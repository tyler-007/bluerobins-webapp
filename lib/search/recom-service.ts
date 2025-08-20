import { createAdminClient } from "../../utils/supabase/admin";
import { embeddingService } from "./embedding-service";
import { weaviateService } from "./weaviate-service";
import { RecommendationResponse, StudentData } from "./types";

export class RecommendationService {
  private supabase: any;

  constructor() {
    try {
      this.supabase = createAdminClient();
      console.log("✅ Supabase client initialized (shared instance)");
    } catch (error) {
      this.supabase = null;
      console.warn(`⚠️ Supabase client not available: ${error}`);
    }
  }

  private async fetchStudentDataFromSupabase(studentId: string, fields: string): Promise<StudentData | null> {
    try {
      if (!this.supabase) return null;

      const response = await this.supabase
        .from("student_profiles")
        .select(fields)
        .eq("id", studentId)
        .single();

      return response.data || null;
    } catch (error) {
      console.error(`❌ Error fetching student data for ${studentId}:`, error);
      return null;
    }
  }

  async fetchStudentData(studentId: string, fields: string): Promise<StudentData | null> {
    const t0 = Date.now();
    const result = await this.fetchStudentDataFromSupabase(studentId, fields);
    const t1 = Date.now();
    console.log(`⏱️ fetch_student_data: ${((t1 - t0) / 1000).toFixed(3)}s (fields: ${fields})`);
    return result;
  }

  createGoalsQuery(studentData: StudentData): string {
    const t0 = Date.now();
    const queryParts: string[] = [];

    // Build structured profile query (NO interests included)
    const profileParts: string[] = [];

    // Add goals
    const goals = studentData.goals;
    if (goals && goals.length > 0) {
      profileParts.push(`goals: ${Array.isArray(goals) ? goals.join(", ") : goals}`);
    }

    // Add student_type
    const studentType = studentData.student_type;
    if (studentType) {
      profileParts.push(`student_type: ${studentType}`);
    }

    // Add grade or major (whichever is available)
    const grade = studentData.grade;
    const major = studentData.major;

    if (grade) {
      profileParts.push(`grade: ${grade}`);
    } else if (major) {
      profileParts.push(`major: ${major}`);
    }

    // Add institution
    const institution = studentData.institution_name;
    if (institution) {
      profileParts.push(`Institution: ${institution}.`);
    }

    // Combine profile parts (this is our search query)
    if (profileParts.length > 0) {
      const profileQuery = `student profile: ${profileParts.join(", ")}`;
      queryParts.push(profileQuery);
    } else {
      // Fallback if no profile data
      queryParts.push("student profile");
    }

    // Join all parts
    const query = queryParts.join(" ");

    console.log(`📝 Created goals-based query: ${query}`);
    const t1 = Date.now();
    console.log(`⏱️ create_goals_query: ${((t1 - t0) / 1000).toFixed(3)}s`);
    return query;
  }

  createInterestsQuery(studentData: StudentData): string {
    const t0 = Date.now();
    const queryParts = ["My interests are"];

    // Add interests
    const interests = studentData.interests;
    if (interests && interests.length > 0) {
      if (Array.isArray(interests)) {
        queryParts.push(...interests);
      } else {
        queryParts.push(String(interests));
      }
    }

    // Join all parts
    const query = queryParts.join(" ");

    console.log(`📝 Created interests-based query: ${query}`);
    const t1 = Date.now();
    console.log(`⏱️ create_interests_query: ${((t1 - t0) / 1000).toFixed(3)}s`);
    return query;
  }

  async searchProjectsByQuery(query: string, topK: number = 10): Promise<any[]> {
    const t0 = Date.now();
    try {
      console.log(`🔍 Searching projects for query: "${query}"`);
      
      // Generate embedding for query using central service
      const vector = await embeddingService.generateEmbedding(query);
      console.log(`🔢 Generated ${vector.length}-dimensional embedding for query`);

      // Use Weaviate service for vector search
      const results = await weaviateService.searchVector(vector, topK);
      console.log(`✅ Vector search completed with ${results.length} results`);

      const t1 = Date.now();
      console.log(`⏱️ search_projects_by_query: ${((t1 - t0) / 1000).toFixed(3)}s`);
      return results;
    } catch (error) {
      console.error(`❌ Error in vector search:`, error);
      const t1 = Date.now();
      console.log(`⏱️ search_projects_by_query (error): ${((t1 - t0) / 1000).toFixed(3)}s`);
      return [];
    }
  }

  async getGoalsRecommendations(studentId: string, topK: number = 10): Promise<RecommendationResponse> {
    const t0 = Date.now();
    try {
      console.log(`🎯 Getting goals-based recommendations for student: ${studentId}`);

      // Fetch student data (only needed fields)
      const fields = "goals,student_type,grade,major,institution_name";
      const studentData = await this.fetchStudentData(studentId, fields);
      
      if (!studentData) {
        const t1 = Date.now();
        console.log(`⏱️ get_goals_recommendations (student not found): ${((t1 - t0) / 1000).toFixed(3)}s`);
        return {
          status: "error",
          student_id: studentId,
          query: "",
          recommendations_count: 0,
          recommendations: [],
          student_data: {}
        };
      }

      // Create goals-based query
      const query = this.createGoalsQuery(studentData);
      if (!query.trim()) {
        const t1 = Date.now();
        console.log(`⏱️ get_goals_recommendations (no profile data): ${((t1 - t0) / 1000).toFixed(3)}s`);
        return {
          status: "error",
          student_id: studentId,
          query: "",
          recommendations_count: 0,
          recommendations: [],
          student_data: {}
        };
      }

      // Search projects by goals
      const recommendations = await this.searchProjectsByQuery(query, topK);
      const t1 = Date.now();
      console.log(`⏱️ get_goals_recommendations: ${((t1 - t0) / 1000).toFixed(3)}s`);
      
      // Filter recommendations to only include project_id, title, and distance
      const filteredRecommendations = recommendations.map(r => ({
        project_id: r.project_id,
        title: r.title,
        distance: r.scores?.distance || 0
      }));
      
      // Log distance scores for debugging
      console.log(`📊 Recommendations with distances:`, 
        filteredRecommendations.map(r => ({
          project_id: r.project_id,
          title: r.title,
          distance: r.distance?.toFixed(4)
        }))
      );
      
      return {
        status: "success",
        student_id: studentId,
        query,
        recommendations_count: filteredRecommendations.length,
        recommendations: filteredRecommendations,
        student_data: {
          goals: studentData.goals,
          student_type: studentData.student_type,
          grade: studentData.grade,
          major: studentData.major,
          institution_name: studentData.institution_name
        }
      };
    } catch (error) {
      console.error(`❌ Error getting goals recommendations:`, error);
      const t1 = Date.now();
      console.log(`⏱️ get_goals_recommendations (error): ${((t1 - t0) / 1000).toFixed(3)}s`);
      return {
        status: "error",
        student_id: studentId,
        query: "",
        recommendations_count: 0,
        recommendations: [],
        student_data: {},
        message: String(error)
      };
    }
  }

  async getInterestsRecommendations(studentId: string, topK: number = 10): Promise<RecommendationResponse> {
    const t0 = Date.now();
    try {
      console.log(`🎯 Getting interests-based recommendations for student: ${studentId}`);

      // Check if Supabase is available
      if (!this.supabase) {
        const t1 = Date.now();
        console.log(`⏱️ get_interests_recommendations (no supabase): ${((t1 - t0) / 1000).toFixed(3)}s`);
        return {
          status: "error",
          student_id: studentId,
          query: "",
          recommendations_count: 0,
          recommendations: [],
          student_data: {},
          message: "Supabase not configured. Please set SUPABASE_URL and SUPABASE_KEY environment variables"
        };
      }

      // Fetch student data (only needed fields)
      const fields = "interests,goals,major,grade";
      const studentData = await this.fetchStudentData(studentId, fields);
      
      if (!studentData) {
        const t1 = Date.now();
        console.log(`⏱️ get_interests_recommendations (student not found): ${((t1 - t0) / 1000).toFixed(3)}s`);
        return {
          status: "error",
          student_id: studentId,
          query: "",
          recommendations_count: 0,
          recommendations: [],
          student_data: {},
          message: `Student not found: ${studentId}`
        };
      }

      // Create interests-based query
      const query = this.createInterestsQuery(studentData);
      if (!query.trim()) {
        const t1 = Date.now();
        console.log(`⏱️ get_interests_recommendations (no interests): ${((t1 - t0) / 1000).toFixed(3)}s`);
        return {
          status: "error",
          student_id: studentId,
          query: "",
          recommendations_count: 0,
          recommendations: [],
          student_data: {},
          message: "No interests found for student"
        };
      }

      // Search projects by interests
      const recommendations = await this.searchProjectsByQuery(query, topK);
      const t1 = Date.now();
      console.log(`⏱️ get_interests_recommendations: ${((t1 - t0) / 1000).toFixed(3)}s`);
      
      // Filter recommendations to only include project_id, title, and distance
      const filteredRecommendations = recommendations.map(r => ({
        project_id: r.project_id,
        title: r.title,
        distance: r.scores?.distance || 0
      }));
      
      return {
        status: "success",
        student_id: studentId,
        query,
        recommendations_count: filteredRecommendations.length,
        recommendations: filteredRecommendations,
        student_data: {
          interests: studentData.interests || [],
          goals: studentData.goals,
          major: studentData.major,
          grade: studentData.grade
        }
      };
    } catch (error) {
      console.error(`❌ Error getting interests recommendations:`, error);
      const t1 = Date.now();
      console.log(`⏱️ get_interests_recommendations (error): ${((t1 - t0) / 1000).toFixed(3)}s`);
      return {
        status: "error",
        student_id: studentId,
        query: "",
        recommendations_count: 0,
        recommendations: [],
        student_data: {},
        message: String(error)
      };
    }
  }
}

// Singleton instance
export const recommendationService = new RecommendationService();
