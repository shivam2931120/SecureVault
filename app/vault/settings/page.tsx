'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';
import { useRouter } from 'next/navigation';
import {
    ClockIcon,
    KeyIcon,
    ArrowDownTrayIcon,
    ArrowUpTrayIcon,
    TrashIcon,
    ShieldCheckIcon,
    SunIcon,
    MoonIcon,
} from '@heroicons/react/24/outline';
import { Modal } from '@/components/Modal';

export default function SettingsPage() {
    const { user, logout } = useAuthStore();
    const { showToast } = useUIStore();
    const router = useRouter();

    const [autoLockTimeout, setAutoLockTimeout] = useState(15);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [exportModalOpen, setExportModalOpen] = useState(false);
    const [darkMode, setDarkMode] = useState(true);

    const handleLogout = () => {
        logout();
        showToast('Logged out successfully', 'success');
        router.push('/auth/login');
    };

    const handleExportVault = async () => {
        // This would export encrypted vault data
        showToast('Export feature coming soon!', 'info');
        setExportModalOpen(false);
    };

    const handleImportVault = () => {
        showToast('Import feature coming soon!', 'info');
    };

    const handleDeleteAccount = () => {
        // This would call API to delete account
        showToast('Account deletion is not yet implemented', 'warning');
        setDeleteModalOpen(false);
    };

    const timeoutOptions = [
        { value: 1, label: '1 minute' },
        { value: 5, label: '5 minutes' },
        { value: 15, label: '15 minutes' },
        { value: 30, label: '30 minutes' },
        { value: 60, label: '1 hour' },
        { value: 0, label: 'Never' },
    ];

    return (
        <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
                <p className="text-sm text-text-secondary mt-1">
                    Manage your account and preferences
                </p>
            </div>

            {/* Account Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card mb-6"
            >
                <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                    <ShieldCheckIcon className="w-5 h-5" />
                    Account
                </h2>

                <div className="space-y-4">
                    <div className="flex items-center justify-between py-3 border-b border-border">
                        <div>
                            <p className="font-medium text-text-primary">Email</p>
                            <p className="text-sm text-text-secondary">{user?.email || 'Not logged in'}</p>
                        </div>
                    </div>

                    <div className="flex items-center justify-between py-3 border-b border-border">
                        <div>
                            <p className="font-medium text-text-primary">Account Created</p>
                            <p className="text-sm text-text-secondary">
                                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center justify-between py-3">
                        <div>
                            <p className="font-medium text-text-primary">Change Master Password</p>
                            <p className="text-sm text-text-secondary">Update your encryption password</p>
                        </div>
                        <button className="btn-secondary text-sm">
                            <KeyIcon className="w-4 h-4 mr-2 inline" />
                            Change
                        </button>
                    </div>
                </div>
            </motion.div>

            {/* Security Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="card mb-6"
            >
                <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                    <ClockIcon className="w-5 h-5" />
                    Security
                </h2>

                <div className="space-y-4">
                    <div className="flex items-center justify-between py-3 border-b border-border">
                        <div>
                            <p className="font-medium text-text-primary">Auto-Lock Timeout</p>
                            <p className="text-sm text-text-secondary">Lock vault after inactivity</p>
                        </div>
                        <select
                            value={autoLockTimeout}
                            onChange={(e) => setAutoLockTimeout(Number(e.target.value))}
                            className="input w-40"
                        >
                            {timeoutOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center justify-between py-3">
                        <div>
                            <p className="font-medium text-text-primary">Theme</p>
                            <p className="text-sm text-text-secondary">Choose your appearance</p>
                        </div>
                        <button
                            onClick={() => setDarkMode(!darkMode)}
                            className="btn-secondary text-sm flex items-center gap-2"
                        >
                            {darkMode ? (
                                <>
                                    <MoonIcon className="w-4 h-4" />
                                    Dark
                                </>
                            ) : (
                                <>
                                    <SunIcon className="w-4 h-4" />
                                    Light
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </motion.div>

            {/* Data Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="card mb-6"
            >
                <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                    <ArrowDownTrayIcon className="w-5 h-5" />
                    Data Management
                </h2>

                <div className="space-y-4">
                    <div className="flex items-center justify-between py-3 border-b border-border">
                        <div>
                            <p className="font-medium text-text-primary">Export Vault</p>
                            <p className="text-sm text-text-secondary">Download encrypted backup</p>
                        </div>
                        <button
                            onClick={() => setExportModalOpen(true)}
                            className="btn-secondary text-sm"
                        >
                            <ArrowDownTrayIcon className="w-4 h-4 mr-2 inline" />
                            Export
                        </button>
                    </div>

                    <div className="flex items-center justify-between py-3">
                        <div>
                            <p className="font-medium text-text-primary">Import Vault</p>
                            <p className="text-sm text-text-secondary">Restore from backup file</p>
                        </div>
                        <button
                            onClick={handleImportVault}
                            className="btn-secondary text-sm"
                        >
                            <ArrowUpTrayIcon className="w-4 h-4 mr-2 inline" />
                            Import
                        </button>
                    </div>
                </div>
            </motion.div>

            {/* Danger Zone */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="card border-danger/20"
            >
                <h2 className="text-lg font-semibold text-danger mb-4 flex items-center gap-2">
                    <TrashIcon className="w-5 h-5" />
                    Danger Zone
                </h2>

                <div className="space-y-4">
                    <div className="flex items-center justify-between py-3 border-b border-border">
                        <div>
                            <p className="font-medium text-text-primary">Sign Out</p>
                            <p className="text-sm text-text-secondary">Log out of your account</p>
                        </div>
                        <button onClick={handleLogout} className="btn-secondary text-sm">
                            Sign Out
                        </button>
                    </div>

                    <div className="flex items-center justify-between py-3">
                        <div>
                            <p className="font-medium text-danger">Delete Account</p>
                            <p className="text-sm text-text-secondary">Permanently delete your account and data</p>
                        </div>
                        <button
                            onClick={() => setDeleteModalOpen(true)}
                            className="btn-danger text-sm"
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </motion.div>

            {/* Export Modal */}
            <Modal
                isOpen={exportModalOpen}
                onClose={() => setExportModalOpen(false)}
                title="Export Vault"
            >
                <p className="text-text-secondary mb-4">
                    Your vault data will be exported as an encrypted JSON file.
                    You'll need your master password to decrypt it later.
                </p>
                <div className="flex gap-3 justify-end">
                    <button onClick={() => setExportModalOpen(false)} className="btn-secondary">
                        Cancel
                    </button>
                    <button onClick={handleExportVault} className="btn-primary">
                        Export
                    </button>
                </div>
            </Modal>

            {/* Delete Modal */}
            <Modal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                title="Delete Account"
            >
                <div className="bg-danger/10 border border-danger/20 rounded-lg p-4 mb-4">
                    <p className="text-danger font-medium">Warning: This action cannot be undone!</p>
                    <p className="text-sm text-text-secondary mt-1">
                        All your vault items, settings, and account data will be permanently deleted.
                    </p>
                </div>
                <div className="flex gap-3 justify-end">
                    <button onClick={() => setDeleteModalOpen(false)} className="btn-secondary">
                        Cancel
                    </button>
                    <button onClick={handleDeleteAccount} className="btn-danger">
                        Delete My Account
                    </button>
                </div>
            </Modal>
        </div>
    );
}
