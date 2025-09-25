import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bot, Clock, TrendingUp } from "lucide-react";
import { formatCurrencyWithSuffix } from "@/lib/currency";
import { formatDistanceToNow } from "date-fns";
import type { OptimizationHistory } from "@shared/schema";

export function ActivityFeed() {
  const { data: history, isLoading } = useQuery<OptimizationHistory[]>({
    queryKey: ['/api/optimization-history'],
    refetchInterval: 60000, // Refresh every minute
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse flex items-start space-x-3 p-3 bg-muted rounded-lg">
                <div className="w-8 h-8 bg-muted-foreground/20 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted-foreground/20 rounded w-3/4"></div>
                  <div className="h-3 bg-muted-foreground/20 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!history || history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-foreground">Recent Activity</CardTitle>
            <Button variant="ghost" size="sm" className="text-primary text-sm hover:underline">
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No recent activity</p>
            <p className="text-sm text-muted-foreground mt-2">Optimization activities will appear here</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusBadge = (status: string, actualSavings?: number) => {
    switch (status) {
      case 'success':
        return (
          <Badge className="bg-accent text-accent-foreground" data-testid="status-success">
            {actualSavings ? formatCurrencyWithSuffix(actualSavings, '/mo saved') : '$0/mo saved'}
          </Badge>
        );
      case 'approved':
        return (
          <Badge className="bg-blue-500 text-white" data-testid="status-approved">
            APPROVED
          </Badge>
        );
      case 'in-progress':
        return <Badge variant="secondary">IN PROGRESS</Badge>;
      case 'failed':
        return <Badge variant="destructive">FAILED</Badge>;
      default:
        return <Badge variant="outline">UNKNOWN</Badge>;
    }
  };

  const getActivityIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <Bot className="text-accent text-sm" />;
      case 'approved':
        return <TrendingUp className="text-blue-500 text-sm" />;
      case 'in-progress':
        return <Clock className="text-chart-3 text-sm" />;
      case 'failed':
        return <TrendingUp className="text-destructive text-sm" />;
      default:
        return <Bot className="text-muted-foreground text-sm" />;
    }
  };

  const getActivityBgColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-accent/5';
      case 'approved':
        return 'bg-blue-50 dark:bg-blue-950/20';
      case 'in-progress':
        return 'bg-chart-3/5';
      case 'failed':
        return 'bg-destructive/5';
      default:
        return 'bg-muted/30';
    }
  };

  return (
    <Card data-testid="activity-feed">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-foreground">Recent Activity</CardTitle>
          <Button variant="ghost" size="sm" className="text-primary text-sm hover:underline">
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {history.slice(0, 5).map((item, index) => (
            <div 
              key={item.id} 
              className={`flex items-start space-x-3 p-3 ${getActivityBgColor(item.status)} rounded-lg transition-colors hover:bg-opacity-80`}
              data-testid={`activity-item-${index}`}
            >
              <Avatar className="w-8 h-8 flex-shrink-0 mt-1">
                <AvatarFallback className={`${item.status === 'success' ? 'bg-accent' : item.status === 'approved' ? 'bg-blue-500' : item.status === 'failed' ? 'bg-destructive' : 'bg-chart-3'} text-white`}>
                  {getActivityIcon(item.status)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground" data-testid={`activity-title-${index}`}>
                  {item.status === 'success' ? 'Optimization Completed' : 
                   item.status === 'approved' ? 'Optimization Approved' :
                   item.status === 'failed' ? 'Optimization Failed' : 'Optimization In Progress'}
                </p>
                <p className="text-sm text-muted-foreground" data-testid={`activity-description-${index}`}>
                  Resource optimization executed for {JSON.stringify(item.beforeConfig).substring(0, 50)}...
                </p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-muted-foreground" data-testid={`activity-time-${index}`}>
                    {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                  </span>
                  {getStatusBadge(item.status, item.actualSavings ?? undefined)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
