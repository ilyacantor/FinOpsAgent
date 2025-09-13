import { RotateCcw } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function Header() {
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
