import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/client";
// import { createAdminClient } from '@/utils/supabase/admin'
// import fetch from 'node-fetch'

export async function GET(request) {
  const supabase = createClient();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const reader = searchParams.get("reader");
  const { data, error } = await supabase
    .from("channel_messages")
    .select("*")
    .eq("channel_id", id);

  console.log("Marking messages as read:", { channel_id: id, reader });
  if (reader) {
    // Update read_by for all messages in this channel
    const { data: updatedData, error: updateError } = await supabase
      .from("channel_messages")
      .update({ read_by: reader })
      .eq("channel_id", id)
      .neq("from_user", reader);

    console.log("Updated read status:", updatedData, updateError);

    // Mark scheduled notifications as deleted for this user and channel
    if (!updateError) {
      const { data: updatedNotifications, error: updateError } = await supabase
        .from("scheduled_notifications")
        .update({ status: 'deleted' })
        .eq("user_id", reader)
        .eq("related_entity_id", id)
        .eq("context->>eventType", "unread_chat_reminder")
        .eq("status", "pending");

      console.log("Marked scheduled notifications as deleted:", {
        updated: updatedNotifications?.length || 0,
        error: updateError?.message
      });
    }
  }

  return NextResponse.json({ status: true, data: data });
}

export async function POST(request) {
  const supabase = createClient();
  const body = await request.json();
  const { channel_id, from_user, to_user, message } = body;
  console.log('POST /api/get_messages called', { channel_id, from_user, to_user, message });
  if (!channel_id || !from_user || !to_user || !message) {
    return NextResponse.json({ status: false, error: 'Missing required fields' }, { status: 400 });
  }
  
  // Insert the new message
  const { data, error } = await supabase
    .from('channel_messages')
    .insert({ channel_id, from_user, to_user, message, created_at: new Date().toISOString() })
    .select();
  if (error) {
    return NextResponse.json({ status: false, error: error.message }, { status: 500 });
  }
  
  // Trigger notifications for the recipient
  try {
    console.log('[API] Triggering notification for message:', { 
      message_id: data[0].id, 
      to_user, 
      from_user, 
      channel_id 
    });
    
    // Import notify directly to avoid extra HTTP call
    console.log('[API] Importing orchestrator...');
    const { notify } = await import('@/lib/notifications/orchestrator');
    console.log('[API] Orchestrator imported successfully, notify function:', typeof notify);
    const notifyResult = await notify({
      eventType: 'chat_message',
      userId: to_user,
      context: {
        message,
        from_user,
        channel_id,
        message_id: data[0].id, // Pass the message ID for scheduling
      },
    });
    
    console.log('[API] Notification result:', notifyResult);
  } catch (notifyError) {
    // Log but don't fail the message send
    console.error('[API] Failed to send chat notification:', notifyError);
    console.error('[API] Error details:', {
      message: notifyError.message,
      stack: notifyError.stack,
      name: notifyError.name
    });
  }
  return NextResponse.json({ status: true, data });
}
