import cron from 'node-cron';
import { awsService } from './aws';
import { sendOptimizationRecommendation, sendOptimizationComplete } from './slack';
import { storage } from '../storage';
import { configService } from './config';
import { geminiAI } from './gemini-ai';
import { syntheticDataGenerator } from './synthetic-data';

export class SchedulerService {
  constructor() {
    this.initializeScheduledTasks();
    this.initializeConfiguration();
    this.initializeSyntheticData();
  }

  private async initializeConfiguration() {
    try {
      await configService.initializeDefaults();
      console.log('✅ Agent configuration initialized');
    } catch (error) {
      console.error('❌ Failed to initialize agent configuration:', error);
    }
  }

  private async initializeSyntheticData() {
    try {
      const config = await configService.getAgentConfig();
      if (config.simulationMode) {
        console.log('📊 Simulation Mode is ON - initializing synthetic dataset...');
        await syntheticDataGenerator.generateInitialDataset();
      }
    } catch (error) {
      console.error('❌ Failed to initialize synthetic data:', error);
    }
  }

  private initializeScheduledTasks() {
    // Resource analysis every 6 hours - checks Prod Mode to decide AI vs Heuristics
    cron.schedule('0 */6 * * *', async () => {
      await this.runResourceAnalysis();
    });

    // Sync cost data daily at 2 AM
    cron.schedule('0 2 * * *', async () => {
      console.log('Running daily cost data sync...');
      await this.syncCostData();
    });

    // Check Trusted Advisor recommendations weekly
    cron.schedule('0 3 * * 0', async () => {
      console.log('Running weekly Trusted Advisor check...');
      await this.checkTrustedAdvisor();
    });

    // Optimized: Evolve synthetic data every 30 minutes when simulation mode is ON (reduced frequency)
    cron.schedule('*/30 * * * *', async () => {
      const config = await configService.getAgentConfig();
      if (config.simulationMode) {
        console.log('📊 [SIMULATION MODE] Evolving synthetic resource data...');
        await syntheticDataGenerator.evolveResources();
      }
    });

    // Optimized: Add new synthetic resources occasionally (every 4 hours) when simulation mode is ON
    cron.schedule('0 */4 * * *', async () => {
      const config = await configService.getAgentConfig();
      if (config.simulationMode && Math.random() > 0.5) { // 50% chance
        console.log('📊 [SIMULATION MODE] Adding new synthetic resource...');
        await syntheticDataGenerator.addNewResource();
      }
    });

    // Mark terminated resources daily when simulation mode is ON
    cron.schedule('0 4 * * *', async () => {
      const config = await configService.getAgentConfig();
      if (config.simulationMode) {
        console.log('📊 [SIMULATION MODE] Checking for resources to terminate...');
        await syntheticDataGenerator.markTerminatedResources();
      }
    });
  }

  // Determines which analysis method to use based on Prod Mode configuration
  private async runResourceAnalysis() {
    const config = await configService.getAgentConfig();
    
    if (config.prodMode) {
      console.log('🚀 [PROD MODE ON] Running AI-powered analysis with Gemini 2.5 Flash + RAG...');
      await this.analyzeWithAI();
    } else {
      console.log('⚙️ [PROD MODE OFF] Running heuristics-based analysis...');
      await this.analyzeAWSResources();
    }
  }

  private async analyzeAWSResources() {
    try {
      // Analyze Redshift clusters
      const clusters = await awsService.getRedshiftClusters();
      
      for (const cluster of clusters) {
        if (!cluster.ClusterIdentifier) continue;
        
        const analysis = await awsService.analyzeRedshiftClusterOptimization(cluster.ClusterIdentifier);
        
        if (analysis.recommendation) {
          // Check if we already have a pending recommendation for this resource
          const existingRecommendations = await storage.getRecommendations('pending');
          const hasExisting = existingRecommendations.some(r => r.resourceId === cluster.ClusterIdentifier);
          
          if (!hasExisting) {
            // Create new recommendation
            const recommendation = await storage.createRecommendation({
              resourceId: cluster.ClusterIdentifier,
              type: 'resize',
              priority: analysis.recommendation.avgUtilization < 25 ? 'critical' : 'high',
              title: 'Redshift Cluster Over-provisioned',
              description: `Cluster running at ${analysis.recommendation.avgUtilization.toFixed(1)}% average utilization. Recommend resizing from ${analysis.recommendation.currentNodeType} to ${analysis.recommendation.recommendedNodeType}.`,
              currentConfig: {
                nodeType: analysis.recommendation.currentNodeType,
                numberOfNodes: analysis.recommendation.currentNodes,
                utilization: analysis.recommendation.avgUtilization
              },
              recommendedConfig: {
                nodeType: analysis.recommendation.recommendedNodeType,
                numberOfNodes: analysis.recommendation.recommendedNodes
              },
              projectedMonthlySavings: analysis.recommendation.projectedSavings.monthly.toString(),
              projectedAnnualSavings: analysis.recommendation.projectedSavings.annual.toString(),
              riskLevel: analysis.recommendation.avgUtilization < 25 ? '5' : '10'
            });

            // Check if we can execute autonomously
            const canExecuteAutonomously = await configService.canExecuteAutonomously({
              type: recommendation.type,
              riskLevel: recommendation.riskLevel,
              projectedAnnualSavings: recommendation.projectedAnnualSavings
            });

            if (canExecuteAutonomously) {
              // Execute immediately in autonomous mode
              try {
                await this.executeOptimization(recommendation);
                await storage.updateRecommendationStatus(recommendation.id, 'executed');

                // Send Slack notification about autonomous execution
                await sendOptimizationComplete({
                  title: `[AUTONOMOUS] ${recommendation.title}`,
                  resourceId: recommendation.resourceId,
                  actualSavings: Number(recommendation.projectedMonthlySavings),
                  status: 'success'
                });

                console.log(`🤖 Autonomously executed recommendation: ${recommendation.title}`);
              } catch (error) {
                await storage.updateRecommendationStatus(recommendation.id, 'failed');
                
                // Create failed optimization history entry
                await storage.createOptimizationHistory({
                  recommendationId: recommendation.id,
                  executedBy: 'autonomous-agent',
                  executionDate: new Date(),
                  beforeConfig: recommendation.currentConfig as any,
                  afterConfig: recommendation.recommendedConfig as any,
                  status: 'failed',
                  errorMessage: error instanceof Error ? error.message : String(error)
                });

                // Send failure notification
                await sendOptimizationComplete({
                  title: `[AUTONOMOUS] ${recommendation.title}`,
                  resourceId: recommendation.resourceId,
                  actualSavings: 0,
                  status: 'failed'
                });

                console.error(`❌ Autonomous execution failed for ${recommendation.id}:`, error);
              }
            } else {
              // Send traditional notification requiring approval
              await sendOptimizationRecommendation({
                title: recommendation.title,
                description: recommendation.description,
                resourceId: recommendation.resourceId,
                projectedMonthlySavings: Number(recommendation.projectedMonthlySavings),
                projectedAnnualSavings: Number(recommendation.projectedAnnualSavings),
                priority: recommendation.priority,
                recommendationId: recommendation.id
              });
            }
          }
        }

        // Update resource in database
        await storage.createAwsResource({
          resourceId: cluster.ClusterIdentifier,
          resourceType: 'Redshift',
          region: cluster.AvailabilityZone?.slice(0, -1) || 'us-east-1',
          currentConfig: {
            nodeType: cluster.NodeType,
            numberOfNodes: cluster.NumberOfNodes,
            clusterStatus: cluster.ClusterStatus
          },
          utilizationMetrics: {
            avgCpuUtilization: analysis.utilization
          },
          monthlyCost: analysis.recommendation?.projectedSavings ? 
            (analysis.recommendation.projectedSavings.monthly + Number(analysis.recommendation.projectedSavings.monthly)).toString() : 
            undefined
        });
      }
    } catch (error) {
      console.error('Error analyzing AWS resources:', error);
    }
  }

  // Public method to trigger analysis manually - respects Prod Mode setting
  public async triggerAnalysis() {
    await this.runResourceAnalysis();
  }

  // Backward compatibility: public method to trigger AI analysis manually
  public async triggerAIAnalysis() {
    await this.analyzeWithAI();
  }

  private async analyzeWithAI() {
    try {
      console.log('🤖 Starting AI-powered resource analysis with Gemini 2.5 Flash...');
      
      // Get all AWS resources from database
      const allResources = await storage.getAllAwsResources();
      
      if (allResources.length === 0) {
        console.log('No resources found to analyze');
        return;
      }

      console.log(`Analyzing ${allResources.length} resources with AI...`);
      
      // Use Gemini AI to analyze resources and generate recommendations
      const aiRecommendations = await geminiAI.analyzeResourcesForOptimization(allResources);
      
      console.log(`🎯 AI generated ${aiRecommendations.length} recommendations`);
      
      for (const aiRec of aiRecommendations) {
        // Check if we already have a pending recommendation for this resource
        const existingRecommendations = await storage.getRecommendations('pending');
        const hasExisting = existingRecommendations.some(r => r.resourceId === aiRec.resourceId);
        
        if (!hasExisting) {
          // Create new AI-powered recommendation
          const recommendation = await storage.createRecommendation(aiRec);
          
          console.log(`✨ Created AI recommendation: ${recommendation.title}`);

          // Check if we can execute autonomously
          const canExecuteAutonomously = await configService.canExecuteAutonomously({
            type: recommendation.type,
            riskLevel: recommendation.riskLevel,
            projectedAnnualSavings: recommendation.projectedAnnualSavings
          });

          if (canExecuteAutonomously) {
            // Execute immediately in autonomous mode
            try {
              await this.executeOptimization(recommendation);
              await storage.updateRecommendationStatus(recommendation.id, 'executed');

              // Send Slack notification about autonomous execution
              await sendOptimizationComplete({
                title: `[AI AUTONOMOUS] ${recommendation.title}`,
                resourceId: recommendation.resourceId,
                actualSavings: Number(recommendation.projectedMonthlySavings),
                status: 'success'
              });

              console.log(`🤖 AI-powered autonomous execution: ${recommendation.title}`);
            } catch (error) {
              await storage.updateRecommendationStatus(recommendation.id, 'failed');
              
              // Create failed optimization history entry
              await storage.createOptimizationHistory({
                recommendationId: recommendation.id,
                executedBy: 'gemini-ai-agent',
                executionDate: new Date(),
                beforeConfig: recommendation.currentConfig as any,
                afterConfig: recommendation.recommendedConfig as any,
                status: 'failed',
                errorMessage: error instanceof Error ? error.message : String(error)
              });

              console.error(`❌ AI autonomous execution failed for ${recommendation.id}:`, error);
            }
          } else {
            // Send notification requiring approval
            await sendOptimizationRecommendation({
              title: `[AI] ${recommendation.title}`,
              description: recommendation.description,
              resourceId: recommendation.resourceId,
              projectedMonthlySavings: Number(recommendation.projectedMonthlySavings),
              projectedAnnualSavings: Number(recommendation.projectedAnnualSavings),
              priority: recommendation.priority,
              recommendationId: recommendation.id
            });
            
            console.log(`📧 Sent AI recommendation for approval: ${recommendation.title}`);
          }
        }
      }
      
      console.log('✅ AI analysis completed successfully');
    } catch (error) {
      console.error('❌ Error in AI-powered analysis:', error);
    }
  }

  private async syncCostData() {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7); // Last 7 days

      const costData = await awsService.getCostAndUsageReports(
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      );

      for (const timeResult of costData) {
        if (!timeResult.Groups) continue;
        
        const reportDate = new Date(timeResult.TimePeriod?.Start || '');
        
        for (const group of timeResult.Groups) {
          const service = group.Keys?.[0] || 'Unknown';
          const cost = parseFloat(group.Metrics?.BlendedCost?.Amount || '0');
          const usage = parseFloat(group.Metrics?.UsageQuantity?.Amount || '0');
          
          if (cost > 0) {
            await storage.createCostReport({
              reportDate,
              serviceCategory: service,
              cost: cost.toString(),
              usage: usage.toString(),
              usageType: group.Metrics?.UsageQuantity?.Unit || 'Unknown',
              region: 'us-east-1' // Default region
            });
          }
        }
      }
    } catch (error) {
      console.error('Error syncing cost data:', error);
    }
  }

  private async checkTrustedAdvisor() {
    try {
      const checks = await awsService.getTrustedAdvisorChecks();
      
      for (const check of checks) {
        if (check.result && (check.result.status === 'error' || check.result.status === 'warning')) {
          console.log(`Trusted Advisor alert: ${check.name} - ${check.result.status}`);
          
          // Process flagged resources
          if (check.result.flaggedResources) {
            for (const resource of check.result.flaggedResources) {
              // Create recommendations based on Trusted Advisor findings
              // This would need more specific logic based on check type
              console.log('Flagged resource:', resource);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error checking Trusted Advisor:', error);
    }
  }

  private async executeOptimization(recommendation: any) {
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
          executedBy: 'autonomous-agent',
          executionDate: new Date(),
          beforeConfig: recommendation.currentConfig,
          afterConfig: recommendation.recommendedConfig,
          actualSavings: recommendation.projectedMonthlySavings,
          status: 'success'
        });
      }
      
      return result;
    } catch (error) {
      // Record failed optimization
      await storage.createOptimizationHistory({
        recommendationId: recommendation.id,
        executedBy: 'autonomous-agent',
        executionDate: new Date(),
        beforeConfig: recommendation.currentConfig,
        afterConfig: recommendation.recommendedConfig,
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : String(error)
      });

      throw error;
    }
  }
}

export const schedulerService = new SchedulerService();
