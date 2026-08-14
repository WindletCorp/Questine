import { createSupabaseServerClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { updateUserProfile } from '@/lib/db/users';

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { username, display_name, avatar_url, bio } = body;

    // Validate username if provided
    if (username !== undefined) {
      const isValidFormat = /^[a-zA-Z0-9_]{3,20}$/.test(username);
      if (!isValidFormat) {
        return NextResponse.json(
          { error: 'Username must be 3-20 characters long and can only contain alphanumeric characters and underscores.' },
          { status: 400 }
        );
      }
    }

    const updates = {
      ...(username !== undefined && { username }),
      ...(display_name !== undefined && { display_name }),
      ...(avatar_url !== undefined && { avatar_url }),
      ...(bio !== undefined && { bio }),
    };

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update provided' }, { status: 400 });
    }

    const { data: profile, error } = await updateUserProfile(supabase, user.id, updates);

    if (error) {
      // Map error codes to HTTP status
      if (error.code === 'CONFLICT') {
        return NextResponse.json({ error: 'Username is already taken' }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ profile });
  } catch (error) {
    console.error('Unexpected error updating profile:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
