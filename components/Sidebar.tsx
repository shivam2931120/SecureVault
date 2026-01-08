'use client';

import { useUIStore } from '@/stores/uiStore';
import { useAuthStore } from '@/stores/authStore';
import {
  LockClosedIcon,
  PlusIcon,
  KeyIcon,
  ShieldCheckIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';
import { useRouter, usePathname } from 'next/navigation';

interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
}

export function Sidebar() {
  const { logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  const menuItems: MenuItem[] = [
    {
      id: 'vault',
      label: 'Vault',
      icon: LockClosedIcon,
      href: '/vault',
    },
    {
      id: 'generator',
      label: 'Generator',
      icon: KeyIcon,
      href: '/vault/generator',
    },
    {
      id: 'security',
      label: 'Security',
      icon: ShieldCheckIcon,
      href: '/vault/security',
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Cog6ToothIcon,
      href: '/vault/settings',
    },
  ];

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };

  const isActive = (href: string) => pathname === href;

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Logo */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
            <LockClosedIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-text-primary">SecureVault</h1>
            <p className="text-xs text-text-secondary">Zero-Knowledge</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          
          return (
            <button
              key={item.id}
              onClick={() => router.push(item.href)}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                text-sm font-medium transition-all duration-150
                ${active 
                  ? 'bg-primary/10 text-primary border-l-3 border-primary' 
                  : 'text-text-secondary hover:bg-surface hover:text-text-primary'
                }
              `}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Add Item Button */}
      <div className="p-3 border-t border-border">
        <button
          onClick={() => router.push('/vault/add')}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-blue-600 transition-all duration-150 font-medium text-sm shadow-md"
        >
          <PlusIcon className="w-5 h-5" />
          <span>Add Item</span>
        </button>
      </div>

      {/* Logout */}
      <div className="p-3 border-t border-border">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-danger hover:bg-danger/10 transition-all duration-150"
        >
          <ArrowRightOnRectangleIcon className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
