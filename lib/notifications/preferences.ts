import { UserPreferences, EmailType, NotificationEventType } from './types';

/**
 * Get user notification preferences from database
 */
export async function getUserPreferences(userId: string): Promise<UserPreferences | null> {
  try {
    const supabase = (await import('@/utils/supabase/admin')).createAdminClient();
    
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.warn(`[Preferences] No preferences found for user ${userId}:`, error.message);
      return null;
    }

    return data;
  } catch (error) {
    console.error(`[Preferences] Error fetching preferences for user ${userId}:`, error);
    return null;
  }
}

/**
 * Check if user should receive email based on preferences and email type
 * 
 * Logic:
 * - Transactional emails (payment receipts, session reminders, etc.) are ALWAYS sent
 * - Promotional emails (marketing, recommendations) only sent if user has opted in
 * - If no preferences found, default to sending everything (fail-safe)
 */
export async function shouldSendEmail(userId: string, emailType: EmailType): Promise<boolean> {
  try {
    // If no userId provided, default to sending (for system emails)
    if (!userId) {
      console.warn('[Preferences] No userId provided, defaulting to send email');
      return true;
    }

    const preferences = await getUserPreferences(userId);
    
    // If no preferences found, default to sending everything (fail-safe)
    if (!preferences) {
      console.warn(`[Preferences] No preferences found for user ${userId}, defaulting to send email`);
      return true;
    }

    // Transactional emails are always sent
    if (emailType === 'transactional') {
      console.log(`[Preferences] Transactional email for user ${userId} - sending`);
      return true;
    }

    // Promotional emails only if user has opted in
    if (emailType === 'promotional') {
      const shouldSend = preferences.email_opt_in === true;
      console.log(`[Preferences] Promotional email for user ${userId} - opt_in: ${preferences.email_opt_in}, sending: ${shouldSend}`);
      return shouldSend;
    }

    // Default to sending if email type is not specified
    console.warn(`[Preferences] Unknown email type for user ${userId}, defaulting to send`);
    return true;
  } catch (error) {
    console.error(`[Preferences] Error checking email preferences for user ${userId}:`, error);
    // Default to sending on error (fail-safe)
    return true;
  }
}

/**
 * Check if user should receive SMS based on preferences
 */
export async function shouldSendSMS(userId: string): Promise<boolean> {
  try {
    if (!userId) {
      console.warn('[Preferences] No userId provided, defaulting to send SMS');
      return true;
    }

    const preferences = await getUserPreferences(userId);
    
    if (!preferences) {
      console.warn(`[Preferences] No preferences found for user ${userId}, defaulting to send SMS`);
      return true;
    }

    const shouldSend = preferences.sms_opt_in === true;
    console.log(`[Preferences] SMS for user ${userId} - opt_in: ${preferences.sms_opt_in}, sending: ${shouldSend}`);
    return shouldSend;
  } catch (error) {
    console.error(`[Preferences] Error checking SMS preferences for user ${userId}:`, error);
    return true; // Default to sending on error
  }
}

/**
 * Check if user should receive in-app notifications based on preferences
 */
export async function shouldSendInApp(userId: string): Promise<boolean> {
  try {
    if (!userId) {
      console.warn('[Preferences] No userId provided, defaulting to send in-app notification');
      return true;
    }

    const preferences = await getUserPreferences(userId);
    
    if (!preferences) {
      console.warn(`[Preferences] No preferences found for user ${userId}, defaulting to send in-app notification`);
      return true;
    }

    // In-app notifications are always sent (they're essential for app functionality)
    console.log(`[Preferences] In-app notification for user ${userId} - sending (always enabled)`);
    return true;
  } catch (error) {
    console.error(`[Preferences] Error checking in-app preferences for user ${userId}:`, error);
    return true; // Default to sending on error
  }
}

/**
 * Create or update user notification preferences
 */
export async function updateUserPreferences(
  userId: string, 
  preferences: Partial<UserPreferences>
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = (await import('@/utils/supabase/admin')).createAdminClient();
    
    const { error } = await supabase
      .from('notification_preferences')
      .upsert({
        user_id: userId,
        ...preferences,
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error(`[Preferences] Error updating preferences for user ${userId}:`, error);
      return { success: false, error: error.message };
    }

    console.log(`[Preferences] Successfully updated preferences for user ${userId}`);
    return { success: true };
  } catch (error) {
    console.error(`[Preferences] Error updating preferences for user ${userId}:`, error);
    return { success: false, error: (error as Error).message };
  }
} 