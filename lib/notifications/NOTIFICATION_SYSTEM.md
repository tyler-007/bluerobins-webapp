# Notification System Documentation

## Overview

This notification system provides a comprehensive solution for sending notifications across multiple channels (email, SMS, in-app) with user preference management and email type segregation (promotional vs transactional).

## Key Features

### 1. **Email Type Segregation**
- **Transactional Emails**: Always sent (payment receipts, session reminders, account updates)
- **Promotional Emails**: Only sent if user has opted in (marketing, recommendations, newsletters)

### 2. **User Preference Management**
- Users can opt in/out of different notification channels
- Fail-safe defaults (sends everything if no preferences found)
- Per-channel and per-event type preferences

### 3. **Multi-Channel Support**
- **Email**: SendGrid integration with template support
- **SMS**: Twilio integration
- **In-App**: Database-stored notifications with real-time delivery

### 4. **Scheduling & Queuing**
- Database-driven scheduling for delayed notifications
- Support for BullMQ integration (future enhancement)

## Database Schema

### Core Tables

1. **`notification_preferences`** - User opt-in/opt-out settings
2. **`notification_templates`** - Email/SMS templates
3. **`notification_logs`** - Delivery tracking and analytics
4. **`scheduled_notifications`** - Queue for delayed notifications
5. **`in_app_notifications`** - In-app notification storage

## Module Structure

```
lib/notifications/
├── types.ts              # TypeScript type definitions
├── orchestrator.ts       # Main notification logic
├── preferences.ts        # User preference checking
├── email.ts             # Email sending with preference checking
├── sms.ts               # SMS sending with preference checking
├── in-app.ts            # In-app notification handling
├── logger.ts            # Notification logging
├── template.ts          # Template management
└── scheduler.ts         # Scheduled notification processing
```

## Usage Examples

### 1. Send a Transactional Email (Always Sent)

```typescript
import { sendTransactionalEmail } from '@/lib/notifications/email';

await sendTransactionalEmail({
  to: 'user@example.com',
  subject: 'Payment Receipt',
  html: '<p>Your payment was successful</p>',
  userId: 'user-uuid'
});
```

### 2. Send a Promotional Email (Only if Opted In)

```typescript
import { sendPromotionalEmail } from '@/lib/notifications/email';

await sendPromotionalEmail({
  to: 'user@example.com',
  subject: 'New Course Recommendation',
  html: '<p>Check out this new course!</p>',
  userId: 'user-uuid'
});
```

### 3. Send SMS with Preference Checking

```typescript
import { sendSMS } from '@/lib/notifications/sms';

await sendSMS({
  to: '+1234567890',
  body: 'Your session reminder',
  userId: 'user-uuid',
  eventType: 'session_reminder'
});
```

### 4. Use the Orchestrator

```typescript
import { notify } from '@/lib/notifications/orchestrator';

await notify({
  eventType: 'payment_success',
  userId: 'user-uuid',
  context: {
    courseDetails: { title: 'Math Course', price: 99 },
    phoneNumber: '+1234567890'
  }
});
```

## API Endpoints

### 1. Trigger Notifications
```
POST /api/notifications/trigger
{
  "eventType": "payment_success",
  "userId": "user-uuid",
  "context": { ... }
}
```

### 2. Test Preferences
```
POST /api/notifications/test-preferences
{
  "action": "set-preferences",
  "userId": "user-uuid",
  "email_opt_in": true,
  "sms_opt_in": false,
  "push_opt_in": true
}
```

### 3. Run Scheduler
```
POST /api/notifications/run-scheduler
```

## Email Type Classification

### Transactional Emails (Always Sent)
- `payment_success`
- `payment_failure`
- `session_scheduled`
- `session_reminder`
- `session_booked`
- `chat_message`

### Promotional Emails (Opt-in Required)
- `random_project_recommendation`
- `course_recommendation`
- `marketing_campaign`
- `welcome_email`

## Preference Logic

### Email Preferences
```typescript
// Transactional emails: ALWAYS sent
if (emailType === 'transactional') return true;

// Promotional emails: Only if user opted in
if (emailType === 'promotional') {
  return preferences.email_opt_in === true;
}
```

### SMS Preferences
```typescript
// SMS: Only if user opted in
return preferences.sms_opt_in === true;
```

### In-App Preferences
```typescript
// In-app: Always sent (essential for app functionality)
return true;
```

## Testing

### 1. Set User Preferences
```bash
curl -X POST http://localhost:3000/api/notifications/test-preferences \
  -H "Content-Type: application/json" \
  -d '{
    "action": "set-preferences",
    "userId": "your-user-uuid",
    "email_opt_in": false,
    "sms_opt_in": true,
    "push_opt_in": true
  }'
```

### 2. Test Promotional Email (Should be Skipped)
```bash
curl -X POST http://localhost:3000/api/notifications/test-preferences \
  -H "Content-Type: application/json" \
  -d '{
    "action": "test-notification",
    "userId": "your-user-uuid",
    "emailType": "promotional",
    "eventType": "random_project_recommendation"
  }'
```

### 3. Test Transactional Email (Should be Sent)
```bash
curl -X POST http://localhost:3000/api/notifications/test-preferences \
  -H "Content-Type: application/json" \
  -d '{
    "action": "test-notification",
    "userId": "your-user-uuid",
    "emailType": "transactional",
    "eventType": "payment_success"
  }'
```

## Environment Variables

```env
# SendGrid
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com

# Twilio
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Database
DATABASE_URL=your_supabase_database_url
```

## Deployment

### 1. Database Setup
Run the SQL schema in `notification_schema.sql` in your Supabase database.

### 2. Environment Variables
Set all required environment variables in your deployment platform.

### 3. Scheduler Setup
For production, set up a cron job to hit `/api/notifications/run-scheduler` every 30 minutes.

## Future Enhancements

1. **BullMQ Integration**: Replace polling scheduler with BullMQ for exact-time job execution
2. **Template Engine**: Add Handlebars/Mustache template rendering
3. **Analytics Dashboard**: Track delivery rates, open rates, click rates
4. **A/B Testing**: Test different notification content and timing
5. **Rate Limiting**: Prevent notification spam
6. **Webhook Support**: Allow external systems to trigger notifications

## Troubleshooting

### Common Issues

1. **Emails not sending**: Check SendGrid API key and from email
2. **SMS not sending**: Check Twilio credentials and phone number format
3. **Preferences not working**: Ensure user exists in `notification_preferences` table
4. **Scheduler not running**: Check cron job configuration and API endpoint

### Debug Logs

The system provides comprehensive logging:
- `[Preferences]` - User preference checking
- `[Email]` - Email sending operations
- `[SMS]` - SMS sending operations
- `[IN-APP]` - In-app notification operations
- `[Orchestrator]` - Main notification logic

## Security Considerations

1. **Row Level Security**: All tables have RLS policies
2. **Input Validation**: All inputs are validated
3. **Error Handling**: Sensitive information is not logged
4. **Rate Limiting**: Consider implementing rate limiting for API endpoints 