// import { NextRequest, NextResponse } from 'next/server';
// import { processUnreadChatNotifications } from '@/lib/notifications/scheduler';

// export async function POST(request: NextRequest) {
//   try {
//     console.log('[Test Unread API] Starting unread chat notification test...');
    
//     // Process unread chat notifications
//     await processUnreadChatNotifications();
    
//     console.log('[Test Unread API] Unread chat notification test completed');
    
//     return NextResponse.json({ 
//       status: 'success', 
//       message: 'Unread chat notifications processed successfully' 
//     });
//   } catch (error) {
//     console.error('[Test Unread API] Error processing unread notifications:', error);
//     return NextResponse.json(
//       { 
//         status: 'error', 
//         message: 'Failed to process unread notifications',
//         error: error instanceof Error ? error.message : 'Unknown error'
//       },
//       { status: 500 }
//     );
//   }
// } 