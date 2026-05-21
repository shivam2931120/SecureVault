'use client';

import { ChangeEvent, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/stores/authStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useUIStore } from '@/stores/uiStore';
import { useRouter } from 'next/navigation';
import {
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  ClockIcon,
  KeyIcon,
  ShieldCheckIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { Modal } from '@/components/Modal';
import { SecureInput } from '@/components/SecureInput';
import { PasswordStrengthMeter } from '@/components/PasswordStrengthMeter';
import {
  base64ToUint8Array,
  createKeyVerifier,
  decryptVaultItem,
  deriveMasterKey,
  encryptVaultItem,
  generateSalt,
  uint8ArrayToBase64,
  verifyMasterKey,
} from '@/lib/crypto';
import { isBase64, isVaultItemType, VaultBackup } from '@/lib/vault';
import { VaultItem } from '@/types';

const timeoutOptions = [
  { value: 1, label: '1 minute' },
  { value: 5, label: '5 minutes' },
  { value: 15, label: '15 minutes' },
  { value: 30, label: '30 minutes' },
  { value: 60, label: '1 hour' },
  { value: 0, label: 'Never' },
];

function isVaultBackup(value: unknown): value is VaultBackup {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const backup = value as Partial<VaultBackup>;
  return backup.app === 'SecureVault'
    && backup.version === 1
    && typeof backup.exportedAt === 'string'
    && typeof backup.userId === 'string'
    && Array.isArray(backup.items)
    && backup.items.every((item) => (
      item
      && typeof item === 'object'
      && typeof item.id === 'string'
      && typeof item.userId === 'string'
      && isVaultItemType(item.itemType)
      && isBase64(item.encryptedData)
      && isBase64(item.iv)
      && typeof item.createdAt === 'string'
      && typeof item.updatedAt === 'string'
    ));
}

export default function SettingsPage() {
  const {
    user,
    masterKey,
    salt,
    keyVerifier,
    logout,
    setMasterKey,
    setSalt,
    setKeyVerifier,
  } = useAuthStore();
  const { autoLockTimeout, setAutoLockTimeout } = useSettingsStore();
  const { showToast } = useUIStore();
  const router = useRouter();
  const importInputRef = useRef<HTMLInputElement>(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [changePasswordModalOpen, setChangePasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const fetchEncryptedItems = async (): Promise<VaultItem[]> => {
    if (!user) {
      throw new Error('You must be signed in');
    }

    const response = await fetch(`/api/vault?userId=${encodeURIComponent(user.id)}`);
    const data = await response.json() as { items?: VaultItem[]; error?: string };

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch vault items');
    }

    return data.items ?? [];
  };

  const handleLogout = () => {
    logout();
    showToast('Logged out successfully', 'success');
    router.push('/auth/login');
  };

  const handleExportVault = async () => {
    try {
      if (!user) {
        throw new Error('You must be signed in');
      }

      const items = await fetchEncryptedItems();
      const backup: VaultBackup = {
        app: 'SecureVault',
        version: 1,
        exportedAt: new Date().toISOString(),
        userId: user.id,
        items,
      };
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `securevault-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      showToast(`Exported ${items.length} encrypted item${items.length === 1 ? '' : 's'}`, 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to export vault';
      showToast(message, 'error');
    } finally {
      setExportModalOpen(false);
    }
  };

  const handleImportVault = () => {
    importInputRef.current?.click();
  };

  const handleImportFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file || !user) {
      return;
    }

    try {
      const parsedBackup = JSON.parse(await file.text()) as unknown;
      if (!isVaultBackup(parsedBackup)) {
        throw new Error('Invalid SecureVault backup file');
      }

      let importedCount = 0;
      for (const item of parsedBackup.items) {
        const response = await fetch('/api/vault', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            itemType: item.itemType,
            encryptedData: item.encryptedData,
            iv: item.iv,
          }),
        });
        const data = await response.json() as { error?: string };

        if (!response.ok) {
          throw new Error(data.error || 'Failed to import vault item');
        }

        importedCount += 1;
      }

      showToast(`Imported ${importedCount} encrypted item${importedCount === 1 ? '' : 's'}`, 'success');
      router.push('/vault');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to import vault';
      showToast(message, 'error');
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) {
      return;
    }

    try {
      const response = await fetch(`/api/auth/account?userId=${encodeURIComponent(user.id)}`, {
        method: 'DELETE',
      });
      const data = await response.json() as { error?: string };

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete account');
      }

      logout();
      showToast('Account deleted', 'success');
      router.push('/auth/register');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete account';
      showToast(message, 'error');
    } finally {
      setDeleteModalOpen(false);
    }
  };

  const handleChangeMasterPassword = async () => {
    if (!user || !masterKey || !salt || !keyVerifier) {
      showToast('Session expired. Please unlock your vault again.', 'error');
      return;
    }

    if (newPassword.length < 8) {
      showToast('New password must be at least 8 characters', 'error');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      showToast('New passwords do not match', 'error');
      return;
    }

    setChangingPassword(true);

    try {
      const currentKey = await deriveMasterKey(currentPassword, base64ToUint8Array(salt));
      const verified = await verifyMasterKey(currentKey, keyVerifier);

      if (!verified) {
        throw new Error('Current master password is incorrect');
      }

      const encryptedItems = await fetchEncryptedItems();
      const decryptedItems = await Promise.all(
        encryptedItems.map(async (item) => ({
          item,
          data: await decryptVaultItem(item.encryptedData, item.iv, masterKey),
        }))
      );
      const newSaltArray = generateSalt();
      const newSalt = uint8ArrayToBase64(newSaltArray);
      const newMasterKey = await deriveMasterKey(newPassword, newSaltArray);
      const newKeyVerifier = await createKeyVerifier(newMasterKey);
      const reencryptedItems = await Promise.all(
        decryptedItems.map(async ({ item, data }) => ({
          item,
          payload: await encryptVaultItem(data, newMasterKey),
        }))
      );
      const updatedItems: VaultItem[] = [];

      try {
        for (const { item, payload } of reencryptedItems) {
          const response = await fetch(`/api/vault/${item.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: user.id,
              encryptedData: payload.encryptedData,
              iv: payload.iv,
            }),
          });
          const data = await response.json() as { error?: string };

          if (!response.ok) {
            throw new Error(data.error || 'Failed to re-encrypt vault item');
          }

          updatedItems.push(item);
        }
      } catch (error) {
        await Promise.all(updatedItems.map((item) => fetch(`/api/vault/${item.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            encryptedData: item.encryptedData,
            iv: item.iv,
          }),
        })));
        throw error;
      }

      const accountResponse = await fetch('/api/auth/account', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          salt: newSalt,
          verifierEncryptedData: newKeyVerifier.encryptedData,
          verifierIv: newKeyVerifier.iv,
        }),
      });
      const accountData = await accountResponse.json() as { error?: string };

      if (!accountResponse.ok) {
        throw new Error(accountData.error || 'Failed to update account');
      }

      setMasterKey(newMasterKey);
      setSalt(newSalt);
      setKeyVerifier(newKeyVerifier);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setChangePasswordModalOpen(false);
      showToast('Master password changed successfully', 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to change master password';
      showToast(message, 'error');
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
        <p className="text-sm text-text-secondary mt-1">Manage your account and security preferences</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card mb-6">
        <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
          <ShieldCheckIcon className="w-5 h-5" />
          Account
        </h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-border">
            <div>
              <p className="font-medium text-text-primary">Email</p>
              <p className="text-sm text-text-secondary">{user?.email || 'Not logged in'}</p>
            </div>
          </div>

          <div className="flex items-center justify-between py-3 border-b border-border">
            <div>
              <p className="font-medium text-text-primary">Account Created</p>
              <p className="text-sm text-text-secondary">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium text-text-primary">Change Master Password</p>
              <p className="text-sm text-text-secondary">Re-encrypt every vault item with a new key</p>
            </div>
            <button onClick={() => setChangePasswordModalOpen(true)} className="btn-secondary text-sm">
              <KeyIcon className="w-4 h-4 mr-2 inline" />
              Change
            </button>
          </div>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card mb-6">
        <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
          <ClockIcon className="w-5 h-5" />
          Security
        </h2>

        <div className="flex items-center justify-between py-3">
          <div>
            <p className="font-medium text-text-primary">Auto-Lock Timeout</p>
            <p className="text-sm text-text-secondary">Lock vault after inactivity</p>
          </div>
          <select
            value={autoLockTimeout}
            onChange={(e) => setAutoLockTimeout(Number(e.target.value))}
            className="input w-40"
          >
            {timeoutOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card mb-6">
        <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
          <ArrowDownTrayIcon className="w-5 h-5" />
          Data Management
        </h2>

        <input
          ref={importInputRef}
          type="file"
          accept="application/json,.json"
          onChange={handleImportFile}
          className="hidden"
        />

        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-border">
            <div>
              <p className="font-medium text-text-primary">Export Vault</p>
              <p className="text-sm text-text-secondary">Download an encrypted backup</p>
            </div>
            <button onClick={() => setExportModalOpen(true)} className="btn-secondary text-sm">
              <ArrowDownTrayIcon className="w-4 h-4 mr-2 inline" />
              Export
            </button>
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium text-text-primary">Import Vault</p>
              <p className="text-sm text-text-secondary">Restore an encrypted SecureVault backup</p>
            </div>
            <button onClick={handleImportVault} className="btn-secondary text-sm">
              <ArrowUpTrayIcon className="w-4 h-4 mr-2 inline" />
              Import
            </button>
          </div>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card border-danger/20">
        <h2 className="text-lg font-semibold text-danger mb-4 flex items-center gap-2">
          <TrashIcon className="w-5 h-5" />
          Danger Zone
        </h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-border">
            <div>
              <p className="font-medium text-text-primary">Sign Out</p>
              <p className="text-sm text-text-secondary">Log out of your account</p>
            </div>
            <button onClick={handleLogout} className="btn-secondary text-sm">Sign Out</button>
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium text-danger">Delete Account</p>
              <p className="text-sm text-text-secondary">Permanently delete your account and data</p>
            </div>
            <button onClick={() => setDeleteModalOpen(true)} className="btn-danger text-sm">Delete</button>
          </div>
        </div>
      </motion.div>

      <Modal isOpen={exportModalOpen} onClose={() => setExportModalOpen(false)} title="Export Vault">
        <p className="text-text-secondary mb-4">
          This exports encrypted vault records only. The backup can be decrypted only with the master password that protected the items when exported.
        </p>
        <div className="flex gap-3 justify-end">
          <button onClick={() => setExportModalOpen(false)} className="btn-secondary">Cancel</button>
          <button onClick={handleExportVault} className="btn-primary">Export</button>
        </div>
      </Modal>

      <Modal isOpen={changePasswordModalOpen} onClose={() => setChangePasswordModalOpen(false)} title="Change Master Password">
        <div className="space-y-4">
          <SecureInput
            value={currentPassword}
            onChange={setCurrentPassword}
            label="Current Master Password"
            placeholder="Enter current password"
            required
            autoComplete="current-password"
          />
          <SecureInput
            value={newPassword}
            onChange={setNewPassword}
            label="New Master Password"
            placeholder="Enter new password"
            required
            autoComplete="new-password"
          />
          <PasswordStrengthMeter password={newPassword} />
          <SecureInput
            value={confirmNewPassword}
            onChange={setConfirmNewPassword}
            label="Confirm New Password"
            placeholder="Re-enter new password"
            required
            autoComplete="new-password"
          />
          <div className="flex gap-3 justify-end pt-2">
            <button onClick={() => setChangePasswordModalOpen(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleChangeMasterPassword} disabled={changingPassword} className="btn-primary">
              {changingPassword ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Delete Account">
        <div className="bg-danger/10 border border-danger/20 rounded-lg p-4 mb-4">
          <p className="text-danger font-medium">Warning: This action cannot be undone.</p>
          <p className="text-sm text-text-secondary mt-1">
            All your vault items, settings, and account data will be permanently deleted.
          </p>
        </div>
        <div className="flex gap-3 justify-end">
          <button onClick={() => setDeleteModalOpen(false)} className="btn-secondary">Cancel</button>
          <button onClick={handleDeleteAccount} className="btn-danger">Delete My Account</button>
        </div>
      </Modal>
    </div>
  );
}
