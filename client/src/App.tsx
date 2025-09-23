import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/dashboard";
import CostAnalysis from "@/pages/cost-analysis";
import Recommendations from "@/pages/recommendations";
import Automation from "@/pages/automation";
import Governance from "@/pages/governance";
import AgentConfig from "@/pages/agent-config";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard}/>
      <Route path="/cost-analysis" component={CostAnalysis}/>
      <Route path="/recommendations" component={Recommendations}/>
      <Route path="/automation" component={Automation}/>
      <Route path="/governance" component={Governance}/>
      <Route path="/agent-config" component={AgentConfig}/>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
