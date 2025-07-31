import { notify } from './orchestrator';
import { logNotification } from './logger';
import { NotificationEventType } from './types';

// You may want to use your admin supabase client here
const createAdminClient = async () => {
  const mod = await import('@/utils/supabase/admin');
  return mod.createAdminClient();
};

// Helper function to mark notification as sent
async function markNotificationAsSent(notif: any, supabase: any, eventType: NotificationEventType) {
  await supabase
    .from('scheduled_notifications')
    .update({ status: 'sent' })
    .eq('id', notif.id);
  
  await logNotification({
    userId: notif.user_id,
    channel: 'system',
    eventType,
    status: 'success',
    notification_id: notif.id,
  });
  
  console.log(`[Scheduler] Sent scheduled notification ${notif.id}`);
}

// Helper function to mark notification as failed
async function markNotificationAsFailed(notif: any, supabase: any, eventType: NotificationEventType, error: string) {
  await supabase
    .from('scheduled_notifications')
    .update({ status: 'failed', error })
    .eq('id', notif.id);
  
  await logNotification({
    userId: notif.user_id,
    channel: 'system',
    eventType,
    status: 'failure',
    error,
    notification_id: notif.id,
  });
  
  console.error(`[Scheduler] Failed to send scheduled notification ${notif.id}:`, error);
}

export async function processScheduledNotifications() {
  const supabase = await createAdminClient();
  const now = new Date();
  const nowISO = now.toISOString();

  const { data: notifications, error } = await supabase
    .from('scheduled_notifications')
    .select('*')
    .eq('status', 'pending')
    .lt('send_at', nowISO);

  if (error) {
    console.error('[Scheduler] Failed to fetch scheduled notifications:', error);
    return;
  }
  if (!notifications || notifications.length === 0) {
    console.log('[Scheduler] No scheduled notifications to process.');
    return;
  }

  console.log(`[Scheduler] Processing ${notifications.length} scheduled notifications`);

  for (const notif of notifications) {
    try {
      const eventType = (notif.context?.eventType || 'session_reminder') as NotificationEventType;
      
      // Prepare notification request
      const request = {
        userId: notif.user_id,
        eventType,
        context: notif.context,
      };
      
      // Send notification
      const result = await notify(request);
      
      // Mark as sent
      await markNotificationAsSent(notif, supabase, eventType);
      
    } catch (err: any) {
      // Mark as failed
      const eventType = (notif.context?.eventType || 'session_reminder') as NotificationEventType;
      await markNotificationAsFailed(notif, supabase, eventType, err.message);
    }
  }
}

// Cleanup function for deleted messages
export async function cleanupDeletedMessageReminders() {
  const supabase = await createAdminClient();
  
  console.log('[Cleanup] Starting cleanup of deleted message reminders...');
  
  // Find messages that have been deleted
  const { data: deletedMessages, error } = await supabase
    .from('channel_messages')
    .select('id')
    .not('deleted_at', 'is', null);
  
  if (error) {
    console.error('[Cleanup] Failed to fetch deleted messages:', error);
    return;
  }
  
  if (!deletedMessages || deletedMessages.length === 0) {
    console.log('[Cleanup] No deleted messages found.');
    return;
  }
  
  const deletedMessageIds = deletedMessages.map(msg => msg.id);
  
  // Mark related reminders as deleted
  const { data: updatedReminders, error: updateError } = await supabase
    .from('scheduled_notifications')
    .update({ status: 'deleted' })
    .in('context->messageId', deletedMessageIds)
    .eq('status', 'pending')
    .select();
  
  if (updateError) {
    console.error('[Cleanup] Failed to update reminders:', updateError);
    return;
  }
  
  console.log(`[Cleanup] Marked ${updatedReminders?.length || 0} reminders as deleted for deleted messages`);
}

// For manual/CLI testing
if (require.main === module) {
  processScheduledNotifications().then(() => process.exit(0));
} 