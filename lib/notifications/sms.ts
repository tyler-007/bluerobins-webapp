// lib/notifications/sms.ts
// Make sure to install twilio and @types/twilio for TypeScript support:
// npm install twilio
// npm install --save-dev @types/twilio
import twilio from "twilio";
import { shouldSendSMS } from './preferences';

const accountSid = process.env.TWILIO_ACCOUNT_SID!;
const authToken = process.env.TWILIO_AUTH_TOKEN!;
const fromNumber = process.env.TWILIO_PHONE_NUMBER!;

const client = twilio(accountSid, authToken);

export type SMSParams = {
  to: string;
  body: string;
  eventType?: string;
  meta?: Record<string, any>;
  userId?: string; // For preference checking
};

export type SMSResult = {
  success: boolean;
  sid?: string;
  error?: any;
  skipped?: boolean;
  reason?: string;
};

function isValidE164(phone: string): boolean {
  // E.164 format: +[country][number], e.g., +15714895628
  return /^\+[1-9]\d{1,14}$/.test(phone);
}

/**
 * Send SMS with preference checking
 */
export async function sendSMS({
  to,
  body,
  eventType,
  meta,
  userId,
}: SMSParams): Promise<SMSResult> {
  try {
    // Check user preferences for SMS sending
    if (userId) {
      const shouldSend = await shouldSendSMS(userId);
      
      if (!shouldSend) {
        console.log(`[SMS] SMS skipped for user ${userId} - SMS not allowed`);
        return { 
          success: true, 
          skipped: true, 
          reason: 'sms_not_allowed',
          sid: undefined 
        };
      }
    }

    if (!isValidE164(to)) {
      const error = `Invalid phone number format: ${to}`;
      console.error(error);
      return { success: false, error };
    }

    console.log("[sendSMS] Sending SMS via Twilio", { to, body, userId });
    const message = await client.messages.create({
      body,
      from: fromNumber,
      to,
    });
    
    console.log("[sendSMS] Twilio response:", message);
    return { success: true, sid: message.sid };
    
  } catch (error) {
    console.error("[sendSMS] Twilio SMS error:", error, { to, eventType, meta, userId });
    return { success: false, error };
  }
} 