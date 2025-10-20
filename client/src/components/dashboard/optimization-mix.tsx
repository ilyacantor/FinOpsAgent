import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock } from "lucide-react";

interface OptimizationMixData {
  autonomousCount: number;
  hitlCount: number;
  autonomousPercentage: number;
  hitlPercentage: number;
  totalRecommendations: number;
}

export function OptimizationMix() {
  const { data: mixData, isLoading } = useQuery<OptimizationMixData>({
    queryKey: ['/api/metrics/optimization-mix'],
    refetchInterval: 3000, // Auto-refresh every 3 seconds
  });

  if (isLoading) {
    return (
      <Card data-testid="card-optimization-mix">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Optimization Mix</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-12 animate-pulse bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  const autonomousPercentage = mixData?.autonomousPercentage || 0;
  const hitlPercentage = mixData?.hitlPercentage || 0;
  const autonomousCount = mixData?.autonomousCount || 0;
  const hitlCount = mixData?.hitlCount || 0;

  return (
    <Card data-testid="card-optimization-mix">
      <CardHeader>
        <CardTitle className="text-sm font-medium">Optimization Mix</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Visual Bar */}
          <div className="flex h-8 rounded-lg overflow-hidden border border-border">
            {autonomousPercentage > 0 && (
              <div
                className="bg-emerald-500/20 border-r border-emerald-500/50 flex items-center justify-center text-xs font-semibold text-emerald-600 dark:text-emerald-400"
                style={{ width: `${autonomousPercentage}%` }}
                data-testid="bar-autonomous"
              >
                {autonomousPercentage}%
              </div>
            )}
            {hitlPercentage > 0 && (
              <div
                className="bg-amber-500/20 flex items-center justify-center text-xs font-semibold text-amber-600 dark:text-amber-400"
                style={{ width: `${hitlPercentage}%` }}
                data-testid="bar-hitl"
              >
                {hitlPercentage}%
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2" data-testid="legend-autonomous">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span className="text-muted-foreground">Autonomous</span>
              </div>
              <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                {autonomousCount}
              </Badge>
            </div>

            <div className="flex items-center gap-2" data-testid="legend-hitl">
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-amber-500" />
                <span className="text-muted-foreground">HITL</span>
              </div>
              <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30">
                {hitlCount}
              </Badge>
            </div>
          </div>

          {/* Summary Text */}
          <p className="text-xs text-muted-foreground text-center" data-testid="text-summary">
            {autonomousCount} auto-executed / {hitlCount} awaiting approval
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
