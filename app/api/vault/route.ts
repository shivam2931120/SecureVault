import { NextResponse } from 'next/server';
import { mockDB, useMockDB } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (useMockDB()) {
      const items = await mockDB.getVaultItems(userId);
      return NextResponse.json({ items }, { status: 200 });
    }

    // TODO: Implement Supabase integration
    return NextResponse.json({ items: [] }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch vault items' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, itemType, encryptedData, iv } = body;

    if (!userId || !itemType || !encryptedData || !iv) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (useMockDB()) {
      const item = await mockDB.addVaultItem(userId, {
        itemType,
        encryptedData,
        iv,
      });
      return NextResponse.json({ item }, { status: 201 });
    }

    // TODO: Implement Supabase integration
    return NextResponse.json(
      { error: 'Supabase not configured' },
      { status: 500 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create vault item' },
      { status: 500 }
    );
  }
}
