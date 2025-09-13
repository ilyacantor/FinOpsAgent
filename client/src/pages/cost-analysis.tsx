import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CostTrendsChart } from "@/components/dashboard/cost-trends-chart";
import { ChartLine, DollarSign, TrendingDown, TrendingUp } from "lucide-react";

export default function CostAnalysis() {
  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      
      <main className="flex-1 overflow-hidden">
        <Header />
        
        <div className="p-6 h-full overflow-y-auto">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cost Analysis</h1>
          <p className="text-muted-foreground">
            Detailed analysis of your AWS spending patterns and cost trends
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Spend</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$0</div>
              <p className="text-xs text-muted-foreground">
                Current month spending
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cost Variance</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0%</div>
              <p className="text-xs text-muted-foreground">
                vs. previous month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Forecast</CardTitle>
              <ChartLine className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$0</div>
              <p className="text-xs text-muted-foreground">
                Projected monthly
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Potential Savings</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$0</div>
              <p className="text-xs text-muted-foreground">
                Available optimizations
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CostTrendsChart />
          
          <Card>
            <CardHeader>
              <CardTitle>Service Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center py-8">
                  <ChartLine className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No cost data available</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Connect your AWS account to see detailed cost breakdown
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
          </div>
        </div>
      </main>
    </div>
  );
}