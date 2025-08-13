import { NextRequest, NextResponse } from 'next/server';
import { RecommendationRequest, RecommendationResponse } from '@/lib/search/types';
import { recommendationService } from '@/lib/search/recom-service';

export async function POST(request: NextRequest) {
  try {
    const body: RecommendationRequest = await request.json();
    const { student_id, top_k = 10 } = body;

    if (!student_id) {
      return NextResponse.json(
        { status: 'error', message: 'student_id is required' },
        { status: 400 }
      );
    }

    // Use RecommendationService
    const results = await recommendationService.getGoalsRecommendations(student_id, top_k);

    return NextResponse.json(results);
  } catch (error) {
    console.error('Goals recommendation error:', error);
    return NextResponse.json(
      { status: 'error', message: 'Failed to get goals recommendations' },
      { status: 500 }
    );
  }
}
