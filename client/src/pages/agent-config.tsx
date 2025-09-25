import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Bot, Shield, Settings, AlertTriangle } from "lucide-react";
import { formatCurrency } from "@/lib/currency";

interface AgentConfig {
  autonomousMode: boolean;
  maxAutonomousRiskLevel: number;
  approvalRequiredAboveSavings: number;
  autoExecuteTypes: string[];
}

export default function AgentConfig() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [localConfig, setLocalConfig] = useState<AgentConfig | null>(null);

  // Fetch current agent configuration
  const { data: agentConfig, isLoading } = useQuery<AgentConfig>({
    queryKey: ['/api/agent-config'],
    staleTime: 30000, // 30 seconds
  });

  // Update local state when data changes
  useEffect(() => {
    if (agentConfig) {
      setLocalConfig(agentConfig);
    }
  }, [agentConfig]);

  // Mutation to update autonomous mode
  const updateAutonomousMode = useMutation({
    mutationFn: async (enabled: boolean) => {
      const response = await fetch('/api/agent-config/autonomous-mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled, updatedBy: 'admin-user' })
      });
      if (!response.ok) throw new Error('Failed to update autonomous mode');
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['/api/agent-config'], data);
      toast({
        title: "Configuration Updated",
        description: `Autonomous mode ${data.autonomousMode ? 'enabled' : 'disabled'} successfully.`,
      });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update autonomous mode configuration.",
        variant: "destructive",
      });
    }
  });

  // Mutation to update risk level
  const updateRiskLevel = useMutation({
    mutationFn: async (riskLevel: number) => {
      const response = await fetch('/api/system-config/agent.max_autonomous_risk_level', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: riskLevel.toString(), updatedBy: 'admin-user' })
      });
      if (!response.ok) throw new Error('Failed to update risk level');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/agent-config'] });
      toast({
        title: "Risk Level Updated",
        description: "Maximum autonomous risk level updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update risk level configuration.",
        variant: "destructive",
      });
    }
  });

  const handleToggleAutonomous = async () => {
    if (localConfig) {
      await updateAutonomousMode.mutateAsync(!localConfig.autonomousMode);
    }
  };

  const handleRiskLevelChange = async (value: string) => {
    const riskLevel = parseFloat(value);
    if (!isNaN(riskLevel) && riskLevel >= 0 && riskLevel <= 100) {
      setLocalConfig(prev => prev ? { ...prev, maxAutonomousRiskLevel: riskLevel } : null);
      await updateRiskLevel.mutateAsync(riskLevel);
    }
  };

  if (isLoading || !localConfig) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Agent Configuration</h1>
          <p className="text-muted-foreground">Loading configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Bot className="h-8 w-8" />
          Agent Configuration
        </h1>
        <p className="text-muted-foreground">
          Configure autonomous AI agent behavior and safety controls
        </p>
      </div>

      {/* Autonomous Mode Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Autonomous Operation Mode
            <Badge variant={localConfig.autonomousMode ? "default" : "secondary"} data-testid="mode-badge">
              {localConfig.autonomousMode ? "AUTONOMOUS" : "MANUAL APPROVAL"}
            </Badge>
          </CardTitle>
          <CardDescription>
            Enable autonomous execution of cost optimization recommendations without human approval
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="autonomous-mode" className="text-base font-medium">
                Autonomous Execution
              </Label>
              <p className="text-sm text-muted-foreground">
                {localConfig.autonomousMode 
                  ? "Agent will automatically execute approved optimization recommendations" 
                  : "All recommendations require manual approval before execution"
                }
              </p>
            </div>
            <Switch
              id="autonomous-mode"
              checked={localConfig.autonomousMode}
              onCheckedChange={handleToggleAutonomous}
              disabled={updateAutonomousMode.isPending}
              data-testid="autonomous-toggle"
            />
          </div>

          {localConfig.autonomousMode && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Autonomous mode is active.</strong> The agent will automatically execute 
                optimizations that meet the safety criteria below. Monitor the system closely.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Safety Controls Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Safety Controls
          </CardTitle>
          <CardDescription>
            Configure safety thresholds for autonomous execution
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="risk-level" className="text-base font-medium">
              Maximum Risk Level for Autonomous Execution
            </Label>
            <div className="flex items-center gap-4">
              <Input
                id="risk-level"
                type="number"
                value={localConfig.maxAutonomousRiskLevel}
                onChange={(e) => handleRiskLevelChange(e.target.value)}
                min="0"
                max="100"
                step="0.1"
                className="w-32"
                data-testid="risk-level-input"
              />
              <span className="text-sm text-muted-foreground">
                % risk threshold (recommendations above this require approval)
              </span>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <Label className="text-base font-medium">
              Annual Savings Threshold
            </Label>
            <div className="flex items-center gap-4">
              <Input
                type="text"
                value={formatCurrency(localConfig.approvalRequiredAboveSavings)}
                readOnly
                className="w-48"
                data-testid="savings-threshold-input"
              />
              <span className="text-sm text-muted-foreground">
                USD/year (recommendations above this always require approval)
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              High-value optimizations above this threshold will always require human approval, 
              regardless of risk level.
            </p>
          </div>

          <Separator />

          <div className="space-y-3">
            <Label className="text-base font-medium">
              Autonomous Execution Types
            </Label>
            <div className="flex gap-2 flex-wrap">
              {localConfig.autoExecuteTypes.map((type) => (
                <Badge key={type} variant="outline" data-testid={`auto-type-${type}`}>
                  {type}
                </Badge>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              Only these recommendation types can be executed autonomously. 
              Other types always require approval.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* System Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            System Status
          </CardTitle>
          <CardDescription>
            Current agent configuration and operational status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium">Operation Mode</p>
              <p className="text-muted-foreground">
                {localConfig.autonomousMode ? "Autonomous" : "Manual Approval Required"}
              </p>
            </div>
            <div>
              <p className="font-medium">Max Risk Level</p>
              <p className="text-muted-foreground">{localConfig.maxAutonomousRiskLevel}%</p>
            </div>
            <div>
              <p className="font-medium">Approval Threshold</p>
              <p className="text-muted-foreground">
                {formatCurrency(localConfig.approvalRequiredAboveSavings)}/year
              </p>
            </div>
            <div>
              <p className="font-medium">Auto-execute Types</p>
              <p className="text-muted-foreground">{localConfig.autoExecuteTypes.length} types</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}