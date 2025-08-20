import { NextRequest, NextResponse } from 'next/server';
import { RecommendationRequest, RecommendationResponse } from '@/lib/search/types';

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

    // Import and use RecommendationService
    const { recommendationService } = await import('@/lib/search/recom-service');
    const results = await recommendationService.getInterestsRecommendations(student_id, top_k);

    return NextResponse.json(results);
  } catch (error) {
    console.error('Interests recommendation error:', error);
    return NextResponse.json(
      { status: 'error', message: 'Failed to get interests recommendations' },
      { status: 500 }
    );
  }
}
