import { NotificationRequest, NotificationChannel, NotificationEventType, NotificationContext, EmailType } from './types';
import { sendSMS } from './sms';
 import { sendEmail } from './email';
import { sendInAppNotification } from './in-app';
import { logNotification } from './logger';
import { shouldSendInApp } from './preferences';
import { handleSMSFallback } from './fallback';

// Wrapper to log and send in-app notifications with preference checking
async function logAndSendInAppNotification(notification: any) {
  try {
    // Check if user should receive in-app notifications
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

/**
 * Determine email type based on event type
 * Transactional: payment receipts, session reminders, account updates
 * Promotional: marketing, recommendations, newsletters
 */
function getEmailType(eventType: NotificationEventType): EmailType {
  const promotionalEvents: NotificationEventType[] = [
    'random_project_recommendation',
    'project_created'
  ];
  
  if (promotionalEvents.includes(eventType)) {
    return 'promotional';
  }
  
  return 'transactional';
  
  // Default to transactional for safety
  console.warn(`[Orchestrator] Unknown event type ${eventType}, defaulting to transactional email`);
  return 'transactional';
}

// Helper to generate unsubscribe link
function generateUnsubscribeLink(email: string, userId: string) {
  return `http://localhost:3000/unsubscribe?email=${encodeURIComponent(email)}&userId=${encodeURIComponent(userId)}`;
}

// Helper to generate fallback email content for SMS fallback
function getFallbackSMSEmailContent({ to, smsBody }: { to: string; smsBody: string }) {
  return {
    to,
    subject: 'Notification from BlueRobins',
    html: `<pre style="font-family:inherit;">${smsBody}</pre>`
  };
}

// Main orchestrator function
export async function notify(request: NotificationRequest) {
  console.log('[notify] called with', request);
  
  // Determine email type based on event type
  const emailType = request.context.emailType || getEmailType(request.eventType);
  
  // Determine channels and logic based on eventType and context
  try {
    if (request.eventType === 'random_project_recommendation') {
      // Fetch a random project directly here
      const supabase = (await import('@/utils/supabase/admin')).createAdminClient();
      // Supabase/Postgres does not support .order('RANDOM()'), so fetch all and pick one in JS
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
      
      // Insert into scheduled_notifications
      const { data: scheduledData, error: scheduledError } = await supabase
        .from('scheduled_notifications')
        .insert([
          {
            user_id: request.userId,
            template_id: null, // No template for in-app, or set if you want
            related_entity_id: project.id,
            read: false,
            created_at: new Date().toISOString(),
            send_at: new Date().toISOString(),
            status: 'sent',
            context: { project, mentorName },
          },
        ])
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
    }
    
    if (request.eventType === 'payment_success') {
      // Compose short SMS body for better deliverability
      const { courseDetails, phoneNumber } = request.context;
      let toNumber = phoneNumber;
      if (!toNumber || !/^\+[1-9]\d{1,14}$/.test(toNumber)) {
        console.warn('[Orchestrator] Invalid or missing phone number, using fallback +919300319597');
        toNumber = '+919300319597';
      }
      let smsBody = `You're booking: ${courseDetails?.title || ''}\n`;
      smsBody += `Sessions: ${courseDetails?.sessions_count || ''}, Price: $${courseDetails?.price || ''}\n`;
      smsBody += `Mentor: ${courseDetails?.mentor?.name || ''}\n`;
      smsBody += `For full details, check your email or dashboard.`;
      
      // Use SMS fallback system: fallback is only email, not in-app
      const smsResult = await handleSMSFallback(
        toNumber,
        request.userId,
        smsBody,
        getFallbackSMSEmailContent({
          to: courseDetails?.mentor?.email || 'user@example.com',
          smsBody
        }),
        request.eventType
      );
      
      // Log the result (SMS or Email fallback)
      await logNotification({
        userId: request.userId,
        channel: smsResult.channel,
        eventType: request.eventType,
        status: smsResult.success ? 'success' : 'failure',
        error: smsResult.success ? undefined : smsResult.reason,
      });
      
      if (toNumber) {
        console.log(`[${smsResult.channel.toUpperCase()}] Notification to ${smsResult.channel === 'sms' ? 'phone' : 'email'}: ${toNumber} | message: ${smsBody}`);
      }
      
      // Add in-app notification
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
      
      if (courseDetails?.mentor?.email) {
        console.log(`[EMAIL] Notification to email: ${courseDetails.mentor.email} | message: Payment successful for ${courseDetails?.title || ''}`);
      }
      
      return { smsResult, inAppResult };
    }
    
    if (request.eventType === 'project_created') {
      const { mentorEmail, projectDetails } = request.context;
      const from = 'Tickets at BlueRobins <mailtojainaayush@gmail.com>';
      const to = mentorEmail;
      
      // Query template from DB
      const { getNotificationTemplate } = await import('./template');
      const { templateId } = await getNotificationTemplate({
        eventType: request.eventType,
        channel: 'email',
        audienceRole: 'mentor',
        fallbackTemplateId: 'd-7c0167aeeb5a4a6f99ea672b8f8d4508',
      });
      
      const dynamicTemplateData = {
        ...projectDetails,
        unsubscribeLink: generateUnsubscribeLink(to, request.userId)
      };
      
      // Insert into scheduled_notifications
      const supabase = (await import('@/utils/supabase/admin')).createAdminClient();
      const { data: scheduledData, error: scheduledError } = await supabase
        .from('scheduled_notifications')
        .insert([
          {
            user_id: request.userId,
            template_id: templateId,
            related_entity_id: projectDetails?.id,
            read: false,
            created_at: new Date().toISOString(),
            send_at: new Date().toISOString(),
            status: 'sent',
            context: { ...projectDetails, unsubscribeLink: generateUnsubscribeLink(to, request.userId) },
          },
        ])
        .select();
      
      // Send email with preference checking
      const emailResult = await sendEmail({ 
        to, 
        from, 
        templateId, 
        dynamicTemplateData,
        emailType: emailType, // Project creation is transactional
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
    }
    
    if (request.eventType === 'session_booked') {
      // Expect context: { userId, sessionTime, bookingId, courseDetails, ... }
      const { userId, sessionTime, bookingId, courseDetails, phoneNumber, email } = request.context;
      const supabase = (await import('@/utils/supabase/admin')).createAdminClient();
      const reminderOffsets = [12, 6, 1, 0.5]; // hours before session
      const now = new Date();
      
      // --- DEFENSIVE DATE PARSING FOR sessionTime ---
      // Accepts both '2025-07-25T7:50:00Z' and '2025-07-25T07:50:00Z'
      let sessionDate = new Date(sessionTime);
      if (isNaN(sessionDate.getTime())) {
        // Try to fix single-digit hour (e.g., T7:50:00Z -> T07:50:00Z)
        const fixedSessionTime = sessionTime.replace(/T(\d:)/, 'T0$1');
        sessionDate = new Date(fixedSessionTime);
      }
      if (isNaN(sessionDate.getTime())) {
        throw new Error(`Invalid sessionTime: ${sessionTime}`);
      }
      // --- END DEFENSIVE DATE PARSING ---
      
      for (const offset of reminderOffsets) {
        const sendAt = new Date(sessionDate.getTime() - offset * 60 * 60 * 1000);
        
        // In-app
        await supabase.from('scheduled_notifications').insert([{
          user_id: userId,
          template_id: null,
          related_entity_id: bookingId,
          read: false,
          created_at: now.toISOString(),
          send_at: sendAt.toISOString(),
          status: 'pending',
          context: {
            eventType: 'session_reminder',
            channel: 'in_app',
            bookingId,
            courseDetails,
            message: `Reminder: Your session for ${courseDetails?.title || 'your course'} is coming up in ${offset >= 1 ? offset + ' hour(s)' : '30 minutes'}!`,
          },
        }]);
        
        // SMS
        await supabase.from('scheduled_notifications').insert([{
          user_id: userId,
          template_id: null,
          related_entity_id: bookingId,
          read: false,
          created_at: now.toISOString(),
          send_at: sendAt.toISOString(),
          status: 'pending',
          context: {
            eventType: 'session_reminder',
            channel: 'sms',
            bookingId,
            courseDetails,
            phoneNumber,
            message: `Reminder: Your session for ${courseDetails?.title || 'your course'} is coming up in ${offset >= 1 ? offset + ' hour(s)' : '30 minutes'}!`,
          },
        }]);
        
        // Email
        await supabase.from('scheduled_notifications').insert([{
          user_id: userId,
          template_id: null,
          related_entity_id: bookingId,
          read: false,
          created_at: now.toISOString(),
          send_at: sendAt.toISOString(),
          status: 'pending',
          context: {
            eventType: 'session_reminder',
            channel: 'email',
            bookingId,
            courseDetails,
            email,
            subject: `Session Reminder: ${courseDetails?.title || 'Your Course'}`,
            message: `This is a reminder that your session for ${courseDetails?.title || 'your course'} is coming up in ${offset >= 1 ? offset + ' hour(s)' : '30 minutes'}!`,
            emailType: 'transactional', // Session reminders are transactional
          },
        }]);
      }
      
      return { success: true, scheduled: true };
    }
    
    if (request.eventType === 'session_reminder') {
      const { message, bookingId, emailType: reminderEmailType = 'transactional', channel, phoneNumber, email } = request.context;

      if (channel === 'sms') {
        // Send SMS
        console.log(`[Orchestrator] Sending SMS for session_reminder to ${phoneNumber}`);
        const { sendSMS } = await import('./sms');
        const smsResult = await sendSMS({
          to: phoneNumber,
          body: message,
          eventType: request.eventType,
          userId: request.userId,
        });
        await logNotification({
          userId: request.userId,
          channel: 'sms',
          eventType: request.eventType,
          status: smsResult.success ? 'success' : 'failure',
          error: smsResult.success ? undefined : JSON.stringify(smsResult.error),
        });
        return smsResult;
      } else if (channel === 'email') {
        // Send Email
        console.log(`[Orchestrator] Sending Email for session_reminder to ${email}`);
        const { sendEmail } = await import('./email');
        const emailResult = await sendEmail({
          to: email,
          subject: `Session Reminder`,
          html: `<pre style="font-family:inherit;">${message}</pre>`,
          userId: request.userId,
          emailType: reminderEmailType,
        });
        await logNotification({
          userId: request.userId,
          channel: 'email',
          eventType: request.eventType,
          status: emailResult.success ? 'success' : 'failure',
          error: emailResult.success ? undefined : JSON.stringify(emailResult.error),
        });
        return emailResult;
      } else {
        // Default to in-app
        console.log(`[Orchestrator] Sending In-App for session_reminder to user ${request.userId}`);
        const inAppResult = await logAndSendInAppNotification({
          user_id: request.userId,
          message,
          related_entity_id: bookingId,
          related_entity_type: 'booking',
        });
        await logNotification({
          userId: request.userId,
          channel: 'in_app',
          eventType: request.eventType,
          status: inAppResult.success ? 'success' : 'failure',
          error: inAppResult.success ? undefined : JSON.stringify(inAppResult.error),
        });
        return inAppResult;
      }
    }
    
    if (request.eventType === 'unread_chat_reminder') {
      const { userId, unreadCount, channelId, lastMessageTime, userEmail, userName } = request.context;
      
      console.log(`[Orchestrator] Sending unread chat reminder to user ${userId} with ${unreadCount} unread messages`);
      
      // Send email notification
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
            <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/chats/${channelId}" 
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
    }
    
    if (request.eventType === 'mentor_profile_approved') {
      const { mentorEmail, mentorName, verifiedAt } = request.context;
      console.log(`[Orchestrator] Processing mentor_profile_approved event:`, { mentorEmail, mentorName, verifiedAt });
      
      // Send approval email to mentor
      const emailResult = await sendEmail({
        to: mentorEmail,
        subject: '🎉 Your Mentor Profile Has Been Approved!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2953BE; margin-bottom: 10px;">🎉 Congratulations!</h1>
              <h2 style="color: #333; margin-bottom: 20px;">Your Mentor Profile Has Been Approved</h2>
            </div>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <p style="font-size: 16px; line-height: 1.6; color: #333;">
                Dear <strong>${mentorName}</strong>,
              </p>
              
              <p style="font-size: 16px; line-height: 1.6; color: #333;">
                Great news! Your mentor profile has been reviewed and approved by our team. 
                You are now officially a verified mentor on BlueRobins and can start accepting students.
              </p>
              
              <p style="font-size: 16px; line-height: 1.6; color: #333;">
                <strong>What's Next?</strong>
              </p>
              
              <ul style="font-size: 16px; line-height: 1.6; color: #333;">
                <li>Students can now discover and book sessions with you</li>
                <li>You can create and manage your research projects</li>
                <li>Start receiving booking requests and messages from students</li>
                <li>Access your mentor dashboard to track your sessions</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/home" 
                 style="background-color: #2953BE; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: bold; display: inline-block;">
                Access Your Dashboard
              </a>
            </div>
            
            <div style="background-color: #e8f4fd; padding: 15px; border-radius: 6px; margin-top: 20px;">
              <p style="font-size: 14px; color: #666; margin: 0;">
                <strong>Approved on:</strong> ${new Date(verifiedAt).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="font-size: 14px; color: #666; text-align: center;">
                If you have any questions, feel free to reach out to our support team.
              </p>
            </div>
          </div>
        `,
        userId: request.userId,
        emailType: 'transactional'
      });
      
      await logNotification({
        userId: request.userId,
        channel: 'email',
        eventType: request.eventType,
        status: emailResult.success ? 'success' : 'failure',
        error: emailResult.success ? undefined : JSON.stringify(emailResult.error),
      });
      
      console.log(`[Orchestrator] Mentor approval email sent to ${mentorEmail}:`, emailResult);
      
      return emailResult;
    }
    
    if (request.eventType === 'chat_message') {
      const { message, from_user, channel_id, message_id } = request.context;
      console.log(`[Orchestrator] Processing chat_message event:`, { message_id, channel_id, from_user, to_user: request.userId });
      
      const supabase = (await import('@/utils/supabase/admin')).createAdminClient();
      
      // Fetch recipient and sender profiles
                const [recipientResult, senderResult] = await Promise.all([
            supabase.from('profiles').select('email, name').eq('id', request.userId).single(),
            supabase.from('profiles').select('name').eq('id', from_user).single()
          ]);
      
      console.log(`[Orchestrator] Profile fetch results:`, { 
        recipientError: recipientResult.error?.message, 
        senderError: senderResult.error?.message,
        hasRecipient: !!recipientResult.data,
        hasSender: !!senderResult.data
      });
      
      if (recipientResult.error || !recipientResult.data) {
        console.error(`[Orchestrator] No recipient profile found for user ${request.userId}. Notification skipped.`);
        return { success: false, error: 'No recipient profile found' };
      }
      
                 const recipientProfile = recipientResult.data;
           const senderName = senderResult.data?.name || 'Someone';
      
      // Schedule unread reminder for 30 minutes later
      const sendAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes later
      
      console.log(`[Orchestrator] Scheduling reminder for ${sendAt.toISOString()}`);
      
      // Check if there's already a pending reminder for this user and channel
      const { data: existingReminder, error: existingError } = await supabase
        .from('scheduled_notifications')
        .select('id')
        .eq('user_id', request.userId)
        .eq('related_entity_id', channel_id)
        .eq('status', 'pending')
        .eq('context->>eventType', 'unread_chat_reminder')
        .single();

      console.log(`[Orchestrator] Existing reminder check:`, { 
        existingReminder: !!existingReminder, 
        error: existingError?.message 
      });

      if (!existingReminder) {
        // Schedule the unread reminder
        const { data: insertData, error: insertError } = await supabase.from('scheduled_notifications').insert({
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
                             userName: recipientProfile.name || 'User'
          },
        }).select();
        
        if (insertError) {
          console.error(`[Orchestrator] Failed to schedule reminder:`, insertError);
          return { success: false, error: insertError.message };
        }
        
        console.log(`[Orchestrator] Successfully scheduled unread reminder:`, { 
          id: insertData?.[0]?.id,
          user: request.userId, 
          channel: channel_id, 
          sendAt: sendAt.toISOString() 
        });
      } else {
        console.log(`[Orchestrator] Skipped scheduling - existing reminder found for user ${request.userId} in channel ${channel_id}`);
      }

      return { success: true, scheduled: true };
    }
    
    // Add more channel logic here
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