'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { SecureInput } from '@/components/SecureInput';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import {
  base64ToUint8Array,
  createKeyVerifier,
  deriveMasterKey,
  generateSalt,
  uint8ArrayToBase64,
  verifyMasterKey,
} from '@/lib/crypto';
import { KeyVerifier } from '@/types';

function AuthPanel({
  icon,
  title,
  description,
  footer,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-[100dvh] bg-background px-4 py-10 font-mono">
      <div className="mx-auto flex min-h-[calc(100dvh-80px)] w-full max-w-[480px] items-center justify-center">
          {/* Auth form */}
          <div className="w-full border border-primary p-0" style={{ boxShadow: '0 0 30px rgba(51, 255, 0, 0.08)' }}>
            {/* Title bar */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-primary bg-primary/5">
              <div className="flex items-center gap-2">
                <span className="text-primary text-xs">┌──</span>
                <span className="text-xs font-bold text-primary uppercase tracking-wider text-glow">AUTH</span>
                <span className="text-primary text-xs">──┐</span>
              </div>
              <span className="text-muted text-[10px]">{process.env.NEXT_PUBLIC_APP_VERSION || 'v2.0'}</span>
            </div>

            <div className="p-8">
              <div className="mb-6 flex flex-col items-center text-center">
                <div className="flex h-16 w-16 items-center justify-center border border-primary/30 bg-primary/10 text-primary">
                  {icon}
                </div>
                <h2 className="mt-4 text-lg font-bold text-primary uppercase tracking-wider text-glow">{title}</h2>
                <p className="mt-2 max-w-sm text-xs leading-5 text-text-secondary">
                  <span className="text-muted">// </span>{description}
                </p>
              </div>

              {children}

              {footer && <div className="mt-6 border-t border-border pt-4">{footer}</div>}

              <div className="mt-6 flex items-center justify-between text-[10px] text-muted">
                <span>{process.env.NEXT_PUBLIC_APP_VERSION || 'v2.0'}</span>
                <span>zero-knowledge</span>
              </div>
            </div>
          </div>
      </div>
    </div>
  );
}

export default function VaultLayout({ children }: { children: React.ReactNode }) {
  const { masterKey, setMasterKey, setSalt, setKeyVerifier } = useAuthStore();
  const { showToast } = useUIStore();
  const router = useRouter();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  const [hasSetupVault, setHasSetupVault] = useState(false);
  const [storedSalt, setStoredSalt] = useState<string | null>(null);
  const [storedVerifier, setStoredVerifier] = useState<KeyVerifier | null>(null);

  useEffect(() => {
    setMounted(true);
    const salt = localStorage.getItem('vault_salt');
    const verifierStr = localStorage.getItem('vault_keyVerifier');
    
    if (salt && verifierStr) {
      try {
        const verifier = JSON.parse(verifierStr);
        setStoredSalt(salt);
        setStoredVerifier(verifier);
        setHasSetupVault(true);
      } catch (e) {
        console.error('Failed to parse key verifier', e);
      }
    }
  }, []);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      showToast('Please enter your master password', 'error');
      return;
    }

    setLoading(true);
    try {
      if (!storedSalt || !storedVerifier) throw new Error('Vault is not set up correctly.');

      const saltArray = base64ToUint8Array(storedSalt);
      const derivedKey = await deriveMasterKey(password, saltArray);
      const verified = await verifyMasterKey(derivedKey, storedVerifier);

      if (!verified) {
        showToast('Invalid master password', 'error');
        return;
      }

      setMasterKey(derivedKey);
      setSalt(storedSalt);
      setKeyVerifier(storedVerifier);
      showToast('Vault unlocked', 'success');
      setPassword('');
    } catch {
      showToast('Failed to unlock vault', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      showToast('Password must be at least 8 characters', 'error');
      return;
    }
    if (password !== confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }

    setLoading(true);
    try {
      const saltArray = generateSalt();
      const saltBase64 = uint8ArrayToBase64(saltArray);
      const derivedKey = await deriveMasterKey(password, saltArray);
      const keyVerifier = await createKeyVerifier(derivedKey);

      localStorage.setItem('vault_salt', saltBase64);
      localStorage.setItem('vault_keyVerifier', JSON.stringify({
        encryptedData: keyVerifier.encryptedData,
        iv: keyVerifier.iv,
      }));

      setStoredSalt(saltBase64);
      setStoredVerifier(keyVerifier);
      setHasSetupVault(true);

      setMasterKey(derivedKey);
      setSalt(saltBase64);
      setKeyVerifier(keyVerifier);
      showToast('Vault setup successful', 'success');
      setPassword('');
      setConfirmPassword('');
    } catch {
      showToast('Failed to set up vault', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleClearVault = () => {
    if (confirm('Are you sure you want to permanently delete your vault and all local data?')) {
      localStorage.removeItem('vault_salt');
      localStorage.removeItem('vault_keyVerifier');
      setHasSetupVault(false);
      setMasterKey(null);
      showToast('Vault deleted', 'success');
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-[100dvh] bg-background" />
    );
  }

  if (!hasSetupVault) {
    return (
      <AuthPanel
        icon={<svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" /></svg>}
        title="CREATE MASTER PASSWORD"
        description="This password unlocks your encrypted vault and never leaves your device."
      >
        <form onSubmit={handleSetup} className="space-y-4">
          <SecureInput value={password} onChange={setPassword} label="master password" placeholder="create a strong master password" autoComplete="new-password" />
          <SecureInput value={confirmPassword} onChange={setConfirmPassword} label="confirm password" placeholder="repeat your master password" autoComplete="new-password" />
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? '[ PROCESSING... ]' : '[ CREATE VAULT ]'}
          </button>
        </form>
      </AuthPanel>
    );
  }

  if (!masterKey) {
    return (
      <AuthPanel
        icon={<svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" /></svg>}
        title="UNLOCK VAULT"
        description="Enter master password for local decryption."
        footer={(
          <div className="space-y-2">
            <button type="button" onClick={handleClearVault} className="btn-secondary w-full text-danger border-danger hover:bg-danger hover:text-background">
              [ FACTORY RESET VAULT ]
            </button>
          </div>
        )}
      >
        <form onSubmit={handleUnlock} className="space-y-4">
          <SecureInput value={password} onChange={setPassword} label="master password" placeholder="enter your master password" autoComplete="current-password" />
          <div className="flex items-center justify-between text-xs">
            <button type="button" className="text-text-secondary transition hover:text-primary">
              forgot password?
            </button>
            <span className="text-muted border border-border px-2 py-0.5 text-[10px]">LOCAL_DECRYPT</span>
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? '[ DECRYPTING... ]' : '[ UNLOCK ]'}
          </button>
        </form>
      </AuthPanel>
    );
  }

  return <AppShell>{children}</AppShell>;
}
