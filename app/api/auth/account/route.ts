import { NextResponse } from 'next/server';
import { vaultDB } from '@/lib/supabase';
import { jsonError, readJsonBody } from '@/lib/api';
import { isBase64, isNonEmptyString } from '@/lib/vault';

export async function PATCH(request: Request) {
  try {
    const body = await readJsonBody(request);
    const userId = typeof body === 'object' && body !== null && 'userId' in body
      ? body.userId
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

    if (!isNonEmptyString(userId) || !isNonEmptyString(salt) || !isNonEmptyString(verifierEncryptedData) || !isNonEmptyString(verifierIv)) {
      return NextResponse.json(
        { error: 'User ID, salt, and key verifier are required' },
        { status: 400 }
      );
    }

    if (!isBase64(salt) || !isBase64(verifierEncryptedData) || !isBase64(verifierIv)) {
      return NextResponse.json(
        { error: 'Invalid salt or verifier format' },
        { status: 400 }
      );
    }

    const updatedUser = await vaultDB.updateUserSalt(userId, salt, {
      encryptedData: verifierEncryptedData,
      iv: verifierIv,
    });
    return NextResponse.json({
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        createdAt: updatedUser.createdAt,
      },
    }, { status: 200 });
  } catch (error) {
    return jsonError(error, 'Failed to update account', 500);
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!isNonEmptyString(userId)) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    await vaultDB.deleteUser(userId);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return jsonError(error, 'Failed to delete account', 500);
  }
}
