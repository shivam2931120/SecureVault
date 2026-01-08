'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useVaultStore } from '@/stores/vaultStore';
import { useAuthStore } from '@/stores/authStore';
import {
    ShieldCheckIcon,
    ExclamationTriangleIcon,
    CheckCircleIcon,
    XCircleIcon,
    ArrowPathIcon,
} from '@heroicons/react/24/outline';

interface SecurityIssue {
    type: 'weak' | 'reused' | 'old';
    severity: 'high' | 'medium' | 'low';
    itemId: string;
    itemTitle: string;
    message: string;
}

export default function SecurityPage() {
    const { items } = useVaultStore();
    const { user } = useAuthStore();
    const [issues, setIssues] = useState<SecurityIssue[]>([]);
    const [scanning, setScanning] = useState(true);
    const [score, setScore] = useState(100);

    useEffect(() => {
        analyzeVault();
    }, [items]);

    const analyzeVault = () => {
        setScanning(true);
        const foundIssues: SecurityIssue[] = [];
        const passwords: Map<string, string[]> = new Map();

        // Analyze password items
        const passwordItems = items.filter(item => item.itemType === 'password');

        passwordItems.forEach(item => {
            if (!item.password) return;

            // Check for weak passwords
            if (item.password.length < 12) {
                foundIssues.push({
                    type: 'weak',
                    severity: item.password.length < 8 ? 'high' : 'medium',
                    itemId: item.id,
                    itemTitle: item.title,
                    message: `Password is only ${item.password.length} characters. Recommend 12+ characters.`,
                });
            }

            // Check for simple patterns
            if (/^[a-z]+$/i.test(item.password) || /^[0-9]+$/.test(item.password)) {
                foundIssues.push({
                    type: 'weak',
                    severity: 'high',
                    itemId: item.id,
                    itemTitle: item.title,
                    message: 'Password uses only letters or numbers. Add variety.',
                });
            }

            // Track for reuse detection
            const existing = passwords.get(item.password);
            if (existing) {
                existing.push(item.title);
            } else {
                passwords.set(item.password, [item.title]);
            }

            // Check for old passwords (mock - would need updatedAt comparison)
            const updatedDate = new Date(item.updatedAt);
            const daysSinceUpdate = Math.floor((Date.now() - updatedDate.getTime()) / (1000 * 60 * 60 * 24));
            if (daysSinceUpdate > 90) {
                foundIssues.push({
                    type: 'old',
                    severity: 'low',
                    itemId: item.id,
                    itemTitle: item.title,
                    message: `Password hasn't been changed in ${daysSinceUpdate} days.`,
                });
            }
        });

        // Add reused password issues
        passwords.forEach((titles, password) => {
            if (titles.length > 1) {
                titles.forEach(title => {
                    foundIssues.push({
                        type: 'reused',
                        severity: 'high',
                        itemId: items.find(i => i.title === title)?.id || '',
                        itemTitle: title,
                        message: `Password is reused across ${titles.length} accounts.`,
                    });
                });
            }
        });

        // Calculate score
        const highIssues = foundIssues.filter(i => i.severity === 'high').length;
        const mediumIssues = foundIssues.filter(i => i.severity === 'medium').length;
        const lowIssues = foundIssues.filter(i => i.severity === 'low').length;
        const calculatedScore = Math.max(0, 100 - (highIssues * 15) - (mediumIssues * 8) - (lowIssues * 3));

        setIssues(foundIssues);
        setScore(calculatedScore);
        setScanning(false);
    };

    const getScoreColor = () => {
        if (score >= 80) return 'text-success';
        if (score >= 50) return 'text-warning';
        return 'text-danger';
    };

    const getScoreBg = () => {
        if (score >= 80) return 'bg-success';
        if (score >= 50) return 'bg-warning';
        return 'bg-danger';
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'high': return 'text-danger bg-danger/10 border-danger/20';
            case 'medium': return 'text-warning bg-warning/10 border-warning/20';
            case 'low': return 'text-text-secondary bg-surface border-border';
            default: return '';
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Security Dashboard</h1>
                    <p className="text-sm text-text-secondary mt-1">
                        Monitor your password health and security issues
                    </p>
                </div>
                <button
                    onClick={analyzeVault}
                    disabled={scanning}
                    className="btn-secondary flex items-center gap-2"
                >
                    <ArrowPathIcon className={`w-4 h-4 ${scanning ? 'animate-spin' : ''}`} />
                    Rescan
                </button>
            </div>

            {/* Score Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card mb-6"
            >
                <div className="flex items-center gap-6">
                    <div className="relative w-32 h-32">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle
                                cx="64"
                                cy="64"
                                r="56"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="8"
                                className="text-surface"
                            />
                            <circle
                                cx="64"
                                cy="64"
                                r="56"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="8"
                                strokeDasharray={`${(score / 100) * 352} 352`}
                                className={getScoreBg()}
                                strokeLinecap="round"
                            />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className={`text-3xl font-bold ${getScoreColor()}`}>{score}</span>
                        </div>
                    </div>
                    <div className="flex-1">
                        <h2 className="text-xl font-semibold text-text-primary mb-2">
                            {score >= 80 ? 'Excellent Security' : score >= 50 ? 'Needs Improvement' : 'Critical Issues'}
                        </h2>
                        <p className="text-text-secondary mb-4">
                            {issues.length === 0
                                ? 'No security issues detected. Great job!'
                                : `Found ${issues.length} issue${issues.length !== 1 ? 's' : ''} that need attention.`}
                        </p>
                        <div className="flex gap-4">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-danger" />
                                <span className="text-sm text-text-secondary">
                                    {issues.filter(i => i.severity === 'high').length} High
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-warning" />
                                <span className="text-sm text-text-secondary">
                                    {issues.filter(i => i.severity === 'medium').length} Medium
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-text-secondary" />
                                <span className="text-sm text-text-secondary">
                                    {issues.filter(i => i.severity === 'low').length} Low
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                    { label: 'Total Items', value: items.length, icon: ShieldCheckIcon },
                    { label: 'Passwords', value: items.filter(i => i.itemType === 'password').length, icon: CheckCircleIcon },
                    { label: 'Weak', value: issues.filter(i => i.type === 'weak').length, icon: ExclamationTriangleIcon },
                    { label: 'Reused', value: issues.filter(i => i.type === 'reused').length, icon: XCircleIcon },
                ].map((stat, i) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="card"
                    >
                        <stat.icon className="w-5 h-5 text-text-secondary mb-2" />
                        <p className="text-2xl font-bold text-text-primary">{stat.value}</p>
                        <p className="text-sm text-text-secondary">{stat.label}</p>
                    </motion.div>
                ))}
            </div>

            {/* Issues List */}
            {issues.length > 0 && (
                <div className="card">
                    <h3 className="text-lg font-semibold text-text-primary mb-4">Security Issues</h3>
                    <div className="space-y-3">
                        {issues.map((issue, index) => (
                            <motion.div
                                key={`${issue.itemId}-${issue.type}-${index}`}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className={`p-4 rounded-lg border ${getSeverityColor(issue.severity)}`}
                            >
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="font-medium">{issue.itemTitle}</p>
                                        <p className="text-sm opacity-80 mt-1">{issue.message}</p>
                                    </div>
                                    <span className="text-xs uppercase font-medium px-2 py-1 rounded bg-black/10">
                                        {issue.type}
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

            {/* Empty State */}
            {issues.length === 0 && !scanning && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="card text-center py-12"
                >
                    <CheckCircleIcon className="w-16 h-16 text-success mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-text-primary mb-2">All Clear!</h3>
                    <p className="text-text-secondary">
                        Your vault is secure. Keep up the good work!
                    </p>
                </motion.div>
            )}
        </div>
    );
}
