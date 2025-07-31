import { NotificationRequest, NotificationChannel, NotificationEventType, NotificationContext, EmailType } from './types';
import { sendSMS } from './sms';
import { sendEmail } from './email';
import { sendInAppNotification } from './in-app';
import { logNotification } from './logger';
import { shouldSendInApp } from './preferences';
import { handleSMSFallback } from './fallback';

// Configuration-driven approach
const NOTIFICATION_CONFIG = {
  session_booked: {
    reminderOffsets: [12, 6, 1, 0.5],
    channels: ['in_app', 'sms', 'email'] as NotificationChannel[],
    fallbackPhone: '+919300319597'
  },
  email: {
    from: 'Tickets at BlueRobins <mailtojainaayush@gmail.com>',
    baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  },
  sms: {
    fallbackPhone: '+919300319597',
    phoneRegex: /^\+[1-9]\d{1,14}$/
  }
} as const;

// Promotional events configuration
const PROMOTIONAL_EVENTS: NotificationEventType[] = [
  'random_project_recommendation',
  'project_created'
];

// Common utility functions
const utils = {
  // Generate unsubscribe link
  generateUnsubscribeLink: (email: string, userId: string) => 
    `${NOTIFICATION_CONFIG.email.baseUrl}/unsubscribe?email=${encodeURIComponent(email)}&userId=${encodeURIComponent(userId)}`,

  // Generate fallback email content for SMS fallback
  getFallbackSMSEmailContent: ({ to, smsBody }: { to: string; smsBody: string }) => ({
    to,
    subject: 'Notification from BlueRobins',
    html: `<pre style="font-family:inherit;">${smsBody}</pre>`
  }),

  // Determine email type based on event type
  getEmailType: (eventType: NotificationEventType): EmailType => 
    PROMOTIONAL_EVENTS.includes(eventType) ? 'promotional' : 'transactional',

  // Validate phone number
  validatePhone: (phone: string): string => {
    if (!phone || !NOTIFICATION_CONFIG.sms.phoneRegex.test(phone)) {
      console.warn(`[Orchestrator] Invalid phone number: ${phone}, using fallback`);
      return NOTIFICATION_CONFIG.sms.fallbackPhone;
    }
    return phone;
  },

  // Parse session time with defensive handling
  parseSessionTime: (sessionTime: string): Date => {
    let sessionDate = new Date(sessionTime);
    if (isNaN(sessionDate.getTime())) {
      const fixedSessionTime = sessionTime.replace(/T(\d:)/, 'T0$1');
      sessionDate = new Date(fixedSessionTime);
    }
    if (isNaN(sessionDate.getTime())) {
      throw new Error(`Invalid sessionTime: ${sessionTime}`);
    }
    return sessionDate;
  },

  // Send multi-channel notification with logging
  sendMultiChannelNotification: async (params: {
    userId: string;
    eventType: NotificationEventType;
    channels: { type: NotificationChannel; data: any }[];
  }) => {
    const results = [];
    for (const channel of params.channels) {
      try {
        let result;
        switch (channel.type) {
          case 'in_app':
            result = await logAndSendInAppNotification(channel.data);
            break;
          case 'sms':
            result = await sendSMS(channel.data);
            break;
          case 'email':
            result = await sendEmail(channel.data);
            break;
          default:
            console.warn(`[Orchestrator] Unknown channel type: ${channel.type}`);
            continue;
        }
        
        await logNotification({
          userId: params.userId,
          channel: channel.type,
          eventType: params.eventType,
          status: result?.success ? 'success' : 'failure',
          error: result?.success ? undefined : JSON.stringify(result?.error),
        });
        
        results.push({ channel: channel.type, result });
      } catch (error) {
        console.error(`[Orchestrator] Error sending ${channel.type} notification:`, error);
        results.push({ channel: channel.type, error });
      }
    }
    return results;
  },

  // Batch insert scheduled notifications
  batchInsertScheduledNotifications: async (notifications: any[]) => {
    const supabase = (await import('@/utils/supabase/admin')).createAdminClient();
    const { data, error } = await supabase
      .from('scheduled_notifications')
      .insert(notifications)
      .select();
    
    if (error) throw new Error(`Failed to batch insert notifications: ${error.message}`);
    return data;
  }
};

// Wrapper to log and send in-app notifications with preference checking
async function logAndSendInAppNotification(notification: any) {
  try {
    const shouldSend = await shouldSendInApp(notification.user_id);
    
    if (!shouldSend) {
      console.log(`[IN-APP] In-app notification skipped for user ${notification.user_id} - not allowed`);
      return { success: true, skipped: true, reason: 'in_app_not_allowed' };
    }

    console.log(`[IN-APP] Notification to userId: ${notification.user_id} | message: ${notification.message}`);
    return await sendInAppNotification(notification);
  } catch (error) {
    console.error(`[IN-APP] Error sending in-app notification to user ${notification.user_id}:`, error);
    return { success: false, error };
  }
}

// Event handlers
const eventHandlers: Record<NotificationEventType, (request: NotificationRequest) => Promise<any>> = {
  async random_project_recommendation(request: NotificationRequest) {
    const supabase = (await import('@/utils/supabase/admin')).createAdminClient();
    
    // Fetch random project
    const { data, error } = await supabase
      .from('projects')
      .select('id, title, selling_price, mentor_user')
      .neq('status', 'draft')
      .order('id');
    
    if (error) throw new Error(`Failed to fetch random project: ${error.message}`);
    if (!data || data.length === 0) throw new Error('No project found');
    
    const project = data[Math.floor(Math.random() * data.length)];
    let mentorName = '';
    
    if (project.mentor_user) {
      const { data: mentorProfile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', project.mentor_user)
        .single();
      mentorName = mentorProfile?.full_name || '';
    }
    
    const message = `Check out this project: ${project.title}\nMentor: ${mentorName}\nPrice: $${project.selling_price}`;
    
    // Insert scheduled notification
    const { data: scheduledData } = await supabase
      .from('scheduled_notifications')
      .insert([{
        user_id: request.userId,
        template_id: null,
        related_entity_id: project.id,
        read: false,
        created_at: new Date().toISOString(),
        send_at: new Date().toISOString(),
        status: 'sent',
        context: { project, mentorName },
      }])
      .select();
    
    // Send in-app notification
    const inAppResult = await logAndSendInAppNotification({
      user_id: request.userId,
      message,
      related_entity_id: project.id,
      related_entity_type: 'project',
    });
    
    await logNotification({
      userId: request.userId,
      channel: 'in_app',
      eventType: request.eventType,
      status: inAppResult.success ? 'success' : 'failure',
      error: inAppResult.success ? undefined : JSON.stringify(inAppResult.error),
      notification_id: scheduledData?.[0]?.id,
    });
    
    return inAppResult;
  },

  async payment_success(request: NotificationRequest) {
    const { courseDetails, phoneNumber } = request.context;
    const toNumber = utils.validatePhone(phoneNumber);
    
    const smsBody = [
      `You're booking: ${courseDetails?.title || ''}`,
      `Sessions: ${courseDetails?.sessions_count || ''}, Price: $${courseDetails?.price || ''}`,
      `Mentor: ${courseDetails?.mentor?.name || ''}`,
      `For full details, check your email or dashboard.`
    ].join('\n');
    
    // SMS with fallback
    const smsResult = await handleSMSFallback(
      toNumber,
      request.userId,
      smsBody,
      utils.getFallbackSMSEmailContent({
        to: courseDetails?.mentor?.email || 'user@example.com',
        smsBody
      }),
      request.eventType
    );
    
    await logNotification({
      userId: request.userId,
      channel: smsResult.channel,
      eventType: request.eventType,
      status: smsResult.success ? 'success' : 'failure',
      error: smsResult.success ? undefined : smsResult.reason,
    });
    
    // In-app notification
    const inAppResult = await logAndSendInAppNotification({
      user_id: request.userId,
      message: `Payment successful for ${courseDetails?.title || ''}`,
      related_entity_id: courseDetails?.id,
      related_entity_type: 'course',
    });
    
    await logNotification({
      userId: request.userId,
      channel: 'in_app',
      eventType: request.eventType,
      status: inAppResult.success ? 'success' : 'failure',
      error: inAppResult.success ? undefined : JSON.stringify(inAppResult.error),
    });
    
    return { smsResult, inAppResult };
  },

  async project_created(request: NotificationRequest) {
    const { mentorEmail, projectDetails } = request.context;
    const { getNotificationTemplate } = await import('./template');
    
    const { templateId } = await getNotificationTemplate({
      eventType: request.eventType,
      channel: 'email',
      audienceRole: 'mentor',
      fallbackTemplateId: 'd-7c0167aeeb5a4a6f99ea672b8f8d4508',
    });
    
    const dynamicTemplateData = {
      ...projectDetails,
      unsubscribeLink: utils.generateUnsubscribeLink(mentorEmail, request.userId)
    };
    
    // Insert scheduled notification
    const supabase = (await import('@/utils/supabase/admin')).createAdminClient();
    const { data: scheduledData } = await supabase
      .from('scheduled_notifications')
      .insert([{
        user_id: request.userId,
        template_id: templateId,
        related_entity_id: projectDetails?.id,
        read: false,
        created_at: new Date().toISOString(),
        send_at: new Date().toISOString(),
        status: 'sent',
        context: { ...projectDetails, unsubscribeLink: utils.generateUnsubscribeLink(mentorEmail, request.userId) },
      }])
      .select();
    
    // Send email
    const emailResult = await sendEmail({ 
      to: mentorEmail, 
      from: NOTIFICATION_CONFIG.email.from, 
      templateId, 
      dynamicTemplateData,
      emailType: utils.getEmailType(request.eventType),
      userId: request.userId
    });
    
    await logNotification({
      userId: request.userId,
      channel: 'email',
      eventType: request.eventType,
      status: emailResult.success ? 'success' : 'failure',
      error: emailResult.success ? undefined : JSON.stringify(emailResult.error),
      notification_id: scheduledData?.[0]?.id,
    });
    
    return emailResult;
  },

  async session_booked(request: NotificationRequest) {
    const { userId, sessionTime, bookingId, courseDetails, phoneNumber, email } = request.context;
    const supabase = (await import('@/utils/supabase/admin')).createAdminClient();
    const sessionDate = utils.parseSessionTime(sessionTime);
    const now = new Date();
    
    // Prepare batch notifications
    const notifications = [];
    
    for (const offset of NOTIFICATION_CONFIG.session_booked.reminderOffsets) {
      const sendAt = new Date(sessionDate.getTime() - offset * 60 * 60 * 1000);
      const message = `Reminder: Your session for ${courseDetails?.title || 'your course'} is coming up in ${offset >= 1 ? offset + ' hour(s)' : '30 minutes'}!`;
      
      for (const channel of NOTIFICATION_CONFIG.session_booked.channels) {
        const notification = {
          user_id: userId,
          template_id: null,
          related_entity_id: bookingId,
          read: false,
          created_at: now.toISOString(),
          send_at: sendAt.toISOString(),
          status: 'pending' as const,
          context: {
            eventType: 'session_reminder',
            channel,
            bookingId,
            courseDetails,
            message,
            ...(channel === 'sms' && { phoneNumber }),
            ...(channel === 'email' && { 
              email,
              subject: `Session Reminder: ${courseDetails?.title || 'Your Course'}`,
              emailType: 'transactional' as const
            }),
          },
        };
        notifications.push(notification);
      }
    }
    
    // Batch insert all notifications
    await utils.batchInsertScheduledNotifications(notifications);
    
    return { success: true, scheduled: true };
  },

  async session_reminder(request: NotificationRequest) {
    const { message, bookingId, emailType: reminderEmailType = 'transactional', channel, phoneNumber, email } = request.context;

    const channelHandlers = {
      sms: async () => {
        console.log(`[Orchestrator] Sending SMS for session_reminder to ${phoneNumber}`);
        const { sendSMS } = await import('./sms');
        return await sendSMS({
          to: phoneNumber,
          body: message,
          eventType: request.eventType,
          userId: request.userId,
        });
      },
      email: async () => {
        console.log(`[Orchestrator] Sending Email for session_reminder to ${email}`);
        const { sendEmail } = await import('./email');
        return await sendEmail({
          to: email,
          subject: `Session Reminder`,
          html: `<pre style="font-family:inherit;">${message}</pre>`,
          userId: request.userId,
          emailType: reminderEmailType,
        });
      },
      in_app: async () => {
        console.log(`[Orchestrator] Sending In-App for session_reminder to user ${request.userId}`);
        return await logAndSendInAppNotification({
          user_id: request.userId,
          message,
          related_entity_id: bookingId,
          related_entity_type: 'booking',
        });
      }
    };

    const handler = channelHandlers[channel as keyof typeof channelHandlers] || channelHandlers.in_app;
    const result = await handler();
    
    await logNotification({
      userId: request.userId,
      channel,
      eventType: request.eventType,
      status: result.success ? 'success' : 'failure',
      error: result.success ? undefined : JSON.stringify(result.error),
    });
    
    return result;
  },

  async unread_chat_reminder(request: NotificationRequest) {
    const { userId, unreadCount, channelId, lastMessageTime, userEmail, userName } = request.context;
    
    console.log(`[Orchestrator] Sending unread chat reminder to user ${userId} with ${unreadCount} unread messages`);
    
    const { sendEmail } = await import('./email');
    const emailResult = await sendEmail({
      to: userEmail,
      subject: `You have ${unreadCount} unread message${unreadCount > 1 ? 's' : ''}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2953BE;">Unread Messages Reminder</h2>
          <p>You have <strong>${unreadCount}</strong> unread message${unreadCount > 1 ? 's' : ''} in your chat.</p>
          <p>The last message was received at: ${new Date(lastMessageTime).toLocaleString()}</p>
          <p>Please check your chat to stay updated with your conversations.</p>
          <a href="${NOTIFICATION_CONFIG.email.baseUrl}/chats/${channelId}" 
             style="background-color: #2953BE; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            View Chat
          </a>
        </div>
      `,
      userId: request.userId,
      emailType: 'transactional',
    });
    
    await logNotification({
      userId: request.userId,
      channel: 'email',
      eventType: request.eventType,
      status: emailResult.success ? 'success' : 'failure',
      error: emailResult.success ? undefined : JSON.stringify(emailResult.error),
    });
    
    return emailResult;
  },

  async chat_message(request: NotificationRequest) {
    const { message, from_user, channel_id, message_id } = request.context;
    const supabase = (await import('@/utils/supabase/admin')).createAdminClient();
    
    // Fetch recipient and sender profiles
    const [recipientResult, senderResult] = await Promise.all([
      supabase.from('profiles').select('email, phone_number, full_name').eq('id', request.userId).single(),
      supabase.from('profiles').select('full_name').eq('id', from_user).single()
    ]);
    
    if (recipientResult.error || !recipientResult.data) {
      console.error(`[Orchestrator] No recipient profile found for user ${request.userId}. Notification skipped.`);
      return { success: false, error: 'No recipient profile found' };
    }
    
    const recipientProfile = recipientResult.data;
    const senderName = senderResult.data?.full_name || 'Someone';
    const messageText = `New message from ${senderName}: ${message}`;

    // Prepare multi-channel notification for immediate delivery
    const channels: { type: NotificationChannel; data: any }[] = [
      {
        type: 'in_app',
        data: {
          user_id: request.userId,
          message: messageText,
          related_entity_id: channel_id,
          related_entity_type: 'chat',
        }
      }
    ];

    // Add SMS if phone number is valid
    const smsTo = utils.validatePhone(recipientProfile.phone_number);
    if (smsTo !== NOTIFICATION_CONFIG.sms.fallbackPhone) {
      channels.push({
        type: 'sms',
        data: {
          to: smsTo,
          body: messageText,
          eventType: request.eventType,
          userId: request.userId,
        }
      });
    }

    // Add email if available
    if (recipientProfile.email) {
      channels.push({
        type: 'email',
        data: {
          to: recipientProfile.email,
          subject: `New message from ${senderName}`,
          html: `<p>You have a new message from <b>${senderName}</b>:</p><p>${message}</p>`,
          emailType: 'transactional',
          userId: request.userId,
        }
      });
    }

    // Send immediate notifications
    const results = await utils.sendMultiChannelNotification({
      userId: request.userId,
      eventType: request.eventType,
      channels
    });

    // Schedule unread reminder for 45 minutes later
    const sendAt = new Date(Date.now() + 45 * 60 * 1000); // 45 minutes later
    
    // Check if there's already a pending reminder for this user and channel
    const { data: existingReminder } = await supabase
      .from('scheduled_notifications')
      .select('id')
      .eq('user_id', request.userId)
      .eq('related_entity_id', channel_id)
      .eq('status', 'pending')
      .eq('context->eventType', 'unread_chat_reminder')
      .single();

    if (!existingReminder) {
      // Schedule the unread reminder
      await supabase.from('scheduled_notifications').insert({
        user_id: request.userId,
        template_id: null,
        related_entity_id: channel_id,
        read: false,
        created_at: new Date().toISOString(),
        send_at: sendAt.toISOString(),
        status: 'pending',
        context: {
          eventType: 'unread_chat_reminder',
          channel: 'email',
          messageId: message_id,
          channelId: channel_id,
          senderName,
          message: message.substring(0, 100), // First 100 chars for context
          userEmail: recipientProfile.email,
          userName: recipientProfile.full_name || 'User'
        }
      });
      
      console.log(`[Orchestrator] Scheduled unread reminder for user ${request.userId} in channel ${channel_id} at ${sendAt.toISOString()}`);
    }

    return { success: true, results };
  },

  // Placeholder handlers for missing event types
  async session_scheduled(request: NotificationRequest) {
    console.warn(`[Orchestrator] session_scheduled event not implemented yet`);
    return { success: false, error: 'Event type not implemented' };
  },

  async payment_failure(request: NotificationRequest) {
    console.warn(`[Orchestrator] payment_failure event not implemented yet`);
    return { success: false, error: 'Event type not implemented' };
  },

  async fallback_triggered(request: NotificationRequest) {
    console.warn(`[Orchestrator] fallback_triggered event not implemented yet`);
    return { success: false, error: 'Event type not implemented' };
  }
};

// Main orchestrator function
export async function notify(request: NotificationRequest) {
  console.log('[notify] called with', request);
  
  try {
    // Get the appropriate handler for the event type
    const handler = eventHandlers[request.eventType];
    
    if (!handler) {
      throw new Error(`No handler found for event type: ${request.eventType}`);
    }
    
    // Execute the handler
    return await handler(request);
    
  } catch (error: any) {
    await logNotification({
      userId: request.userId,
      channel: 'sms', // Fallback channel for logging
      eventType: request.eventType,
      status: 'failure',
      error: error.message,
    });
    throw error;
  }
} 