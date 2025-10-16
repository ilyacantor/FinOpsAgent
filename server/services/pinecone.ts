import { Pinecone } from '@pinecone-database/pinecone';
import { GoogleGenerativeAI } from "@google/generative-ai";

export interface VectorMetadata {
  id: string;
  type: 'recommendation' | 'optimization_history';
  content: string;
  status?: string;
  savings?: number;
  timestamp: string;
}

export class PineconeService {
  private pinecone: Pinecone;
  private indexName: string = 'autonomos-finops-rag';
  private genAI: GoogleGenerativeAI;
  private embeddingModel: any;
  
  constructor() {
    const apiKey = process.env.PINECONE_API_KEY;
    if (!apiKey) {
      throw new Error("PINECONE_API_KEY is not configured");
    }
    
    this.pinecone = new Pinecone({ apiKey });
    
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      throw new Error("GEMINI_API_KEY is not configured for embeddings");
    }
    
    this.genAI = new GoogleGenerativeAI(geminiKey);
    this.embeddingModel = this.genAI.getGenerativeModel({ model: "text-embedding-004" });
  }

  async ensureIndex(): Promise<void> {
    try {
      const indexes = await this.pinecone.listIndexes();
      const indexExists = indexes.indexes?.some(idx => idx.name === this.indexName);
      
      if (!indexExists) {
        console.log(`Creating Pinecone index: ${this.indexName}`);
        await this.pinecone.createIndex({
          name: this.indexName,
          dimension: 768,
          metric: 'cosine',
          spec: {
            serverless: {
              cloud: 'aws',
              region: 'us-east-1'
            }
          }
        });
        
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    } catch (error) {
      console.error("Error ensuring Pinecone index:", error);
      throw error;
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const result = await this.embeddingModel.embedContent(text);
      return result.embedding.values;
    } catch (error) {
      console.error("Error generating embedding:", error);
      throw error;
    }
  }

  async storeRecommendation(recommendation: any): Promise<void> {
    try {
      await this.ensureIndex();
      const index = this.pinecone.index(this.indexName);
      
      const content = `${recommendation.type}: ${recommendation.description}. Impact: ${recommendation.estimatedSavings / 1000} savings, Priority: ${recommendation.priority}`;
      const embedding = await this.generateEmbedding(content);
      
      const metadata: VectorMetadata = {
        id: recommendation.id,
        type: 'recommendation',
        content,
        savings: recommendation.estimatedSavings,
        timestamp: new Date(recommendation.createdAt).toISOString()
      };
      
      await index.upsert([{
        id: `rec_${recommendation.id}`,
        values: embedding,
        metadata: metadata as any
      }]);
      
      console.log(`✅ Stored recommendation ${recommendation.id} in Pinecone`);
    } catch (error) {
      console.error("Error storing recommendation in Pinecone:", error);
    }
  }

  async storeOptimizationHistory(history: any): Promise<void> {
    try {
      await this.ensureIndex();
      const index = this.pinecone.index(this.indexName);
      
      const content = `Optimization ${history.recommendationType}: ${history.resourceId}. Status: ${history.status}, Result: ${history.resultMessage || 'N/A'}`;
      const embedding = await this.generateEmbedding(content);
      
      const metadata: VectorMetadata = {
        id: history.id,
        type: 'optimization_history',
        content,
        status: history.status,
        timestamp: new Date(history.createdAt).toISOString()
      };
      
      await index.upsert([{
        id: `opt_${history.id}`,
        values: embedding,
        metadata: metadata as any
      }]);
      
      console.log(`✅ Stored optimization history ${history.id} in Pinecone`);
    } catch (error) {
      console.error("Error storing optimization history in Pinecone:", error);
    }
  }

  async retrieveRelevantContext(query: string, topK: number = 10): Promise<VectorMetadata[]> {
    try {
      await this.ensureIndex();
      const index = this.pinecone.index(this.indexName);
      
      const queryEmbedding = await this.generateEmbedding(query);
      
      const results = await index.query({
        vector: queryEmbedding,
        topK,
        includeMetadata: true
      });
      
      return results.matches?.map(match => match.metadata as unknown as VectorMetadata) || [];
    } catch (error) {
      console.error("Error retrieving context from Pinecone:", error);
      return [];
    }
  }

  async clearIndex(): Promise<void> {
    try {
      await this.ensureIndex();
      const index = this.pinecone.index(this.indexName);
      await index.deleteAll();
      console.log(`🗑️ Cleared Pinecone index: ${this.indexName}`);
    } catch (error) {
      console.error("Error clearing Pinecone index:", error);
    }
  }
}

export const pineconeService = new PineconeService();
