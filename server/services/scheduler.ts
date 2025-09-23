import cron from 'node-cron';
import { awsService } from './aws';
import { sendOptimizationRecommendation, sendOptimizationComplete } from './slack';
import { storage } from '../storage';
import { configService } from './config';

export class SchedulerService {
  constructor() {
    this.initializeScheduledTasks();
    this.initializeConfiguration();
  }

  private async initializeConfiguration() {
    try {
      await configService.initializeDefaults();
      console.log('✅ Agent configuration initialized');
    } catch (error) {
      console.error('❌ Failed to initialize agent configuration:', error);
    }
  }

  private initializeScheduledTasks() {
    // Analyze AWS resources every 6 hours
    cron.schedule('0 */6 * * *', async () => {
      console.log('Running scheduled AWS resource analysis...');
      await this.analyzeAWSResources();
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
