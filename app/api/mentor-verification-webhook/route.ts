import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Webhook received:', body);
    
    // Check if this is a mentor verification update
    if (body.type === 'UPDATE' && body.table === 'mentor_profiles') {
      const { record, old_record } = body;
      
      // Check if verified changed from false to true
      if (old_record?.verified === false && record?.verified === true) {
        console.log('✅ Mentor verification detected:', record.id);
        
        // Get mentor email from profiles table
        const supabase = createAdminClient();
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('email, name')
          .eq('id', record.id)
          .single();
        
        if (profileError || !profile) {
          console.error('❌ Error fetching mentor profile:', profileError);
          return NextResponse.json({
            success: false,
            error: 'Failed to fetch mentor profile'
          }, { status: 500 });
        }
        
        // Send to your notification trigger API
        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/notifications/trigger`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            eventType: 'mentor_profile_approved',
            userId: record.id,
            context: {
              mentorEmail: profile.email,
              mentorName: profile.name,
              verifiedAt: record.updated_at
            }
          })
        });
        
        const result = await response.json();
        console.log('✅ API response:', result);
        
        return NextResponse.json({
          success: true,
          mentor_id: record.id,
          api_response: result
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'No action taken'
    });
    
  } catch (error) {
    console.error('❌ Webhook API error:', error);
    return NextResponse.json({
      success: false,
      error: (error as Error).message
    }, { status: 500 });
  }
} 