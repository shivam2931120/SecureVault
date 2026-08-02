'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { useVaultStore } from '@/stores/vaultStore';

interface SidebarProps {
  collapsed?: boolean;
  onCollapseToggle?: () => void;
  onNavigate?: () => void;
}

const navItems = [
  { label: './vault', href: '/vault', icon: '🔒' },
  { label: './generator', href: '/vault/generator', icon: '🔑' },
  { label: './settings', href: '/vault/settings', icon: '⚙️' },
];

export function Sidebar({ collapsed = false, onCollapseToggle, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const items = useVaultStore((state) => state.items);

  const itemCount = items.length;
  const usagePercent = Math.min(100, Math.max(8, (itemCount / 50) * 100));

  const currentSection = useMemo(() => navItems.find((item) => pathname.startsWith(item.href)), [pathname]);

  // Build terminal-style storage bar
  const barLength = 20;
  const filledLength = Math.round((usagePercent / 100) * barLength);
  const storageBar = '\u2588'.repeat(filledLength) + '\u2591'.repeat(barLength - filledLength);

  return (
    <div className={cn('flex h-full flex-col bg-background border-r border-border font-mono transition-all duration-200', collapsed ? 'w-[72px]' : 'w-[260px]')}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <button
          type="button"
          onClick={() => {
            router.push('/vault');
            onNavigate?.();
          }}
          className={cn('flex items-center gap-2 text-left', collapsed && 'justify-center')}
          aria-label="Go to vault"
        >
          <span className="text-primary text-glow font-bold text-base tracking-widest">SV</span>
          {!collapsed && (
            <div>
              <div className="text-xs font-bold text-primary uppercase tracking-widest text-glow">SecureVault</div>
              <div className="text-[10px] text-muted">{process.env.NEXT_PUBLIC_APP_VERSION || 'v2.0'}</div>
            </div>
          )}
        </button>

        <button type="button" onClick={onCollapseToggle} className="hidden lg:inline-flex text-muted hover:text-primary text-xs transition-colors" aria-label="Toggle sidebar">
          {collapsed ? '>>' : '<<'}
        </button>
      </div>

      {/* System info */}
      {!collapsed && (
        <div className="px-4 py-3 border-b border-border">
          <div className="text-[10px] text-muted uppercase tracking-widest">// system status</div>
          <div className="mt-1 text-xs text-primary">
            <span className="text-primary">$</span> status: <span className="text-success">online</span>
          </div>
          <div className="text-xs text-text-secondary">
            <span className="text-primary">$</span> module: <span className="text-secondary">{currentSection?.label?.replace('./', '') || 'vault'}</span>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3">
        <div className="mb-2 px-2 text-[10px] text-muted uppercase tracking-widest">
          {!collapsed ? '// modules' : '~'}
        </div>
        <div className="space-y-0.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  'relative flex items-center gap-2 py-2 px-3 text-xs transition-all duration-150',
                  collapsed ? 'justify-center px-0' : '',
                  isActive
                    ? 'text-primary border-l-2 border-primary bg-primary/5 text-glow'
                    : 'text-text-secondary border-l-2 border-transparent hover:text-primary hover:border-muted hover:bg-primary/3'
                )}
                aria-current={isActive ? 'page' : undefined}
                title={collapsed ? item.label : undefined}
              >
                <span>{item.icon}</span>
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </div>

        <div className="my-4 border-t border-border" />

        <button
          type="button"
          onClick={() => {
            router.push('/vault/add');
            onNavigate?.();
          }}
          className={cn('btn-primary w-full text-xs', collapsed && 'px-2')}
          title={collapsed ? 'Add item' : undefined}
        >
          {collapsed ? '+' : '[ + ADD ENTRY ]'}
        </button>

        {!collapsed && (
          <>
            <div className="my-4 border-t border-border" />
            <div className="px-2">
              <div className="text-[10px] text-muted uppercase tracking-widest">// storage</div>
              <div className="mt-1 text-xs text-primary">
                [{storageBar}]
              </div>
              <div className="mt-0.5 text-[10px] text-text-secondary">
                {itemCount}/50 entries ({Math.round(usagePercent)}%)
              </div>
            </div>
          </>
        )}
      </nav>

      {/* User section */}
      <div className="border-t border-border p-3">
        <div className={cn('px-2 mb-2', collapsed && 'px-0 text-center')}>
        </div>
        <button
          type="button"
          onClick={() => {
            logout();
            router.push('/auth/login');
            onNavigate?.();
          }}
          className={cn(
            'flex items-center gap-2 w-full py-2 px-3 text-xs text-danger border-l-2 border-transparent hover:border-danger hover:bg-danger/5 transition-all',
            collapsed && 'justify-center px-0'
          )}
          aria-label="Logout"
        >
          <span>⏻</span>
          {!collapsed && <span>$ logout</span>}
        </button>
      </div>
    </div>
  );
}

export default Sidebar;
