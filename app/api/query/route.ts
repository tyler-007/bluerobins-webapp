import { NextRequest, NextResponse } from 'next/server';
import { QueryRequest, RankAllRequest, QueryResponse, RankAllResponse } from '@/lib/search/types';

// export async function GET(request: NextRequest) {
//   try {
//     const { searchParams } = new URL(request.url);
//     const query = searchParams.get('query');
//     const top_k = parseInt(searchParams.get('top_k') || '5');
//     const search_type = (searchParams.get('search_type') || 'hybrid') as 'hybrid' | 'vector';
//     const alpha = parseFloat(searchParams.get('alpha') || '0.5');

//     if (!query) {
//       return NextResponse.json(
//         { status: 'error', message: 'Query parameter is required' },
//         { status: 400 }
//       );
//     }

//     // Validate search_type
//     if (!['hybrid', 'vector'].includes(search_type)) {
//       return NextResponse.json(
//         { status: 'error', message: 'search_type must be "hybrid" or "vector"' },
//         { status: 400 }
//       );
//     }

//     // Validate alpha range
//     if (alpha < 0.0 || alpha > 1.0) {
//       return NextResponse.json(
//         { status: 'error', message: 'alpha must be between 0.0 and 1.0' },
//         { status: 400 }
//       );
//     }

//     // Import and use SearchService
//     const { searchService } = await import('@/lib/search/search-service');
//     const results = await searchService.search(query, top_k, search_type, alpha);

//     return NextResponse.json(results);
//   } catch (error) {
//     console.error('Query GET error:', error);
//     return NextResponse.json(
//       { status: 'error', message: 'Failed to process query' },
//       { status: 500 }
//     );
//   }
// }

export async function POST(request: NextRequest) {
  try {
    const body: QueryRequest | RankAllRequest = await request.json();
    const { query, search_type = 'hybrid', alpha = 0.5 } = body;

    if (!query) {
      return NextResponse.json(
        { status: 'error', message: 'Query is required' },
        { status: 400 }
      );
    }

    // Validate search_type
    if (!['hybrid', 'vector'].includes(search_type)) {
      return NextResponse.json(
        { status: 'error', message: 'search_type must be "hybrid" or "vector"' },
        { status: 400 }
      );
    }

    // Validate alpha range
    if (alpha < 0.0 || alpha > 1.0) {
      return NextResponse.json(
        { status: 'error', message: 'alpha must be between 0.0 and 1.0' },
        { status: 400 }
      );
    }

    // Check if this is a rank-all request (no top_k specified)
    if ('top_k' in body) {
      // Regular query
      const top_k = body.top_k || 5;
      
      // Import and use SearchService
      const { searchService } = await import('@/lib/search/search-service');
      const results = await searchService.search(query, top_k, search_type, alpha);

      return NextResponse.json(results);
    } else {
      // Rank all request
      // Import and use SearchService
      const { searchService } = await import('@/lib/search/search-service');
      const results = await searchService.searchRanked(query, search_type, alpha);

      return NextResponse.json(results);
    }
  } catch (error) {
    console.error('Query POST error:', error);
    return NextResponse.json(
      { status: 'error', message: 'Failed to process query' },
      { status: 500 }
    );
  }
}
