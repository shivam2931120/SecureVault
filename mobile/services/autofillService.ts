import AsyncStorage from '@react-native-async-storage/async-storage';
import { decryptVaultItem } from '@/crypto';

export interface AutofillCredential {
    id: string;
    title: string;
    url: string;
    username: string;
    password: string;
}

interface AutofillSettings {
    enabled: boolean;
    matchByDomain: boolean;
    saveNewCredentials: boolean;
    showNotifications: boolean;
}

const AUTOFILL_SETTINGS_KEY = 'autofill_settings';

class AutofillService {
    private settings: AutofillSettings = {
        enabled: false,
        matchByDomain: true,
        saveNewCredentials: true,
        showNotifications: true,
    };

    async initialize(): Promise<void> {
        const stored = await AsyncStorage.getItem(AUTOFILL_SETTINGS_KEY);
        if (stored) {
            this.settings = { ...this.settings, ...JSON.parse(stored) };
        }
    }

    async getSettings(): Promise<AutofillSettings> {
        return this.settings;
    }

    async updateSettings(updates: Partial<AutofillSettings>): Promise<void> {
        this.settings = { ...this.settings, ...updates };
        await AsyncStorage.setItem(AUTOFILL_SETTINGS_KEY, JSON.stringify(this.settings));
    }

    // Extract domain from URL
    extractDomain(url: string): string {
        try {
            const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
            return parsed.hostname.replace('www.', '');
        } catch {
            return url;
        }
    }

    // Match credentials by URL/domain
    matchCredentials(
        credentials: AutofillCredential[],
        targetUrl: string
    ): AutofillCredential[] {
        const targetDomain = this.extractDomain(targetUrl);

        return credentials.filter(cred => {
            const credDomain = this.extractDomain(cred.url);

            if (this.settings.matchByDomain) {
                // Match by domain (e.g., google.com matches accounts.google.com)
                return credDomain === targetDomain ||
                    targetDomain.endsWith(`.${credDomain}`) ||
                    credDomain.endsWith(`.${targetDomain}`);
            } else {
                // Exact URL match
                return cred.url === targetUrl;
            }
        });
    }

    // Get credentials from vault for autofill
    async getCredentialsForUrl(
        vaultItems: any[],
        masterKey: string,
        targetUrl: string
    ): Promise<AutofillCredential[]> {
        if (!this.settings.enabled) return [];

        const loginItems = vaultItems.filter(item => item.itemType === 'login');
        const credentials: AutofillCredential[] = [];

        for (const item of loginItems) {
            try {
                const decrypted = await decryptVaultItem(item.encryptedData, item.iv, masterKey);
                credentials.push({
                    id: item.id,
                    title: item.title,
                    url: decrypted.url || '',
                    username: decrypted.username || '',
                    password: decrypted.password || '',
                });
            } catch (e) {
                console.warn('Failed to decrypt item for autofill:', item.id);
            }
        }

        return this.matchCredentials(credentials, targetUrl);
    }

    // Android Autofill dataset generator (for native bridge)
    generateAutofillDataset(credential: AutofillCredential): object {
        return {
            id: credential.id,
            title: credential.title,
            subtitle: credential.username,
            username: {
                value: credential.username,
                autofillType: 'username',
            },
            password: {
                value: credential.password,
                autofillType: 'password',
            },
        };
    }
}

export const autofillService = new AutofillService();

// Instructions for native Android Autofill implementation
/*
To enable Android Autofill, you need to:

1. Create Android native module in `android/app/src/main/java/.../autofill/`:
   - AutofillServiceModule.java
   - SecureVaultAutofillService.java

2. Register service in AndroidManifest.xml:
   <service
       android:name=".autofill.SecureVaultAutofillService"
       android:permission="android.permission.BIND_AUTOFILL_SERVICE">
       <intent-filter>
           <action android:name="android.service.autofill.AutofillService"/>
       </intent-filter>
       <meta-data
           android:name="android.autofill"
           android:resource="@xml/autofill_service"/>
   </service>

3. Create res/xml/autofill_service.xml:
   <?xml version="1.0" encoding="utf-8"?>
   <autofill-service
       xmlns:android="http://schemas.android.com/apk/res/android"
       android:settingsActivity=".MainActivity"/>

4. Bridge to React Native:
   - Use expo-modules or native module bridge
   - Call autofillService.getCredentialsForUrl() from native

Note: Autofill requires a development build (not Expo Go)
*/
