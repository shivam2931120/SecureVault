import { NextResponse } from 'next/server';
import { vaultDB } from '@/lib/supabase';
import { jsonError, readJsonBody } from '@/lib/api';
import { isBase64, isNonEmptyString } from '@/lib/vault';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const { id: itemId } = await context.params;

    if (!isNonEmptyString(userId) || !isNonEmptyString(itemId)) {
      return NextResponse.json(
        { error: 'User ID and item ID are required' },
        { status: 400 }
      );
    }

    const item = await vaultDB.getVaultItem(userId, itemId);
    return NextResponse.json({ item }, { status: 200 });
  } catch (error) {
    return jsonError(error, 'Failed to fetch vault item', 500);
  }
}

export async function PUT(
  request: Request,
  context: RouteContext
) {
  try {
    const body = await readJsonBody(request);
    const userId = typeof body === 'object' && body !== null && 'userId' in body
      ? body.userId
      : null;
    const encryptedData = typeof body === 'object' && body !== null && 'encryptedData' in body
      ? body.encryptedData
      : null;
    const iv = typeof body === 'object' && body !== null && 'iv' in body
      ? body.iv
      : null;
    const { id: itemId } = await context.params;

    if (!isNonEmptyString(userId) || !isNonEmptyString(itemId) || !isBase64(encryptedData) || !isBase64(iv)) {
      return NextResponse.json(
        { error: 'User ID, item ID, encrypted data, and IV are required' },
        { status: 400 }
      );
    }

    const item = await vaultDB.updateVaultItem(userId, itemId, {
      encryptedData,
      iv,
    });

    return NextResponse.json({ item }, { status: 200 });
  } catch (error) {
    return jsonError(error, 'Failed to update vault item', 500);
  }
}

export async function DELETE(
  request: Request,
  context: RouteContext
) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const { id: itemId } = await context.params;

    if (!isNonEmptyString(userId) || !isNonEmptyString(itemId)) {
      return NextResponse.json(
        { error: 'User ID and item ID are required' },
        { status: 400 }
      );
    }

    await vaultDB.deleteVaultItem(userId, itemId);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return jsonError(error, 'Failed to delete vault item', 500);
  }
}
