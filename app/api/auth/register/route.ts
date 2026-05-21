import { NextResponse } from 'next/server';
import { vaultDB } from '@/lib/supabase';
import { jsonError, readJsonBody } from '@/lib/api';
import { isBase64, isValidEmail, normalizeEmail } from '@/lib/vault';

export async function POST(request: Request) {
  try {
    const body = await readJsonBody(request);
    const emailInput = typeof body === 'object' && body !== null && 'email' in body
      ? body.email
      : null;
    const salt = typeof body === 'object' && body !== null && 'salt' in body
      ? body.salt
      : null;
    const verifierEncryptedData = typeof body === 'object' && body !== null && 'verifierEncryptedData' in body
      ? body.verifierEncryptedData
      : null;
    const verifierIv = typeof body === 'object' && body !== null && 'verifierIv' in body
      ? body.verifierIv
      : null;

    if (typeof emailInput !== 'string' || typeof salt !== 'string' || typeof verifierEncryptedData !== 'string' || typeof verifierIv !== 'string') {
      return NextResponse.json(
        { error: 'Email, salt, and key verifier are required' },
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

    if (!isBase64(salt) || !isBase64(verifierEncryptedData) || !isBase64(verifierIv)) {
      return NextResponse.json(
        { error: 'Invalid salt or verifier format' },
        { status: 400 }
      );
    }

    const registeredUser = await vaultDB.register(email, salt, {
      encryptedData: verifierEncryptedData,
      iv: verifierIv,
    });
    return NextResponse.json({
      user: {
        id: registeredUser.id,
        email: registeredUser.email,
        createdAt: registeredUser.createdAt,
      },
    }, { status: 201 });
  } catch (error) {
    return jsonError(error, 'Registration failed', 400);
  }
}
