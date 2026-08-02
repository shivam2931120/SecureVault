'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { useVaultStore } from '@/stores/vaultStore';
import { useUIStore } from '@/stores/uiStore';
import { decryptVaultItem, encryptVaultItem } from '@/lib/crypto';
import { getDisplayTitle } from '@/lib/vault';
import {
  emptyVaultItemFormData,
  formDataFromVaultItem,
  toDecryptedVaultItem,
  validateVaultItemForm,
  VaultItemFormData,
  WebVaultItemType,
  buildVaultItemData,
} from '@/lib/vaultForm';
import { DecryptedVaultItem, VaultItem, VaultItemType } from '@/types';
import { SkeletonCard } from '@/components/Skeleton';
import { VaultItemEditor } from '@/components/VaultItemEditor';

function getEditableType(itemType: VaultItemType): WebVaultItemType | null {
  if (itemType === 'login') return 'password';
  if (itemType === 'password' || itemType === 'note' || itemType === 'card' || itemType === 'apikey' || itemType === 'identity' || itemType === 'wifi') {
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
      if (!user || !masterKey || !itemId) return;

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

      updateItem(itemId, toDecryptedVaultItem(data.item.id, selectedType, formData, createdAt, data.item.updatedAt));
      showToast('Item updated successfully', 'success');
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
      <div className="mx-auto max-w-[980px]">
        <SkeletonCard />
      </div>
    );
  }

  return (
    <VaultItemEditor
      mode="edit"
      selectedType={selectedType}
      onTypeChange={setSelectedType}
      formData={formData}
      onInputChange={handleInputChange}
      onSubmit={handleSubmit}
      onCancel={() => router.back()}
      saving={saving}
    />
  );
}
