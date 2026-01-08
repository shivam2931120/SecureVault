'use client';

import { useState, useEffect } from 'react';
import { AppShell } from '@/components/AppShell';
import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'next/navigation';
import { SecureInput } from '@/components/SecureInput';
import { LockClosedIcon } from '@heroicons/react/24/outline';
import { useUIStore } from '@/stores/uiStore';

export default function VaultLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, masterKey, user, isHydrated, rehydrateSession, logout } = useAuthStore();
  const { showToast } = useUIStore();
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [unlocking, setUnlocking] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Wait for client-side hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect to login if not authenticated at all
  useEffect(() => {
    if (mounted && isHydrated && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [mounted, isHydrated, isAuthenticated, router]);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      showToast('Please enter your master password', 'error');
      return;
    }

    setUnlocking(true);
    try {
      const success = await rehydrateSession(password);
      if (success) {
        showToast('Vault unlocked!', 'success');
        setPassword('');
      } else {
        showToast('Invalid password', 'error');
      }
    } catch (error) {
      showToast('Failed to unlock vault', 'error');
    } finally {
      setUnlocking(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };

  // Show nothing during hydration to avoid flicker
  if (!mounted || !isHydrated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-text-secondary">Loading...</div>
      </div>
    );
  }

  // Not authenticated - will redirect
  if (!isAuthenticated) {
    return null;
  }

  // Authenticated but no masterKey - show unlock screen
  if (!masterKey) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <div className="w-full max-w-[400px] bg-surface border border-border rounded-xl p-8 shadow-2xl">
          <div className="flex flex-col items-center mb-6">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mb-3 shadow-md">
              <LockClosedIcon className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-text-primary">Vault Locked</h1>
            <p className="text-sm text-text-secondary mt-1">
              Welcome back, {user?.email}
            </p>
          </div>

          <form onSubmit={handleUnlock} className="space-y-4">
            <SecureInput
              value={password}
              onChange={setPassword}
              label="Master Password"
              placeholder="Enter your master password"
              required
              autoComplete="current-password"
            />

            <button
              type="submit"
              disabled={unlocking}
              className="w-full px-4 py-3 bg-primary text-white font-medium rounded-lg hover:bg-blue-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              {unlocking ? 'Unlocking...' : 'Unlock Vault'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={handleLogout}
              className="text-sm text-text-secondary hover:text-danger transition-colors"
            >
              Sign out and use different account
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Fully authenticated with masterKey
  return <AppShell>{children}</AppShell>;
}

