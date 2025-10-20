import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, X, User } from "lucide-react";
import { formatCurrencyK } from "@/lib/currency";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import type { Recommendation } from "@shared/schema";

export function ApprovalModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRecommendationId, setSelectedRecommendationId] = useState<string | null>(null);
  const { toast } = useToast();

  // Listen for modal open events
  useEffect(() => {
    const handleOpenModal = (event: CustomEvent) => {
      setSelectedRecommendationId(event.detail.recommendationId);
      setIsOpen(true);
    };

    window.addEventListener('openApprovalModal', handleOpenModal as EventListener);
    return () => {
      window.removeEventListener('openApprovalModal', handleOpenModal as EventListener);
    };
  }, []);

  const { data: recommendation } = useQuery<Recommendation>({
    queryKey: ['/api/recommendations', selectedRecommendationId],
    enabled: !!selectedRecommendationId,
  });

  const approvalMutation = useMutation({
    mutationFn: async ({ status, comments }: { status: string; comments?: string }) => {
      if (!selectedRecommendationId) throw new Error("No recommendation selected");
      
      // Create approval request
      await apiRequest('POST', '/api/approval-requests', {
        recommendationId: selectedRecommendationId,
        requestedBy: 'current-user', // In a real app, this would be the current user ID
        approverRole: 'Head of Cloud Platform',
        status,
        comments,
        approvedBy: status === 'approved' ? 'current-user' : undefined,
        approvalDate: status === 'approved' ? new Date() : undefined
      });
    },
    onSuccess: async (_, variables) => {
      toast({
        title: variables.status === 'approved' ? "Optimization Approved" : "Optimization Rejected",
        description: variables.status === 'approved' 
          ? "The optimization will be executed during the next maintenance window."
          : "The optimization request has been rejected.",
      });
      
      // Force refresh recommendation data and activity feed
      await queryClient.invalidateQueries({ queryKey: ['/api/recommendations'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/approval-requests'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/optimization-history'] });
      await queryClient.refetchQueries({ queryKey: ['/api/recommendations'] });
      
      setIsOpen(false);
      setSelectedRecommendationId(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to process approval request. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleApprove = () => {
    approvalMutation.mutate({ status: 'approved' });
  };

  const handleReject = () => {
    approvalMutation.mutate({ status: 'rejected', comments: 'Rejected via dashboard' });
  };

  const handleClose = () => {
    setIsOpen(false);
    setSelectedRecommendationId(null);
  };

  if (!recommendation) {
    return null;
  }

  const currentConfig = recommendation.currentConfig as any;
  const recommendedConfig = recommendation.recommendedConfig as any;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-2xl" data-testid="approval-modal" aria-describedby="approval-description">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold text-foreground">Approve Optimization</DialogTitle>
            <Button variant="ghost" size="sm" onClick={handleClose} data-testid="button-close-modal">
              <X className="w-5 h-5" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="space-y-6">
          <div id="approval-description" className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="text-destructive text-lg mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-destructive mb-2">Critical Resource Optimization</h3>
                <p className="text-sm text-foreground" data-testid="optimization-description">
                  {recommendation.description}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-semibold text-foreground">Current Configuration</h4>
              <div className="space-y-2 text-sm">
                {currentConfig.nodeType && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Instance Type:</span>
                    <span className="font-medium" data-testid="current-instance-type">{currentConfig.nodeType}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Monthly Cost:</span>
                  <span className="font-medium" data-testid="current-monthly-cost">
                    {formatCurrencyK(recommendation.projectedMonthlySavings + 7560000)}
                  </span>
                </div>
                {currentConfig.utilization && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Avg Utilization:</span>
                    <span className="font-medium text-destructive" data-testid="current-utilization">
                      {Math.round(currentConfig.utilization)}%
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-semibold text-foreground">Recommended Configuration</h4>
              <div className="space-y-2 text-sm">
                {recommendedConfig.nodeType && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Instance Type:</span>
                    <span className="font-medium text-accent" data-testid="recommended-instance-type">{recommendedConfig.nodeType}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Monthly Cost:</span>
                  <span className="font-medium text-accent" data-testid="recommended-monthly-cost">{formatCurrencyK(7560000)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Expected Utilization:</span>
                  <span className="font-medium text-accent" data-testid="expected-utilization">85%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-accent/10 border border-accent/20 rounded-lg p-4">
            <h4 className="font-semibold text-accent mb-2">Impact Analysis</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Monthly Savings:</span>
                <span className="font-bold text-accent ml-2" data-testid="monthly-savings">
                  {formatCurrencyK(recommendation.projectedMonthlySavings)}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Annual Savings:</span>
                <span className="font-bold text-accent ml-2" data-testid="annual-savings">
                  {formatCurrencyK(recommendation.projectedAnnualSavings)}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Performance Risk:</span>
                <span className="font-medium text-accent ml-2" data-testid="performance-risk">
                  &lt; {recommendation.riskLevel}%
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Maintenance Window:</span>
                <span className="font-medium ml-2" data-testid="maintenance-window">Sun 2-4 AM EST</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <User className="w-4 h-4" />
              <span>Requires Head of Cloud Platform approval</span>
            </div>
            <div className="flex space-x-3">
              <Button 
                variant="outline" 
                onClick={handleReject}
                disabled={approvalMutation.isPending}
                data-testid="button-reject"
              >
                Reject
              </Button>
              <Button 
                onClick={handleApprove}
                disabled={approvalMutation.isPending}
                data-testid="button-approve"
              >
                {approvalMutation.isPending ? "Processing..." : "Approve Optimization"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
