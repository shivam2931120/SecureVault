import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '@/utils/constants';

export type AlertType = 'login' | 'export' | 'share' | 'failed_unlock' | 'new_device';

interface AlertEvent {
    id: string;
    type: AlertType;
    message: string;
    timestamp: string;
    sent: boolean;
}

const ALERTS_KEY = 'security_alert_queue';
const EMAIL_KEY = 'user_email_for_alerts';

// Queue an alert to be sent
export async function queueSecurityAlert(type: AlertType, message: string): Promise<void> {
    try {
        const stored = await AsyncStorage.getItem(ALERTS_KEY);
        const alerts: AlertEvent[] = stored ? JSON.parse(stored) : [];

        const newAlert: AlertEvent = {
            id: `alert_${Date.now()}`,
            type,
            message,
            timestamp: new Date().toISOString(),
            sent: false,
        };

        alerts.push(newAlert);
        await AsyncStorage.setItem(ALERTS_KEY, JSON.stringify(alerts));

        // Attempt to send immediately
        await sendPendingAlerts();
    } catch (e) {
        console.error('Failed to queue alert', e);
    }
}

// Send all pending alerts via API
export async function sendPendingAlerts(): Promise<void> {
    try {
        const stored = await AsyncStorage.getItem(ALERTS_KEY);
        if (!stored) return;

        const email = await AsyncStorage.getItem(EMAIL_KEY);
        if (!email) {
            console.log('No email configured for alerts');
            return;
        }

        const alerts: AlertEvent[] = JSON.parse(stored);
        const pending = alerts.filter(a => !a.sent);

        if (pending.length === 0) return;

        // Send to backend (this would call your email API)
        try {
            const res = await fetch(`${API_URL}/api/alerts/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    alerts: pending.map(a => ({
                        type: a.type,
                        message: a.message,
                        timestamp: a.timestamp,
                    })),
                }),
            });

            if (res.ok) {
                // Mark as sent
                const updated = alerts.map(a =>
                    pending.some(p => p.id === a.id) ? { ...a, sent: true } : a
                );
                await AsyncStorage.setItem(ALERTS_KEY, JSON.stringify(updated));
            }
        } catch (e) {
            console.log('Failed to send alerts to server, will retry later', e);
        }
    } catch (e) {
        console.error('Failed to process alerts', e);
    }
}

// Set email for alerts
export async function setAlertEmail(email: string): Promise<void> {
    await AsyncStorage.setItem(EMAIL_KEY, email);
}

// Get current alert email
export async function getAlertEmail(): Promise<string | null> {
    return AsyncStorage.getItem(EMAIL_KEY);
}

// Clear old alerts (keep last 50)
export async function cleanupAlerts(): Promise<void> {
    try {
        const stored = await AsyncStorage.getItem(ALERTS_KEY);
        if (!stored) return;

        const alerts: AlertEvent[] = JSON.parse(stored);
        if (alerts.length > 50) {
            const trimmed = alerts.slice(-50);
            await AsyncStorage.setItem(ALERTS_KEY, JSON.stringify(trimmed));
        }
    } catch (e) {
        console.error('Failed to cleanup alerts', e);
    }
}

// Alert descriptions for display
export const ALERT_MESSAGES: Record<AlertType, string> = {
    login: 'New login detected',
    export: 'Vault was exported',
    share: 'Item was shared',
    failed_unlock: 'Multiple failed unlock attempts',
    new_device: 'New device access',
};
