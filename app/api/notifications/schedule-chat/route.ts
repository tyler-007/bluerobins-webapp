import { NextRequest, NextResponse } from 'next/server';
import { notify } from '@/lib/notifications/orchestrator';

export async function POST(request: NextRequest) {
  console.log('[Schedule Chat API] Request received');
  
  try {
    const body = await request.json();
    console.log('[Schedule Chat API] Request body:', body);
    
    const { message, from_user, channel_id, message_id, to_user } = body;
    
    // If the recipient already read this message (real-time open), skip scheduling by marking deleted downstream
    try {
      if (message_id) {
        const supabase = (await import('@/utils/supabase/admin')).createAdminClient();
        const { data: msg } = await supabase
          .from('channel_messages')
          .select('read_by')
          .eq('id', message_id)
          .single();
        if (msg?.read_by === to_user) {
          console.log('[Schedule Chat API] Message already read by recipient; orchestrator will insert reminder as deleted');
        }
      }
    } catch (e) {
      console.warn('[Schedule Chat API] Pre-check read state failed:', e);
    }

    console.log('[Schedule Chat API] Scheduling notification for message:', { message_id, channel_id, from_user, to_user });
    
    const result = await notify({
      eventType: 'chat_message',
      userId: to_user,
      context: {
        message,
        from_user,
        channel_id,
        message_id,
      },
    });
    
    console.log('[Schedule Chat API] Notification scheduling result:', result);
    
    return NextResponse.json({ 
      success: true, 
      result 
    });
  } catch (error: any) {
    console.error('[Schedule Chat API] Error scheduling notification:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message 
      },
      { status: 500 }
    );
  }
} 