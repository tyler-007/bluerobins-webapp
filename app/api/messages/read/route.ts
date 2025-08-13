import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { channel_id, reader, message_ids } = body as {
      channel_id: string;
      reader: string;
      message_ids?: string[];
    };

    if (!channel_id || !reader) {
      return NextResponse.json(
        { success: false, error: 'channel_id and reader are required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    let updatedMessages;
    let readError;

    if (Array.isArray(message_ids) && message_ids.length > 0) {
      // Mark specific messages
      ({ data: updatedMessages, error: readError } = await supabase
        .from('channel_messages')
        .update({ read_by: reader })
        .in('id', message_ids)
        .neq('from_user', reader)
        .select('id'));
    } else {
      // Fallback: Mark all in channel (old GET logic)
      ({ data: updatedMessages, error: readError } = await supabase
        .from('channel_messages')
        .update({ read_by: reader })
        .eq('channel_id', channel_id)
        .neq('from_user', reader)
        .select('id'));
    }

    if (readError) {
      return NextResponse.json(
        { success: false, error: readError.message },
        { status: 500 }
      );
    }

    // Remove pending unread reminders if we marked anything
    if ((updatedMessages?.length || 0) > 0) {
      await supabase
        .from('scheduled_notifications')
        .update({ status: 'deleted' })
        .eq('user_id', reader)
        .eq('related_entity_id', channel_id)
        .eq('event_type', 'unread_chat_reminder')
        .eq('status', 'pending');
    }

    return NextResponse.json({
      success: true,
      marked_read_count: updatedMessages?.length || 0,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
