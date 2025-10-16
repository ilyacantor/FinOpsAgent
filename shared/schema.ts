import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, decimal, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("user"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const awsResources = pgTable("aws_resources", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  resourceId: text("resource_id").notNull().unique(),
  resourceType: text("resource_type").notNull(), // EC2, RDS, Redshift, S3, etc.
  region: text("region").notNull(),
  currentConfig: jsonb("current_config").notNull(),
  utilizationMetrics: jsonb("utilization_metrics"),
  monthlyCost: integer("monthly_cost"), // Multiplied by 1000, no pennies
  lastAnalyzed: timestamp("last_analyzed").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const costReports = pgTable("cost_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reportDate: timestamp("report_date").notNull(),
  serviceCategory: text("service_category").notNull(),
  resourceId: text("resource_id"),
  cost: integer("cost").notNull(), // Multiplied by 1000, no pennies
  usage: decimal("usage", { precision: 12, scale: 6 }),
  usageType: text("usage_type"),
  region: text("region"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const recommendations = pgTable("recommendations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  resourceId: text("resource_id").notNull(),
  type: text("type").notNull(), // resize, terminate, storage-class, reserved-instance
  priority: text("priority").notNull(), // critical, high, medium, low
  title: text("title").notNull(),
  description: text("description").notNull(),
  currentConfig: jsonb("current_config").notNull(),
  recommendedConfig: jsonb("recommended_config").notNull(),
  projectedMonthlySavings: integer("projected_monthly_savings").notNull(), // Multiplied by 1000, no pennies
  projectedAnnualSavings: integer("projected_annual_savings").notNull(), // Multiplied by 1000, no pennies
  riskLevel: decimal("risk_level", { precision: 5, scale: 2 }).notNull(), // percentage
  status: text("status").notNull().default("pending"), // pending, approved, rejected, executed
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const optimizationHistory = pgTable("optimization_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  recommendationId: varchar("recommendation_id").notNull(),
  executedBy: varchar("executed_by").notNull(),
  executionDate: timestamp("execution_date").notNull(),
  beforeConfig: jsonb("before_config").notNull(),
  afterConfig: jsonb("after_config").notNull(),
  actualSavings: integer("actual_savings"), // Multiplied by 1000, no pennies
  status: text("status").notNull(), // success, failed, in-progress
  errorMessage: text("error_message"),
  slackMessageId: text("slack_message_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const approvalRequests = pgTable("approval_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  recommendationId: varchar("recommendation_id").notNull(),
  requestedBy: varchar("requested_by").notNull(),
  approverRole: text("approver_role").notNull(),
  status: text("status").notNull().default("pending"), // pending, approved, rejected
  approvedBy: varchar("approved_by"),
  approvalDate: timestamp("approval_date"),
  comments: text("comments"),
  slackThreadId: text("slack_thread_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const systemConfig = pgTable("system_config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  description: text("description"),
  updatedBy: varchar("updated_by").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const historicalCostSnapshots = pgTable("historical_cost_snapshots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  snapshotDate: timestamp("snapshot_date").notNull(),
  totalMonthlyCost: integer("total_monthly_cost").notNull(),
  computeCost: integer("compute_cost").notNull(),
  storageCost: integer("storage_cost").notNull(),
  databaseCost: integer("database_cost").notNull(),
  networkCost: integer("network_cost").notNull(),
  otherCost: integer("other_cost").notNull(),
  resourceCount: integer("resource_count").notNull(),
  avgUtilization: decimal("avg_utilization", { precision: 5, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const recommendationsRelations = relations(recommendations, ({ one }) => ({
  resource: one(awsResources, {
    fields: [recommendations.resourceId],
    references: [awsResources.resourceId],
  }),
}));

export const optimizationHistoryRelations = relations(optimizationHistory, ({ one }) => ({
  recommendation: one(recommendations, {
    fields: [optimizationHistory.recommendationId],
    references: [recommendations.id],
  }),
  executedByUser: one(users, {
    fields: [optimizationHistory.executedBy],
    references: [users.id],
  }),
}));

export const approvalRequestsRelations = relations(approvalRequests, ({ one }) => ({
  recommendation: one(recommendations, {
    fields: [approvalRequests.recommendationId],
    references: [recommendations.id],
  }),
  requestedByUser: one(users, {
    fields: [approvalRequests.requestedBy],
    references: [users.id],
  }),
  approvedByUser: one(users, {
    fields: [approvalRequests.approvedBy],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertAwsResourceSchema = createInsertSchema(awsResources).omit({ id: true, createdAt: true });
export const insertCostReportSchema = createInsertSchema(costReports).omit({ id: true, createdAt: true });
export const insertRecommendationSchema = createInsertSchema(recommendations).omit({ id: true, createdAt: true, updatedAt: true });
export const insertOptimizationHistorySchema = createInsertSchema(optimizationHistory).omit({ id: true, createdAt: true });
export const insertApprovalRequestSchema = createInsertSchema(approvalRequests).omit({ id: true, createdAt: true, approvalDate: true });
export const insertSystemConfigSchema = createInsertSchema(systemConfig).omit({ id: true, createdAt: true, updatedAt: true });
export const insertHistoricalCostSnapshotSchema = createInsertSchema(historicalCostSnapshots).omit({ id: true, createdAt: true });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type AwsResource = typeof awsResources.$inferSelect;
export type InsertAwsResource = z.infer<typeof insertAwsResourceSchema>;
export type CostReport = typeof costReports.$inferSelect;
export type InsertCostReport = z.infer<typeof insertCostReportSchema>;
export type Recommendation = typeof recommendations.$inferSelect;
export type InsertRecommendation = z.infer<typeof insertRecommendationSchema>;
export type OptimizationHistory = typeof optimizationHistory.$inferSelect;
export type InsertOptimizationHistory = z.infer<typeof insertOptimizationHistorySchema>;
export type ApprovalRequest = typeof approvalRequests.$inferSelect;
export type InsertApprovalRequest = z.infer<typeof insertApprovalRequestSchema>;
export type SystemConfig = typeof systemConfig.$inferSelect;
export type InsertSystemConfig = z.infer<typeof insertSystemConfigSchema>;
export type HistoricalCostSnapshot = typeof historicalCostSnapshots.$inferSelect;
export type InsertHistoricalCostSnapshot = z.infer<typeof insertHistoricalCostSnapshotSchema>;
