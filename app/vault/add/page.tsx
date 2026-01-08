'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/stores/authStore';
import { useVaultStore } from '@/stores/vaultStore';
import { useUIStore } from '@/stores/uiStore';
import { encryptVaultItem } from '@/lib/crypto';
import { SecureInput } from '@/components/SecureInput';
import {
    KeyIcon,
    DocumentTextIcon,
    CreditCardIcon,
    CodeBracketIcon,
    ArrowLeftIcon,
} from '@heroicons/react/24/outline';

type ItemType = 'password' | 'note' | 'card' | 'apikey';

interface FormData {
    title: string;
    username: string;
    password: string;
    url: string;
    note: string;
    cardNumber: string;
    cardExpiry: string;
    cardCVV: string;
    cardHolder: string;
    apiKey: string;
    apiService: string;
    tags: string;
}

const itemTypes = [
    { id: 'password' as ItemType, label: 'Password', icon: KeyIcon, color: 'text-primary' },
    { id: 'note' as ItemType, label: 'Secure Note', icon: DocumentTextIcon, color: 'text-success' },
    { id: 'card' as ItemType, label: 'Credit Card', icon: CreditCardIcon, color: 'text-warning' },
    { id: 'apikey' as ItemType, label: 'API Key', icon: CodeBracketIcon, color: 'text-danger' },
];

export default function AddItemPage() {
    const router = useRouter();
    const { user, masterKey } = useAuthStore();
    const { addItem } = useVaultStore();
    const { showToast } = useUIStore();

    const [selectedType, setSelectedType] = useState<ItemType>('password');
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState<FormData>({
        title: '',
        username: '',
        password: '',
        url: '',
        note: '',
        cardNumber: '',
        cardExpiry: '',
        cardCVV: '',
        cardHolder: '',
        apiKey: '',
        apiService: '',
        tags: '',
    });

    const handleInputChange = (field: keyof FormData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.title) {
            showToast('Please enter a title', 'error');
            return;
        }

        if (!masterKey || !user) {
            showToast('Session expired. Please login again.', 'error');
            router.push('/auth/login');
            return;
        }

        setSaving(true);

        try {
            // Build item data based on type
            const itemData: Record<string, any> = {
                title: formData.title,
                itemType: selectedType,
                tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
            };

            switch (selectedType) {
                case 'password':
                    itemData.username = formData.username;
                    itemData.password = formData.password;
                    itemData.url = formData.url;
                    break;
                case 'note':
                    itemData.note = formData.note;
                    break;
                case 'card':
                    itemData.cardNumber = formData.cardNumber;
                    itemData.cardExpiry = formData.cardExpiry;
                    itemData.cardCVV = formData.cardCVV;
                    itemData.cardHolder = formData.cardHolder;
                    break;
                case 'apikey':
                    itemData.apiKey = formData.apiKey;
                    itemData.apiService = formData.apiService;
                    break;
            }

            // Encrypt the item
            const { encryptedData, iv } = await encryptVaultItem(itemData, masterKey);

            // Save to backend
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

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to save item');
            }

            // Add to local store with proper typing
            addItem({
                id: data.item.id,
                itemType: selectedType,
                title: formData.title,
                username: formData.username || undefined,
                password: formData.password || undefined,
                url: formData.url || undefined,
                note: formData.note || undefined,
                cardNumber: formData.cardNumber || undefined,
                cardExpiry: formData.cardExpiry || undefined,
                cardCVV: formData.cardCVV || undefined,
                apiKey: formData.apiKey || undefined,
                tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
                createdAt: data.item.createdAt,
                updatedAt: data.item.updatedAt,
            });

            showToast('Item saved successfully!', 'success');
            router.push('/vault');
        } catch (error: any) {
            showToast(error.message || 'Failed to save item', 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => router.back()}
                    className="p-2 text-text-secondary hover:text-text-primary hover:bg-surface rounded-lg transition-all"
                >
                    <ArrowLeftIcon className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Add New Item</h1>
                    <p className="text-sm text-text-secondary mt-1">
                        Choose a type and fill in the details
                    </p>
                </div>
            </div>

            {/* Type Selector */}
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

            {/* Form */}
            <motion.form
                key={selectedType}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onSubmit={handleSubmit}
                className="card space-y-4"
            >
                {/* Common: Title */}
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

                {/* Password Fields */}
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

                {/* Note Fields */}
                {selectedType === 'note' && (
                    <div>
                        <label className="block text-sm font-medium text-text-primary mb-2">
                            Secure Note
                        </label>
                        <textarea
                            value={formData.note}
                            onChange={(e) => handleInputChange('note', e.target.value)}
                            placeholder="Enter your secure note..."
                            rows={6}
                            className="input resize-none"
                        />
                    </div>
                )}

                {/* Card Fields */}
                {selectedType === 'card' && (
                    <>
                        <div>
                            <label className="block text-sm font-medium text-text-primary mb-2">
                                Cardholder Name
                            </label>
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
                                <label className="block text-sm font-medium text-text-primary mb-2">
                                    Expiry Date
                                </label>
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

                {/* API Key Fields */}
                {selectedType === 'apikey' && (
                    <>
                        <div>
                            <label className="block text-sm font-medium text-text-primary mb-2">
                                Service Name
                            </label>
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

                {/* Common: Tags */}
                <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                        Tags (comma-separated)
                    </label>
                    <input
                        type="text"
                        value={formData.tags}
                        onChange={(e) => handleInputChange('tags', e.target.value)}
                        placeholder="work, personal, important"
                        className="input"
                    />
                </div>

                {/* Submit */}
                <div className="flex gap-3 pt-4">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="flex-1 btn-secondary py-3"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex-1 btn-primary py-3"
                    >
                        {saving ? 'Saving...' : 'Save Item'}
                    </button>
                </div>
            </motion.form>
        </div>
    );
}
