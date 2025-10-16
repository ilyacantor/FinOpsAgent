import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { awsService } from "./services/aws";
import { sendOptimizationComplete } from "./services/slack";
import { insertRecommendationSchema, insertApprovalRequestSchema } from "@shared/schema";
// Import scheduler service to ensure it's instantiated and configuration is initialized
import { schedulerService } from "./services/scheduler.js";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Store connected clients
  const clients = new Set<WebSocket>();

  wss.on('connection', (ws) => {
    clients.add(ws);
    
    ws.on('close', () => {
      clients.delete(ws);
    });
  });

  // Broadcast to all connected clients
  const broadcast = (data: any) => {
    const message = JSON.stringify(data);
    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  };

  // Dashboard metrics endpoint
  app.get("/api/dashboard/metrics", async (req, res) => {
    try {
      const metrics = await storage.getDashboardMetrics();
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching dashboard metrics:", error);
      res.status(500).json({ error: "Failed to fetch dashboard metrics" });
    }
  });

  // Cost trends endpoint
  app.get("/api/dashboard/cost-trends", async (req, res) => {
    try {
      const trends = await storage.getMonthlyCostSummary();
      res.json(trends);
    } catch (error) {
      console.error("Error fetching cost trends:", error);
      res.status(500).json({ error: "Failed to fetch cost trends" });
    }
  });

  // Recommendations endpoints
  app.get("/api/recommendations", async (req, res) => {
    try {
      const status = req.query.status as string | undefined;
      const recommendations = await storage.getRecommendations(status);
      res.json(recommendations);
    } catch (error) {
      console.error("Error fetching recommendations:", error);
      res.status(500).json({ error: "Failed to fetch recommendations" });
    }
  });

  app.get("/api/recommendations/:id", async (req, res) => {
    try {
      const recommendation = await storage.getRecommendation(req.params.id);
      if (!recommendation) {
        return res.status(404).json({ error: "Recommendation not found" });
      }
      res.json(recommendation);
    } catch (error) {
      console.error("Error fetching recommendation:", error);
      res.status(500).json({ error: "Failed to fetch recommendation" });
    }
  });

  app.post("/api/recommendations", async (req, res) => {
    try {
      const validatedData = insertRecommendationSchema.parse(req.body);
      const recommendation = await storage.createRecommendation(validatedData);
      
      // Broadcast new recommendation to connected clients
      broadcast({
        type: 'new_recommendation',
        data: recommendation
      });
      
      res.json(recommendation);
    } catch (error) {
      console.error("Error creating recommendation:", error);
      res.status(400).json({ error: "Failed to create recommendation" });
    }
  });

  // Approval request endpoints
  app.post("/api/approval-requests", async (req, res) => {
    try {
      console.log("Creating approval request with data:", req.body);
      const validatedData = insertApprovalRequestSchema.parse(req.body);
      console.log("Validated data:", validatedData);
      
      // Create approval request with date handling
      const approvalRequestData = {
        ...validatedData,
        ...(req.body.approvalDate && { approvalDate: new Date(req.body.approvalDate) })
      };
      console.log("Final approval request data:", approvalRequestData);
      
      const approvalRequest = await storage.createApprovalRequest(approvalRequestData as any);
      console.log("Created approval request:", approvalRequest);
      
      // If approved, update the recommendation status and create activity entry
      if (req.body.status === 'approved') {
        console.log("Updating recommendation status to approved for:", validatedData.recommendationId);
        await storage.updateRecommendationStatus(validatedData.recommendationId, 'approved');
        
        // Get the recommendation details for the activity entry
        const recommendation = await storage.getRecommendation(validatedData.recommendationId);
        if (recommendation) {
          console.log("Creating activity entry for approval");
          await storage.createOptimizationHistory({
            recommendationId: validatedData.recommendationId,
            executedBy: validatedData.approvedBy || 'system',
            executionDate: new Date(),
            beforeConfig: recommendation.currentConfig as any,
            afterConfig: recommendation.recommendedConfig as any,
            actualSavings: recommendation.projectedMonthlySavings,
            status: 'approved'
          });
        }
      }
      
      // Broadcast approval request to connected clients
      broadcast({
        type: 'approval_request',
        data: approvalRequest
      });
      
      res.json(approvalRequest);
    } catch (error) {
      console.error("Error creating approval request:", error);
      res.status(500).json({ error: "Failed to create approval request" });
    }
  });

  app.patch("/api/approval-requests/:id", async (req, res) => {
    try {
      const { status, approvedBy, comments } = req.body;
      const updateData: any = {
        status,
        approvedBy,
        comments,
      };
      
      if (status === 'approved') {
        updateData.approvalDate = new Date();
      }
      
      const updatedRequest = await storage.updateApprovalRequest(req.params.id, updateData);

      if (!updatedRequest) {
        return res.status(404).json({ error: "Approval request not found" });
      }

      // If approved, execute the optimization
      if (status === 'approved') {
        const recommendation = await storage.getRecommendation(updatedRequest.recommendationId);
        if (recommendation) {
          try {
            await executeOptimization(recommendation);
            await storage.updateRecommendationStatus(recommendation.id, 'executed');
            
            // Broadcast optimization execution
            broadcast({
              type: 'optimization_executed',
              data: { recommendationId: recommendation.id, status: 'success' }
            });
          } catch (error) {
            console.error("Error executing optimization:", error);
            await storage.updateRecommendationStatus(recommendation.id, 'failed');
            
            broadcast({
              type: 'optimization_executed',
              data: { recommendationId: recommendation.id, status: 'failed', error: error instanceof Error ? error.message : String(error) }
            });
          }
        }
      }

      res.json(updatedRequest);
    } catch (error) {
      console.error("Error updating approval request:", error);
      res.status(400).json({ error: "Failed to update approval request" });
    }
  });

  // Bulk approve all pending recommendations
  app.post("/api/approve-all-recommendations", async (req, res) => {
    try {
      console.log("Starting bulk approval of all pending recommendations");
      const { approvedBy = 'current-user', comments } = req.body;
      
      // Get all pending recommendations
      const allRecommendations = await storage.getRecommendations();
      const pendingRecommendations = allRecommendations.filter(r => r.status === 'pending');
      
      if (pendingRecommendations.length === 0) {
        return res.json({ 
          message: "No pending recommendations to approve",
          approvedCount: 0,
          recommendations: []
        });
      }

      console.log(`Found ${pendingRecommendations.length} pending recommendations to approve`);
      
      const approvedRecommendations = [];
      const errors = [];

      // Process each pending recommendation
      for (const recommendation of pendingRecommendations) {
        try {
          // Create approval request
          const approvalRequest = await storage.createApprovalRequest({
            recommendationId: recommendation.id,
            requestedBy: approvedBy,
            approverRole: 'Head of Cloud Platform',
            status: 'approved',
            approvedBy,
            comments: comments || `Bulk approved with ${pendingRecommendations.length - 1} other recommendations`,
            approvalDate: new Date()
          } as any);

          // Update recommendation status
          await storage.updateRecommendationStatus(recommendation.id, 'approved');

          // Create optimization history entry
          await storage.createOptimizationHistory({
            recommendationId: recommendation.id,
            executedBy: approvedBy,
            executionDate: new Date(),
            beforeConfig: recommendation.currentConfig as any,
            afterConfig: recommendation.recommendedConfig as any,
            actualSavings: recommendation.projectedMonthlySavings,
            status: 'approved'
          });

          approvedRecommendations.push({
            id: recommendation.id,
            title: recommendation.title,
            projectedAnnualSavings: recommendation.projectedAnnualSavings
          });

          console.log(`Successfully approved recommendation: ${recommendation.title}`);
        } catch (error) {
          console.error(`Error approving recommendation ${recommendation.id}:`, error);
          errors.push({
            recommendationId: recommendation.id,
            title: recommendation.title,
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }

      // Broadcast bulk approval to connected clients  
      broadcast({
        type: 'bulk_approval',
        data: { 
          approvedCount: approvedRecommendations.length,
          totalAttempted: pendingRecommendations.length,
          errors: errors.length
        }
      });

      const totalSavings = approvedRecommendations.reduce((sum, rec) => sum + Number(rec.projectedAnnualSavings), 0);

      res.json({
        message: `Successfully approved ${approvedRecommendations.length} of ${pendingRecommendations.length} pending recommendations`,
        approvedCount: approvedRecommendations.length,
        totalAttempted: pendingRecommendations.length,
        totalAnnualSavings: totalSavings,
        recommendations: approvedRecommendations,
        errors
      });

      console.log(`Bulk approval completed: ${approvedRecommendations.length}/${pendingRecommendations.length} successful`);
    } catch (error) {
      console.error("Error in bulk approval:", error);
      res.status(500).json({ error: "Failed to approve recommendations" });
    }
  });

  // Optimization history endpoint
  app.get("/api/optimization-history", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const history = await storage.getOptimizationHistory(limit);
      res.json(history);
    } catch (error) {
      console.error("Error fetching optimization history:", error);
      res.status(500).json({ error: "Failed to fetch optimization history" });
    }
  });

  // AWS resources endpoint
  app.get("/api/aws-resources", async (req, res) => {
    try {
      const resources = await storage.getAllAwsResources();
      res.json(resources);
    } catch (error) {
      console.error("Error fetching AWS resources:", error);
      res.status(500).json({ error: "Failed to fetch AWS resources" });
    }
  });

  // Manual analysis trigger
  app.post("/api/analyze-resources", async (req, res) => {
    try {
      // Trigger analysis for specific resource type or all
      const { resourceType, resourceId } = req.body;
      
      if (resourceType === 'redshift' && resourceId) {
        const analysis = await awsService.analyzeRedshiftClusterOptimization(resourceId);
        res.json(analysis);
      } else {
        res.status(400).json({ error: "Invalid analysis request" });
      }
    } catch (error) {
      console.error("Error analyzing resources:", error);
      res.status(500).json({ error: "Failed to analyze resources" });
    }
  });

  // AWS Data Simulation endpoints
  app.post("/api/generate-aws-data", async (req, res) => {
    try {
      const { DataGenerator } = await import('./services/data-generator.js');
      const generator = new DataGenerator(storage);
      const result = await generator.generateAWSData();
      res.json(result);
    } catch (error) {
      console.error("Error generating AWS data:", error);
      res.status(500).json({ error: "Failed to generate AWS data" });
    }
  });

  app.post("/api/clear-simulation-data", async (req, res) => {
    try {
      const { DataGenerator } = await import('./services/data-generator.js');
      const generator = new DataGenerator(storage);
      await generator.clearAllData();
      res.json({ message: "Simulation data cleared" });
    } catch (error) {
      console.error("Error clearing simulation data:", error);
      res.status(500).json({ error: "Failed to clear simulation data" });
    }
  });

  // Basic auth check (simplified - in production use proper auth middleware)
  const requireAuth = (req: any, res: any, next: any) => {
    // TODO: Implement proper authentication/authorization
    // For now, just log the access attempt
    console.log('Configuration access attempt from:', req.ip);
    next();
  };

  // System Configuration Routes
  app.get("/api/system-config", requireAuth, async (req, res) => {
    try {
      const configs = await storage.getAllSystemConfig();
      res.json(configs);
    } catch (error) {
      console.error("Error fetching system config:", error);
      res.status(500).json({ error: "Failed to fetch system configuration" });
    }
  });

  app.get("/api/system-config/:key", requireAuth, async (req, res) => {
    try {
      const config = await storage.getSystemConfig(req.params.key);
      if (!config) {
        return res.status(404).json({ error: "Configuration not found" });
      }
      res.json(config);
    } catch (error) {
      console.error("Error fetching system config:", error);
      res.status(500).json({ error: "Failed to fetch system configuration" });
    }
  });

  app.post("/api/system-config", requireAuth, async (req, res) => {
    try {
      const { insertSystemConfigSchema } = await import("@shared/schema");
      const validatedData = insertSystemConfigSchema.parse(req.body);
      const config = await storage.setSystemConfig(validatedData);
      res.json(config);
    } catch (error) {
      console.error("Error setting system config:", error);
      res.status(500).json({ error: "Failed to set system configuration" });
    }
  });

  app.put("/api/system-config/:key", requireAuth, async (req, res) => {
    try {
      const { value, updatedBy } = req.body;
      
      // Basic validation for numeric values
      if (req.params.key.includes('risk_level') || req.params.key.includes('savings')) {
        const numValue = parseFloat(value);
        if (isNaN(numValue) || numValue < 0) {
          return res.status(400).json({ error: "Invalid numeric value" });
        }
      }
      
      const config = await storage.updateSystemConfig(req.params.key, value, updatedBy || 'system');
      if (!config) {
        return res.status(404).json({ error: "Configuration not found" });
      }

      // Invalidate configuration service cache when system config is updated
      const { configService } = await import('./services/config.js');
      configService.invalidateCache();
      
      res.json(config);
    } catch (error) {
      console.error("Error updating system config:", error);
      res.status(500).json({ error: "Failed to update system configuration" });
    }
  });

  // Agent Configuration Helper Routes
  app.get("/api/agent-config", requireAuth, async (req, res) => {
    try {
      const { configService } = await import('./services/config.js');
      const agentConfig = await configService.getAgentConfig();
      res.json(agentConfig);
    } catch (error) {
      console.error("Error fetching agent config:", error);
      res.status(500).json({ error: "Failed to fetch agent configuration" });
    }
  });

  app.post("/api/agent-config/autonomous-mode", requireAuth, async (req, res) => {
    try {
      const { enabled, updatedBy } = req.body;
      
      if (typeof enabled !== 'boolean') {
        return res.status(400).json({ error: "Enabled must be a boolean value" });
      }
      
      const { configService } = await import('./services/config.js');
      await configService.setAutonomousMode(enabled, updatedBy || 'system');
      const agentConfig = await configService.getAgentConfig();
      
      // Broadcast configuration change to connected clients
      broadcast({
        type: 'agent_config_updated',
        data: { autonomousMode: enabled, updatedBy }
      });
      
      res.json(agentConfig);
    } catch (error) {
      console.error("Error updating autonomous mode:", error);
      res.status(500).json({ error: "Failed to update autonomous mode" });
    }
  });

  app.post("/api/agent-config/prod-mode", requireAuth, async (req, res) => {
    try {
      const { enabled, updatedBy } = req.body;
      
      if (typeof enabled !== 'boolean') {
        return res.status(400).json({ error: "Enabled must be a boolean value" });
      }
      
      const { configService } = await import('./services/config.js');
      await configService.setProdMode(enabled, updatedBy || 'system');
      const agentConfig = await configService.getAgentConfig();
      
      // Broadcast configuration change to connected clients
      broadcast({
        type: 'agent_config_updated',
        data: { prodMode: enabled, updatedBy }
      });
      
      res.json(agentConfig);
    } catch (error) {
      console.error("Error updating prod mode:", error);
      res.status(500).json({ error: "Failed to update prod mode" });
    }
  });

  // Manual AI analysis trigger endpoint
  app.post("/api/ai/analyze", async (req, res) => {
    try {
      console.log('🤖 Manual AI analysis triggered...');
      
      // Trigger AI analysis manually (useful for testing)
      schedulerService.triggerAIAnalysis().catch(err => {
        console.error('AI analysis error:', err);
      });
      
      res.json({ 
        success: true, 
        message: 'AI analysis started. Check logs for progress.' 
      });
    } catch (error) {
      console.error("Error triggering AI analysis:", error);
      res.status(500).json({ error: "Failed to trigger AI analysis" });
    }
  });

  // Execute optimization function
  async function executeOptimization(recommendation: any) {
    try {
      let result;
      
      if (recommendation.type === 'resize' && recommendation.resourceId.includes('redshift')) {
        // Execute Redshift cluster resize
        const config = recommendation.recommendedConfig;
        result = await awsService.resizeRedshiftCluster(
          recommendation.resourceId,
          config.nodeType,
          config.numberOfNodes
        );
        
        // Record the optimization in history
        await storage.createOptimizationHistory({
          recommendationId: recommendation.id,
          executedBy: 'system', // In a real app, this would be the current user
          executionDate: new Date(),
          beforeConfig: recommendation.currentConfig,
          afterConfig: recommendation.recommendedConfig,
          actualSavings: recommendation.projectedMonthlySavings,
          status: 'success'
        });

        // Send Slack notification
        await sendOptimizationComplete({
          title: recommendation.title,
          resourceId: recommendation.resourceId,
          actualSavings: Number(recommendation.projectedMonthlySavings),
          status: 'success'
        });
      }
      
      return result;
    } catch (error) {
      // Record failed optimization
      await storage.createOptimizationHistory({
        recommendationId: recommendation.id,
        executedBy: 'system',
        executionDate: new Date(),
        beforeConfig: recommendation.currentConfig,
        afterConfig: recommendation.recommendedConfig,
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : String(error)
      });

      await sendOptimizationComplete({
        title: recommendation.title,
        resourceId: recommendation.resourceId,
        actualSavings: 0,
        status: 'failed'
      });

      throw error;
    }
  }

  return httpServer;
}
