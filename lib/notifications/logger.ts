import { NotificationLog } from './types';

export async function logNotification(log: NotificationLog) {
  // TODO: Replace with DB insert
  console.log('[NotificationLog]', log);
} 