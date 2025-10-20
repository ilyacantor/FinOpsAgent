import { useEffect, useState } from "react";
import { useAgentConfig } from "@/hooks/use-agent-config";
import { Activity } from "lucide-react";

export function AiModeIndicator() {
  const { agentConfig } = useAgentConfig();
  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    if (!agentConfig?.prodMode) {
      setCountdown(null);
      return;
    }

    // Initialize countdown at 30 seconds
    setCountdown(30);

    // Countdown timer
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [agentConfig?.prodMode]);

  if (!agentConfig?.prodMode || countdown === null) {
    return null;
  }

  return (
    <div 
      className="fixed top-4 right-4 z-50 bg-cyan-500/20 border-2 border-cyan-500 rounded-lg px-4 py-2 flex items-center gap-3 animate-pulse"
      data-testid="ai-mode-indicator"
    >
      <Activity className="w-5 h-5 text-cyan-400" />
      <div className="flex flex-col">
        <span className="text-cyan-400 font-semibold text-sm">
          ⚡ Prod Mode Active (RAG)
        </span>
        <span className="text-cyan-300 text-xs" data-testid="ai-mode-countdown">
          Auto-revert in {countdown}s
        </span>
      </div>
    </div>
  );
}
