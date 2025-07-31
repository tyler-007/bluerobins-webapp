import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { email, userId } = await req.json();
    console.log('[Unsubscribe API] Received request:', { email, userId });
    
    if (!email || !userId) {
      console.log('[Unsubscribe API] Missing email or userId');
      return NextResponse.json({ success: false, error: 'Missing email or userId' }, { status: 400 });
    }

    // Create Supabase admin client
    console.log('[Unsubscribe API] Creating Supabase admin client...');
    const supabase = (await import('@/utils/supabase/admin')).createAdminClient();
    console.log('[Unsubscribe API] Supabase client created successfully');

    // First, check if the user exists in notification_preferences
    console.log('[Unsubscribe API] Checking if user exists in notification_preferences...');
    const { data: existingUser, error: checkError } = await supabase
      .from('notification_preferences')
      .select('user_id, email_opt_in')
      .eq('user_id', userId)
      .single();

    if (checkError) {
      console.error('[Unsubscribe API] Error checking user:', checkError);
      return NextResponse.json({ success: false, error: `User check failed: ${checkError.message}` }, { status: 500 });
    }

    if (!existingUser) {
      console.log('[Unsubscribe API] User not found in notification_preferences, creating record...');
      // Create the record if it doesn't exist
      const { error: insertError } = await supabase
        .from('notification_preferences')
        .insert({
          user_id: userId,
          email_opt_in: false,
          sms_opt_in: true,
          push_opt_in: true,
          created_at: new Date().toISOString()
        });

      if (insertError) {
        console.error('[Unsubscribe API] Error creating user preferences:', insertError);
        return NextResponse.json({ success: false, error: `Failed to create user preferences: ${insertError.message}` }, { status: 500 });
      }
      console.log('[Unsubscribe API] User preferences created successfully');
    } else {
      console.log('[Unsubscribe API] User found, updating email_opt_in to false...');
      // Update existing record
      const { error: updateError } = await supabase
        .from('notification_preferences')
        .update({ 
          email_opt_in: false
        })
        .eq('user_id', userId);

      if (updateError) {
        console.error('[Unsubscribe API] Error updating user preferences:', updateError);
        return NextResponse.json({ success: false, error: `Failed to update user preferences: ${updateError.message}` }, { status: 500 });
      }
      console.log('[Unsubscribe API] User preferences updated successfully');
    }

    console.log('[Unsubscribe API] Success - user unsubscribed');
    return NextResponse.json({ success: true });
    
  } catch (err) {
    console.error('[Unsubscribe API] Unexpected error:', err);
    return NextResponse.json({ 
      success: false, 
      error: 'Server error', 
      details: err instanceof Error ? err.message : 'Unknown error'
    }, { status: 500 });
  }
} 