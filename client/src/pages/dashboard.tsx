import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MetricsCards } from "@/components/dashboard/metrics-cards";
import { RecommendationsPanel } from "@/components/dashboard/recommendations-panel";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { ResourceMonitor } from "@/components/dashboard/resource-monitor";
import { ApprovalModal } from "@/components/modals/approval-modal";
import { DataGeneratorCard } from "@/components/simulation/data-generator-card";
// Temporarily disable WebSocket due to React hook error
// import { useWebSocket } from "@/hooks/use-websocket";
// import { useEffect } from "react";
// import { useToast } from "@/hooks/use-toast";
// import { queryClient } from "@/lib/queryClient";

export default function Dashboard() {
  // Temporarily disabled WebSocket functionality to fix navigation
  // const { lastMessage } = useWebSocket();
  // const { toast } = useToast();

  // useEffect(() => {
  //   if (lastMessage) {
  //     // Handle real-time updates
  //     switch (lastMessage.type) {
  //       case 'new_recommendation':
  //         toast({
  //           title: "New Optimization Opportunity",
  //           description: `${lastMessage.data.title} - Potential savings: $${Number(lastMessage.data.projectedAnnualSavings).toLocaleString()}/year`,
  //         });
  //         queryClient.invalidateQueries({ queryKey: ['/api/recommendations'] });
  //         break;
  //       case 'optimization_executed':
  //         toast({
  //           title: lastMessage.data.status === 'success' ? "Optimization Completed" : "Optimization Failed",
  //           description: lastMessage.data.status === 'success' ? "Resource optimization executed successfully" : lastMessage.data.error,
  //           variant: lastMessage.data.status === 'success' ? "default" : "destructive",
  //         });
  //         queryClient.invalidateQueries({ queryKey: ['/api/optimization-history'] });
  //         queryClient.invalidateQueries({ queryKey: ['/api/dashboard/metrics'] });
  //         break;
  //     }
  //   }
  // }, [lastMessage, toast]);

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      
      <main className="flex-1 overflow-hidden">
        <Header />
        
        <div className="p-6 h-full overflow-y-auto">
          <MetricsCards />
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
            <div className="lg:col-span-2">
            </div>
            <div>
              <RecommendationsPanel />
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
            <ActivityFeed />
            <DataGeneratorCard />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
            <ResourceMonitor />
          </div>
        </div>
      </main>
      
      <ApprovalModal />
    </div>
  );
}
