# 🔐 SecureVault - Supabase Setup Guide

This guide walks you through setting up Supabase as the backend for SecureVault, replacing the current mock database.

---

## 📋 Prerequisites

- A Supabase account ([sign up here](https://supabase.com))
- Node.js and npm installed
- SecureVault project cloned and running

---

## 🚀 Step 1: Create Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Click **"New Project"**
3. Fill in:
   - **Project Name**: `SecureVault` (or your choice)
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Select closest to your users
   - **Pricing Plan**: Free tier works perfectly for development
4. Click **"Create new project"** and wait 2-3 minutes for setup

---

## 🗄️ Step 2: Create Database Tables

1. In your Supabase dashboard, go to **SQL Editor** (left sidebar)
2. Click **"New Query"**
3. Copy and paste the following SQL:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  master_key_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vault items table
CREATE TABLE vault_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  encrypted_data TEXT NOT NULL,
  iv TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_vault_items_user_id ON vault_items(user_id);
CREATE INDEX idx_users_email ON users(email);

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault_items ENABLE ROW LEVEL SECURITY;

-- Users can only read/update their own data
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Vault items policies
CREATE POLICY "Users can view own vault items" ON vault_items
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own vault items" ON vault_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own vault items" ON vault_items
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own vault items" ON vault_items
  FOR DELETE USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to auto-update timestamps
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vault_items_updated_at
  BEFORE UPDATE ON vault_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

4. Click **"Run"** to execute the SQL

---

## 🔑 Step 3: Get Your API Keys

1. In Supabase dashboard, go to **Settings** → **API**
2. You'll see:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon/public key**: `eyJhbGc...` (long JWT token)
   - **service_role key**: `eyJhbGc...` (use for server-side only!)

3. Copy these values - you'll need them next

---

## ⚙️ Step 4: Configure Environment Variables

1. In your SecureVault project root, create `.env.local`:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

2. Replace the values with your actual keys from Step 3

3. **Important**: Add `.env.local` to `.gitignore`:
```bash
echo ".env.local" >> .gitignore
```

---

## 📦 Step 5: Install Supabase Client

```bash
npm install @supabase/supabase-js
```

---

## 🔧 Step 6: Update Supabase Client Code

Replace the contents of `lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Check your .env.local file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface User {
  id: string;
  email: string;
  masterKeyHash: string;
  salt: string;
  createdAt: string;
  updatedAt: string;
}

export interface VaultItem {
  id: string;
  userId: string;
  encryptedData: string;
  iv: string;
  createdAt: string;
  updatedAt: string;
}

// User operations
export async function createUser(email: string, masterKeyHash: string, salt: string) {
  const { data, error } = await supabase
    .from('users')
    .insert([{
      email,
      master_key_hash: masterKeyHash,
      salt,
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getUserByEmail(email: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
  return data;
}

// Vault item operations
export async function createVaultItem(
  userId: string,
  encryptedData: string,
  iv: string
) {
  const { data, error } = await supabase
    .from('vault_items')
    .insert([{
      user_id: userId,
      encrypted_data: encryptedData,
      iv,
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getVaultItems(userId: string) {
  const { data, error } = await supabase
    .from('vault_items')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function updateVaultItem(
  itemId: string,
  encryptedData: string,
  iv: string
) {
  const { data, error } = await supabase
    .from('vault_items')
    .update({
      encrypted_data: encryptedData,
      iv,
    })
    .eq('id', itemId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteVaultItem(itemId: string) {
  const { error } = await supabase
    .from('vault_items')
    .delete()
    .eq('id', itemId);

  if (error) throw error;
}
```

---

## 🧪 Step 7: Test the Connection

1. Restart your development server:
```bash
npm run dev
```

2. Navigate to `http://localhost:3000`
3. Try registering a new account
4. Check Supabase dashboard → **Table Editor** → **users** to see the new user
5. Add a vault item and check **vault_items** table

---

## 🔒 Security Best Practices

### ✅ What SecureVault Does Right:
- **Zero-Knowledge Architecture**: Server never sees unencrypted data
- **Client-Side Encryption**: AES-256-GCM encryption in browser
- **PBKDF2 Key Derivation**: 100,000 iterations for strong key derivation
- **Row-Level Security**: Supabase RLS ensures users can only access their data

### 🛡️ Additional Recommendations:

1. **Enable 2FA** in Supabase dashboard (Settings → Security)
2. **Set up backups** (Settings → Backups) - automatic daily backups
3. **Monitor usage** (Dashboard → Home) - track API requests
4. **Rate limiting**: Add rate limits in production:
   ```typescript
   // In API routes
   import rateLimit from 'express-rate-limit';
   const limiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 100 // limit each IP to 100 requests per windowMs
   });
   ```

5. **HTTPS only**: Ensure `NEXT_PUBLIC_SUPABASE_URL` uses `https://`

---

## 🚀 Production Deployment

### Environment Variables (Vercel/Netlify):

Add these to your deployment platform:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Database Optimization:

1. **Add indexes** for frequently queried fields
2. **Enable connection pooling** (Settings → Database → Connection Pooling)
3. **Monitor performance** (Database → Logs)

---

## 🐛 Troubleshooting

### "Invalid API Key" Error
- Check `.env.local` has correct keys
- Ensure you're using `anon` key (not service_role) for client-side
- Restart dev server after changing `.env.local`

### "Row Level Security Policy Violation"
- Verify RLS policies are created correctly
- Check user is authenticated before making requests
- Test queries in SQL Editor with RLS disabled temporarily

### "Network Request Failed"
- Verify `NEXT_PUBLIC_SUPABASE_URL` is correct
- Check Supabase project is not paused (free tier pauses after 1 week inactivity)
- Verify CORS settings in Supabase (Settings → API → CORS)

### Migration Issues
- Export existing mock data first
- Test with a few items before migrating everything
- Keep mock DB as backup until confirmed working

---

## 📊 Monitoring & Analytics

1. **Real-time dashboard**: Supabase Dashboard → Home
2. **API logs**: Dashboard → Logs → API Logs
3. **Database logs**: Dashboard → Logs → Database Logs
4. **Performance**: Dashboard → Database → Query Performance

---

## 🔄 Migration from Mock Database

If you have existing data in the mock database:

1. **Export mock data**:
```typescript
// Add to a migration script
const mockDB = JSON.parse(localStorage.getItem('mockDB') || '{}');
console.log(JSON.stringify(mockDB, null, 2));
```

2. **Import to Supabase**: Use the SQL Editor to insert data
3. **Verify**: Check all data migrated correctly
4. **Remove mock DB**: Delete mock database code from `lib/supabase.ts`

---

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JS Client Reference](https://supabase.com/docs/reference/javascript)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js + Supabase Guide](https://supabase.com/docs/guides/getting-started/tutorials/with-nextjs)

---

## 💬 Need Help?

- **Supabase Discord**: [discord.supabase.com](https://discord.supabase.com)
- **GitHub Issues**: Report bugs in SecureVault repo
- **Supabase Support**: [supabase.com/support](https://supabase.com/support)

---

✅ **You're all set!** Your SecureVault is now powered by Supabase with production-ready security and scalability.
