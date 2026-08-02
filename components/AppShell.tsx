'use client';

import { ReactNode, useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { useAuthStore } from '@/stores/authStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useUIStore } from '@/stores/uiStore';
import { useVaultStore } from '@/stores/vaultStore';

interface AppShellProps {
  children: ReactNode;
}

const pageMeta: Record<string, { title: string; description: string; breadcrumb: string[] }> = {
  '/vault': {
    title: 'System Access Control',
    description: 'Dashboard',
    breadcrumb: ['SecureVault', 'Dashboard'],
  },
  '/vault/add': {
    title: 'System Access Control',
    description: 'Add Item',
    breadcrumb: ['SecureVault', 'Dashboard'],
  },
  '/vault/generator': {
    title: 'System Access Control',
    description: 'Password Generator',
    breadcrumb: ['SecureVault', 'Dashboard'],
  },
  '/vault/security': {
    title: 'System Access Control',
    description: 'Security Center',
    breadcrumb: ['SecureVault', 'Dashboard'],
  },
  '/vault/settings': {
    title: 'System Access Control',
    description: 'Settings',
    breadcrumb: ['SecureVault', 'Dashboard'],
  },
};

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { lock, user } = useAuthStore();
  const autoLockTimeout = useSettingsStore((state) => state.autoLockTimeout);
  const showToast = useUIStore((state) => state.showToast);
  const updateActivity = useVaultStore((state) => state.updateActivity);

  useEffect(() => {
    if (autoLockTimeout === 0) {
      return;
    }

    const activityEvents: Array<keyof WindowEventMap> = ['click', 'keydown', 'mousemove', 'scroll', 'touchstart'];
    const timeoutMs = autoLockTimeout * 60 * 1000;
    const recordActivity = () => updateActivity();

    activityEvents.forEach((eventName) => window.addEventListener(eventName, recordActivity, { passive: true }));

    const intervalId = window.setInterval(() => {
      const { lastActivity } = useVaultStore.getState();
      if (Date.now() - lastActivity >= timeoutMs) {
        lock();
        showToast('Vault locked due to inactivity', 'info');
      }
    }, 5000);

    recordActivity();

    return () => {
      window.clearInterval(intervalId);
      activityEvents.forEach((eventName) => window.removeEventListener(eventName, recordActivity));
    };
  }, [autoLockTimeout, lock, showToast, updateActivity]);

  const headerMeta = useMemo(() => {
    if (pathname.startsWith('/vault/') && pathname.endsWith('/edit')) {
      return {
        title: 'System Access Control',
        description: 'Edit Item',
        breadcrumb: ['SecureVault', 'Dashboard'],
      };
    }

    return pageMeta[pathname] || pageMeta['/vault'];
  }, [pathname]);

  return (
    <div className="min-h-[100dvh] bg-background">
      <div className="flex min-h-[100dvh]">
        <aside className="hidden lg:block">
          <Sidebar collapsed={sidebarCollapsed} onCollapseToggle={() => setSidebarCollapsed((current) => !current)} />
        </aside>

        <AnimatePresence>
          {mobileSidebarOpen && (
            <>
              <motion.button
                type="button"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileSidebarOpen(false)}
                className="fixed inset-0 z-40 bg-black/80 lg:hidden"
                aria-label="Close navigation"
              />
              <motion.aside
                initial={{ x: -320 }}
                animate={{ x: 0 }}
                exit={{ x: -320 }}
                transition={{ duration: 0.22 }}
                className="fixed inset-y-0 left-0 z-50 lg:hidden"
              >
                <Sidebar onNavigate={() => setMobileSidebarOpen(false)} />
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Terminal-style header bar */}
          <header className="sticky top-0 z-30 border-b border-border bg-background">
            <div className="mx-auto flex w-full max-w-[1400px] items-center gap-4 px-5 py-4 lg:px-10">
              <button type="button" onClick={() => setMobileSidebarOpen(true)} className="lg:hidden text-primary hover:text-primary/80 transition-colors" aria-label="Open navigation">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              </button>

              <div className="min-w-0 flex-1 font-mono">
                <div className="flex flex-wrap items-center gap-1 text-xs text-muted">
                  {headerMeta.breadcrumb.map((crumb, index) => (
                    <span key={crumb} className="inline-flex items-center gap-1">
                      {index > 0 && <span className="text-muted">/</span>}
                      <span>{crumb.toLowerCase()}</span>
                    </span>
                  ))}
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-primary">$</span>
                  <h1 className="truncate text-lg font-bold text-primary uppercase tracking-wider text-glow">{headerMeta.description}</h1>
                  <span className="cursor-blink"></span>
                </div>
              </div>

              <div className="hidden items-center gap-3 xl:flex font-mono">
                <div className="flex items-center gap-2 text-xs border border-border px-3 py-1.5">
                  <span className="w-2 h-2 bg-success inline-block" style={{ boxShadow: '0 0 6px rgba(51,255,0,0.5)' }}></span>
                  <span className="text-text-secondary">sync:ok</span>
                </div>
                <div className="flex items-center gap-1 text-xs border border-border px-3 py-1.5 text-primary">
                  <span className="text-secondary">@</span>
                  <span className="truncate max-w-[120px]">{user?.email || 'user'}</span>
                </div>
              </div>

              <button type="button" className="xl:hidden text-primary" aria-label="Header actions">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                </svg>
              </button>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto">
            <div className="mx-auto w-full max-w-[1400px] px-5 py-6 lg:px-10 lg:py-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

export default AppShell;
