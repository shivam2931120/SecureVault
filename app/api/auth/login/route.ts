import { NextResponse } from 'next/server';
import { vaultDB } from '@/lib/supabase';
import { jsonError, readJsonBody } from '@/lib/api';
import { isValidEmail, normalizeEmail } from '@/lib/vault';

export async function POST(request: Request) {
  try {
    const body = await readJsonBody(request);
    const emailInput = typeof body === 'object' && body !== null && 'email' in body
      ? body.email
      : null;

    if (typeof emailInput !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const email = normalizeEmail(emailInput);
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    const { salt, keyVerifier, ...user } = await vaultDB.login(email);
    return NextResponse.json({ user, salt, keyVerifier }, { status: 200 });
  } catch (error) {
    return jsonError(error, 'Login failed', 401);
  }
}
