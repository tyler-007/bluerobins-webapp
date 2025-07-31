// Notification channel types
export type NotificationChannel = 'email' | 'sms' | 'in_app' | 'system';

// Email type for notification preferences
export type EmailType = 'transactional' | 'promotional';

// Email parameters interface
export interface EmailParams {
  to: string;
  from?: string;
  subject?: string;
  html?: string;
  text?: string;
  templateId?: string;
  dynamicTemplateData?: any;
  userId?: string;
  emailType?: EmailType;
}

// User notification preferences
export interface UserPreferences {
  id?: string;
  user_id: string;
  email_opt_in?: boolean;
  sms_opt_in?: boolean;
  in_app_opt_in?: boolean;
  created_at?: string;
  updated_at?: string;
}

// Notification event types (expand as needed)
export type NotificationEventType =
  | 'session_scheduled'
  | 'session_reminder'
  | 'chat_message'
  | 'payment_success'
  | 'payment_failure'
  | 'random_project_recommendation'
  | 'project_created'
  | 'session_booked'
  | 'fallback_triggered'
  | 'unread_chat_reminder'
  | 'mentor_profile_approved';

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
  notification_id?: string;
  delivery_info?: any;
} 