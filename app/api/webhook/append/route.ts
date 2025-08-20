import { NextRequest, NextResponse } from 'next/server';
import { WebhookRequest } from '@/lib/search/types';
import { webhookService } from '@/lib/search/webhook-service';

export async function POST(request: NextRequest) {
  try {
    const body: WebhookRequest = await request.json();
    const { type, table, record, old_record } = body;

    console.log(`📥 Received webhook: ${type} on table ${table}`);
    console.log(`📋 Record:`, record);

    // Validate webhook payload
    if (!type || !table || !record) {
      return NextResponse.json(
        { status: 'error', message: 'Invalid webhook payload' },
        { status: 400 }
      );
    }

    // Process webhook using the service
    const result = await webhookService.processWebhook(body);

    console.log(`✅ Webhook processing result:`, result);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    return NextResponse.json(
      { status: 'error', message: 'Failed to process webhook' },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({ 
    status: 'ok', 
    service: 'webhook-append',
    timestamp: new Date().toISOString()
  });
}
