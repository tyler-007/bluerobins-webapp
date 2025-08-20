import { createAdminClient } from '../../utils/supabase/admin';
import { embeddingService } from './embedding-service';
import { weaviateService } from './weaviate-service';
import { QueryRequest, RankAllRequest, QueryResponse, RankAllResponse, SearchResult } from './types';

export class SearchService {

  async search(
    query: string, 
    top_k: number = 5, 
    search_type: string = "hybrid", 
    alpha: number = 0.5
  ): Promise<QueryResponse> {
    try {
      console.log(`🔍 Processing search: '${query}' (type: ${search_type}, top_k: ${top_k}, alpha: ${alpha})`);

      // Generate embedding for the query using central service
      const vector = await embeddingService.generateEmbedding(query);
      console.log(`🔢 Generated ${vector.length}-dimensional query embedding`);

      // Perform search based on type
      let results: any[] = [];
      let searchMethod = "";

      if (search_type === "hybrid") {
        results = await weaviateService.searchHybrid(query, vector, top_k, alpha);
        searchMethod = "hybrid";
      } else if (search_type === "vector") {
        results = await weaviateService.searchVector(vector, top_k);
        searchMethod = "vector";
      } else {
        throw new Error(`Invalid search type: ${search_type}`);
      }

      // Format results for TypeScript client
      const formattedResults = this.formatResults(results, searchMethod);

      console.log(`✅ Search completed: ${results.length} results found`);

      return {
        status: "success",
        query,
        search_type: searchMethod,
        top_k,
        results_count: results.length,
        results: formattedResults,
        vector_dimension: vector.length,
        alpha: search_type === "hybrid" ? alpha : undefined
      };
    } catch (error) {
      console.error(`❌ Search error:`, error);
      return {
        status: "error",
        message: String(error),
        query,
        search_type,
        results_count: 0,
        results: [],
        vector_dimension: 0
      };
    }
  }

  async searchRanked(
    query: string, 
    search_type: string = "hybrid", 
    alpha: number = 0.5
  ): Promise<RankAllResponse> {
    try {
      console.log(`🏆 Processing ranked search: '${query}' (type: ${search_type}, alpha: ${alpha})`);

      // Generate embedding for the query
      const vector = await embeddingService.generateEmbedding(query);
      console.log(`🔢 Generated ${vector.length}-dimensional query embedding`);

      // Perform ranked search based on type (no top_k limit)
      let results: any[] = [];
      let searchMethod = "";

      if (search_type === "hybrid") {
        results = await weaviateService.searchHybridRanked(query, vector, alpha);
        searchMethod = "hybrid";
      } else if (search_type === "vector") {
        results = await weaviateService.searchVectorRanked(vector);
        searchMethod = "vector";
      } else {
        throw new Error(`Invalid search type: ${search_type}`);
      }

      // Format results for TypeScript client
      const formattedResults = this.formatResults(results, searchMethod);
      // changes needed here

      const filteredRecommendations = formattedResults.map(r => ({
        rank: r.rank,
        project_id: r.project_id,
        title: r.title,
        mentor_institution:r.mentor_institution
        // distance: r.scores?.distance || 0
      }));

      console.log(`✅ Ranked search completed: ${results.length} total projects ranked`);

      return {
        status: "success",
        query,
        search_type: searchMethod,
        total_projects: filteredRecommendations.length,
        results: filteredRecommendations,
        vector_dimension: vector.length,
        alpha: search_type === "hybrid" ? alpha : undefined
      };
    } catch (error) {
      console.error(`❌ Ranked search error:`, error);
      return {
        status: "error",
        message: String(error),
        query,
        search_type,
        total_projects: 0,
        results: [],
        vector_dimension: 0
      };
    }
  }

  private formatResults(results: any[], searchMethod: string): SearchResult[] {
    const formattedResults: SearchResult[] = [];

    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const formattedResult: SearchResult = {
        rank: i + 1,
        project_id: result.project_id || result.id,
        mentor_user_id: result.mentor_user_id || result.mentor_user || "",
        title: result.title || "",
        description: result.description || "",
        categories: result.categories || [],
        mentor_name: result.mentor_name,
        mentor_institution: result.mentor_institution,
        agenda: result.agenda,
        prerequisites: result.prerequisites,
        tools: result.tools,
        created_at: result.created_at,
        updated_at: result.updated_at,
        scores: {}
      };

      // Add scores based on search method
      if (searchMethod === "hybrid") {
        if (result.hybrid_score !== undefined) {
          formattedResult.scores.hybrid = result.hybrid_score;
        }
        if (result.vector_distance !== undefined) {
          formattedResult.scores.vector_distance = result.vector_distance;
        }
      } else { // vector search
        if (result.vector_distance !== undefined) {
          formattedResult.scores.distance = result.vector_distance;
        }
      }

      formattedResults.push(formattedResult);
    }

    return formattedResults;
  }
}

// Singleton instance
export const searchService = new SearchService();
