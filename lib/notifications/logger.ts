import { NotificationLog } from './types';
import { createAdminClient } from '@/utils/supabase/admin';

export async function logNotification(log: NotificationLog) {
  const supabase = createAdminClient();
  const payload: any = {
    user_id: log.userId,
    notification_id: log.notification_id,
    status: log.status,
    sent_at: log.createdAt || new Date().toISOString(),
    error: log.error,
    event_type: log.eventType,
    channel: log.channel,
    delivery_info: log.delivery_info || null,
    opened_at: null,
    clicked_at: null,
  };
  await supabase.from('notification_logs').insert([payload]);
}