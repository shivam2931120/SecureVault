'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useVaultStore } from '@/stores/vaultStore';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { ClipboardButton } from '@/components/ClipboardButton';
import { SkeletonList } from '@/components/Skeleton';
import { Modal } from '@/components/Modal';
import { formatDate } from '@/lib/utils';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  KeyIcon,
  DocumentTextIcon,
  CreditCardIcon,
  CodeBracketIcon,
  PlusIcon,
  TrashIcon,
  PencilIcon,
} from '@heroicons/react/24/outline';
import { decryptVaultItem } from '@/lib/crypto';

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
  const { showToast, openModal } = useUIStore();

  useEffect(() => {
    loadVaultItems();
  }, []);

  const loadVaultItems = async () => {
    try {
      const { user } = useAuthStore.getState();
      if (!user) {
        showToast('Please login first', 'error');
        return;
      }

      const response = await fetch(`/api/vault?userId=${user.id}`);
      const data = await response.json();

      if (response.ok && masterKey) {
        // Decrypt all items
        const decrypted = await Promise.all(
          data.items.map(async (item: any) => {
            try {
              const decryptedData = await decryptVaultItem(
                item.encryptedData,
                item.iv,
                masterKey
              );
              return {
                ...decryptedData,
                id: item.id,
                createdAt: item.createdAt,
                updatedAt: item.updatedAt,
              };
            } catch (error) {
              console.error('Failed to decrypt item:', error);
              return null;
            }
          })
        );
        setItems(decrypted.filter(item => item !== null));
      }
    } catch (error: any) {
      showToast(error.message || 'Failed to load vault items', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;

    try {
      const { user } = useAuthStore.getState();
      if (!user) return;

      const response = await fetch(`/api/vault/${itemToDelete}?userId=${user.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        deleteItem(itemToDelete);
        showToast('Item deleted successfully', 'success');
      } else {
        throw new Error('Failed to delete item');
      }
    } catch (error: any) {
      showToast(error.message || 'Failed to delete item', 'error');
    } finally {
      setDeleteModalOpen(false);
      setItemToDelete(null);
    }
  };

  const filteredItems = items
    .filter((item) => {
      if (filterType !== 'all' && item.itemType !== filterType) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          item.title?.toLowerCase().includes(query) ||
          item.username?.toLowerCase().includes(query) ||
          item.url?.toLowerCase().includes(query)
        );
      }
      return true;
    });

  const getIcon = (type: string) => {
    switch (type) {
      case 'password':
        return <KeyIcon className="w-5 h-5 text-primary" />;
      case 'note':
        return <DocumentTextIcon className="w-5 h-5 text-success" />;
      case 'card':
        return <CreditCardIcon className="w-5 h-5 text-warning" />;
      case 'apikey':
        return <CodeBracketIcon className="w-5 h-5 text-danger" />;
      default:
        return <KeyIcon className="w-5 h-5 text-primary" />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">My Vault</h1>
          <p className="text-sm text-text-secondary mt-1">
            {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => openModal('add')}
          className="btn-primary flex items-center gap-2"
        >
          <PlusIcon className="w-5 h-5" />
          Add Item
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search vault..."
            className="input pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <FunnelIcon className="w-5 h-5 text-text-secondary" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="input w-48"
          >
            <option value="all">All Items</option>
            <option value="password">Passwords</option>
            <option value="note">Notes</option>
            <option value="card">Cards</option>
            <option value="apikey">API Keys</option>
          </select>
        </div>
      </div>

      {/* Vault Items */}
      {loading ? (
        <SkeletonList count={5} />
      ) : filteredItems.length === 0 ? (
        <div className="card text-center py-12">
          <KeyIcon className="w-12 h-12 text-text-secondary mx-auto mb-3" />
          <h2 className="text-xl font-semibold text-text-primary mb-2">
            No items found
          </h2>
          <p className="text-text-secondary mb-6">
            {searchQuery || filterType !== 'all'
              ? 'Try adjusting your search or filter'
              : 'Get started by adding your first item'}
          </p>
          {!searchQuery && filterType === 'all' && (
            <button
              onClick={() => openModal('add')}
              className="btn-primary inline-flex items-center gap-2"
            >
              <PlusIcon className="w-5 h-5" />
              Add Your First Item
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="card-hover"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-surface rounded-lg flex items-center justify-center flex-shrink-0">
                  {getIcon(item.itemType)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-text-primary mb-1">
                    {item.title}
                  </h3>
                  {item.username && (
                    <p className="text-text-secondary text-sm mb-1">
                      {item.username}
                    </p>
                  )}
                  {item.url && (
                    <p className="text-text-secondary text-sm mb-2 truncate">
                      {item.url}
                    </p>
                  )}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="badge badge-success capitalize">
                      {item.itemType}
                    </span>
                    <span className="text-xs text-text-secondary">
                      {formatDate(item.updatedAt)}
                    </span>
                    {item.tags?.map((tag) => (
                      <span key={tag} className="badge bg-surface">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {item.password && <ClipboardButton text={item.password} />}
                  <button className="p-2 text-text-secondary hover:text-primary hover:bg-surface rounded-lg transition-all">
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setItemToDelete(item.id);
                      setDeleteModalOpen(true);
                    }}
                    className="p-2 text-text-secondary hover:text-danger hover:bg-surface rounded-lg transition-all"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Item"
      >
        <p className="text-text-secondary mb-6">
          Are you sure you want to delete this item? This action cannot be undone.
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={() => setDeleteModalOpen(false)}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button onClick={handleDelete} className="btn-danger">
            Delete
          </button>
        </div>
      </Modal>
    </div>
  );
}
