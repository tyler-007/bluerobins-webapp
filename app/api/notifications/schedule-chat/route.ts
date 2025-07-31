import { NextRequest, NextResponse } from 'next/server';
import { notify } from '@/lib/notifications/orchestrator';

export async function POST(request: NextRequest) {
  console.log('[Schedule Chat API] Request received');
  
  try {
    const body = await request.json();
    console.log('[Schedule Chat API] Request body:', body);
    
    const { message, from_user, channel_id, message_id, to_user } = body;
    
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