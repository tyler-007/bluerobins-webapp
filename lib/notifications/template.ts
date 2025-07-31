import { createAdminClient } from "@/utils/supabase/admin";

/**
 * Fetches a notification template by event type, channel, and role.
 * Falls back to a default templateId if not found.
 */
export async function getNotificationTemplate({ eventType, channel, audienceRole, fallbackTemplateId }: {
  eventType: string;
  channel: string;
  audienceRole?: string;
  fallbackTemplateId?: string;
}) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('notification_templates')
    .select('*')
    .eq('event_type', eventType)
    .eq('channel', channel)
    .eq('audience_role', audienceRole || 'student')
    .order('version', { ascending: false })
    .limit(1);
  if (error || !data || data.length === 0) {
    return { templateId: fallbackTemplateId, template: null };
  }
  return { templateId: data[0].id, template: data[0] };
}
