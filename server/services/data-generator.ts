import { nanoid } from 'nanoid';
import type { IStorage } from '../storage.js';

export class DataGenerator {
  private storage: IStorage;

  constructor(storage: IStorage) {
    this.storage = storage;
  }

  async generateAWSData() {
    console.log('🚀 Starting AWS data simulation...');

    // Generate AWS resources
    const resources = await this.generateAWSResources();
    console.log(`✅ Generated ${resources.length} AWS resources`);

    // Generate cost data for the past 6 months
    await this.generateCostData();
    console.log('✅ Generated cost data for past 6 months');

    // Generate recommendations based on resources
    const recommendations = await this.generateRecommendations(resources);
    console.log(`✅ Generated ${recommendations.length} recommendations`);

    // Generate some optimization history
    await this.generateOptimizationHistory();
    console.log('✅ Generated optimization history');

    console.log('🎉 AWS simulation data generation complete!');

    return {
      resourcesCount: resources.length,
      recommendationsCount: recommendations.length,
      message: 'AWS simulation data generated successfully'
    };
  }

  private async generateAWSResources() {
    const resources = [];

    // EC2 Instances
    const ec2Instances = [
      {
        resourceId: `i-${nanoid(17)}`, // Unique EC2 instance ID
        resourceType: 'EC2',
        region: 'us-east-1',
        currentConfig: JSON.stringify({
          instanceType: 'm5.2xlarge',
          vcpus: 8,
          memory: '32 GiB',
          storage: 'EBS-optimized'
        }),
        utilizationMetrics: JSON.stringify({
          cpuUtilization: 25.5,
          memoryUtilization: 40.2,
          networkIn: 1024.5,
          networkOut: 2048.1
        }),
        monthlyCost: '245.76',
        tags: JSON.stringify({
          Environment: 'production',
          Team: 'backend',
          Project: 'web-api'
        })
      },
      {
        resourceId: `i-${nanoid(17)}`, // Unique EC2 instance ID
        resourceType: 'EC2',
        region: 'us-west-2',
        currentConfig: JSON.stringify({
          instanceType: 't3.large',
          vcpus: 2,
          memory: '8 GiB',
          storage: 'EBS-optimized'
        }),
        utilizationMetrics: JSON.stringify({
          cpuUtilization: 85.3,
          memoryUtilization: 75.8,
          networkIn: 512.3,
          networkOut: 1024.7
        }),
        monthlyCost: '67.32',
        tags: JSON.stringify({
          Environment: 'development',
          Team: 'frontend',
          Project: 'web-ui'
        })
      },
      {
        resourceId: `i-${nanoid(17)}`, // Unique EC2 instance ID
        resourceType: 'EC2',
        region: 'us-east-1',
        currentConfig: JSON.stringify({
          instanceType: 'c5.4xlarge',
          vcpus: 16,
          memory: '32 GiB',
          storage: 'EBS-optimized'
        }),
        utilizationMetrics: JSON.stringify({
          cpuUtilization: 12.1,
          memoryUtilization: 18.5,
          networkIn: 256.1,
          networkOut: 512.3
        }),
        monthlyCost: '501.12',
        tags: JSON.stringify({
          Environment: 'production',
          Team: 'data',
          Project: 'analytics'
        })
      }
    ];

    // RDS Instances
    const rdsInstances = [
      {
        resourceId: `db-${nanoid(12)}`, // Unique RDS instance ID
        resourceType: 'RDS',
        region: 'us-east-1',
        currentConfig: JSON.stringify({
          engine: 'mysql',
          instanceClass: 'db.r5.xlarge',
          allocatedStorage: 500,
          storageType: 'gp2'
        }),
        utilizationMetrics: JSON.stringify({
          cpuUtilization: 45.2,
          connections: 125,
          readLatency: 0.002,
          writeLatency: 0.005
        }),
        monthlyCost: '412.50',
        tags: JSON.stringify({
          Environment: 'production',
          Team: 'backend',
          Project: 'web-api'
        })
      },
      {
        resourceId: `db-${nanoid(12)}`, // Unique RDS instance ID
        resourceType: 'RDS',
        region: 'us-west-2',
        currentConfig: JSON.stringify({
          engine: 'postgres',
          instanceClass: 'db.t3.medium',
          allocatedStorage: 100,
          storageType: 'gp2'
        }),
        utilizationMetrics: JSON.stringify({
          cpuUtilization: 15.8,
          connections: 12,
          readLatency: 0.001,
          writeLatency: 0.003
        }),
        monthlyCost: '89.25',
        tags: JSON.stringify({
          Environment: 'development',
          Team: 'backend',
          Project: 'web-api'
        })
      }
    ];

    // S3 Buckets
    const s3Buckets = [
      {
        resourceId: `bucket-${nanoid(12)}`, // Unique S3 bucket ID
        resourceType: 'S3',
        region: 'us-east-1',
        currentConfig: JSON.stringify({
          storageClass: 'STANDARD',
          sizeGB: 2500,
          objectCount: 125000,
          versioning: true
        }),
        utilizationMetrics: JSON.stringify({
          getRequests: 50000,
          putRequests: 5000,
          dataTransferOut: 100.5
        }),
        monthlyCost: '57.38',
        tags: JSON.stringify({
          Environment: 'production',
          Team: 'devops',
          Project: 'backup'
        })
      },
      {
        resourceId: `bucket-${nanoid(12)}`, // Unique S3 bucket ID
        resourceType: 'S3',
        region: 'us-east-1',
        currentConfig: JSON.stringify({
          storageClass: 'STANDARD',
          sizeGB: 450,
          objectCount: 25000,
          versioning: false
        }),
        utilizationMetrics: JSON.stringify({
          getRequests: 500000,
          putRequests: 1000,
          dataTransferOut: 1500.2
        }),
        monthlyCost: '23.67',
        tags: JSON.stringify({
          Environment: 'production',
          Team: 'frontend',
          Project: 'web-ui'
        })
      }
    ];

    // Load Balancers
    const loadBalancers = [
      {
        resourceId: `alb-${nanoid(10)}`, // Unique ALB resource ID
        resourceType: 'ALB',
        region: 'us-east-1',
        currentConfig: JSON.stringify({
          type: 'application',
          scheme: 'internet-facing',
          targets: 3
        }),
        utilizationMetrics: JSON.stringify({
          requestCount: 2500000,
          targetResponseTime: 0.045,
          healthyTargets: 3
        }),
        monthlyCost: '22.50',
        tags: JSON.stringify({
          Environment: 'production',
          Team: 'devops',
          Project: 'web-api'
        })
      }
    ];

    const allResources = [...ec2Instances, ...rdsInstances, ...s3Buckets, ...loadBalancers];

    for (const resource of allResources) {
      const created = await this.storage.createAwsResource({
        ...resource,
        lastAnalyzed: new Date()
      });
      resources.push(created);
    }

    return resources;
  }

  private async generateCostData() {
    const services = [
      'EC2-Instance', 'RDS', 'S3', 'ELB', 'CloudWatch', 'Route53', 
      'CloudFront', 'Lambda', 'EBS', 'Data Transfer'
    ];

    // Generate data for past 6 months
    for (let monthsBack = 6; monthsBack >= 0; monthsBack--) {
      const reportDate = new Date();
      reportDate.setMonth(reportDate.getMonth() - monthsBack);
      reportDate.setDate(1); // First of month
      
      for (const service of services) {
        const baseCost = this.getBaseCostForService(service);
        // Add some randomness (±20%)
        const variation = (Math.random() - 0.5) * 0.4;
        const cost = baseCost * (1 + variation);
        
        await this.storage.createCostReport({
          reportDate,
          serviceCategory: service,
          cost: cost.toFixed(2),
          usage: this.generateUsageForService(service),
          usageType: this.getUsageTypeForService(service),
          region: ['us-east-1', 'us-west-2', 'eu-west-1'][Math.floor(Math.random() * 3)]
        });
      }
    }
  }

  private getBaseCostForService(service: string): number {
    const baseCosts: { [key: string]: number } = {
      'EC2-Instance': 814.0,
      'RDS': 501.75,
      'S3': 81.05,
      'ELB': 22.50,
      'CloudWatch': 15.25,
      'Route53': 12.00,
      'CloudFront': 45.30,
      'Lambda': 8.75,
      'EBS': 125.40,
      'Data Transfer': 89.60
    };
    return baseCosts[service] || 50.0;
  }

  private generateUsageForService(service: string): string {
    const usageRanges: { [key: string]: [number, number] } = {
      'EC2-Instance': [500, 1000],
      'RDS': [200, 500],
      'S3': [1000, 5000],
      'ELB': [50, 200],
      'CloudWatch': [10000, 50000],
      'Route53': [100000, 500000], // Reduced to fit precision 12, scale 6
      'CloudFront': [10000, 100000],
      'Lambda': [50000, 500000], // Reduced to fit precision 12, scale 6
      'EBS': [1000, 10000],
      'Data Transfer': [100, 1000]
    };

    const [min, max] = usageRanges[service] || [100, 1000];
    return (Math.random() * (max - min) + min).toFixed(2);
  }

  private getUsageTypeForService(service: string): string {
    const usageTypes: { [key: string]: string } = {
      'EC2-Instance': 'Instance-Hours',
      'RDS': 'Instance-Hours',
      'S3': 'GB-Month',
      'ELB': 'LoadBalancer-Hours',
      'CloudWatch': 'Requests',
      'Route53': 'Queries',
      'CloudFront': 'Requests',
      'Lambda': 'Invocations',
      'EBS': 'GB-Month',
      'Data Transfer': 'GB'
    };
    return usageTypes[service] || 'Units';
  }

  private async generateRecommendations(resources: any[]) {
    const recommendations = [];

    // Recommendation 1: Downsize over-provisioned EC2
    const overProvisionedEC2 = resources.find(r => 
      r.resourceType === 'EC2' && 
      r.currentConfig.instanceType === 'c5.4xlarge'
    );

    if (overProvisionedEC2) {
      recommendations.push({
        resourceId: overProvisionedEC2.resourceId,
        type: 'resize',
        priority: 'high',
        title: 'Downsize Over-Provisioned EC2 Instance',
        description: 'This c5.4xlarge instance shows low CPU (12%) and memory (18%) utilization. Consider downsizing to c5.xlarge to reduce costs without impacting performance.',
        currentConfig: overProvisionedEC2.currentConfig,
        recommendedConfig: JSON.stringify({
          instanceType: 'c5.xlarge',
          vcpus: 4,
          memory: '8 GiB',
          storage: 'EBS-optimized'
        }),
        projectedMonthlySavings: '250.56',
        projectedAnnualSavings: (250.56 * 12).toFixed(2),
        riskLevel: '15.5',
        status: 'pending'
      });
    }

    // Recommendation 2: Move S3 to cheaper storage class
    const s3Bucket = resources.find(r => 
      r.resourceType === 'S3' &&
      r.currentConfig.sizeGB >= 2000 // Find the large backup bucket
    );

    if (s3Bucket) {
      recommendations.push({
        resourceId: s3Bucket.resourceId,
        type: 'storage-class',
        priority: 'medium',
        title: 'Migrate Backup Data to S3 Intelligent Tiering',
        description: 'Your backup bucket contains 2.5TB of data that could benefit from S3 Intelligent Tiering to automatically move objects to cheaper storage classes.',
        currentConfig: s3Bucket.currentConfig,
        recommendedConfig: JSON.stringify({
          storageClass: 'INTELLIGENT_TIERING',
          sizeGB: 2500,
          objectCount: 125000,
          versioning: true
        }),
        projectedMonthlySavings: '17.21',
        projectedAnnualSavings: (17.21 * 12).toFixed(2),
        riskLevel: '5.0',
        status: 'pending'
      });
    }

    // Recommendation 3: Reserved Instance opportunity
    const prodEC2 = resources.find(r => 
      r.resourceType === 'EC2' && 
      r.currentConfig.instanceType === 'm5.2xlarge'
    );

    if (prodEC2) {
      recommendations.push({
        resourceId: prodEC2.resourceId,
        type: 'reserved-instance',
        priority: 'medium',
        title: 'Purchase Reserved Instance for Production Workload',
        description: 'This production m5.2xlarge instance runs 24/7. A 1-year reserved instance would provide significant savings over on-demand pricing.',
        currentConfig: prodEC2.currentConfig,
        recommendedConfig: JSON.stringify({
          instanceType: 'm5.2xlarge',
          pricingModel: 'reserved-1year',
          paymentOption: 'partial-upfront'
        }),
        projectedMonthlySavings: '73.68',
        projectedAnnualSavings: (73.68 * 12).toFixed(2),
        riskLevel: '2.5',
        status: 'pending'
      });
    }

    // Recommendation 4: Stop development resources after hours
    const devResources = resources.filter(r => {
      try {
        const tags = r.tags || {};
        return tags.Environment === 'development';
      } catch {
        return false;
      }
    });

    if (devResources.length > 0) {
      const totalDevCost = devResources.reduce((sum, r) => sum + parseFloat(r.monthlyCost), 0);
      const potentialSavings = totalDevCost * 0.65; // Assume 65% savings by stopping after hours

      recommendations.push({
        resourceId: 'dev-environment-group',
        type: 'terminate',
        priority: 'critical',
        title: 'Implement Auto-Shutdown for Development Environment',
        description: `Schedule automatic shutdown of development resources (${devResources.length} instances) after business hours (6 PM - 8 AM) and weekends to reduce costs.`,
        currentConfig: JSON.stringify({
          schedule: '24/7',
          resources: devResources.length
        }),
        recommendedConfig: JSON.stringify({
          schedule: 'weekdays 8 AM - 6 PM',
          autoShutdown: true,
          resources: devResources.length
        }),
        projectedMonthlySavings: potentialSavings.toFixed(2),
        projectedAnnualSavings: (potentialSavings * 12).toFixed(2),
        riskLevel: '8.0',
        status: 'pending'
      });
    }

    // Recommendation 5: RDS rightsizing
    const underutilizedRDS = resources.find(r => 
      r.resourceType === 'RDS' && 
      r.currentConfig.engine === 'postgres'
    );

    if (underutilizedRDS) {
      recommendations.push({
        resourceId: underutilizedRDS.resourceId,
        type: 'resize',
        priority: 'low',
        title: 'Downsize Development Database Instance',
        description: 'Development PostgreSQL database shows low utilization (16% CPU, 12 connections). Consider moving to db.t3.micro for development workloads.',
        currentConfig: underutilizedRDS.currentConfig,
        recommendedConfig: JSON.stringify({
          engine: 'postgres',
          instanceClass: 'db.t3.micro',
          allocatedStorage: 50,
          storageType: 'gp2'
        }),
        projectedMonthlySavings: '63.18',
        projectedAnnualSavings: (63.18 * 12).toFixed(2),
        riskLevel: '12.0',
        status: 'pending'
      });
    }

    // Store recommendations
    const createdRecommendations = [];
    for (const rec of recommendations) {
      const created = await this.storage.createRecommendation(rec);
      createdRecommendations.push(created);
    }

    return createdRecommendations;
  }

  private async generateOptimizationHistory() {
    const historyItems = [
      {
        id: nanoid(),
        recommendationId: 'completed-1',
        executedBy: 'system',
        executionDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
        beforeConfig: JSON.stringify({
          instanceType: 't3.2xlarge',
          vcpus: 8,
          memory: '32 GiB'
        }),
        afterConfig: JSON.stringify({
          instanceType: 't3.xlarge',
          vcpus: 4,
          memory: '16 GiB'
        }),
        actualSavings: '142.50',
        status: 'success'
      },
      {
        id: nanoid(),
        recommendationId: 'completed-2',
        executedBy: 'john.davis@company.com',
        executionDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 2 weeks ago
        beforeConfig: JSON.stringify({
          storageClass: 'STANDARD',
          autoTiering: false
        }),
        afterConfig: JSON.stringify({
          storageClass: 'INTELLIGENT_TIERING',
          autoTiering: true
        }),
        actualSavings: '89.32',
        status: 'success'
      },
      {
        id: nanoid(),
        recommendationId: 'completed-3',
        executedBy: 'system',
        executionDate: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000), // 3 weeks ago
        beforeConfig: JSON.stringify({
          schedule: '24/7',
          instances: 5
        }),
        afterConfig: JSON.stringify({
          schedule: 'weekdays 8 AM - 8 PM',
          instances: 5
        }),
        actualSavings: '425.68',
        status: 'success'
      },
      {
        id: nanoid(),
        recommendationId: 'failed-1',
        executedBy: 'system',
        executionDate: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000), // 4 weeks ago
        beforeConfig: JSON.stringify({
          instanceType: 'm5.large'
        }),
        afterConfig: JSON.stringify({
          instanceType: 'm5.medium'
        }),
        actualSavings: null,
        status: 'failed',
        errorMessage: 'Insufficient capacity for m5.medium in us-east-1a'
      }
    ];

    for (const item of historyItems) {
      await this.storage.createOptimizationHistory(item);
    }
  }

  async clearAllData() {
    // Note: This would need to be implemented in the storage layer
    // For now, we'll just indicate this is a placeholder
    console.log('🗑️  Data clearing would need to be implemented in storage layer');
  }
}