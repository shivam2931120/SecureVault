import { NextResponse } from 'next/server';
import { mockDB, useMockDB } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    if (useMockDB()) {
      // Use mock database
      const user = await mockDB.login(email);
      return NextResponse.json({ user, salt: user.salt }, { status: 200 });
    }

    // TODO: Implement Supabase integration
    return NextResponse.json(
      { error: 'Supabase not configured' },
      { status: 500 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Login failed' },
      { status: 401 }
    );
  }
}
