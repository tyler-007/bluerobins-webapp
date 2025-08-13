import { NotificationChannel, EmailType } from './types';
import { getFallbackConfig } from './config';

/**
 * Check if phone number is from supported country (US or India)
 */
export async function isSupportedSMSCountry(phone: string): Promise<boolean> {
  const config = await getFallbackConfig();
  
  // Check against supported countries from DB
  for (const country of config.SMS_SUPPORTED_COUNTRIES) {
    const countryCode = country.trim().toUpperCase();
    if (countryCode === 'US' && phone.startsWith('+1')) return true;
    if (countryCode === 'IN' && phone.startsWith('+91')) return true;
  }
  
  return false;
}

/**
 * Get country code from phone number
 */
export function getCountryFromPhone(phone: string): string | null {
  if (phone.startsWith('+1')) return 'US';
  if (phone.startsWith('+91')) return 'IN';
  return null;
}

/**
 * Check SMS rate limit for a user
 * Returns true if SMS can be sent, false if rate limited
 */
export async function checkSMSRateLimit(userId: string): Promise<{ allowed: boolean; reason?: string }> {
  try {
    const config = await getFallbackConfig();
    
    // Skip rate limiting if disabled
    if (!config.SMS_RATE_LIMIT_ENABLED) {
      return { allowed: true };
    }
    
    const supabase = (await import('@/utils/supabase/admin')).createAdminClient();
    
    // Get SMS count in the last window
    const windowStart = new Date(Date.now() - config.SMS_WINDOW_HOURS * 60 * 60 * 1000);
    
    const { data: recentSMS, error } = await supabase
      .from('notification_logs')
      .select('id')
      .eq('user_id', userId)
      .eq('channel', 'sms')
      .gte('sent_at', windowStart.toISOString());

    if (error) {
      console.error('[Fallback] Error checking SMS rate limit:', error);
      return { allowed: true }; // Allow on error (fail-safe)
    }

    const smsCount = recentSMS?.length || 0;
    
    if (smsCount >= config.SMS_MAX_PER_HOUR) {
      console.log(`[Fallback] SMS rate limit exceeded for user ${userId}: ${smsCount} SMS in last ${config.SMS_WINDOW_HOURS} hour(s)`);
      return { 
        allowed: false, 
        reason: `Rate limit exceeded: ${smsCount} SMS in last ${config.SMS_WINDOW_HOURS} hour(s)` 
      };
    }

    return { allowed: true };
  } catch (error) {
    console.error('[Fallback] Error checking SMS rate limit:', error);
    return { allowed: true }; // Allow on error (fail-safe)
  }
}

/**
 * Determine fallback channel based on priority
 */
export function getFallbackChannel(originalChannel: NotificationChannel): NotificationChannel {
  const fallbackMap: Record<NotificationChannel, NotificationChannel> = {
    'sms': 'email',
    'email': 'in_app',
    'in_app': 'in_app', // No fallback for in-app
    'system': 'system' // No fallback for system
  };
  
  return fallbackMap[originalChannel] || 'in_app';
}

/**
 * Check if SMS should be sent based on country and rate limits
 * Returns fallback channel if SMS should not be sent
 */
export async function shouldSendSMS(phone: string, userId: string): Promise<{
  shouldSend: boolean;
  fallbackChannel?: NotificationChannel;
  reason?: string;
}> {
  // 1. Check if country is supported
  if (!(await isSupportedSMSCountry(phone))) {
    const country = getCountryFromPhone(phone);
    console.log(`[Fallback] SMS not supported for country: ${country}, falling back to email`);
    return {
      shouldSend: false,
      fallbackChannel: 'email',
      reason: `SMS not supported for country: ${country}`
    };
  }

  // 2. Check rate limit
  const rateLimitCheck = await checkSMSRateLimit(userId);
  if (!rateLimitCheck.allowed) {
    console.log(`[Fallback] SMS rate limited for user ${userId}, falling back to email`);
    return {
      shouldSend: false,
      fallbackChannel: 'email',
      reason: rateLimitCheck.reason
    };
  }

  return { shouldSend: true };
}

/**
 * Handle SMS fallback logic
 * If SMS fails or is not allowed, automatically try email
 * Always fetch the user's email from the profiles table for fallback
 * Logs all steps for debugging.
 */
export async function handleSMSFallback(
  phone: string, 
  userId: string, 
  smsContent: string,
  _emailContent: { to: string; subject: string; html: string }, // ignored, always fetch user email
  eventType: string
): Promise<{ success: boolean; channel: NotificationChannel; reason?: string }> {
  // Check if SMS should be sent
  const smsCheck = await shouldSendSMS(phone, userId);
  if (!smsCheck.shouldSend) {
    console.log(`[Fallback] SMS not allowed: ${smsCheck.reason}, trying email fallback for userId: ${userId}`);
    // Fetch user email from profiles table
    try {
      const supabase = (await import('@/utils/supabase/admin')).createAdminClient();
      const { data: userProfile, error } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', userId)
        .single();
      console.log(`[Fallback] Fetched user profile for fallback:`, userProfile, 'error:', error);
      if (error || !userProfile?.email) {
        console.error('[Fallback] Could not fetch user email for fallback:', error);
        return { success: false, channel: 'email', reason: 'No user email for fallback' };
      }
      if (!userProfile.email.includes('@')) {
        console.error('[Fallback] Fetched email is not valid:', userProfile.email);
        return { success: false, channel: 'email', reason: 'Invalid user email for fallback' };
      }
      const { sendEmail } = await import('./email');
      const emailResult = await sendEmail({
        to: userProfile.email,
        subject: 'Notification from BlueRobins',
        html: `<pre style="font-family:inherit;">${smsContent}</pre>`,
        userId,
        emailType: 'transactional',
      });
      console.log(`[Fallback] Email fallback sendEmail result:`, emailResult);
      if (emailResult.success) {
        console.log(`[Fallback] Email fallback successful for user ${userId}`);
        return { success: true, channel: 'email', reason: smsCheck.reason };
      } else {
        console.error(`[Fallback] Email fallback failed for user ${userId}`);
        return { success: false, channel: 'email', reason: 'Email fallback failed' };
      }
    } catch (error) {
      console.error(`[Fallback] Error in email fallback for user ${userId}:`, error);
      return { success: false, channel: 'email', reason: 'Email fallback error' };
    }
  }

  // SMS is allowed, proceed with SMS sending
  try {
    const { sendSMS } = await import('./sms');
    const smsResult = await sendSMS({
      to: phone,
      body: smsContent,
      eventType,
      userId
    });
    if (smsResult.success) {
      console.log(`[Fallback] SMS sent successfully to user ${userId}`);
      return { success: true, channel: 'sms' };
    } else {
      console.log(`[Fallback] SMS failed for user ${userId}, trying email fallback`);
      // Fetch user email from profiles table
      try {
        const supabase = (await import('@/utils/supabase/admin')).createAdminClient();
        const { data: userProfile, error } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', userId)
          .single();
        console.log(`[Fallback] Fetched user profile for fallback:`, userProfile, 'error:', error);
        if (error || !userProfile?.email) {
          console.error('[Fallback] Could not fetch user email for fallback:', error);
          return { success: false, channel: 'email', reason: 'No user email for fallback' };
        }
        if (!userProfile.email.includes('@')) {
          console.error('[Fallback] Fetched email is not valid:', userProfile.email);
          return { success: false, channel: 'email', reason: 'Invalid user email for fallback' };
        }
        const { sendEmail } = await import('./email');
        const emailResult = await sendEmail({
          to: userProfile.email,
          subject: 'Notification from BlueRobins',
          html: `<pre style="font-family:inherit;">${smsContent}</pre>`,
          userId,
          emailType: 'transactional',
        });
        console.log(`[Fallback] Email fallback sendEmail result:`, emailResult);
        if (emailResult.success) {
          console.log(`[Fallback] Email fallback successful after SMS failure for user ${userId}`);
          return { success: true, channel: 'email', reason: 'SMS failed, email fallback successful' };
        } else {
          console.error(`[Fallback] Email fallback failed after SMS failure for user ${userId}`);
          return { success: false, channel: 'email', reason: 'Both SMS and email failed' };
        }
      } catch (error) {
        console.error(`[Fallback] Error in email fallback after SMS failure for user ${userId}:`, error);
        return { success: false, channel: 'email', reason: 'SMS failed, email fallback error' };
      }
    }
  } catch (error) {
    console.error(`[Fallback] Error sending SMS for user ${userId}:`, error);
    return { success: false, channel: 'sms', reason: 'SMS sending error' };
  }
}

/**
 * Log fallback events for analytics
 */
export async function logFallbackEvent(
  userId: string,
  originalChannel: NotificationChannel,
  fallbackChannel: NotificationChannel,
  reason: string
): Promise<void> {
  try {
    const { logNotification } = await import('./logger');
    await logNotification({
      userId,
      channel: 'system',
      eventType: 'fallback_triggered',
      status: 'success',
      delivery_info: {
        originalChannel,
        fallbackChannel,
        reason
      }
    });
  } catch (error) {
    console.error('[Fallback] Error logging fallback event:', error);
  }
} 