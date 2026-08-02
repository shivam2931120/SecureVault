'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { useVaultStore } from '@/stores/vaultStore';
import { useUIStore } from '@/stores/uiStore';
import { encryptVaultItem } from '@/lib/crypto';
import {
  buildVaultItemData,
  emptyVaultItemFormData,
  toDecryptedVaultItem,
  validateVaultItemForm,
  VaultItemFormData,
  WebVaultItemType,
} from '@/lib/vaultForm';
import { VaultItem } from '@/types';
import { VaultItemEditor } from '@/components/VaultItemEditor';

export default function AddItemPage() {
  const router = useRouter();
  const { user, masterKey } = useAuthStore();
  const { addItem } = useVaultStore();
  const { showToast } = useUIStore();

  const [selectedType, setSelectedType] = useState<WebVaultItemType>('password');
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<VaultItemFormData>(emptyVaultItemFormData);

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

    if (!masterKey || !user) {
      showToast('Session expired. Please login again.', 'error');
      router.push('/auth/login');
      return;
    }

    setSaving(true);

    try {
      const itemData = buildVaultItemData(selectedType, formData);
      const { encryptedData, iv } = await encryptVaultItem(itemData, masterKey);

      const response = await fetch('/api/vault', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          itemType: selectedType,
          encryptedData,
          iv,
        }),
      });

      const data = await response.json() as { item?: VaultItem; error?: string };

      if (!response.ok || !data.item) {
        throw new Error(data.error || 'Failed to save item');
      }

      addItem(toDecryptedVaultItem(data.item.id, selectedType, formData, data.item.createdAt, data.item.updatedAt));
      showToast('Item saved successfully', 'success');
      router.push('/vault');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save item';
      showToast(message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <VaultItemEditor
      mode="add"
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
