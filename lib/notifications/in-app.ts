import { createAdminClient } from "@/utils/supabase/admin";

export async function sendInAppNotification(notification: {
    user_id: string;
    message: string;
    related_entity_id?: string;
    related_entity_type?: string;
}) {
    const supabase = createAdminClient();
    const channelName = `notifications-${notification.user_id}`;
    
    const payload = {
        id: notification.related_entity_id || new Date().getTime().toString(), // Use entity_id or timestamp as a fallback key
        message: notification.message,
        is_read: false,
        created_at: new Date().toISOString(),
    };

    try {
        await supabase.realtime.sendToChannel(channelName, {
            type: "broadcast",
            event: "new_notification",
            payload,
        });
        return { success: true, data: [payload] };
    } catch (error) {
        console.error("Error broadcasting in-app notification:", error);
        return { success: false, error };
    }
} 