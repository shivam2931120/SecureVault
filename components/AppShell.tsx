'use client';

import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Toast } from './Toast';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar - Fixed */}
      <aside className="w-64 flex-shrink-0 border-r border-border bg-background z-20">
        <Sidebar />
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative z-10">
        {/* Top Bar */}
        <header className="h-16 border-b border-border bg-surface flex items-center px-6 flex-shrink-0">
          <div className="flex items-center justify-between w-full">
            <h2 className="text-lg font-semibold text-text-primary">SecureVault</h2>
            <div className="flex items-center gap-3">
              <div className="px-3 py-1.5 rounded-lg bg-success/10 border border-success/20">
                <span className="text-xs font-medium text-success">● Vault Unlocked</span>
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            {children}
          </div>
        </div>
      </main>

      {/* Toast Container - Highest z-index */}
      <Toast />
    </div>
  );
}
