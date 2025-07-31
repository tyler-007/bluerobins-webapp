import { createAdminClient } from "@/utils/supabase/admin";

export async function sendInAppNotification(notification: {
    user_id: string;
    message: string;
    related_entity_id?: string;
    related_entity_type?: string;
}) {
    const supabase = createAdminClient();
    const payload = {
        user_id: notification.user_id,
        message: notification.message,
        is_read: false,
        related_entity_id: notification.related_entity_id,
        related_entity_type: notification.related_entity_type,
        created_at: new Date().toISOString(),
    };

    // Insert into DB
    const { data, error } = await supabase
        .from("in_app_notifications")
        .insert([payload])
        .select();

    if (error) {
        console.error("Error inserting in-app notification:", error);
        return { success: false, error };
    }

    // Remove the call to supabase.realtime.sendToChannel, just insert the notification
    // (Assume this is inside sendInAppNotification or similar function)
    // Remove or comment out:
    // await supabase.realtime.sendToChannel(channelName, { ... });

    return { success: true, data: data[0] };
}