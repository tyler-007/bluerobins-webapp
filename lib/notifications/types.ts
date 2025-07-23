// Notification channel types
export type NotificationChannel = 'email' | 'sms' | 'inapp';

// Notification event types (expand as needed)
export type NotificationEventType =
  | 'payment_success'
  | 'payment_failure'
  | 'session_scheduled'
  | 'session_reminder'
  | 'chat_message'
  | 'project_created';

// Notification payload context (expand as needed)
export interface NotificationContext {
  [key: string]: any;
}

// Notification request
export interface NotificationRequest {
  eventType: NotificationEventType;
  userId: string;
  context: NotificationContext;
}

// Notification log entry
export interface NotificationLog {
  id?: string;
  userId: string;
  channel: NotificationChannel;
  eventType: NotificationEventType;
  status: 'success' | 'failure';
  error?: string;
  createdAt?: string;
} 