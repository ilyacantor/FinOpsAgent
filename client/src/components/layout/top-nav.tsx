import { Link } from "wouter";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Bot, Cpu } from "lucide-react";

interface TopNavProps {
  lastSync?: string;
  prodMode: boolean;
  syntheticData: boolean;
  onProdModeChange: (enabled: boolean) => void;
  onSyntheticDataChange: (enabled: boolean) => void;
}

export function TopNav({ 
  lastSync = "Just now", 
  prodMode, 
  syntheticData,
  onProdModeChange,
  onSyntheticDataChange
}: TopNavProps) {
  return (
    <nav 
      className="fixed top-0 left-0 right-0 h-[60px] bg-[#0f172a] border-b border-white/[0.08] z-50 px-6"
      data-testid="top-nav"
    >
      <div className="h-full flex items-center justify-between">
        {/* Left: Logo and Brand */}
        <Link 
          href="/" 
          className="flex items-center gap-3 hover:opacity-80 transition-opacity group"
          data-testid="nav-home-link"
        >
          {/* autonomOS Logo SVG */}
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition-shadow">
            <svg 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
              className="text-white"
            >
              <path 
                d="M12 2L2 7L12 12L22 7L12 2Z" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                fill="currentColor"
                fillOpacity="0.2"
              />
              <path 
                d="M2 17L12 22L22 17" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
              <path 
                d="M2 12L12 17L22 12" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="hidden sm:block">
            <div className="text-white font-semibold text-lg leading-tight font-['Inter']">
              autonomOS
            </div>
            <div className="text-cyan-400 text-xs leading-tight">
              FinOps Agent
            </div>
          </div>
        </Link>

        {/* Right: Last Sync and Toggles */}
        <div className="flex items-center gap-4">
          {/* Last Sync */}
          <div className="hidden lg:flex flex-col items-end">
            <span className="text-xs text-gray-400">Last Sync</span>
            <span className="text-xs text-white font-medium" data-testid="last-sync">
              {lastSync}
            </span>
          </div>

          {/* Prod Mode Toggle */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <Label 
                htmlFor="prod-mode-toggle" 
                className="text-sm text-gray-300 cursor-pointer font-medium"
              >
                Prod Mode
              </Label>
            </div>
            <Switch
              id="prod-mode-toggle"
              checked={prodMode}
              onCheckedChange={onProdModeChange}
              className="data-[state=checked]:bg-cyan-500"
              data-testid="toggle-prod-mode"
            />
          </div>

          {/* Synthetic Data Toggle */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5">
              <Bot className="w-3.5 h-3.5 text-purple-400" />
              <Label 
                htmlFor="synthetic-toggle" 
                className="text-sm text-gray-300 cursor-pointer font-medium"
              >
                Synthetic
              </Label>
            </div>
            <Switch
              id="synthetic-toggle"
              checked={syntheticData}
              onCheckedChange={onSyntheticDataChange}
              className="data-[state=checked]:bg-purple-500"
              data-testid="toggle-synthetic"
            />
          </div>
        </div>
      </div>
    </nav>
  );
}
