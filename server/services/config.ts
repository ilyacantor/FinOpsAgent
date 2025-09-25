import { storage } from '../storage.js';

export interface AgentConfig {
  autonomousMode: boolean;
  maxAutonomousRiskLevel: number;
  approvalRequiredAboveSavings: number;
  autoExecuteTypes: string[];
}

export class ConfigService {
  private static instance: ConfigService;
  private configCache: Map<string, string> = new Map();

  private constructor() {}

  static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }

  async initializeDefaults() {
    // Initialize default configuration values
    const defaults = [
      {
        key: 'agent.autonomous_mode',
        value: 'false',
        description: 'Enable autonomous execution of recommendations without human approval',
        updatedBy: 'system'
      },
      {
        key: 'agent.max_autonomous_risk_level',
        value: '5.0',
        description: 'Maximum risk level (percentage) for autonomous execution',
        updatedBy: 'system'
      },
      {
        key: 'agent.approval_required_above_savings',
        value: '10000000',
        description: 'Annual savings amount (USD) above which approval is required even in autonomous mode',
        updatedBy: 'system'
      },
      {
        key: 'agent.auto_execute_types',
        value: 'resize,storage-class',
        description: 'Comma-separated list of recommendation types that can be executed autonomously',
        updatedBy: 'system'
      }
    ];

    for (const config of defaults) {
      const existing = await storage.getSystemConfig(config.key);
      if (!existing) {
        await storage.setSystemConfig(config);
        this.configCache.set(config.key, config.value);
      } else {
        this.configCache.set(config.key, existing.value);
      }
    }
  }

  async getAgentConfig(): Promise<AgentConfig> {
    await this.refreshCache();
    
    return {
      autonomousMode: this.getBooleanConfig('agent.autonomous_mode', false),
      maxAutonomousRiskLevel: this.getNumberConfig('agent.max_autonomous_risk_level', 5.0),
      approvalRequiredAboveSavings: this.getNumberConfig('agent.approval_required_above_savings', 10000),
      autoExecuteTypes: this.getArrayConfig('agent.auto_execute_types', ['resize', 'storage-class'])
    };
  }

  async setAutonomousMode(enabled: boolean, updatedBy: string): Promise<void> {
    await storage.updateSystemConfig('agent.autonomous_mode', enabled.toString(), updatedBy);
    this.configCache.set('agent.autonomous_mode', enabled.toString());
  }

  async setMaxAutonomousRiskLevel(riskLevel: number, updatedBy: string): Promise<void> {
    await storage.updateSystemConfig('agent.max_autonomous_risk_level', riskLevel.toString(), updatedBy);
    this.configCache.set('agent.max_autonomous_risk_level', riskLevel.toString());
  }

  // Method to invalidate cache when configuration is updated externally
  invalidateCache(): void {
    this.configCache.clear();
  }

  async canExecuteAutonomously(recommendation: {
    type: string;
    riskLevel: string;
    projectedAnnualSavings: string;
  }): Promise<boolean> {
    const config = await this.getAgentConfig();
    
    // Must be in autonomous mode
    if (!config.autonomousMode) {
      return false;
    }

    // Check risk level
    const riskLevel = parseFloat(recommendation.riskLevel);
    if (riskLevel > config.maxAutonomousRiskLevel) {
      return false;
    }

    // Check savings threshold
    const annualSavings = parseFloat(recommendation.projectedAnnualSavings);
    if (annualSavings > config.approvalRequiredAboveSavings) {
      return false;
    }

    // Check if recommendation type is allowed for autonomous execution
    if (!config.autoExecuteTypes.includes(recommendation.type)) {
      return false;
    }

    return true;
  }

  private async refreshCache(): Promise<void> {
    // Only refresh cache if it's empty or periodically
    if (this.configCache.size === 0) {
      const allConfig = await storage.getAllSystemConfig();
      for (const config of allConfig) {
        this.configCache.set(config.key, config.value);
      }
    }
  }

  private getBooleanConfig(key: string, defaultValue: boolean): boolean {
    const value = this.configCache.get(key);
    return value ? value.toLowerCase() === 'true' : defaultValue;
  }

  private getNumberConfig(key: string, defaultValue: number): number {
    const value = this.configCache.get(key);
    return value ? parseFloat(value) : defaultValue;
  }

  private getArrayConfig(key: string, defaultValue: string[]): string[] {
    const value = this.configCache.get(key);
    return value ? value.split(',').map(v => v.trim()) : defaultValue;
  }
}

export const configService = ConfigService.getInstance();