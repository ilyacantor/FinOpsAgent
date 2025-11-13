import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConfigService } from '../../../server/services/config';

// Mock the storage module
vi.mock('../../../server/storage', () => ({
  storage: {
    getSystemConfig: vi.fn(),
    setSystemConfig: vi.fn(),
    updateSystemConfig: vi.fn(),
    getAllSystemConfig: vi.fn(),
  },
}));

describe('ConfigService', () => {
  let configService: ConfigService;

  beforeEach(() => {
    configService = ConfigService.getInstance();
    vi.clearAllMocks();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = ConfigService.getInstance();
      const instance2 = ConfigService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('getAgentConfig', () => {
    it('should return default configuration when cache is empty', async () => {
      const { storage } = await import('../../../server/storage');
      vi.mocked(storage.getAllSystemConfig).mockResolvedValue([]);

      const config = await configService.getAgentConfig();

      expect(config).toMatchObject({
        autonomousMode: false,
        prodMode: false,
        simulationMode: false,
        maxAutonomousRiskLevel: 5.0,
      });
    });

    it('should return prod mode time remaining when enabled', async () => {
      const { storage } = await import('../../../server/storage');
      vi.mocked(storage.getAllSystemConfig).mockResolvedValue([
        { key: 'agent.prod_mode', value: 'true', description: '', updatedBy: 'test', updatedAt: new Date() }
      ]);

      await configService.setProdMode(true, 'test');
      const config = await configService.getAgentConfig();

      expect(config.prodMode).toBe(true);
      expect(config.prodModeTimeRemaining).toBeDefined();
      expect(config.prodModeTimeRemaining).toBeGreaterThan(0);
      expect(config.prodModeTimeRemaining).toBeLessThanOrEqual(30);
    });
  });

  describe('canExecuteAutonomously', () => {
    beforeEach(async () => {
      const { storage } = await import('../../../server/storage');
      vi.mocked(storage.getAllSystemConfig).mockResolvedValue([
        { key: 'agent.autonomous_mode', value: 'true', description: '', updatedBy: 'test', updatedAt: new Date() },
        { key: 'agent.max_autonomous_risk_level', value: '5.0', description: '', updatedBy: 'test', updatedAt: new Date() },
        { key: 'agent.approval_required_above_savings', value: '10000', description: '', updatedBy: 'test', updatedAt: new Date() },
        { key: 'agent.auto_execute_types', value: 'resize,storage-class', description: '', updatedBy: 'test', updatedAt: new Date() },
      ]);
      configService.invalidateCache();
    });

    it('should allow autonomous execution for valid recommendation', async () => {
      const recommendation = {
        type: 'resize',
        riskLevel: 3.0,
        projectedAnnualSavings: 5000,
      };

      const canExecute = await configService.canExecuteAutonomously(recommendation);
      expect(canExecute).toBe(true);
    });

    it('should reject autonomous execution when risk level is too high', async () => {
      const recommendation = {
        type: 'resize',
        riskLevel: 8.0,
        projectedAnnualSavings: 5000,
      };

      const canExecute = await configService.canExecuteAutonomously(recommendation);
      expect(canExecute).toBe(false);
    });

    it('should reject autonomous execution when savings exceed threshold', async () => {
      const recommendation = {
        type: 'resize',
        riskLevel: 3.0,
        projectedAnnualSavings: 15000,
      };

      const canExecute = await configService.canExecuteAutonomously(recommendation);
      expect(canExecute).toBe(false);
    });

    it('should reject autonomous execution for non-allowed types', async () => {
      const recommendation = {
        type: 'terminate',
        riskLevel: 3.0,
        projectedAnnualSavings: 5000,
      };

      const canExecute = await configService.canExecuteAutonomously(recommendation);
      expect(canExecute).toBe(false);
    });
  });

  describe('Cache Management', () => {
    it('should invalidate cache', () => {
      configService.invalidateCache();
      // If cache is cleared, next call should fetch from storage
      expect(() => configService.invalidateCache()).not.toThrow();
    });
  });

  describe('Configuration Setters', () => {
    it('should set autonomous mode', async () => {
      const { storage } = await import('../../../server/storage');
      await configService.setAutonomousMode(true, 'test-user');

      expect(storage.updateSystemConfig).toHaveBeenCalledWith(
        'agent.autonomous_mode',
        'true',
        'test-user'
      );
    });

    it('should set prod mode with expiration', async () => {
      const { storage } = await import('../../../server/storage');
      await configService.setProdMode(true, 'test-user');

      expect(storage.updateSystemConfig).toHaveBeenCalledWith(
        'agent.prod_mode',
        'true',
        'test-user'
      );
    });

    it('should set simulation mode', async () => {
      const { storage } = await import('../../../server/storage');
      await configService.setSimulationMode(true, 'test-user');

      expect(storage.updateSystemConfig).toHaveBeenCalledWith(
        'agent.simulation_mode',
        'true',
        'test-user'
      );
    });

    it('should set max autonomous risk level', async () => {
      const { storage } = await import('../../../server/storage');
      await configService.setMaxAutonomousRiskLevel(7.5, 'test-user');

      expect(storage.updateSystemConfig).toHaveBeenCalledWith(
        'agent.max_autonomous_risk_level',
        '7.5',
        'test-user'
      );
    });
  });
});
