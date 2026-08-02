'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CodeBracketIcon,
  CreditCardIcon,
  DocumentTextIcon,
  KeyIcon,
  PencilSquareIcon,
  PlusIcon,
  StarIcon,
  TrashIcon,
  UserCircleIcon,
  WifiIcon,
} from '@heroicons/react/24/outline';
import { ClipboardButton } from '@/components/ClipboardButton';
import { EmptyState } from '@/components/EmptyState';
import { Modal } from '@/components/Modal';
import { SearchBar } from '@/components/SearchBar';
import { SkeletonList } from '@/components/Skeleton';
import { decryptVaultItem } from '@/lib/crypto';
import { formatDate } from '@/lib/utils';
import { getDisplayTitle, getSearchableVaultText } from '@/lib/vault';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { useVaultStore } from '@/stores/vaultStore';
import { DecryptedVaultItem, VaultItem, VaultItemType } from '@/types';

const filterOptions: Array<{ id: 'all' | VaultItemType; label: string; flag: string }> = [
  { id: 'all', label: 'ALL', flag: '--all' },
  { id: 'password', label: 'PWD', flag: '--pwd' },
  { id: 'card', label: 'CARD', flag: '--card' },
  { id: 'note', label: 'NOTE', flag: '--note' },
  { id: 'apikey', label: 'API', flag: '--api' },
];

function getItemTypeIcon(type: VaultItemType) {
  switch (type) {
    case 'password':
    case 'login':
      return '🔑';
    case 'card':
      return '💳';
    case 'note':
      return '📝';
    case 'apikey':
      return '🔧';
    case 'identity':
      return '👤';
    case 'wifi':
      return '📶';
    default:
      return '🔑';
  }
}

function getSecondaryText(item: DecryptedVaultItem) {
  return item.username || item.emailAddress || item.apiService || item.cardHolder || item.ssid || item.url || 'stored_item';
}

export default function VaultPage() {
  const [loading, setLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const {
    items,
    setItems,
    searchQuery,
    setSearchQuery,
    filterType,
    setFilterType,
    deleteItem,
  } = useVaultStore();

  const { masterKey } = useAuthStore();
  const { showToast } = useUIStore();
  const router = useRouter();

  const loadVaultItems = useCallback(async () => {
    try {
      const { user } = useAuthStore.getState();
      if (!user || !masterKey) {
        setItems([]);
        return;
      }

      const response = await fetch(`/api/vault?userId=${encodeURIComponent(user.id)}`);
      const data = await response.json() as { items?: VaultItem[]; error?: string };
      if (!response.ok) throw new Error(data.error || 'Failed to load vault items');

      const decrypted = await Promise.all(
        (data.items ?? []).map(async (item) => {
          try {
            const decryptedData = await decryptVaultItem(item.encryptedData, item.iv, masterKey);
            if (!decryptedData || typeof decryptedData !== 'object') return null;

            const itemData = decryptedData as Partial<DecryptedVaultItem>;
            return {
              ...itemData,
              id: item.id,
              itemType: itemData.itemType ?? item.itemType,
              title: getDisplayTitle(itemData),
              createdAt: item.createdAt,
              updatedAt: item.updatedAt,
            } as DecryptedVaultItem;
          } catch {
            return null;
          }
        }),
      );

      const loadedItems = decrypted.filter((item): item is DecryptedVaultItem => item !== null);
      setItems(loadedItems);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load vault items';
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  }, [masterKey, setItems, showToast]);

  useEffect(() => {
    void loadVaultItems();
  }, [loadVaultItems]);

  const filteredItems = useMemo(() => (
    items
      .filter((item) => {
        if (filterType !== 'all' && item.itemType !== filterType) return false;
        if (!searchQuery) return true;
        return getSearchableVaultText(item).includes(searchQuery.toLowerCase());
      })
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  ), [filterType, items, searchQuery]);

  const metrics = useMemo(() => ({
    total: items.length,
    weak: items.filter((item) => {
      const secret = item.password || item.networkPassword || item.apiKey;
      return secret ? secret.length < 12 : false;
    }).length,
    compromised: 0,
    updated: items.filter((item) => Date.now() - new Date(item.updatedAt).getTime() < 1000 * 60 * 60 * 24 * 30).length,
  }), [items]);

  const handleDelete = async () => {
    if (!itemToDelete) return;

    try {
      const { user } = useAuthStore.getState();
      if (!user) return;

      const response = await fetch(`/api/vault/${itemToDelete}?userId=${encodeURIComponent(user.id)}`, { method: 'DELETE' });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error || 'Failed to delete item');

      deleteItem(itemToDelete);
      showToast('Item deleted', 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete item';
      showToast(message, 'error');
    } finally {
      setDeleteModalOpen(false);
      setItemToDelete(null);
    }
  };

  return (
    <div className="space-y-6 font-mono">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-primary text-sm">$</span>
              <h1 className="text-3xl font-bold text-primary uppercase tracking-wider text-glow">MY VAULT</h1>
            </div>
            <p className="mt-1 text-xs text-text-secondary pl-5">
              <span className="text-muted">// </span>manage and secure your credentials
            </p>
            <div className="text-muted text-xs mt-2 pl-5">{'─'.repeat(40)}</div>
          </div>
          <button onClick={() => router.push('/vault/add')} className="btn-primary">
            [ + ADD ENTRY ]
          </button>
        </div>

        {/* Metrics - terminal style */}
        <div className="grid gap-2 lg:grid-cols-4">
          {[
            { label: 'TOTAL_ITEMS', value: metrics.total, status: 'text-primary' },
            { label: 'WEAK_PASSWORDS', value: metrics.weak, status: metrics.weak > 0 ? 'text-danger' : 'text-primary' },
            { label: 'COMPROMISED', value: metrics.compromised, status: 'text-primary' },
            { label: 'RECENT_UPDATES', value: metrics.updated, status: 'text-primary' },
          ].map((card) => (
            <div key={card.label} className="border border-border p-4">
              <div className="text-[10px] text-muted uppercase tracking-widest">{card.label}</div>
              <div className={`mt-2 text-2xl font-bold ${card.status} text-glow`}>{card.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Filter bar */}
      <div className="sticky top-[65px] z-20 -mx-5 border-y border-border bg-background px-5 py-3 lg:-mx-10 lg:px-10">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap gap-1">
            {filterOptions.map((filter) => {
              const active = filterType === filter.id;
              return (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setFilterType(filter.id)}
                  className={`px-3 py-1.5 text-xs border transition-all ${
                    active
                      ? 'border-primary bg-primary/10 text-primary text-glow'
                      : 'border-border text-text-secondary hover:border-muted hover:text-primary'
                  }`}
                >
                  <span className="text-muted">{filter.flag} </span>{filter.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder='grep -i "search"...'
              className="min-w-[280px]"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <SkeletonList count={6} />
      ) : filteredItems.length === 0 ? (
        <EmptyState
          icon={KeyIcon}
          title="NO ENTRIES FOUND"
          description="Add your first credential to start using the vault."
          primaryAction={{ label: 'Add Entry', onClick: () => router.push('/vault/add') }}
        />
      ) : (
        <div className="grid gap-2 xl:grid-cols-3">
          {filteredItems.map((item) => {
            const secret = item.password || item.apiKey || item.networkPassword || '';

            return (
              <div
                key={item.id}
                className="group border border-border p-4 transition-all duration-150 hover:border-primary hover:bg-primary/3 relative"
              >
                {/* Item header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{getItemTypeIcon(item.itemType)}</span>
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-bold text-primary">{item.title}</h3>
                      <p className="truncate text-xs text-text-secondary">{getSecondaryText(item)}</p>
                    </div>
                  </div>
                </div>

                {/* Secret field */}
                <div className="mt-3 border border-border bg-background px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-xs font-mono truncate ${secret && secret.length < 12 ? 'text-danger' : 'text-text-secondary'}`}>
                      {secret ? '••••••••••••••' : 'stored_item'}
                    </span>
                    {secret && <ClipboardButton text={secret} />}
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-3 flex items-end justify-between gap-3">
                  <div className="flex flex-wrap gap-1">
                    <span className="border border-border px-1.5 py-0.5 text-[9px] text-primary uppercase tracking-wider">
                      {item.itemType}
                    </span>
                    {(item.tags ?? []).slice(0, 2).map((tag) => (
                      <span key={tag} className="border border-border px-1.5 py-0.5 text-[9px] text-text-secondary uppercase tracking-wider">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                    <button onClick={() => router.push(`/vault/${item.id}/edit`)} className="text-muted hover:text-primary text-xs px-1 py-0.5 border border-transparent hover:border-primary transition-all" aria-label={`Edit ${item.title}`}>
                      [EDT]
                    </button>
                    <button
                      onClick={() => {
                        setItemToDelete(item.id);
                        setDeleteModalOpen(true);
                      }}
                      className="text-muted hover:text-danger text-xs px-1 py-0.5 border border-transparent hover:border-danger transition-all"
                      aria-label={`Delete ${item.title}`}
                    >
                      [DEL]
                    </button>
                  </div>
                </div>

                <div className="absolute bottom-2 right-3 text-[9px] text-muted">{formatDate(item.updatedAt)}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete modal */}
      <Modal isOpen={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="DELETE ENTRY">
        <p className="text-xs text-text-secondary font-mono">
          <span className="text-danger">[WARN]</span> This will permanently remove the item from the vault.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={() => setDeleteModalOpen(false)} className="btn-secondary">[ CANCEL ]</button>
          <button onClick={handleDelete} className="px-4 py-2 border border-danger text-danger text-xs font-mono uppercase tracking-wider hover:bg-danger hover:text-background transition-colors">[ CONFIRM DELETE ]</button>
        </div>
      </Modal>
    </div>
  );
}
