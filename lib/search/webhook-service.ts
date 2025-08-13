import { createAdminClient } from '../../utils/supabase/admin';
import { embeddingService } from './embedding-service';
import { weaviateService } from './weaviate-service';
import { WebhookRequest, ProjectData } from './types';

interface WebhookResult {
  status: string;
  message?: string;
  project_id?: string;
  action?: string;
  webhook_type?: string;
  vector_dimension?: number;
  mentor_data_fetched?: boolean;
}

export class WebhookService {
  private supabaseUrl: string;
  private supabaseKey: string;

  constructor() {
    this.supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    this.supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!this.supabaseUrl || !this.supabaseKey) {
      console.warn("⚠️ Supabase credentials not found. Mentor data fetching will be disabled.");
    }
  }

  async processWebhook(webhookData: WebhookRequest): Promise<WebhookResult> {
    try {
      console.log("📥 Processing webhook data...");

      const { type: webhookType, table, record, old_record } = webhookData;
      console.log(`📋 Webhook type: ${webhookType}, table: ${table}`);

      if (table !== "projects") {
        console.warn(`⚠️ Unexpected table: ${table}`);
        return { status: "error", message: `Unexpected table: ${table}` };
      }

      const projectId = record?.id || old_record?.id;
      if (!projectId) {
        return { status: "error", message: "No project ID found" };
      }

      if (webhookType === "DELETE") {
        return await this.handleDelete(projectId, old_record);
      } else if (["INSERT", "UPDATE"].includes(webhookType)) {
        return await this.handleUpsert(projectId, record, webhookType);
      } else {
        return { status: "error", message: `Unsupported webhook type: ${webhookType}` };
      }
    } catch (error) {
      console.error("❌ Webhook processing error:", error);
      return { status: "error", message: String(error) };
    }
  }

  private async handleDelete(projectId: string, oldRecord: Record<string, any>): Promise<WebhookResult> {
    try {
      console.log(`🗑️ Handling DELETE for project ${projectId}`);

      // Use Weaviate service for vector storage
      const success = await weaviateService.deleteProject(projectId);

      if (success) {
        return {
          status: "success",
          project_id: projectId,
          action: "deleted"
        };
      } else {
        return {
          status: "error",
          message: `Failed to delete project ${projectId}`
        };
      }
    } catch (error) {
      console.error("❌ Delete error:", error);
      return { status: "error", message: String(error) };
    }
  }

  private async handleUpsert(projectId: string, record: Record<string, any>, webhookType: string): Promise<WebhookResult> {
    try {
      console.log(`🔄 Handling ${webhookType} for project ${projectId}`);

      // Fetch mentor data if mentor_user exists
      let mentorData: Record<string, any> = {};
      const mentorUserId = record.mentor_user;

      if (mentorUserId && this.supabaseUrl && this.supabaseKey) {
        const fetchedMentorData = await this.fetchMentorData(mentorUserId);
        if (fetchedMentorData) {
          mentorData = fetchedMentorData;
        }
      }

      // Create enriched project data
      const projectData = this.createEnrichedProjectData(record, mentorData);

      // Generate embedding using central service
      const textBlob = this.createTextBlob(projectData);
      const vector = await embeddingService.generateEmbedding(textBlob);

      console.log(`🔢 Generated ${vector.length}-dimensional embedding for project ${projectId}`);

      // Use Weaviate service for vector storage
      const success = await weaviateService.upsertProject(projectData, vector);

      if (success) {
        return {
          status: "success",
          project_id: projectId,
          action: "upserted",
          webhook_type: webhookType,
          vector_dimension: vector.length,
          mentor_data_fetched: mentorData !== null
        };
      } else {
        return {
          status: "error",
          message: `Failed to upsert project ${projectId}`
        };
      }
    } catch (error) {
      console.error("❌ Upsert error:", error);
      return { status: "error", message: String(error) };
    }
  }

  private async fetchMentorData(mentorUserId: string): Promise<Record<string, any> | null> {
    try {
      if (!this.supabaseUrl || !this.supabaseKey) {
        return null;
      }

      console.log(`🔍 Fetching mentor data for user ${mentorUserId}`);

      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from('mentor_profiles')
        .select('*')
        .eq('id', mentorUserId)
        .single();

      if (error) {
        console.error("❌ Error fetching mentor data:", error);
        return null;
      }

      if (data) {
        const mentorName = data.name || 'Unknown';
        console.log(`✅ Found mentor data: ${mentorName}`);
        return data;
      } else {
        console.warn(`⚠️ No mentor data found for user ${mentorUserId}`);
        return null;
      }
    } catch (error) {
      console.error("❌ Error fetching mentor data:", error);
      return null;
    }
  }

  private createEnrichedProjectData(record: Record<string, any>, mentorData: Record<string, any>): ProjectData {
    return {
      project_id: String(record.id),
      mentor_user_id: record.mentor_user ? String(record.mentor_user) : "",
      title: record.title || "",
      description: record.description || "",
      categories: record.categories || [],
      mentor_name: mentorData?.name || "",
      mentor_institution: mentorData?.institution || "",
      agenda: record.agenda,
      prerequisites: record.prerequisites,
      tools: record.tools,
      created_at: record.created_at,
      updated_at: record.updated_at
    };
  }

  private cleanJsonbField(fieldData: any, fieldName: string): string {
    try {
      if (!fieldData) {
        return "";
      }

      // If it's already a string, return as is
      if (typeof fieldData === "string") {
        return fieldData;
      }

      // If it's a list, extract content from objects
      if (Array.isArray(fieldData)) {
        const cleanedItems: string[] = [];
        for (const item of fieldData) {
          if (typeof item === "object" && item !== null) {
            // Extract title, description, or content fields
            if ("title" in item) {
              cleanedItems.push(item.title);
            } else if ("description" in item) {
              cleanedItems.push(item.description);
            } else if ("content" in item) {
              cleanedItems.push(item.content);
            } else {
              // If no specific field, use the whole item as string
              cleanedItems.push(String(item));
            }
          } else {
            cleanedItems.push(String(item));
          }
        }
        return cleanedItems.join(", ");
      }

      // If it's a dict, extract relevant fields
      if (typeof fieldData === "object" && fieldData !== null) {
        if ("title" in fieldData) {
          return fieldData.title;
        } else if ("description" in fieldData) {
          return fieldData.description;
        } else if ("content" in fieldData) {
          return fieldData.content;
        } else {
          return JSON.stringify(fieldData);
        }
      }

      // For any other type, convert to string
      return String(fieldData);
    } catch (error) {
      console.warn(`⚠️ Error cleaning ${fieldName}:`, error);
      // Return original data as string if cleaning fails
      return fieldData ? String(fieldData) : "";
    }
  }

  private createTextBlob(projectData: ProjectData): string {
    const textParts: string[] = [];

    // Title
    if (projectData.title) {
      textParts.push(`Title: ${projectData.title}`);
    }

    // Description
    if (projectData.description) {
      textParts.push(`Description: ${projectData.description}`);
    }

    // Categories
    const categories = projectData.categories;
    if (categories && categories.length > 0) {
      const categoriesText = Array.isArray(categories) ? categories.join(", ") : String(categories);
      textParts.push(`Categories: ${categoriesText}`);
    }

    // Mentor Name
    if (projectData.mentor_name) {
      textParts.push(`Mentor Name: ${projectData.mentor_name}`);
    }

    // Mentor Institution
    if (projectData.mentor_institution) {
      textParts.push(`Mentor Institution: ${projectData.mentor_institution}`);
    }

    // Agenda (clean and convert to readable text)
    const agendaCleaned = this.cleanJsonbField(projectData.agenda, "agenda");
    if (agendaCleaned) {
      textParts.push(`Agenda: ${agendaCleaned}`);
    }

    // Prerequisites (clean and convert to readable text)
    const prereqCleaned = this.cleanJsonbField(projectData.prerequisites, "prerequisites");
    if (prereqCleaned) {
      textParts.push(`Prerequisites: ${prereqCleaned}`);
    }

    // Tools (clean and convert to readable text)
    const toolsCleaned = this.cleanJsonbField(projectData.tools, "tools");
    if (toolsCleaned) {
      textParts.push(`Tools: ${toolsCleaned}`);
    }

    // Join all parts with newlines
    const enhancedText = textParts.join("\n");

    console.log(`📝 Created enhanced text blob (${enhancedText.length} chars) for embedding`);
    return enhancedText;
  }

  validateWebhookSignature(webhookData: WebhookRequest, signature: string): boolean {
    // TODO: Implement signature validation if Supabase provides it
    // For now, we'll trust the webhook
    return true;
  }
}

// Singleton instance
export const webhookService = new WebhookService();
