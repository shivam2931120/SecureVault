# SecureVault Supabase Setup Guide

SecureVault can run with the in-memory mock database for local development. To persist data across server restarts, configure Supabase and keep all database access behind the Next.js API routes.

## Prerequisites

- A Supabase project
- Node.js 18+
- The SecureVault web app running from the repository root

## 1. Create Tables

Open the Supabase SQL editor and run:

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  salt TEXT NOT NULL,
  verifier_encrypted_data TEXT NOT NULL,
  verifier_iv TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vault_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL,
  encrypted_data TEXT NOT NULL,
  iv TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_vault_items_user_id ON vault_items(user_id);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_vault_items_updated_at ON vault_items;
CREATE TRIGGER update_vault_items_updated_at
  BEFORE UPDATE ON vault_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault_items ENABLE ROW LEVEL SECURITY;
```

The app uses server-side API routes with `SUPABASE_SERVICE_ROLE_KEY`, so direct browser access to these tables is not required. RLS is enabled to prevent accidental anon-client access.

## 2. Configure Environment

Create `.env.local` in the repository root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

`SUPABASE_SERVICE_ROLE_KEY` must stay server-only. Do not expose it in client components or commit it to git.

## 3. Run The App

```bash
npm install
npm run dev
```

Then register an account and add a vault item. The `users` table should contain the email, salt, and encrypted key verifier. The `vault_items` table should contain only encrypted item payloads, IVs, and item metadata.

## Security Model

- Master passwords are never sent to the server.
- The client derives an AES-GCM key with PBKDF2.
- The server stores an encrypted key verifier so the client can reject wrong passwords without storing a password hash.
- Vault item bodies are encrypted and decrypted only in the client.
- The service role key is used only in server-side API routes.

## Troubleshooting

- If the app still uses the mock database, confirm all three Supabase environment variables exist and restart the dev server.
- If registration fails with missing columns, rerun the SQL above and confirm `verifier_encrypted_data`, `verifier_iv`, and `item_type` exist.
- If API calls fail with RLS errors, confirm `SUPABASE_SERVICE_ROLE_KEY` is set correctly.
- If a vault unlock fails after changing the master password, export/import is not a recovery mechanism; the backup must match the password that encrypted those items.
