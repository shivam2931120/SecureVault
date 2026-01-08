# SecureVault Mobile - User Guide

## 🚀 First Launch

### Setup
1. Open SecureVault - you'll see the **Setup** screen
2. Create a **Master Password** (minimum 6 characters)
3. Optionally enable **Biometric Unlock** (fingerprint/Face ID)
4. Your vault is ready!

### Unlocking
- **Biometrics**: Auto-prompts on app open (if enabled)
- **Password**: Enter master password as fallback

---

## 📱 Navigation

| Tab | Function |
|-----|----------|
| 🛡️ Vault | View/search items |
| ➕ Add | Create new items |
| 🔑 Generator | Generate passwords |
| 📁 Files | Encrypted attachments |
| ⚙️ Settings | Preferences |

---

## ➕ Adding Items

**Supported Types:**
- **Login** - Website credentials
- **Card** - Credit/debit cards
- **Note** - Secure text notes
- **Identity** - Personal info
- **API Key** - Developer keys
- **Wi-Fi** - Network passwords

**Steps:**
1. Tap **+** tab
2. Select item type
3. Enter title and details
4. Tap **Save**

---

## 🔑 Password Generator

**3 Modes:**
| Mode | Use Case |
|------|----------|
| Password | Random characters |
| Passphrase | Readable words |
| PIN | Numeric codes |

**Features:**
- Length slider
- Character toggles (upper/lower/numbers/symbols)
- Avoid ambiguous (0O, 1lI)
- Strength meter
- Auto-clear clipboard (30s)

---

## ⚙️ Settings

| Option | Description |
|--------|-------------|
| Biometric Unlock | Use fingerprint/Face ID |
| Auto-Lock | Lock after 30s/1m/5m/10m/never |
| Screenshot Protection | Block screenshots |
| Biometric Re-prompt | Re-auth for sensitive actions |
| Emergency Access | Trusted contacts |

---

## 📲 Building APK

```bash
cd /home/shivam/secure-vault/mobile
npm install -g eas-cli
eas login
eas build --platform android --profile production
```

---

## � Suggested Features to Add

### High Priority
1. **TOTP Authenticator** - Built-in 2FA code generator
2. **Password Audit** - Check for weak/reused passwords
3. **Autofill Service** - Auto-fill logins in other apps
4. **Cloud Backup** - Encrypted backup to Google Drive/iCloud

### Medium Priority
5. **Item Details View** - Full item view with edit/copy
6. **Password History View** - See previous passwords
7. **Search Tags** - Tag items for better organization
8. **Dark/Light Theme** - Theme toggle

### Nice to Have
9. **Browser Extension** - Sync with desktop
10. **Shared Vaults** - Share with family/team
11. **Security Dashboard** - Vault health score
12. **Breach Detection** - Check against HIBP

---

## ❓ Troubleshooting

| Issue | Fix |
|-------|-----|
| Biometrics not working | Re-enable in Settings |
| Can't save items | Check title is not empty |
| App keeps locking | Increase auto-lock timer |
| Forgot password | Password cannot be recovered ⚠️ |

**Version:** 1.0.0
