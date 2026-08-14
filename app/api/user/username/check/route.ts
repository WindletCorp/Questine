import { createSupabaseServerClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const username = searchParams.get('username');

    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    // Check formatting manually as well to provide early feedback
    const isValidFormat = /^[a-zA-Z0-9_]{3,20}$/.test(username);
    if (!isValidFormat) {
      return NextResponse.json(
        { error: 'Username must be 3-20 characters long and can only contain alphanumeric characters and underscores.' },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from('user_profiles')
      .select('username')
      .eq('username', username)
      .maybeSingle();

    if (error) {
      console.error('Error checking username:', error);
      return NextResponse.json(
        { error: 'Failed to check username availability' },
        { status: 500 }
      );
    }

    if (data) {
      return NextResponse.json({ available: false });
    }

    return NextResponse.json({ available: true });
  } catch (error) {
    console.error('Unexpected error checking username:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
