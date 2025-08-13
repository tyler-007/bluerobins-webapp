import sgMail from '@sendgrid/mail';
import { EmailParams, EmailType } from './types';
import { getUserPreferences } from './preferences';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export async function sendEmail(params: EmailParams) {
  // Only check preferences for promotional emails
  if (params.userId && (params.emailType === 'promotional')) {
    const preferences = await getUserPreferences(params.userId);
    console.log('[Email] User preferences:', preferences);
    if (preferences && preferences.email_opt_in === false) {
      console.log(`[Email] User ${params.userId} has unsubscribed from promotional emails. Skipping email.`);
      return { success: true, skipped: true, reason: 'unsubscribed' };
    }
  }

  try {
    const msg: any = {
      to: params.to,
      from: params.from || process.env.SENDGRID_FROM_EMAIL!,
    };
    if (params.templateId) {
      msg.templateId = params.templateId;
      msg.dynamicTemplateData = params.dynamicTemplateData;
    } else {
      msg.subject = params.subject;
      msg.html = params.html;
      if (params.text) msg.text = params.text;
    }
    const result = await sgMail.send(msg);
    return { success: true, result };
  } catch (error) {
    console.error('[sendEmail] SendGrid error:', error);
    return { success: false, error };
  }
}