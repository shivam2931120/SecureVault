'use client';

import { ChangeEvent, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Modal } from '@/components/Modal';
import { PageHeader } from '@/components/PageHeader';
import { PasswordStrengthMeter } from '@/components/PasswordStrengthMeter';
import { SecureInput } from '@/components/SecureInput';
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
import { useAuthStore } from '@/stores/authStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useUIStore } from '@/stores/uiStore';
import { VaultItem } from '@/types';

const timeoutOptions = [
  { value: 1, label: '1 min' },
  { value: 5, label: '5 min' },
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 60, label: '1 hr' },
  { value: 0, label: 'Never' },
];

const tabs = [
  { id: 'security', label: 'SEC' },
  { id: 'backup', label: 'BAK' },
  { id: 'about', label: 'INF' },
] as const;

type SettingsTab = typeof tabs[number]['id'];

function isVaultBackup(value: unknown): value is VaultBackup {
  if (!value || typeof value !== 'object') return false;
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

function SettingRow({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 border border-border bg-background p-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <div className="text-xs font-bold text-primary uppercase tracking-wider">{title}</div>
        <div className="mt-1 text-[10px] text-text-secondary">// {description}</div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
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

  const [activeTab, setActiveTab] = useState<SettingsTab>('security');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [changePasswordModalOpen, setChangePasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const itemSummary = useMemo(() => ({
    email: user?.email || 'Unknown user',
    createdAt: user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A',
  }), [user?.createdAt, user?.email]);

  const fetchEncryptedItems = async (): Promise<VaultItem[]> => {
    if (!user) throw new Error('You must be signed in');
    const response = await fetch(`/api/vault?userId=${encodeURIComponent(user.id)}`);
    const data = await response.json() as { items?: VaultItem[]; error?: string };
    if (!response.ok) throw new Error(data.error || 'Failed to fetch vault items');
    return data.items ?? [];
  };

  const handleLogout = () => {
    logout();
    showToast('Logged out successfully', 'success');
    router.push('/auth/login');
  };

  const handleExportVault = async () => {
    try {
      if (!user) throw new Error('You must be signed in');
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

  const handleImportFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !user) return;

    try {
      const parsedBackup = JSON.parse(await file.text()) as unknown;
      if (!isVaultBackup(parsedBackup)) throw new Error('Invalid SecureVault backup file');

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
        if (!response.ok) throw new Error(data.error || 'Failed to import vault item');
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
    if (!user) return;

    try {
      const response = await fetch(`/api/auth/account?userId=${encodeURIComponent(user.id)}`, { method: 'DELETE' });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error || 'Failed to delete account');

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
      if (!verified) throw new Error('Current master password is incorrect');

      const encryptedItems = await fetchEncryptedItems();
      const decryptedItems = await Promise.all(
        encryptedItems.map(async (item) => ({
          item,
          data: await decryptVaultItem(item.encryptedData, item.iv, masterKey),
        }))
      );

      const newSaltArray = generateSalt();
      const nextSalt = uint8ArrayToBase64(newSaltArray);
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
          if (!response.ok) throw new Error(data.error || 'Failed to re-encrypt vault item');
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
          salt: nextSalt,
          verifierEncryptedData: newKeyVerifier.encryptedData,
          verifierIv: newKeyVerifier.iv,
        }),
      });
      const accountData = await accountResponse.json() as { error?: string };
      if (!accountResponse.ok) throw new Error(accountData.error || 'Failed to update account');

      setMasterKey(newMasterKey);
      setSalt(nextSalt);
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
    <div className="space-y-8 font-mono">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-primary text-sm">$</span>
            <h1 className="text-3xl font-bold text-primary uppercase tracking-wider text-glow">CFG_SYS</h1>
          </div>
          <p className="mt-1 text-xs text-text-secondary pl-5">
            <span className="text-muted">// </span>configure vault parameters
          </p>
          <div className="text-muted text-xs mt-2 pl-5">{'─'.repeat(40)}</div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[200px_minmax(0,1fr)]">
        <aside className="border border-border p-3 h-fit">
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  type="button"
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-xs transition-colors ${
                    active ? 'bg-primary/10 text-primary border-l-2 border-primary text-glow' : 'text-text-secondary border-l-2 border-transparent hover:text-primary hover:bg-primary/5'
                  }`}
                >
                  <span className="text-muted">{'>'}</span> {tab.label}
                </button>
              );
            })}
          </nav>
        </aside>

        <section className="space-y-4">


          {activeTab === 'security' && (
            <div className="border border-border p-5">
              <div className="flex items-center gap-2 mb-6 border-b border-border pb-2">
                <span className="text-primary text-xs">┌──</span>
                <h2 className="text-xs font-bold text-primary uppercase tracking-wider text-glow">SECURITY</h2>
                <span className="text-primary text-xs">──┐</span>
              </div>
              <div className="space-y-4">
                <SettingRow
                  title="MASTER_KEY"
                  description="Re-encrypt entire vault with new key"
                  action={<button onClick={() => setChangePasswordModalOpen(true)} className="btn-secondary px-3 py-1 text-[10px]">[ UPDATE ]</button>}
                />
                <SettingRow
                  title="SESSION"
                  description="Clear memory and disconnect"
                  action={<button onClick={handleLogout} className="btn-secondary text-danger border-danger px-3 py-1 text-[10px] hover:bg-danger hover:text-background">[ KILL ]</button>}
                />
              </div>
            </div>
          )}



          {activeTab === 'backup' && (
            <div className="border border-border p-5">
              <input
                ref={importInputRef}
                type="file"
                accept="application/json,.json"
                onChange={handleImportFile}
                className="hidden"
              />
              <div className="flex items-center gap-2 mb-6 border-b border-border pb-2">
                <span className="text-primary text-xs">┌──</span>
                <h2 className="text-xs font-bold text-primary uppercase tracking-wider text-glow">BACKUP_SYS</h2>
                <span className="text-primary text-xs">──┐</span>
              </div>
              <div className="space-y-4">
                <SettingRow
                  title="EXPORT"
                  description="Dump encrypted records to local disk"
                  action={
                    <button onClick={() => setExportModalOpen(true)} className="btn-secondary px-3 py-1 text-[10px]">
                      [ EXPORT ]
                    </button>
                  }
                />
                <SettingRow
                  title="IMPORT"
                  description="Load records from local file"
                  action={
                    <button onClick={() => importInputRef.current?.click()} className="btn-secondary px-3 py-1 text-[10px]">
                      [ IMPORT ]
                    </button>
                  }
                />
              </div>
            </div>
          )}

          {activeTab === 'about' && (
            <div className="border border-border p-5">
              <div className="flex items-center gap-2 mb-6 border-b border-border pb-2">
                <span className="text-primary text-xs">┌──</span>
                <h2 className="text-xs font-bold text-primary uppercase tracking-wider text-glow">SYSTEM_INFO</h2>
                <span className="text-primary text-xs">──┐</span>
              </div>
              <div className="space-y-4">
                <SettingRow title="VERSION" description={`${process.env.NEXT_PUBLIC_APP_VERSION || 'v2.0'}`} />
                <SettingRow
                  title="DANGER_ZONE"
                  description="Permanent destructive wipe"
                  action={
                    <button onClick={() => setDeleteModalOpen(true)} className="border border-danger text-danger px-3 py-1 text-[10px] uppercase hover:bg-danger hover:text-background transition-colors">
                      [ WIPE_ALL ]
                    </button>
                  }
                />
              </div>
            </div>
          )}
        </section>
      </div>

      <Modal isOpen={exportModalOpen} onClose={() => setExportModalOpen(false)} title="EXPORT_VAULT">
        <p className="text-xs text-text-secondary font-mono">
          <span className="text-warning">[WARN]</span> Backups contain encrypted payloads. Master key context is still required to restore.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={() => setExportModalOpen(false)} className="btn-secondary">[ CANCEL ]</button>
          <button onClick={handleExportVault} className="btn-primary">[ PROCEED ]</button>
        </div>
      </Modal>

      <Modal isOpen={changePasswordModalOpen} onClose={() => setChangePasswordModalOpen(false)} title="REKEY_VAULT">
        <div className="space-y-4">
          <SecureInput value={currentPassword} onChange={setCurrentPassword} label="OLD_KEY" placeholder="Current master password" autoComplete="current-password" />
          <SecureInput value={newPassword} onChange={setNewPassword} label="NEW_KEY" placeholder="New master password" autoComplete="new-password" />
          <PasswordStrengthMeter password={newPassword} />
          <SecureInput value={confirmNewPassword} onChange={setConfirmNewPassword} label="VERIFY_KEY" placeholder="Repeat new password" autoComplete="new-password" />
          <div className="flex justify-end gap-3 pt-4">
            <button onClick={() => setChangePasswordModalOpen(false)} className="btn-secondary">[ CANCEL ]</button>
            <button onClick={handleChangeMasterPassword} disabled={changingPassword} className="btn-primary">
              {changingPassword ? '[ PROCESSING... ]' : '[ REKEY ]'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="SYS_WIPE">
        <div className="border border-danger bg-danger/10 p-4">
          <div className="text-xs font-bold text-danger uppercase tracking-widest">[CRITICAL WARNING]</div>
          <div className="mt-2 text-xs text-danger/90">Execution will permanently erase all data, keys, and metadata. Recovery is impossible.</div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={() => setDeleteModalOpen(false)} className="btn-secondary">[ ABORT ]</button>
          <button onClick={handleDeleteAccount} className="border border-danger text-danger px-4 py-2 text-xs font-mono uppercase hover:bg-danger hover:text-background transition-colors">[ CONFIRM_WIPE ]</button>
        </div>
      </Modal>
    </div>
  );
}
