import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Info, CheckCircle, ExternalLink } from "lucide-react";
import { useState } from "react";
import type { Recommendation } from "@shared/schema";

export function RecommendationsPanel() {
  const [selectedRecommendation, setSelectedRecommendation] = useState<string | null>(null);
  
  const { data: recommendations, isLoading } = useQuery<Recommendation[]>({
    queryKey: ['/api/recommendations'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const handleApprovalRequest = (recommendationId: string) => {
    setSelectedRecommendation(recommendationId);
    // This will trigger the ApprovalModal to open
    const event = new CustomEvent('openApprovalModal', { detail: { recommendationId } });
    window.dispatchEvent(event);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Priority Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse bg-muted rounded-lg p-4 h-32"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!recommendations || recommendations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Priority Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 text-accent mx-auto mb-4" />
            <p className="text-muted-foreground">No pending recommendations</p>
            <p className="text-sm text-muted-foreground mt-2">All resources are optimally configured</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  const sortedRecommendations = [...recommendations]
    .filter(r => r.status === 'pending')
    .sort((a, b) => priorityOrder[a.priority as keyof typeof priorityOrder] - priorityOrder[b.priority as keyof typeof priorityOrder])
    .slice(0, 3);

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical': return <AlertCircle className="w-4 h-4" />;
      case 'high': return <AlertCircle className="w-4 h-4" />;
      case 'medium': return <Info className="w-4 h-4" />;
      case 'low': return <CheckCircle className="w-4 h-4" />;
      default: return <Info className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  return (
    <Card data-testid="recommendations-panel">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-foreground">Priority Recommendations</CardTitle>
          <Button variant="ghost" size="sm" className="text-primary text-sm hover:underline">
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {sortedRecommendations.map((recommendation, index) => {
          const isCritical = recommendation.priority === 'critical';
          
          return (
            <Card 
              key={recommendation.id} 
              className={`${isCritical ? 'border-l-4 border-l-destructive' : 'border-l-4 border-l-accent'} hover:shadow-md transition-shadow`}
              data-testid={`recommendation-${index}`}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className={`text-${getPriorityColor(recommendation.priority)}`}>
                      {getPriorityIcon(recommendation.priority)}
                    </span>
                    <Badge variant={getPriorityColor(recommendation.priority) as any}>
                      {recommendation.priority.toUpperCase()}
                    </Badge>
                  </div>
                  <Badge variant="outline" data-testid={`savings-badge-${index}`}>
                    ${Number(recommendation.projectedAnnualSavings).toLocaleString()}/year
                  </Badge>
                </div>
                
                <h4 className="font-semibold text-foreground mb-2" data-testid={`recommendation-title-${index}`}>
                  {recommendation.title}
                </h4>
                <p className="text-sm text-muted-foreground mb-3" data-testid={`recommendation-description-${index}`}>
                  {recommendation.description}
                </p>
                
                <div className="space-y-2 mb-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Resource:</span>
                    <span className="font-medium" data-testid={`resource-id-${index}`}>{recommendation.resourceId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Monthly Savings:</span>
                    <span className="font-bold text-accent" data-testid={`monthly-savings-${index}`}>
                      ${Number(recommendation.projectedMonthlySavings).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Risk Level:</span>
                    <span className="text-accent" data-testid={`risk-level-${index}`}>
                      &lt; {recommendation.riskLevel}%
                    </span>
                  </div>
                </div>
                
                <Button 
                  className="w-full" 
                  onClick={() => handleApprovalRequest(recommendation.id)}
                  data-testid={`button-approve-${index}`}
                >
                  Review & Approve
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </CardContent>
    </Card>
  );
}
