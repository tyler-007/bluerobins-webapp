import { NotificationRequest, NotificationChannel, NotificationEventType, NotificationContext } from './types';
import { sendSMS } from './sms';
import { sendEmail } from './email';
import { sendInAppNotification } from './in-app';
import { logNotification } from './logger';

// Main orchestrator function
export async function notify(request: NotificationRequest) {
  // Determine channels and logic based on eventType and context
  try {
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
      const smsResult = await sendSMS({
        to: toNumber,
        body: smsBody,
        eventType: request.eventType,
        meta: request.context,
      });
      await logNotification({
        userId: request.userId,
        channel: 'sms',
        eventType: request.eventType,
        status: smsResult.success ? 'success' : 'failure',
        error: smsResult.error ? JSON.stringify(smsResult.error) : undefined,
      });
      return smsResult;
    }
    if (request.eventType === 'project_created') {
      const { mentorEmail, projectDetails } = request.context;
      const from = 'Tickets at BlueRobins <mailtojainaayush@gmail.com>';
      const to = mentorEmail;
      // Use SendGrid template
      const templateId = 'd-7c0167aeeb5a4a6f99ea672b8f8d4508';
      const dynamicTemplateData = projectDetails;
      const emailResult = await sendEmail({ to, from, templateId, dynamicTemplateData });
      await logNotification({
        userId: request.userId,
        channel: 'email',
        eventType: request.eventType,
        status: emailResult.success ? 'success' : 'failure',
        error: emailResult.success ? undefined : JSON.stringify(emailResult.error),
      });
      return emailResult;
    }
    if (request.eventType === 'session_reminder') {
      const { message, bookingId } = request.context;
      const inAppResult = await sendInAppNotification({
        user_id: request.userId,
        message,
        related_entity_id: bookingId,
        related_entity_type: 'booking',
      });
      await logNotification({
        userId: request.userId,
        channel: 'inapp',
        eventType: request.eventType,
        status: inAppResult.success ? 'success' : 'failure',
        error: inAppResult.success ? undefined : JSON.stringify(inAppResult.error),
      });
      return inAppResult;
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