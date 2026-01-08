import { NextResponse } from 'next/server';
import { mockDB, useMockDB } from '@/lib/supabase';

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    const { userId, encryptedData, iv } = body;
    const { id: itemId } = await context.params;

    if (!userId || !itemId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (useMockDB()) {
      const item = await mockDB.updateVaultItem(userId, itemId, {
        encryptedData,
        iv,
      });
      return NextResponse.json({ item }, { status: 200 });
    }

    // TODO: Implement Supabase integration
    return NextResponse.json(
      { error: 'Supabase not configured' },
      { status: 500 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update vault item' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const { id: itemId } = await context.params;

    if (!userId || !itemId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (useMockDB()) {
      await mockDB.deleteVaultItem(userId, itemId);
      return NextResponse.json({ success: true }, { status: 200 });
    }

    // TODO: Implement Supabase integration
    return NextResponse.json(
      { error: 'Supabase not configured' },
      { status: 500 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to delete vault item' },
      { status: 500 }
    );
  }
}
