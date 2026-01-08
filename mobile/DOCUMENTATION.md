# SecureVault - Complete Application Documentation

> **Zero-Knowledge Password Manager for Android**
> Version 1.0.0 | Built with Expo & React Native

---

## Table of Contents
1. [Overview](#overview)
2. [Security Architecture](#security-architecture)
3. [Core Features](#core-features)
4. [Vault Management](#vault-management)
5. [Authentication & Biometrics](#authentication--biometrics)
6. [Offline Mode](#offline-mode)
7. [Autofill Integration](#autofill-integration)
8. [Advanced Features](#advanced-features)
9. [Settings & Configuration](#settings--configuration)
10. [Technical Specifications](#technical-specifications)

---

## Overview

SecureVault is a **zero-knowledge password manager** that ensures your sensitive data never leaves your device unencrypted. The master password is used to derive an encryption key locally - no plaintext passwords are ever transmitted or stored.

### Key Principles
- **Zero-Knowledge**: Server never sees your passwords
- **Client-Side Encryption**: All encryption/decryption happens on-device
- **Offline-First**: Full functionality without internet
- **Biometric Security**: Fingerprint/Face unlock

---

## Security Architecture

### Encryption
| Component | Algorithm |
|-----------|-----------|
| Key Derivation | SHA-256 with salt (1000+ iterations) |
| Data Encryption | XOR cipher with derived key |
| Storage | AsyncStorage (encrypted blobs) |
| Key Storage | Encrypted in SecureStore |

### Data Flow
```
Master Password → SHA-256 Hash → Derived Key (hex string)
                                      ↓
              Vault Items ← XOR Encrypt/Decrypt → Encrypted Blobs
                                      ↓
                              AsyncStorage (local)
```

### Security Features
- ✅ Auto-lock on app background
- ✅ Biometric authentication required
- ✅ Screenshot protection (Android `FLAG_SECURE`)
- ✅ Clipboard auto-clear (30 seconds)
- ✅ No plaintext logging
- ✅ Secure key storage in device keychain

---

## Core Features

### 1. Vault Items
SecureVault supports **6 item types**:

| Type | Icon | Fields |
|------|------|--------|
| **Login** | 🔑 | URL, Username, Password, TOTP, Notes |
| **Card** | 💳 | Cardholder, Number, Expiry, CVV, PIN, Notes |
| **Note** | 📝 | Title, Body (rich text) |
| **Identity** | 👤 | Name, Email, Phone, Address, ID Number |
| **API Key** | 🔌 | Service, Key, Expiry, Notes |
| **WiFi** | 📶 | SSID, Password, Security Type |

### 2. Password Generator
- **Length**: 8-64 characters
- **Character Sets**: Uppercase, Lowercase, Numbers, Symbols
- **Passphrase Mode**: Word-based passwords (e.g., "correct-horse-battery")
- **One-tap copy** with haptic feedback
- **History**: Recent generated passwords saved

### 3. Search & Filters
- **Global Search**: Search by title, username, URL, tags
- **Type Filters**: Filter by item type (Login, Card, etc.)
- **Favorites**: Star important items for quick access
- **Folders**: Organize items into custom folders

---

## Vault Management

### Adding Items
1. Navigate to **Add** tab
2. Select item type
3. Fill in required fields
4. Tap **Save**
5. Item is encrypted and stored locally

### Editing Items
1. Tap any item in vault list
2. View details in modal
3. Tap **Edit** to modify
4. Save changes

### Deleting Items
1. Open item details
2. Tap **Delete**
3. Confirm deletion
4. Item is permanently removed

### Folders
- Create custom folders for organization
- Assign items to folders when creating/editing
- Filter vault by folder

### Favorites
- Star items for quick access
- Toggle favorites filter in vault header
- Favorites appear first in search results

---

## Authentication & Biometrics

### First-Time Setup
1. Launch app → **Create Vault** screen
2. Enter master password (min 8 characters)
3. Confirm password
4. Vault created with derived encryption key

### Unlock Methods

| Method | Description |
|--------|-------------|
| **Master Password** | Enter password to derive key |
| **Fingerprint** | Biometric unlock (after setup) |
| **Face ID** | Face recognition (if supported) |

### Enabling Biometrics
1. Go to **Settings** → **Security**
2. Toggle **Biometric Unlock**
3. Authenticate with fingerprint/face
4. Biometrics enabled for future unlocks

### Auto-Lock
- **Background Lock**: Locks when app goes to background
- **Inactivity Timer**: Configurable timeout (1-30 minutes)
- **Immediate Lock**: Tap lock icon in header

---

## Offline Mode

### How It Works
SecureVault is **offline-first**:
1. All vault data stored locally (encrypted)
2. No internet required for core functionality
3. Changes queued for sync when online

### Sync Queue System
```
┌─────────────────────────────────────────┐
│              Offline Mode               │
├─────────────────────────────────────────┤
│  User Action → Local Storage            │
│       ↓                                 │
│  Add to Sync Queue (pending)            │
│       ↓                                 │
│  Internet Available → Process Queue     │
│       ↓                                 │
│  Sync Complete → Mark as synced         │
└─────────────────────────────────────────┘
```

### Offline Indicators
- 🔴 Red dot in header when offline
- "Pending sync" badge on unsynchronized items
- Queue count in settings

### Conflict Resolution
When same item edited offline on multiple devices:
1. **Last-write-wins** for simple conflicts
2. **Manual merge** prompt for complex conflicts
3. Full version history available

---

## Autofill Integration

### Android Autofill Service
SecureVault can autofill passwords in browsers and apps:

### Setup
1. Go to **Settings** → **Autofill**
2. Tap **Enable Autofill Service**
3. Select **SecureVault** as autofill provider
4. Grant required permissions

### How It Works
```
Browser/App Login → Android Autofill Request
                          ↓
                SecureVault Service Activated
                          ↓
                Biometric Authentication
                          ↓
                Match URL/Package → Credentials
                          ↓
                Autofill Username & Password
```

### Credential Matching
- **URL Matching**: Match by domain (e.g., google.com)
- **App Matching**: Match by package name
- **Fuzzy Match**: Suggest similar credentials
- **Manual Select**: Choose from all logins

### Quick Actions
- Tap notification to copy password
- Long-press autofill suggestion for options
- "Save new login" prompt after manual entry

---

## Advanced Features

### Emergency Access
Set up trusted contacts who can request access to your vault:

1. **Settings** → **Emergency Access**
2. Add trusted contact (email)
3. Set waiting period (24h - 30 days)
4. Contact requests access
5. You have waiting period to deny
6. If not denied, access granted

### Secure Sharing
Share individual items securely:

1. Open item → Tap **Share**
2. Set expiration (1 hour - 7 days)
3. Set view limit (1-10 views)
4. Generate secure link
5. Share via any messaging app

### Export Vault
Export your data for backup:

| Format | Encrypted | Use Case |
|--------|-----------|----------|
| JSON (Encrypted) | ✅ | Secure backup |
| JSON (Plain) | ❌ | Migration |
| CSV | ❌ | Spreadsheet import |

### Import Vault
Import from other password managers:

- **Supported Formats**: 1Password, LastPass, Bitwarden, Chrome, Firefox
- **Auto-detection** of import format
- **Duplicate detection** during import

### Password Health
Analyze your passwords for security issues:

| Check | Status |
|-------|--------|
| **Weak Passwords** | < 8 chars, common patterns |
| **Reused Passwords** | Same password on multiple sites |
| **Old Passwords** | Not changed in 6+ months |
| **Breached** | Found in known data breaches |

---

## Settings & Configuration

### Security Settings
| Setting | Options | Default |
|---------|---------|---------|
| Biometric Unlock | On/Off | Off |
| Auto-lock Timeout | 1-30 min | 5 min |
| Clipboard Timeout | 10-120 sec | 30 sec |
| Screenshot Protection | On/Off | On |

### Appearance
| Setting | Options |
|---------|---------|
| Theme | Dark (Red+Black) |
| Language | English |
| Item Preview | Show/Hide |

### Data Management
- **Export Vault**: Create encrypted backup
- **Import Data**: Import from other managers
- **Clear Sync Queue**: Force clear pending syncs
- **Delete All Data**: Factory reset

### Account
- **Change Master Password**: Re-encrypt vault
- **Delete Account**: Permanently destroy all data
- **View Activity Log**: See recent access

---

## Technical Specifications

### Technology Stack
| Component | Technology |
|-----------|------------|
| Framework | Expo SDK 54 |
| Language | TypeScript |
| UI | React Native |
| State | Zustand |
| Navigation | Expo Router |
| Crypto | expo-crypto |
| Storage | AsyncStorage + SecureStore |
| Biometrics | expo-local-authentication |

### Minimum Requirements
| Platform | Version |
|----------|---------|
| Android | 6.0 (API 23) |
| iOS | 13.0 |

### File Structure
```
mobile/
├── app/                    # Expo Router pages
│   ├── (auth)/            # Auth screens
│   ├── (tabs)/            # Main tab screens
│   ├── setup.tsx          # First-time setup
│   └── unlock.tsx         # Unlock screen
├── components/            # Reusable UI components
├── crypto/                # Encryption utilities
├── hooks/                 # Custom React hooks
├── services/              # API & background services
├── store/                 # Zustand state stores
├── theme/                 # Colors, typography
├── types/                 # TypeScript definitions
└── utils/                 # Helper functions
```

### Build & Deploy
```bash
# Development
cd mobile
npm install
npx expo start

# Build APK
npx eas-cli build --platform android --profile production

# Or use GitHub Actions (automatic on push to main)
```

---

## Support & Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Biometrics not working | Check device settings, re-enable in app |
| Items not syncing | Check internet, clear sync queue |
| Autofill not appearing | Re-enable autofill service |
| App crashes on launch | Clear app data, reinstall |

### Reset Options
1. **Soft Reset**: Settings → Clear Cache
2. **Hard Reset**: Settings → Delete All Data
3. **Reinstall**: Uninstall and reinstall app

---

## Changelog

### v1.0.0 (Current)
- ✅ Core vault functionality
- ✅ 6 item types support
- ✅ Biometric unlock
- ✅ Password generator
- ✅ Offline mode
- ✅ Autofill service
- ✅ Export/Import
- ✅ Emergency access
- ✅ Secure sharing

---

> **SecureVault** - Your passwords, your control.
