import { RotateCcw, Bot, Settings } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface AgentConfig {
  autonomousMode: boolean;
  prodMode: boolean;
  maxAutonomousRiskLevel: number;
  approvalRequiredAboveSavings: number;
  autoExecuteTypes: string[];
}

export function Header() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch current agent configuration
  const { data: agentConfig } = useQuery<AgentConfig>({
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
        description: `${data.prodMode ? '🚀 AI Mode ON (Gemini + RAG)' : '⚙️ Heuristics Mode ON'}`,
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

  const handleToggleProdMode = () => {
    if (agentConfig) {
      updateProdMode.mutate(!agentConfig.prodMode);
    }
  };

  return (
    <header className="bg-card border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Executive Dashboard</h1>
          <p className="text-muted-foreground mt-1">Real-time cloud cost optimization insights</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 bg-muted px-3 py-2 rounded-lg">
            <RotateCcw className="w-4 h-4 text-accent" />
            <span className="text-sm text-muted-foreground" data-testid="last-sync-time">Last sync: 2 min ago</span>
          </div>
          
          {/* Prod Mode Toggle */}
          {agentConfig && (
            <div className="flex items-center gap-3 px-4 py-2 rounded-lg border border-cyan-500/30 bg-gradient-to-r from-background to-cyan-950/10">
              <div className="flex items-center gap-2">
                {agentConfig.prodMode ? (
                  <Bot className="w-4 h-4 text-cyan-400" />
                ) : (
                  <Settings className="w-4 h-4 text-muted-foreground" />
                )}
                <span className="text-sm font-medium">Prod Mode</span>
                <Badge 
                  variant={agentConfig.prodMode ? "default" : "secondary"} 
                  className={agentConfig.prodMode ? "bg-cyan-500" : ""}
                  data-testid="header-prod-mode-badge"
                >
                  {agentConfig.prodMode ? "ON" : "OFF"}
                </Badge>
              </div>
              <Switch
                checked={agentConfig.prodMode}
                onCheckedChange={handleToggleProdMode}
                disabled={updateProdMode.isPending}
                data-testid="header-prod-mode-toggle"
                className="data-[state=checked]:bg-cyan-500"
              />
            </div>
          )}
          
          <div className="flex items-center space-x-2">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs font-medium">JD</AvatarFallback>
            </Avatar>
            <div className="text-sm">
              <div className="font-medium text-foreground" data-testid="user-name">John Davis</div>
              <div className="text-muted-foreground" data-testid="user-role">CFO</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
