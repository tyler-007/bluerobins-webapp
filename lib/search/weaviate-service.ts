import { createAdminClient } from '../../utils/supabase/admin';
import { ProjectData, SearchResult } from './types';

function cleanJsonbField(fieldData: any, fieldName: string): string {
  try {
    if (!fieldData) {
      return "";
    }
    if (typeof fieldData === "string") {
      return fieldData;
    }
    if (Array.isArray(fieldData)) {
      const cleanedItems: string[] = [];
      for (const item of fieldData) {
        if (typeof item === "object" && item !== null) {
          if ("title" in item) {
            cleanedItems.push(item.title);
          } else if ("description" in item) {
            cleanedItems.push(item.description);
          } else if ("content" in item) {
            cleanedItems.push(item.content);
          } else {
            cleanedItems.push(String(item));
          }
        } else {
          cleanedItems.push(String(item));
        }
      }
      return cleanedItems.join(", ");
    } else if (typeof fieldData === "object" && fieldData !== null) {
      if ("title" in fieldData) {
        return fieldData.title;
      } else if ("description" in fieldData) {
        return fieldData.description;
      } else if ("content" in fieldData) {
        return fieldData.content;
      } else {
        return JSON.stringify(fieldData);
      }
    } else {
      return String(fieldData);
    }
  } catch (error) {
    console.warn(`⚠️ Error cleaning ${fieldName}:`, error);
    return fieldData ? String(fieldData) : "";
  }
}

export class WeaviateService {
  private client: any;
  private collectionName: string;
  private supabase: any;

  constructor() {
    this.collectionName = "Project";
    this.supabase = createAdminClient();
    this.connect();
  }

  private connect() {
    try {
      const weaviateUrl = process.env.WEAVIATE_URL;

      if (!weaviateUrl) {
        throw new Error("WEAVIATE_URL not found in environment");
      }

      console.log(`🔗 Connecting to Weaviate at ${weaviateUrl}`);

      // We'll use the Weaviate client for operations
      this.client = null;

      console.log("✅ Weaviate connection established");
    } catch (error) {
      console.error("❌ Failed to connect to Weaviate:", error);
      throw error;
    }
  }

  async projectExists(projectId: string): Promise<boolean> {
    try {
      const weaviateUrl = process.env.WEAVIATE_URL;
      const weaviateApiKey = process.env.WEAVIATE_API_KEY;

      if (!weaviateUrl || !weaviateApiKey) {
        console.warn("⚠️ WEAVIATE_URL or WEAVIATE_API_KEY not configured for project existence check");
        return false;
      }

      // Use Weaviate client with API key
      const weaviate = await import('weaviate-ts-client');
      const client = weaviate.default.client({
        scheme: 'https',
        host: new URL(weaviateUrl).host,
        apiKey: new (weaviate as any).default.ApiKey(weaviateApiKey) as any,
      } as any);

      const result = await client.graphql
        .get()
        .withClassName('Project')
        .withWhere({
          path: ['project_id'],
          operator: 'Equal',
          valueString: String(projectId)
        })
        .withLimit(1)
        .withFields('project_id _additional { id }')
        .do();

      const response = result as any;
      const projects = response.data?.Get?.Project || [];
      return projects.length > 0;
    } catch (error) {
      console.error("❌ Error checking project existence:", error);
      return false;
    }
  }

  private async getWeaviateObjectIdByProjectId(projectId: string): Promise<string | null> {
    try {
      const weaviateUrl = process.env.WEAVIATE_URL;
      const weaviateApiKey = process.env.WEAVIATE_API_KEY;

      if (!weaviateUrl || !weaviateApiKey) return null;

      const weaviate = await import('weaviate-ts-client');
      const client = weaviate.default.client({
        scheme: 'https',
        host: new URL(weaviateUrl).host,
        apiKey: new (weaviate as any).default.ApiKey(weaviateApiKey) as any,
      } as any);

      const result = await client.graphql
        .get()
        .withClassName('Project')
        .withWhere({
          path: ['project_id'],
          operator: 'Equal',
          valueString: String(projectId)
        })
        .withLimit(1)
        .withFields('_additional { id } project_id')
        .do();

      const response = result as any;
      const projects = response.data?.Get?.Project || [];
      if (projects.length === 0) return null;
      return projects[0]?._additional?.id || null;
    } catch {
      return null;
    }
  }

  async insertProject(projectData: ProjectData, vector: number[]): Promise<boolean> {
    try {
      // Clean relevant fields before insert
      const cleanedData = { ...projectData };
      for (const field of ["agenda", "prerequisites", "tools"]) {
        if (field in cleanedData) {
          cleanedData[field as keyof ProjectData] = cleanJsonbField(cleanedData[field as keyof ProjectData], field);
        }
      }
      // Create or connect Weaviate client
      const weaviateUrl = process.env.WEAVIATE_URL;
      const weaviateApiKey = process.env.WEAVIATE_API_KEY;

      if (!weaviateUrl || !weaviateApiKey) {
        throw new Error("WEAVIATE_URL or WEAVIATE_API_KEY not configured");
      }

      const weaviate = await import('weaviate-ts-client');

      const client = weaviate.default.client({
        scheme: 'https',
        host: new URL(weaviateUrl).host,
        apiKey: new weaviate.default.ApiKey(weaviateApiKey as any) as any,
      } as any);

      // If object with project_id exists, reuse its internal id, else generate deterministic UUID
      const existingId = await this.getWeaviateObjectIdByProjectId(String(projectData.project_id));
      const objectId = existingId || (weaviate as any).generateUuid5(String(projectData.project_id));

      // Create object with vector
      await client.data
        .creator()
        .withClassName(this.collectionName)
        .withId(objectId)
        .withProperties(cleanedData)
        .withVector(vector)
        .do();

      console.log(`✅ Project ${projectData.project_id} inserted into Weaviate (id=${objectId})`);
      return true;
    } catch (error) {
      console.error("❌ Error inserting project:", error);
      return false;
    }
  }

  async updateProject(projectId: string, projectData: ProjectData, vector: number[]): Promise<boolean> {
    try {
      // Clean relevant fields before update
      const cleanedData = { ...projectData };
      for (const field of ["agenda", "prerequisites", "tools"]) {
        if (field in cleanedData) {
          cleanedData[field as keyof ProjectData] = cleanJsonbField(cleanedData[field as keyof ProjectData], field);
        }
      }
      const weaviateUrl = process.env.WEAVIATE_URL;
      const weaviateApiKey = process.env.WEAVIATE_API_KEY;

      if (!weaviateUrl || !weaviateApiKey) {
        throw new Error("WEAVIATE_URL or WEAVIATE_API_KEY not configured");
      }

      const weaviate = await import('weaviate-ts-client');
      const client = weaviate.default.client({
        scheme: 'https',
        host: new URL(weaviateUrl).host,
        apiKey: new weaviate.default.ApiKey(weaviateApiKey as any) as any,
      } as any);

      // Prefer existing _additional.id for accurate update; fall back to deterministic UUID
      const existingId = await this.getWeaviateObjectIdByProjectId(String(projectId));
      const objectId = existingId || (weaviate as any).generateUuid5(String(projectId));

      await client.data
        .updater()
        .withClassName(this.collectionName)
        .withId(objectId)
        .withProperties(cleanedData)
        .withVector(vector)
        .do();

      console.log(`✅ Project ${projectId} updated in Weaviate (id=${objectId})`);
      return true;
    } catch (error) {
      console.error(`❌ Error updating project ${projectId}:`, error);
      return false;
    }
  }

  async upsertProject(projectData: ProjectData, vector: number[]): Promise<boolean> {
    const projectId = projectData.project_id;
    if (!projectId) {
      console.error("❌ project_id is required for upsert operation");
      return false;
    }

    // Clean relevant fields before upsert
    const cleanedData = { ...projectData };
    for (const field of ["agenda", "prerequisites", "tools"]) {
      if (field in cleanedData) {
        cleanedData[field as keyof ProjectData] = cleanJsonbField(cleanedData[field as keyof ProjectData], field);
      }
    }

    const exists = await this.projectExists(projectId);
    if (exists) {
      console.log(`🔄 Project ${projectId} exists, updating...`);
      return await this.updateProject(projectId, cleanedData, vector);
    } else {
      console.log(`🆕 Project ${projectId} is new, inserting...`);
      return await this.insertProject(cleanedData, vector);
    }
  }

  async searchHybrid(query: string, vector: number[], topK: number = 5, alpha: number = 0.5): Promise<SearchResult[]> {
    try {
      console.log(`🔍 Hybrid search: query="${query}", top_k=${topK}, alpha=${alpha}`);

      const weaviateUrl = process.env.WEAVIATE_URL;
      const weaviateApiKey = process.env.WEAVIATE_API_KEY;

      if (!weaviateUrl || !weaviateApiKey) {
        throw new Error("WEAVIATE_URL or WEAVIATE_API_KEY not configured");
      }

      // Use Weaviate JS client and its hybrid operator with API key
      const weaviate = await import('weaviate-ts-client');
      const client = weaviate.default.client({
        scheme: 'https',
        host: new URL(weaviateUrl).host,
        apiKey: new weaviate.default.ApiKey(weaviateApiKey as any) as any,
      } as any);

      const result = await client.graphql
        .get()
        .withClassName('Project')
        .withHybrid({ query, alpha, vector })
        .withLimit(topK)
        .withFields('project_id mentor_user_id title description categories mentor_name mentor_institution agenda prerequisites tools created_at updated_at _additional { score distance }')
        .do();

      console.log(`🔍 Raw Weaviate hybrid response:`, JSON.stringify(result, null, 2));

      const response = result as any;
      if (response.errors || !response.data?.Get?.Project) {
        console.error('❌ Weaviate hybrid response error or no data:', JSON.stringify(response, null, 2));
        return [];
      }

      const projects = response.data?.Get?.Project || [];
      const searchResults: SearchResult[] = projects.map((obj: any, index: number) => {
        const hybridScore = obj._additional?.score ?? undefined;
        const distance = obj._additional?.distance ?? undefined;
        return {
          rank: index + 1,
          project_id: obj.project_id,
          mentor_user_id: obj.mentor_user_id,
          title: obj.title || '',
          description: obj.description || '',
          categories: obj.categories || [],
          mentor_name: obj.mentor_name,
          mentor_institution: obj.mentor_institution,
          agenda: obj.agenda,
          prerequisites: obj.prerequisites,
          tools: obj.tools,
          created_at: obj.created_at,
          updated_at: obj.updated_at,
          // Keep both a nested scores object and top-level fields for downstream formatters
          scores: {
            hybrid: hybridScore,
            vector_distance: distance
          },
          // Also expose top-level values used by formatters elsewhere
          // @ts-ignore - allow extra fields on the result object
          hybrid_score: hybridScore,
          // @ts-ignore
          vector_distance: distance,
        } as any;
      });

      // Weaviate already ranks; still normalize rank indices
      searchResults.forEach((r, i) => (r.rank = i + 1));
      console.log(`🔍 Hybrid search returned ${searchResults.length} results`);
      return searchResults;
    } catch (error) {
      console.error("❌ Error in hybrid search:", error);
      return [];
    }
  }

  async searchVector(vector: number[], topK: number = 5): Promise<SearchResult[]> {
    try {
      console.log(`🔍 Vector search: top_k=${topK}, vector_dimension=${vector.length}`);

      const weaviateUrl = process.env.WEAVIATE_URL;
      const weaviateApiKey = process.env.WEAVIATE_API_KEY;

      if (!weaviateUrl || !weaviateApiKey) {
        throw new Error("WEAVIATE_URL or WEAVIATE_API_KEY not configured");
      }

      // Use Weaviate JavaScript client with API key
      const weaviate = await import('weaviate-ts-client');
      const client = weaviate.default.client({
        scheme: 'https',
        host: new URL(weaviateUrl).host,
        apiKey: new weaviate.default.ApiKey(weaviateApiKey as any) as any,
      } as any);

      // Use the proper Weaviate client syntax for vector search
      const result = await client.graphql
        .get()
        .withClassName('Project')
        .withNearVector({ vector })
        .withLimit(topK)
        .withFields('project_id mentor_user_id title description categories mentor_name mentor_institution agenda prerequisites tools created_at updated_at _additional { distance }')
        .do();

      console.log(`🔍 Raw Weaviate response:`, JSON.stringify(result, null, 2));

      // Check for errors in the response - use type assertion for flexibility
      const response = result as any;
      if (response.errors || !response.data?.Get?.Project) {
        console.error('❌ Weaviate response error or no data:', JSON.stringify(response, null, 2));
        return [];
      }

      const projects = response.data?.Get?.Project || [];
      const searchResults: SearchResult[] = projects.map((obj: any, index: number) => {
        const distance = obj._additional?.distance ?? 0.0;
        return {
          rank: index + 1,
          project_id: obj.project_id,
          mentor_user_id: obj.mentor_user_id,
          title: obj.title || '',
          description: obj.description || '',
          categories: obj.categories || [],
          mentor_name: obj.mentor_name,
          mentor_institution: obj.mentor_institution,
          agenda: obj.agenda,
          prerequisites: obj.prerequisites,
          tools: obj.tools,
          created_at: obj.created_at,
          updated_at: obj.updated_at,
          scores: {
            distance
          },
          // Expose top-level for downstream formatters
          // @ts-ignore
          vector_distance: distance,
        } as any;
      });

      // Sort by distance (lower distance = more similar) and re-rank
      searchResults.sort((a, b) => (a.scores.distance || 0) - (b.scores.distance || 0));
      searchResults.forEach((result, index) => {
        result.rank = index + 1;
      });

      console.log(
        `🔍 Vector search returned ${searchResults.length} results with distances:`,
        searchResults.map(r => `${r.project_id}: ${r.scores.distance?.toFixed(4)}`)
      );

      return searchResults;
    } catch (error) {
      console.error("❌ Error in vector search:", error);
      return [];
    }
  }

  async deleteProject(projectId: string): Promise<boolean> {
    try {
      const weaviateUrl = process.env.WEAVIATE_URL;
      const weaviateApiKey = process.env.WEAVIATE_API_KEY;

      if (!weaviateUrl || !weaviateApiKey) {
        throw new Error("WEAVIATE_URL or WEAVIATE_API_KEY not configured");
      }

      const weaviate = await import('weaviate-ts-client');
      const client = weaviate.default.client({
        scheme: 'https',
        host: new URL(weaviateUrl).host,
        apiKey: new weaviate.default.ApiKey(weaviateApiKey as any) as any,
      } as any);

      // Prefer existing _additional.id for accurate deletion; fall back to deterministic UUID
      const existingId = await this.getWeaviateObjectIdByProjectId(String(projectId));
      const objectId = existingId || (weaviate as any).generateUuid5(String(projectId));

      await client.data
        .deleter()
        .withClassName(this.collectionName)
        .withId(objectId)
        .do();

      console.log(`✅ Project ${projectId} deleted from Weaviate (id=${objectId})`);
      return true;
    } catch (error) {
      console.error(`❌ Error deleting project ${projectId}:`, error);
      return false;
    }
  }

  async searchHybridRanked(query: string, vector: number[], alpha: number = 0.5): Promise<SearchResult[]> {
    try {
      console.log(`🔍 Hybrid ranked search: query="${query}", alpha=${alpha}`);
      
      // Use the same implementation as searchHybrid but with higher limit
      return await this.searchHybrid(query, vector, 100, alpha);
    } catch (error) {
      console.error("❌ Hybrid ranked search error:", error);
      return [];
    }
  }

  async searchVectorRanked(vector: number[]): Promise<SearchResult[]> {
    try {
      console.log(`🔍 Vector ranked search`);
      
      // Use the same implementation as searchVector but with higher limit
      return await this.searchVector(vector, 100);
    } catch (error) {
      console.error("❌ Vector ranked search error:", error);
      return [];
    }
  }

  // Alternative implementation using Supabase for vector storage
  async searchVectorWithSupabase(vector: number[], topK: number = 5): Promise<SearchResult[]> {
    try {
      // Use Supabase for vector similarity search
      const { data, error } = await this.supabase
        .rpc('match_projects', {
          query_embedding: vector,
          match_threshold: 0.7,
          match_count: topK
        });

      if (error) {
        console.error("❌ Error in Supabase vector search:", error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error("❌ Error in Supabase vector search:", error);
      return [];
    }
  }

  async upsertProjectWithSupabase(projectData: ProjectData, vector: number[]): Promise<boolean> {
    try {
      // Store project with vector embedding in Supabase
      const { error } = await this.supabase
        .from('projects')
        .upsert({
          ...projectData,
          vector_embedding: vector,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error("❌ Error upserting project to Supabase:", error);
        return false;
      }

      console.log(`✅ Project ${projectData.project_id} upserted to Supabase successfully`);
      return true;
    } catch (error) {
      console.error("❌ Error upserting project to Supabase:", error);
      return false;
    }
  }
}

// Singleton instance
export const weaviateService = new WeaviateService();
