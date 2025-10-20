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

  // Fetch current agent configuration with polling to catch auto-revert
  const { data: agentConfig, isLoading } = useQuery<AgentConfig>({
    queryKey: ['/api/agent-config'],
    refetchInterval: 5000, // Poll every 5 seconds to catch prod mode auto-revert
  });

  // Mutation to update prod mode using new auto-revert endpoint
  const updateProdMode = useMutation({
    mutationFn: async (enabled: boolean) => {
      const response = await fetch('/api/mode/prod', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled })
      });
      if (!response.ok) throw new Error('Failed to update prod mode');
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/agent-config'] });
      const message = data.prodMode 
        ? `Prod Mode ON (AI with RAG) - Auto-reverts in ${data.timeRemaining}s` 
        : 'Prod Mode OFF (Heuristics)';
      toast({
        title: "Prod Mode Updated",
        description: message,
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

  return {
    agentConfig,
    isLoading,
    updateProdMode: (enabled: boolean) => updateProdMode.mutate(enabled),
  };
}
