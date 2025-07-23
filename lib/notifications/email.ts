import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export type EmailParams = {
  to: string;
  subject?: string;
  html?: string;
  text?: string;
  from?: string;
  templateId?: string;
  dynamicTemplateData?: Record<string, any>;
};

export async function sendEmail({ to, subject, html, text, from, templateId, dynamicTemplateData }: EmailParams) {
  try {
    const msg: any = {
      to,
      from: from || process.env.SENDGRID_FROM_EMAIL!,
    };
    if (templateId) {
      msg.templateId = templateId;
      msg.dynamicTemplateData = dynamicTemplateData;
    } else {
      msg.subject = subject;
      msg.html = html;
      if (text) msg.text = text;
    }
    const result = await sgMail.send(msg);
    return { success: true, result };
  } catch (error) {
    console.error('[sendEmail] SendGrid error:', error);
    return { success: false, error };
  }
}