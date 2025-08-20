export interface QueryRequest {
  query: string;
  top_k?: number;
  search_type?: 'hybrid' | 'vector';
  alpha?: number;
}

export interface RankAllRequest {
  query: string;
  search_type?: 'hybrid' | 'vector';
  alpha?: number;
}

export interface QueryResponse {
  status: string;
  query: string;
  search_type: string;
  top_k?: number;
  results_count: number;
  results: Array<Record<string, any>>;
  vector_dimension: number;
  alpha?: number;
  message?: string;
}

export interface RankAllResponse {
  status: string;
  query: string;
  search_type: string;
  total_projects: number;
  results: Array<Record<string, any>>;
  vector_dimension: number;
  alpha?: number;
  message?: string;
}

export interface RecommendationRequest {
  student_id: string;
  top_k?: number;
}

export interface RecommendationResponse {
  status: string;
  student_id: string;
  query: string;
  recommendations_count: number;
  recommendations: Array<Record<string, any>>;
  student_data: Record<string, any>;
  message?: string;
}

export interface WebhookRequest {
  type: string;
  table: string;
  record: Record<string, any>;
  old_record?: Record<string, any>;
}

export interface ErrorResponse {
  status: string;
  message: string;
  query?: string;
}

// Search and recommendation specific types
export interface SearchResult {
  rank: number;
  project_id: string;
  mentor_user_id: string;
  title: string;
  description: string;
  categories: string[];
  mentor_name?: string;
  mentor_institution?: string;
  agenda?: any;
  prerequisites?: any;
  tools?: any;
  created_at?: string;
  updated_at?: string;
  scores: Record<string, number>;
}

export interface StudentData {
  id?: string;
  goals?: string[];
  interests?: string[];
  student_type?: string;
  grade?: string;
  major?: string;
  institution_name?: string;
}

export interface ProjectData {
  project_id: string;
  mentor_user_id: string;
  title: string;
  description: string;
  categories: string[];
  mentor_name?: string;
  mentor_institution?: string;
  agenda?: any;
  prerequisites?: any;
  tools?: any;
  created_at?: string;
  updated_at?: string;
}
