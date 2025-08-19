// Central embedding service using OpenAI API
// This service provides a centralized way to generate embeddings
class EmbeddingService {
  private modelName: string;
  private apiUrl: string;
  private apiKey: string | undefined;
  private cache: Map<string, number[]>;
  private cacheSize: number;
  constructor() {
    // Use OpenAI's text-embedding-3-small model
    this.modelName = "text-embedding-3-small";
    this.apiUrl = "https://api.openai.com/v1/embeddings";
    this.apiKey = process.env.OPENAI_API_KEY || '';
    this.cache = new Map();
    this.cacheSize = 1000; // Cache size limit
    if (!this.apiKey) {
      console.warn("⚠️ OPENAI_API_KEY not found. Embedding generation will fail.");
    } else {
      console.log("✅ OpenAI API key found");
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      if (!text) {
        throw new Error("Text cannot be empty");
      }
      // Check cache first
      const cacheKey = this.hashText(text);
      if (this.cache.has(cacheKey)) {
        console.log("📋 Using cached embedding");
        return this.cache.get(cacheKey)!;
      }
      console.log(`🔢 Generating embedding for text (${text.length} chars)`);
      
      // OpenAI API request format
      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey || ''}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          input: text, // Single text input
          model: this.modelName
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ OpenAI API error: ${response.status} ${response.statusText}`);
        console.error(`❌ Error details: ${errorText}`);
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log(`📊 OpenAI response:`, result);
      
      // Extract embedding from OpenAI response structure
      const embedding = result.data[0].embedding;
      
      // Cache the result
      this.cacheEmbedding(cacheKey, embedding);
      console.log(`✅ Generated ${embedding.length}-dimensional embedding`);
      return embedding;
    } catch (error) {
      console.error("❌ Error generating embedding:", error);
      throw error;
    }
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    try {
      console.log(`🔢 Generating embeddings for ${texts.length} texts`);
      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey || ''}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          input: texts, // Array of texts
          model: this.modelName
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const result = await response.json();
      console.log(`✅ Generated ${result.data.length} embeddings`);
      
      // Extract embeddings from OpenAI response structure
      return result.data.map((item: any) => item.embedding);
    } catch (error) {
      console.error("❌ Error generating embeddings:", error);
      throw error;
    }
  }

  private hashText(text: string): string {
    // Simple hash function for caching
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  private cacheEmbedding(key: string, embedding: number[]): void {
    // Implement LRU cache
    if (this.cache.size >= this.cacheSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, embedding);
  }

  getModelInfo(): { name: string; dimension: number } {
    return {
      name: this.modelName,
      dimension: 1536 // text-embedding-3-small dimension
    };
  }

  clearCache(): void {
    this.cache.clear();
    console.log("🗑️ Embedding cache cleared");
  }

  getCacheStats(): { size: number; maxSize: number } {
    return {
      size: this.cache.size,
      maxSize: this.cacheSize
    };
  }
}

// // Singleton instance - this keeps the model "loaded" (cached)
export const embeddingService = new EmbeddingService();

// Central embedding service using Hugging Face API
// This service provides a centralized way to generate embeddings

// class EmbeddingService {
//   private modelName: string;
//   private apiUrl: string;
//   private apiKey: string | undefined;
//   private cache: Map<string, number[]>;
//   private cacheSize: number;

//   constructor() {
//     // Use a model that actually generates embeddings
//     this.modelName = "sentence-transformers/all-MiniLM-L12-v2";
//     this.apiUrl = `https://router.huggingface.co/hf-inference/models/${this.modelName}/pipeline/feature-extraction`;
//     this.apiKey = process.env.HUGGINGFACE_API_KEY || '';
//     this.cache = new Map();
//     this.cacheSize = 1000; // Cache size limit

//     if (!this.apiKey) {
//       console.warn("⚠️ HUGGINGFACE_API_KEY not found. Embedding generation will fail.");
//     } else {
//       console.log("✅ Hugging Face API key found");
//     }
//   }

//   async generateEmbedding(text: string): Promise<number[]> {
//     try {
//       if (!text) {
//         throw new Error("Text cannot be empty");
//       }
//       // Check cache first
//       const cacheKey = this.hashText(text);
//       if (this.cache.has(cacheKey)) {
//         console.log("📋 Using cached embedding");
//         return this.cache.get(cacheKey)!;
//       }

//       console.log(`🔢 Generating embedding for text (${text.length} chars)`);

//       // Use the correct API format for sentence similarity model
//       const response = await fetch(this.apiUrl, {
//         method: "POST",
//         headers: {
//           "Authorization": `Bearer ${this.apiKey || ''}`,
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({ 
//           inputs: [text] // Feature extraction pipeline expects inputs array
//         }),
//       });

//       if (!response.ok) {
//         const errorText = await response.text();
//         console.error(`❌ Hugging Face API error: ${response.status} ${response.statusText}`);
//         console.error(`❌ Error details: ${errorText}`);
//         throw new Error(`Hugging Face API error: ${response.status} ${response.statusText}`);
//       }

//       const result = await response.json();
//       console.log(`📊 Hugging Face response:`, result);
//       const embedding = result[0];

//       // Cache the result
//       this.cacheEmbedding(cacheKey, embedding);

//       console.log(`✅ Generated ${embedding.length}-dimensional embedding`);
//       return embedding;
//     } catch (error) {
//       console.error("❌ Error generating embedding:", error);
//       throw error;
//     }
//   }

//   async generateEmbeddings(texts: string[]): Promise<number[][]> {
//     try {
//       console.log(`🔢 Generating embeddings for ${texts.length} texts`);

//       const response = await fetch(this.apiUrl, {
//         method: "POST",
//         headers: {
//           "Authorization": `Bearer ${this.apiKey || ''}`,
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({ inputs: texts }),
//       });

//       if (!response.ok) {
//         throw new Error(`Hugging Face API error: ${response.statusText}`);
//       }

//       const result = await response.json();
//       console.log(`✅ Generated ${result.length} embeddings`);
//       return result;
//     } catch (error) {
//       console.error("❌ Error generating embeddings:", error);
//       throw error;
//     }
//   }

//   private hashText(text: string): string {
//     // Simple hash function for caching
//     let hash = 0;
//     for (let i = 0; i < text.length; i++) {
//       const char = text.charCodeAt(i);
//       hash = ((hash << 5) - hash) + char;
//       hash = hash & hash; // Convert to 32-bit integer
//     }
//     return hash.toString();
//   }

//   private cacheEmbedding(key: string, embedding: number[]): void {
//     // Implement LRU cache
//     if (this.cache.size >= this.cacheSize) {
//       const firstKey = this.cache.keys().next().value;
//       if (firstKey) {
//         this.cache.delete(firstKey);
//       }
//     }
//     this.cache.set(key, embedding);
//   }

//   getModelInfo(): { name: string; dimension: number } {
//     return {
//       name: this.modelName,
//       dimension: 384 // MiniLM-L6-v2 dimension
//     };
//   }

//   clearCache(): void {
//     this.cache.clear();
//     console.log("🗑️ Embedding cache cleared");
//   }

//   getCacheStats(): { size: number; maxSize: number } {
//     return {
//       size: this.cache.size,
//       maxSize: this.cacheSize
//     };
//   }
// }

// // Singleton instance - this keeps the model "loaded" (cached)
// export const embeddingService = new EmbeddingService();
