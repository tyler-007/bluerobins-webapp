import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { channel_id, reader, message_ids } = body as {
      channel_id: string;
      reader: string;
      message_ids: string[];
    };

    if (!channel_id || !reader || !Array.isArray(message_ids) || message_ids.length === 0) {
      return NextResponse.json(
        { success: false, error: 'channel_id, reader and non-empty message_ids are required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Mark specific messages as read for this reader (ignore own messages)
    const { data: updatedMessages, error: readError } = await supabase
      .from('channel_messages')
      .update({ read_by: reader })
      .in('id', message_ids)
      .neq('from_user', reader)
      .select('id');

    if (readError) {
      return NextResponse.json(
        { success: false, error: readError.message },
        { status: 500 }
      );
    }

          // If we marked anything as read, delete pending unread reminders for this channel/user
      if ((updatedMessages?.length || 0) > 0) {
        await supabase
          .from('scheduled_notifications')
          .update({ status: 'deleted' })
          .eq('user_id', reader)
          .eq('related_entity_id', channel_id)
          .eq('event_type', 'unread_chat_reminder') // ← Use dedicated column
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


