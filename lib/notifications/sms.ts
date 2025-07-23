// lib/notifications/sms.ts
// Make sure to install twilio and @types/twilio for TypeScript support:
// npm install twilio
// npm install --save-dev @types/twilio
import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID!;
const authToken = process.env.TWILIO_AUTH_TOKEN!;
const fromNumber = process.env.TWILIO_PHONE_NUMBER!;

const client = twilio(accountSid, authToken);

export type SMSParams = {
  to: string;
  body: string;
  eventType?: string;
  meta?: Record<string, any>;
};

export type SMSResult = {
  success: boolean;
  sid?: string;
  error?: any;
};

function isValidE164(phone: string): boolean {
  // E.164 format: +[country][number], e.g., +15714895628
  return /^\+[1-9]\d{1,14}$/.test(phone);
}

export async function sendSMS({
  to,
  body,
  eventType,
  meta,
}: SMSParams): Promise<SMSResult> {
  if (!isValidE164(to)) {
    const error = `Invalid phone number format: ${to}`;
    console.error(error);
    return { success: false, error };
  }
  try {
    console.log("[sendSMS] Sending SMS via Twilio", { to, body });
    const message = await client.messages.create({
      body,
      from: fromNumber,
      to,
    });
    console.log("[sendSMS] Twilio response:", message);
    // Placeholder: Log to DB (eventType, meta, message.sid, etc.)
    // await logNotification({ channel: 'sms', to, body, eventType, meta, sid: message.sid, status: 'sent' });
    return { success: true, sid: message.sid };
  } catch (error) {
    // Placeholder: Log error to DB (eventType, meta, error)
    // await logNotification({ channel: 'sms', to, body, eventType, meta, error, status: 'failed' });
    console.error("[sendSMS] Twilio SMS error:", error, { to, eventType, meta });
    return { success: false, error };
  }
} 