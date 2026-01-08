# 🚀 Quick Start Guide

## Get Up and Running in 60 Seconds

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```

### 3. Open Browser
Visit: **http://localhost:3000**

### 4. Create Account
1. Click "Create Free Account" or "Get Started"
2. Enter your email
3. Create a strong master password
4. Click "Create Account"

### 5. Add Your First Password
1. Click "Add Item" in sidebar or top button
2. Fill in:
   - Title (e.g., "Gmail")
   - Username
   - Password (or generate one!)
   - URL (optional)
3. Click "Save"

### 6. Try Password Generator
1. Click "Password Generator" in sidebar
2. Adjust length and options
3. Click copy icon
4. Password auto-clears from clipboard in 15s

## 🎨 UI Features to Try

### Press & Hold to Reveal
- Passwords are masked by default
- Press and hold the eye icon to reveal
- Release to hide again

### Clipboard Auto-Clear
- Copy any password
- Notice the countdown timer
- Clipboard clears automatically after 15s

### Search & Filter
- Use search bar in vault
- Filter by type (passwords, notes, cards, API keys)
- Real-time filtering

### Toast Notifications
- Top-right corner
- Auto-dismiss after 5 seconds
- Indicates success/error/info

## 🔐 Security Notes

### Your Master Password
- **CRITICAL**: Cannot be recovered
- Store it securely
- Required to access your vault
- Never sent to server

### How It Works
1. Your master password stays on your device
2. All encryption happens in your browser
3. Server only sees encrypted data
4. Zero-knowledge = we can't see your secrets

## 📱 Responsive Design
- Desktop: Full sidebar navigation
- Tablet: Collapsible sidebar
- Mobile: Bottom navigation (ready)

## 🛠️ Development Features

### Hot Reload
- Edit files and see changes instantly
- No need to restart server

### Mock Database
- Works out of the box
- No setup required
- Data persists during session

### TypeScript
- Full type safety
- IntelliSense support
- Catch errors early

## 🔄 Optional: Add Real Database

### Supabase Setup (Optional)
1. Go to https://supabase.com
2. Create new project
3. Go to SQL Editor
4. Run this schema:

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  salt VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE vault_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  item_type VARCHAR(50) NOT NULL,
  encrypted_data TEXT NOT NULL,
  iv VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

5. Copy your project URL and anon key
6. Create `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

7. Restart dev server

## 📦 Build for Production

```bash
npm run build
npm start
```

## 🎯 Test Checklist

Try these features:
- [ ] Create account
- [ ] Login
- [ ] Add password item
- [ ] Copy password (check clipboard timer)
- [ ] Search vault
- [ ] Filter by type
- [ ] Generate password
- [ ] Adjust generator settings
- [ ] Delete item (with confirmation)
- [ ] Logout and login again

## 💡 Tips

### Password Generator
- Use 16+ characters for strong passwords
- Enable all character types
- Copy directly to clipboard

### Vault Organization
- Use descriptive titles
- Add tags for grouping
- Include URLs for quick reference

### Security Best Practices
- Use unique passwords for each site
- Enable all password generator options
- Regularly update passwords
- Keep your master password secure

## 🆘 Troubleshooting

### Port 3000 Already in Use?
```bash
# Use different port
PORT=3001 npm run dev
```

### Build Errors?
```bash
# Clear cache and reinstall
rm -rf .next node_modules
npm install
npm run build
```

### Can't Login?
- Check if you used the same master password
- Remember: no password recovery
- Create new account if needed

## 🎓 Learn More

- Read [README.md](README.md) for full documentation
- Check [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) for architecture details
- View [SecureVault_Full_Project_Specification.pdf](SecureVault_Full_Project_Specification.pdf) for requirements

## 🌟 You're All Set!

Your SecureVault is now running with:
- ✅ Zero-knowledge encryption
- ✅ Premium dark UI
- ✅ Password generator
- ✅ Secure clipboard
- ✅ Mock database (or Supabase if configured)

**Enjoy your secure vault!** 🔐
