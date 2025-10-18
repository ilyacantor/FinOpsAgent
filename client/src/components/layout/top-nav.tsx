import { Link } from "wouter";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Bot, Cpu } from "lucide-react";
import autonomosLogo from "@assets/MAIN LOGO TEAL DARK BG PNG_1760814802183.png";

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
        {/* Left: Logo */}
        <Link 
          href="/" 
          className="hover:opacity-80 transition-opacity"
          data-testid="nav-home-link"
        >
          <img 
            src={autonomosLogo} 
            alt="autonomOS" 
            className="h-8"
          />
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
