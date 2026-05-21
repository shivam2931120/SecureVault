import { NextResponse } from 'next/server';
import { vaultDB } from '@/lib/supabase';
import { jsonError, readJsonBody } from '@/lib/api';
import { isBase64, isNonEmptyString, isVaultItemType } from '@/lib/vault';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!isNonEmptyString(userId)) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const items = await vaultDB.getVaultItems(userId);
    return NextResponse.json({ items }, { status: 200 });
  } catch (error) {
    return jsonError(error, 'Failed to fetch vault items', 500);
  }
}

export async function POST(request: Request) {
  try {
    const body = await readJsonBody(request);
    const userId = typeof body === 'object' && body !== null && 'userId' in body
      ? body.userId
      : null;
    const itemType = typeof body === 'object' && body !== null && 'itemType' in body
      ? body.itemType
      : null;
    const encryptedData = typeof body === 'object' && body !== null && 'encryptedData' in body
      ? body.encryptedData
      : null;
    const iv = typeof body === 'object' && body !== null && 'iv' in body
      ? body.iv
      : null;

    if (!isNonEmptyString(userId) || !isVaultItemType(itemType) || !isBase64(encryptedData) || !isBase64(iv)) {
      return NextResponse.json(
        { error: 'User ID, item type, encrypted data, and IV are required' },
        { status: 400 }
      );
    }

    const item = await vaultDB.addVaultItem(userId, {
      itemType,
      encryptedData,
      iv,
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    return jsonError(error, 'Failed to create vault item', 500);
  }
}
