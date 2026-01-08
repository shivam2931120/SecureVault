import { NextResponse } from 'next/server';
import { mockDB, useMockDB } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { email, salt } = await request.json();

    if (!email || !salt) {
      return NextResponse.json(
        { error: 'Email and salt are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    if (useMockDB()) {
      // Use mock database
      const user = await mockDB.register(email, salt);
      return NextResponse.json({ user }, { status: 201 });
    }

    // TODO: Implement Supabase integration
    return NextResponse.json(
      { error: 'Supabase not configured' },
      { status: 500 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Registration failed' },
      { status: 400 }
    );
  }
}
