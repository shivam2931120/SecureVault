# 🚀 SecureVault - Quick Start Guide

## ⚡ Get Started in 30 Seconds

```bash
# 1. Install dependencies (if not already done)
npm install

# 2. Start development server
npm run dev

# 3. Open browser
# Navigate to: http://localhost:3000
```

## 📱 What You'll See

### 1. **Login/Register Page** (Landing)
- Centered card layout
- Subtle decorative backgrounds
- Email + password fields
- "Register" or "Login" buttons

### 2. **Vault Dashboard** (After login)
```
┌─────────────────────────────────────────────────────┐
│  [Sidebar]  │  My Vault (3 items)    [+ Add Item]  │
│             │                                        │
│  Dashboard  │  [Search...] [Filter: All Items]     │
│  Generator  │                                        │
│  Settings   │  ┌──────────────────────────────┐    │
│             │  │ 🔑 GitHub Account           │    │
│  [+ Add]    │  │ username@example.com        │    │
│             │  │ Updated 2 hours ago         │    │
│  [Logout]   │  └──────────────────────────────┘    │
│             │                                        │
└─────────────────────────────────────────────────────┘
```

## 🎯 Quick Actions

### Add Your First Password:
1. Click **"+ Add Item"** button (top right OR sidebar)
2. Fill in the form:
   - Title: `GitHub Account`
   - Username: `your@email.com`
   - Password: `your-password` (or use generator)
   - URL: `https://github.com`
   - Type: `Password`
3. Click **"Save"**
4. Done! Item encrypted and stored

### Generate Strong Password:
1. Click **"Generator"** in sidebar
2. Adjust settings:
   - Length: 16-64 characters
   - Include: Uppercase, lowercase, numbers, symbols
3. Click refresh icon to regenerate
4. Click copy button to use

### Search Vault:
- Type in search box: searches title, username, URL
- Use filter dropdown: filter by type (password, note, card, API key)

## 🔐 Security Features

### Zero-Knowledge Architecture:
```
Your Password → PBKDF2 (100K iterations) → Master Key
                                            ↓
Your Data → AES-256-GCM Encryption → Encrypted Data
                                      ↓
                                   Stored on Server
```

**Server NEVER sees**:
- ❌ Your master password
- ❌ Your decrypted data
- ❌ Your encryption keys

**Server ONLY sees**:
- ✅ Encrypted blobs (gibberish)
- ✅ Your email (for login)
- ✅ Password hash (for verification)

## 📁 File Structure (For Developers)

```
Important Files:
├── app/
│   ├── auth/
│   │   ├── login/page.tsx        ← Login form
│   │   └── register/page.tsx     ← Registration form
│   ├── vault/
│   │   ├── layout.tsx            ← Uses AppShell
│   │   ├── page.tsx              ← Main dashboard
│   │   └── generator/page.tsx    ← Password generator
│   └── page.tsx                  ← Redirects to login
├── components/
│   ├── AppShell.tsx              ← Main layout wrapper
│   ├── Sidebar.tsx               ← Navigation
│   ├── Toast.tsx                 ← Notifications
│   └── Modal.tsx                 ← Dialogs
├── lib/
│   ├── crypto.ts                 ← Encryption logic
│   └── supabase.ts               ← Database (mock)
└── stores/
    ├── authStore.ts              ← Auth state
    ├── vaultStore.ts             ← Vault state
    └── uiStore.ts                ← UI state
```

## 🎨 Customization

### Change Colors:
Edit `tailwind.config.ts`:
```typescript
colors: {
  primary: '#3B82F6',    // Change to your brand color
  success: '#22C55E',
  danger: '#EF4444',
  // ...
}
```

### Change Sidebar Width:
Edit `components/AppShell.tsx`:
```tsx
<aside className="w-64">  {/* Change w-64 to w-72, etc. */}
```

### Change Theme:
Edit `app/globals.css`:
```css
body {
  background-color: #0B0F14;  /* Change background */
}
```

## 🔧 Common Tasks

### Reset Everything:
```bash
# Clear browser storage
localStorage.clear()

# Restart dev server
npm run dev
```

### Check for Errors:
```bash
# Type checking
npm run type-check

# Linting
npm run lint
```

### Build for Production:
```bash
npm run build
npm start
```

## 🐛 Troubleshooting

### "You're Offline" Error:
- Check browser console for errors
- Try different browser
- Clear cache and cookies
- Check `/debug` page for diagnostics

### Can't Login:
- Make sure email/password are correct
- Try registering a new account
- Check browser console for encryption errors

### Vault Items Not Loading:
- Check if you're logged in (top bar shows "Logout")
- Refresh the page
- Check browser console for errors

### Styling Looks Broken:
- Clear browser cache
- Restart dev server: `npm run dev`
- Check for CSS errors in console

## 📚 Next Steps

1. **Set Up Database**: See `SUPABASE_SETUP.md`
2. **Deploy to Production**: Use Vercel/Netlify
3. **Add Custom Features**: Vault is extensible
4. **Security Audit**: Review before production use

## 🆘 Get Help

### Debug Page:
Navigate to: `http://localhost:3000/debug`
- Shows auth state
- Displays vault items
- Provides diagnostic info

### Check Documentation:
- `README.md` - Full project documentation
- `SUPABASE_SETUP.md` - Database setup guide
- `UI_REBUILD_SUMMARY.md` - UI architecture details

### Common URLs:
- **Home**: `http://localhost:3000`
- **Login**: `http://localhost:3000/auth/login`
- **Register**: `http://localhost:3000/auth/register`
- **Vault**: `http://localhost:3000/vault`
- **Generator**: `http://localhost:3000/vault/generator`
- **Settings**: `http://localhost:3000/vault/settings`
- **Debug**: `http://localhost:3000/debug`

## ✨ Pro Tips

1. **Use Password Generator**: Don't reuse passwords!
2. **Tag Your Items**: Add tags for better organization
3. **Regular Backups**: Export your vault periodically
4. **Strong Master Password**: Use 16+ characters with mix of types
5. **Unique Master Password**: Don't use it anywhere else

## 🎉 You're Ready!

Your SecureVault is now running with:
- ✅ Zero-knowledge encryption
- ✅ Professional UI/UX
- ✅ Responsive layout
- ✅ Toast notifications
- ✅ Modal dialogs
- ✅ Password generator
- ✅ Search & filter
- ✅ Type safety

**Start securing your passwords today! 🔐**
