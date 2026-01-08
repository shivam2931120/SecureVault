# SecureVault - Zero-Knowledge Password & Data Vault ✅ **UI REBUILT!**

A production-grade, zero-knowledge password and sensitive data vault built with Next.js 15, TypeScript, and military-grade encryption.

![SecureVault](https://img.shields.io/badge/Security-Zero--Knowledge-blue)
![Next.js](https://img.shields.io/badge/Next.js-15-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Encryption](https://img.shields.io/badge/Encryption-AES--256--GCM-green)

## 🎉 Latest Updates

✅ **Complete UI/UX Architectural Rebuild** (Just Completed!)
- Proper App Shell with fixed sidebar (260px) and top bar (64px)
- Professional navigation with active state highlighting
- Z-index hierarchy fixed (toasts, modals, content layers)
- Decorative backgrounds constrained and moved to proper layers
- Auth pages cleaned up with centered layouts
- No more overlapping elements or layout issues!

📚 **New Documentation**: See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for database setup guide

---

## Features

### Core Security
- **Zero-Knowledge Architecture**: All encryption/decryption happens client-side only
- **AES-256-GCM Encryption**: Military-grade encryption for all data
- **PBKDF2 Key Derivation**: 100,000 iterations with unique salts
- **Client-Side Only**: Server never sees plaintext data or encryption keys
- **Unique IV per Item**: Every vault item gets a unique initialization vector

### Vault Features
- Store passwords, secure notes, credit cards, and API keys
- Password health analysis
- Search and filter vault items
- Tags and categories
- Auto-clear clipboard (15 seconds)
- Last updated tracking

### Password Generator
- Customizable length (8-64 characters)
- Include/exclude: uppercase, lowercase, numbers, symbols
- Real-time strength meter
- Cryptographically secure random generation

### UI/UX
- Premium dark mode interface
- Bitwarden/1Password inspired design
- Smooth animations with Framer Motion
- Responsive design (mobile, tablet, desktop)
- Accessible (WCAG compliant)
- Skeleton loaders
- Toast notifications

## Tech Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **State Management**: Zustand
- **Icons**: Heroicons

### Backend
- **Runtime**: Node.js (Next.js API Routes)
- **Database**: Supabase (PostgreSQL) or Mock DB
- **Encryption**: Web Crypto API

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

The application works out of the box with an in-memory mock database - no Supabase setup required for development!

## Usage

1. **Register**: Create an account with your email and a strong master password
2. **Important**: Your master password cannot be recovered. Store it securely!
3. **Add Items**: Create passwords, notes, cards, or API keys in your vault
4. **Generate Passwords**: Use the built-in generator for strong passwords
5. **Copy Safely**: Clipboard auto-clears after 15 seconds

## Architecture

### Zero-Knowledge Encryption Flow

1. **User Registration**:
   - User enters master password
   - Client generates unique salt (16 bytes)
   - Client derives encryption key using PBKDF2 (100,000 iterations)
   - Only email + salt sent to server (never the password or key)

2. **Data Encryption**:
   - User creates vault item
   - Client generates unique IV (12 bytes)
   - Data encrypted with AES-256-GCM using master key
   - Only encrypted blob + IV sent to server

3. **Data Decryption**:
   - Client fetches encrypted data + IV
   - Master key (in memory only) decrypts locally
   - Plaintext never leaves the client

## Color Palette

The UI uses a carefully crafted dark theme:

- **Background**: `#0B0F14` (deep black-blue)
- **Surface**: `#121822`
- **Card**: `#161D29`
- **Primary**: `#3B82F6` (secure blue)
- **Success**: `#22C55E`
- **Warning**: `#FACC15`
- **Danger**: `#EF4444`

## Security Features

### What We Do
- ✅ Client-side encryption only
- ✅ Zero-knowledge architecture
- ✅ Unique salt per user
- ✅ Unique IV per vault item
- ✅ PBKDF2 with 100,000 iterations
- ✅ AES-256-GCM encryption
- ✅ Auto-lock on inactivity
- ✅ Clipboard auto-clear

### What We DON'T Do
- ❌ Store master password
- ❌ Store encryption keys
- ❌ See plaintext data
- ❌ Offer password recovery (by design)
- ❌ Log sensitive information

## Project Structure

```
secure-vault/
├── app/
│   ├── api/              # API routes
│   ├── auth/             # Authentication pages
│   ├── vault/            # Vault pages
│   ├── layout.tsx
│   └── page.tsx
├── components/           # Reusable UI components
├── lib/                  # Utilities & crypto
├── stores/               # Zustand state management
├── types/                # TypeScript types
└── tailwind.config.ts
```

## Optional: Supabase Setup

To use Supabase instead of the mock database:

1. Create a Supabase project
2. Run this SQL in your Supabase SQL editor:

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

3. Add credentials to `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Requires Web Crypto API support

## License

MIT License - see LICENSE file for details

---

**Note**: This is a demonstration project showcasing zero-knowledge encryption principles. For production use, ensure proper security audits.
