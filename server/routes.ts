import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { awsService } from "./services/aws";
import { sendOptimizationComplete } from "./services/slack";
import { insertRecommendationSchema, insertApprovalRequestSchema } from "@shared/schema";

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
      const validatedData = insertApprovalRequestSchema.parse(req.body);
      const approvalRequest = await storage.createApprovalRequest(validatedData);
      
      // Broadcast approval request to connected clients
      broadcast({
        type: 'approval_request',
        data: approvalRequest
      });
      
      res.json(approvalRequest);
    } catch (error) {
      console.error("Error creating approval request:", error);
      res.status(400).json({ error: "Failed to create approval request" });
    }
  });

  app.patch("/api/approval-requests/:id", async (req, res) => {
    try {
      const { status, approvedBy, comments } = req.body;
      const updatedRequest = await storage.updateApprovalRequest(req.params.id, {
        status,
        approvedBy,
        comments,
        approvalDate: status === 'approved' ? new Date() : undefined
      });

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
