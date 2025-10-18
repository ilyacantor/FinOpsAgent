import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface AgentConfig {
  autonomousMode: boolean;
  prodMode: boolean;
  simulationMode: boolean;
  maxAutonomousRiskLevel: number;
  approvalRequiredAboveSavings: number;
  autoExecuteTypes: string[];
}

export function useAgentConfig() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch current agent configuration
  const { data: agentConfig, isLoading } = useQuery<AgentConfig>({
    queryKey: ['/api/agent-config'],
    staleTime: 30000,
  });

  // Mutation to update prod mode
  const updateProdMode = useMutation({
    mutationFn: async (enabled: boolean) => {
      const response = await fetch('/api/agent-config/prod-mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled, updatedBy: 'admin-user' })
      });
      if (!response.ok) throw new Error('Failed to update prod mode');
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['/api/agent-config'], data);
      toast({
        title: "Prod Mode Updated",
        description: `Prod Mode ${data.prodMode ? 'ON (AI with RAG)' : 'OFF (Heuristics)'}`,
      });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update prod mode.",
        variant: "destructive",
      });
    }
  });

  // Mutation to update simulation mode
  const updateSimulationMode = useMutation({
    mutationFn: async (enabled: boolean) => {
      const response = await fetch('/api/agent-config/simulation-mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled, updatedBy: 'admin-user' })
      });
      if (!response.ok) throw new Error('Failed to update simulation mode');
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['/api/agent-config'], data);
      toast({
        title: "Simulation Mode Updated",
        description: `Simulation Mode ${data.simulationMode ? 'ON (Synthetic Data)' : 'OFF (Real Data)'}`,
      });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update simulation mode.",
        variant: "destructive",
      });
    }
  });

  return {
    agentConfig,
    isLoading,
    updateProdMode: (enabled: boolean) => updateProdMode.mutate(enabled),
    updateSimulationMode: (enabled: boolean) => updateSimulationMode.mutate(enabled),
  };
}
