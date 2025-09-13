import { 
  users, awsResources, costReports, recommendations, optimizationHistory, approvalRequests,
  type User, type InsertUser, type AwsResource, type InsertAwsResource,
  type CostReport, type InsertCostReport, type Recommendation, type InsertRecommendation,
  type OptimizationHistory, type InsertOptimizationHistory, type ApprovalRequest, type InsertApprovalRequest
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte, sql } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // AWS Resources
  createAwsResource(resource: InsertAwsResource): Promise<AwsResource>;
  getAwsResource(resourceId: string): Promise<AwsResource | undefined>;
  updateAwsResource(resourceId: string, updates: Partial<InsertAwsResource>): Promise<AwsResource | undefined>;
  getAllAwsResources(): Promise<AwsResource[]>;

  // Cost Reports
  createCostReport(report: InsertCostReport): Promise<CostReport>;
  getCostReports(dateFrom?: Date, dateTo?: Date): Promise<CostReport[]>;
  getMonthlyCostSummary(): Promise<{ month: string; totalCost: number; }[]>;

  // Recommendations
  createRecommendation(recommendation: InsertRecommendation): Promise<Recommendation>;
  getRecommendations(status?: string): Promise<Recommendation[]>;
  getRecommendation(id: string): Promise<Recommendation | undefined>;
  updateRecommendationStatus(id: string, status: string): Promise<Recommendation | undefined>;
  
  // Optimization History
  createOptimizationHistory(history: InsertOptimizationHistory): Promise<OptimizationHistory>;
  getOptimizationHistory(limit?: number): Promise<OptimizationHistory[]>;

  // Approval Requests
  createApprovalRequest(request: InsertApprovalRequest): Promise<ApprovalRequest>;
  getApprovalRequests(status?: string): Promise<ApprovalRequest[]>;
  updateApprovalRequest(id: string, updates: Partial<InsertApprovalRequest>): Promise<ApprovalRequest | undefined>;

  // Dashboard metrics
  getDashboardMetrics(): Promise<{
    monthlySpend: number;
    identifiedSavings: number;
    resourcesAnalyzed: number;
    wastePercentage: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async createAwsResource(resource: InsertAwsResource): Promise<AwsResource> {
    const [created] = await db
      .insert(awsResources)
      .values(resource)
      .returning();
    return created;
  }

  async getAwsResource(resourceId: string): Promise<AwsResource | undefined> {
    const [resource] = await db
      .select()
      .from(awsResources)
      .where(eq(awsResources.resourceId, resourceId));
    return resource || undefined;
  }

  async updateAwsResource(resourceId: string, updates: Partial<InsertAwsResource>): Promise<AwsResource | undefined> {
    const [updated] = await db
      .update(awsResources)
      .set({ ...updates, lastAnalyzed: new Date() })
      .where(eq(awsResources.resourceId, resourceId))
      .returning();
    return updated || undefined;
  }

  async getAllAwsResources(): Promise<AwsResource[]> {
    return await db.select().from(awsResources);
  }

  async createCostReport(report: InsertCostReport): Promise<CostReport> {
    const [created] = await db
      .insert(costReports)
      .values(report)
      .returning();
    return created;
  }

  async getCostReports(dateFrom?: Date, dateTo?: Date): Promise<CostReport[]> {
    if (dateFrom && dateTo) {
      return await db
        .select()
        .from(costReports)
        .where(
          and(
            gte(costReports.reportDate, dateFrom),
            lte(costReports.reportDate, dateTo)
          )
        )
        .orderBy(desc(costReports.reportDate));
    }
    
    return await db
      .select()
      .from(costReports)
      .orderBy(desc(costReports.reportDate));
  }

  async getMonthlyCostSummary(): Promise<{ month: string; totalCost: number; }[]> {
    const result = await db
      .select({
        month: sql<string>`TO_CHAR(${costReports.reportDate}, 'YYYY-MM')`,
        totalCost: sql<number>`SUM(${costReports.cost})::numeric`
      })
      .from(costReports)
      .groupBy(sql`TO_CHAR(${costReports.reportDate}, 'YYYY-MM')`)
      .orderBy(sql`TO_CHAR(${costReports.reportDate}, 'YYYY-MM')`);
    
    return result.map(r => ({ month: r.month, totalCost: Number(r.totalCost) }));
  }

  async createRecommendation(recommendation: InsertRecommendation): Promise<Recommendation> {
    const [created] = await db
      .insert(recommendations)
      .values(recommendation)
      .returning();
    return created;
  }

  async getRecommendations(status?: string): Promise<Recommendation[]> {
    if (status) {
      return await db
        .select()
        .from(recommendations)
        .where(eq(recommendations.status, status))
        .orderBy(desc(recommendations.createdAt));
    }
    
    return await db
      .select()
      .from(recommendations)
      .orderBy(desc(recommendations.createdAt));
  }

  async getRecommendation(id: string): Promise<Recommendation | undefined> {
    const [recommendation] = await db
      .select()
      .from(recommendations)
      .where(eq(recommendations.id, id));
    return recommendation || undefined;
  }

  async updateRecommendationStatus(id: string, status: string): Promise<Recommendation | undefined> {
    const [updated] = await db
      .update(recommendations)
      .set({ status, updatedAt: new Date() })
      .where(eq(recommendations.id, id))
      .returning();
    return updated || undefined;
  }

  async createOptimizationHistory(history: InsertOptimizationHistory): Promise<OptimizationHistory> {
    const [created] = await db
      .insert(optimizationHistory)
      .values(history)
      .returning();
    return created;
  }

  async getOptimizationHistory(limit = 50): Promise<OptimizationHistory[]> {
    return await db
      .select()
      .from(optimizationHistory)
      .orderBy(desc(optimizationHistory.createdAt))
      .limit(limit);
  }

  async createApprovalRequest(request: InsertApprovalRequest): Promise<ApprovalRequest> {
    const [created] = await db
      .insert(approvalRequests)
      .values(request)
      .returning();
    return created;
  }

  async getApprovalRequests(status?: string): Promise<ApprovalRequest[]> {
    if (status) {
      return await db
        .select()
        .from(approvalRequests)
        .where(eq(approvalRequests.status, status))
        .orderBy(desc(approvalRequests.createdAt));
    }
    
    return await db
      .select()
      .from(approvalRequests)
      .orderBy(desc(approvalRequests.createdAt));
  }

  async updateApprovalRequest(id: string, updates: Partial<InsertApprovalRequest>): Promise<ApprovalRequest | undefined> {
    const [updated] = await db
      .update(approvalRequests)
      .set(updates)
      .where(eq(approvalRequests.id, id))
      .returning();
    return updated || undefined;
  }

  async getDashboardMetrics(): Promise<{
    monthlySpend: number;
    identifiedSavings: number;
    resourcesAnalyzed: number;
    wastePercentage: number;
  }> {
    // Get current month cost
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);
    
    const [monthlySpendResult] = await db
      .select({
        total: sql<number>`COALESCE(SUM(${costReports.cost}), 0)::numeric`
      })
      .from(costReports)
      .where(gte(costReports.reportDate, currentMonth));

    // Get total identified savings from active recommendations
    const [savingsResult] = await db
      .select({
        total: sql<number>`COALESCE(SUM(${recommendations.projectedAnnualSavings}), 0)::numeric`
      })
      .from(recommendations)
      .where(eq(recommendations.status, 'pending'));

    // Get total resources analyzed
    const [resourcesResult] = await db
      .select({
        count: sql<number>`COUNT(*)`
      })
      .from(awsResources);

    // Calculate waste percentage (simplified)
    const monthlySpend = Number(monthlySpendResult.total);
    const identifiedSavings = Number(savingsResult.total);
    const wastePercentage = monthlySpend > 0 ? (identifiedSavings / 12 / monthlySpend) * 100 : 0;

    return {
      monthlySpend,
      identifiedSavings,
      resourcesAnalyzed: Number(resourcesResult.count),
      wastePercentage: Math.round(wastePercentage)
    };
  }
}

export const storage = new DatabaseStorage();
