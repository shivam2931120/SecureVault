'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/stores/authStore';
import { useVaultStore } from '@/stores/vaultStore';
import { useUIStore } from '@/stores/uiStore';
import { decryptVaultItem, encryptVaultItem } from '@/lib/crypto';
import { getDisplayTitle } from '@/lib/vault';
import {
  buildVaultItemData,
  emptyVaultItemFormData,
  formDataFromVaultItem,
  toDecryptedVaultItem,
  validateVaultItemForm,
  VaultItemFormData,
  WebVaultItemType,
} from '@/lib/vaultForm';
import { DecryptedVaultItem, VaultItem, VaultItemType } from '@/types';
import { SecureInput } from '@/components/SecureInput';
import { SkeletonCard } from '@/components/Skeleton';
import {
  ArrowLeftIcon,
  CodeBracketIcon,
  CreditCardIcon,
  DocumentTextIcon,
  KeyIcon,
} from '@heroicons/react/24/outline';

const itemTypes = [
  { id: 'password' as WebVaultItemType, label: 'Password', icon: KeyIcon, color: 'text-primary' },
  { id: 'note' as WebVaultItemType, label: 'Secure Note', icon: DocumentTextIcon, color: 'text-success' },
  { id: 'card' as WebVaultItemType, label: 'Credit Card', icon: CreditCardIcon, color: 'text-warning' },
  { id: 'apikey' as WebVaultItemType, label: 'API Key', icon: CodeBracketIcon, color: 'text-danger' },
];

function getEditableType(itemType: VaultItemType): WebVaultItemType | null {
  if (itemType === 'login') {
    return 'password';
  }

  if (itemType === 'password' || itemType === 'note' || itemType === 'card' || itemType === 'apikey') {
    return itemType;
  }

  return null;
}

export default function EditItemPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const itemId = params.id;
  const { user, masterKey } = useAuthStore();
  const { updateItem } = useVaultStore();
  const { showToast } = useUIStore();

  const [selectedType, setSelectedType] = useState<WebVaultItemType>('password');
  const [formData, setFormData] = useState<VaultItemFormData>(emptyVaultItemFormData);
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadItem = async () => {
      if (!user || !masterKey || !itemId) {
        return;
      }

      try {
        const response = await fetch(`/api/vault/${itemId}?userId=${encodeURIComponent(user.id)}`);
        const data = await response.json() as { item?: VaultItem; error?: string };

        if (!response.ok || !data.item) {
          throw new Error(data.error || 'Failed to load item');
        }

        const decryptedData = await decryptVaultItem(data.item.encryptedData, data.item.iv, masterKey);
        if (!decryptedData || typeof decryptedData !== 'object') {
          throw new Error('Failed to decrypt item');
        }

        const itemData = decryptedData as Partial<DecryptedVaultItem>;
        const decryptedItem = {
          ...itemData,
          id: data.item.id,
          itemType: itemData.itemType ?? data.item.itemType,
          title: getDisplayTitle(itemData),
          createdAt: data.item.createdAt,
          updatedAt: data.item.updatedAt,
        } as DecryptedVaultItem;
        const editableType = getEditableType(decryptedItem.itemType);

        if (!editableType) {
          showToast('This item type is not editable in the web app yet', 'warning');
          router.push('/vault');
          return;
        }

        setSelectedType(editableType);
        setFormData(formDataFromVaultItem(decryptedItem));
        setCreatedAt(data.item.createdAt);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load item';
        showToast(message, 'error');
        router.push('/vault');
      } finally {
        setLoading(false);
      }
    };

    void loadItem();
  }, [itemId, masterKey, router, showToast, user]);

  const handleInputChange = (field: keyof VaultItemFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateVaultItemForm(selectedType, formData);
    if (validationError) {
      showToast(validationError, 'error');
      return;
    }

    if (!masterKey || !user || !itemId || !createdAt) {
      showToast('Session expired. Please login again.', 'error');
      router.push('/auth/login');
      return;
    }

    setSaving(true);

    try {
      const itemData = buildVaultItemData(selectedType, formData);
      const { encryptedData, iv } = await encryptVaultItem(itemData, masterKey);

      const response = await fetch(`/api/vault/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          encryptedData,
          iv,
        }),
      });

      const data = await response.json() as { item?: VaultItem; error?: string };

      if (!response.ok || !data.item) {
        throw new Error(data.error || 'Failed to update item');
      }

      const updatedItem = toDecryptedVaultItem(
        data.item.id,
        selectedType,
        formData,
        createdAt,
        data.item.updatedAt
      );

      updateItem(itemId, updatedItem);
      showToast('Item updated successfully!', 'success');
      router.push('/vault');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update item';
      showToast(message, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <SkeletonCard />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.back()}
          className="p-2 text-text-secondary hover:text-text-primary hover:bg-surface rounded-lg transition-all"
          aria-label="Go back"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Edit Item</h1>
          <p className="text-sm text-text-secondary mt-1">Update the item and re-encrypt it locally</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {itemTypes.map((type) => {
          const Icon = type.icon;
          const isSelected = selectedType === type.id;
          return (
            <button
              key={type.id}
              onClick={() => setSelectedType(type.id)}
              className={`p-4 rounded-lg border transition-all ${isSelected
                ? 'border-primary bg-primary/10'
                : 'border-border bg-surface hover:border-primary/50'
              }`}
            >
              <Icon className={`w-6 h-6 mx-auto mb-2 ${isSelected ? 'text-primary' : type.color}`} />
              <p className={`text-sm font-medium ${isSelected ? 'text-primary' : 'text-text-primary'}`}>
                {type.label}
              </p>
            </button>
          );
        })}
      </div>

      <motion.form
        key={selectedType}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className="card space-y-4"
      >
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Title <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            placeholder="e.g., Google Account"
            className="input"
            required
          />
        </div>

        {selectedType === 'password' && (
          <>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Username / Email
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                placeholder="user@example.com"
                className="input"
              />
            </div>
            <SecureInput
              value={formData.password}
              onChange={(v) => handleInputChange('password', v)}
              label="Password"
              placeholder="Enter password"
            />
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Website URL
              </label>
              <input
                type="url"
                value={formData.url}
                onChange={(e) => handleInputChange('url', e.target.value)}
                placeholder="https://example.com"
                className="input"
              />
            </div>
          </>
        )}

        {selectedType === 'note' && (
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Secure Note</label>
            <textarea
              value={formData.note}
              onChange={(e) => handleInputChange('note', e.target.value)}
              placeholder="Enter your secure note..."
              rows={6}
              className="input resize-none"
            />
          </div>
        )}

        {selectedType === 'card' && (
          <>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Cardholder Name</label>
              <input
                type="text"
                value={formData.cardHolder}
                onChange={(e) => handleInputChange('cardHolder', e.target.value)}
                placeholder="John Doe"
                className="input"
              />
            </div>
            <SecureInput
              value={formData.cardNumber}
              onChange={(v) => handleInputChange('cardNumber', v)}
              label="Card Number"
              placeholder="1234 5678 9012 3456"
            />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Expiry Date</label>
                <input
                  type="text"
                  value={formData.cardExpiry}
                  onChange={(e) => handleInputChange('cardExpiry', e.target.value)}
                  placeholder="MM/YY"
                  className="input"
                />
              </div>
              <SecureInput
                value={formData.cardCVV}
                onChange={(v) => handleInputChange('cardCVV', v)}
                label="CVV"
                placeholder="123"
              />
            </div>
          </>
        )}

        {selectedType === 'apikey' && (
          <>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Service Name</label>
              <input
                type="text"
                value={formData.apiService}
                onChange={(e) => handleInputChange('apiService', e.target.value)}
                placeholder="e.g., OpenAI, Stripe"
                className="input"
              />
            </div>
            <SecureInput
              value={formData.apiKey}
              onChange={(v) => handleInputChange('apiKey', v)}
              label="API Key"
              placeholder="sk-..."
            />
          </>
        )}

        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">Tags (comma-separated)</label>
          <input
            type="text"
            value={formData.tags}
            onChange={(e) => handleInputChange('tags', e.target.value)}
            placeholder="work, personal, important"
            className="input"
          />
        </div>

        <div className="flex gap-3 pt-4">
          <button type="button" onClick={() => router.back()} className="flex-1 btn-secondary py-3">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="flex-1 btn-primary py-3">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </motion.form>
    </div>
  );
}
