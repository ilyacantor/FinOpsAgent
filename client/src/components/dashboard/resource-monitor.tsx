import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RotateCcw, MessageSquare } from "lucide-react";
import type { AwsResource } from "@shared/schema";

export function ResourceMonitor() {
  const { data: resources, isLoading } = useQuery<AwsResource[]>({
    queryKey: ['/api/aws-resources'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Resource Utilization</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse space-y-3">
                <div className="h-4 bg-muted rounded w-1/2"></div>
                <div className="h-2 bg-muted rounded"></div>
                <div className="h-3 bg-muted rounded w-1/3"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!resources || resources.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-foreground">Resource Utilization</CardTitle>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <RotateCcw className="w-4 h-4" />
              <span>Real-time</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">No resources found</p>
            <p className="text-sm text-muted-foreground mt-2">AWS resources will appear here once discovered</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Group resources by type for better display
  const resourcesByType = resources.reduce((acc, resource) => {
    if (!acc[resource.resourceType]) {
      acc[resource.resourceType] = [];
    }
    acc[resource.resourceType].push(resource);
    return acc;
  }, {} as Record<string, AwsResource[]>);

  const getUtilizationData = (resourceType: string, resources: AwsResource[]) => {
    // Calculate average utilization for resource type
    const utilizationValues = resources
      .map(r => r.utilizationMetrics)
      .filter(Boolean)
      .map(metrics => {
        if (typeof metrics === 'object' && metrics && 'avgCpuUtilization' in metrics) {
          return Number(metrics.avgCpuUtilization) || 0;
        }
        return 0;
      });
    
    const avgUtilization = utilizationValues.length > 0 
      ? utilizationValues.reduce((sum, val) => sum + val, 0) / utilizationValues.length 
      : 0;

    const underUtilizedCount = resources.filter(r => {
      const metrics = r.utilizationMetrics;
      if (typeof metrics === 'object' && metrics && 'avgCpuUtilization' in metrics) {
        return Number(metrics.avgCpuUtilization) < 50;
      }
      return false;
    }).length;

    return {
      avgUtilization: Math.round(avgUtilization),
      underUtilizedCount,
      totalCount: resources.length
    };
  };

  const getUtilizationColor = (utilization: number) => {
    if (utilization < 30) return 'bg-destructive';
    if (utilization < 70) return 'bg-chart-3';
    return 'bg-accent';
  };

  const getUtilizationStatus = (utilization: number, underUtilized: number, total: number) => {
    if (utilization > 80) return 'Well optimized';
    if (underUtilized === 0) return 'Optimized';
    return `${underUtilized} of ${total} under-utilized`;
  };

  return (
    <Card data-testid="resource-monitor">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-foreground">Resource Utilization</CardTitle>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <RotateCcw className="w-4 h-4" />
            <span>Real-time</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {Object.entries(resourcesByType).map(([resourceType, typeResources], index) => {
            const utilData = getUtilizationData(resourceType, typeResources);
            
            return (
              <div key={resourceType} data-testid={`resource-type-${index}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground" data-testid={`resource-type-name-${index}`}>
                    {resourceType} {resourceType === 'Redshift' ? 'Clusters' : 'Instances'}
                  </span>
                  <span className="text-sm text-muted-foreground" data-testid={`resource-utilization-${index}`}>
                    {utilData.avgUtilization}% avg utilization
                  </span>
                </div>
                <Progress 
                  value={utilData.avgUtilization} 
                  className="w-full h-2"
                  data-testid={`resource-progress-${index}`}
                />
                <p className="text-xs text-muted-foreground mt-1" data-testid={`resource-status-${index}`}>
                  {getUtilizationStatus(utilData.avgUtilization, utilData.underUtilizedCount, utilData.totalCount)}
                </p>
              </div>
            );
          })}

          <div className="mt-6 p-4 bg-muted/50 rounded-lg" data-testid="slack-integration">
            <div className="flex items-center space-x-2 mb-2">
              <MessageSquare className="w-4 h-4 text-chart-3" />
              <span className="text-sm font-medium text-foreground">Slack Integration</span>
            </div>
            <p className="text-xs text-muted-foreground mb-2">
              #finops-alerts channel configured for notifications
            </p>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
                <span className="text-xs text-muted-foreground">Connected</span>
              </div>
              <Button variant="ghost" size="sm" className="text-xs text-primary hover:underline" data-testid="button-configure-slack">
                Configure
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
