import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartLine, DollarSign, TrendingDown, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { useQuery } from "@tanstack/react-query";
import type { AwsResource } from "@shared/schema";

interface DashboardMetrics {
  monthlySpend: number;
  identifiedSavings: number;
  realizedSavings: number;
  resourcesAnalyzed: number;
  wastePercentage: number;
}

interface CostTrend {
  month: string;
  totalCost: number;
}

export default function CostAnalysis() {
  const { data: metrics, isLoading: metricsLoading } = useQuery<DashboardMetrics>({
    queryKey: ['/api/dashboard/metrics'],
    refetchInterval: 60000,
  });

  const { data: trends, isLoading: trendsLoading } = useQuery<CostTrend[]>({
    queryKey: ['/api/dashboard/cost-trends'],
    refetchInterval: 300000,
  });

  const { data: resources, isLoading: resourcesLoading } = useQuery<AwsResource[]>({
    queryKey: ['/api/aws-resources'],
    refetchInterval: 300000,
  });

  // Calculate cost variance from trends
  const costVariance = trends && trends.length >= 2 
    ? ((trends[trends.length - 1].totalCost - trends[trends.length - 2].totalCost) / trends[trends.length - 2].totalCost) * 100
    : 0;

  // Calculate forecast based on trend
  const forecast = trends && trends.length >= 3
    ? trends[trends.length - 1].totalCost * 1.025 // Simple 2.5% growth projection
    : metrics?.monthlySpend ? metrics.monthlySpend * 1.025 : 0;

  // Calculate service breakdown from resources
  const serviceBreakdown = resources?.reduce((acc, resource) => {
    const service = resource.resourceType;
    const cost = Number(resource.monthlyCost) || 0;
    acc[service] = (acc[service] || 0) + cost;
    return acc;
  }, {} as Record<string, number>) || {};

  const sortedServices = Object.entries(serviceBreakdown)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5); // Top 5 services

  const isLoading = metricsLoading || trendsLoading || resourcesLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen flex bg-background">
        <Sidebar />
        <main className="flex-1 overflow-hidden">
          <Header />
          <div className="p-6 h-full overflow-y-auto">
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Cost Analysis</h1>
                <p className="text-muted-foreground">Loading cost analysis...</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-20 bg-muted rounded"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

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
                  <div className="text-2xl font-bold" data-testid="monthly-spend">
                    {formatCurrency(metrics?.monthlySpend || 0)}
                  </div>
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
                  <div className="text-2xl font-bold" data-testid="cost-variance">
                    {costVariance > 0 ? '+' : ''}{costVariance.toFixed(1)}%
                  </div>
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
                  <div className="text-2xl font-bold" data-testid="forecast">
                    {formatCurrency(forecast)}
                  </div>
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
                  <div className="text-2xl font-bold" data-testid="potential-savings">
                    {formatCurrency(metrics?.identifiedSavings || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Available optimizations
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Realized Savings</CardTitle>
                  <TrendingUp className="h-4 w-4 text-accent" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-accent" data-testid="realized-savings">
                    {formatCurrency(metrics?.realizedSavings || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    From approved optimizations
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Service Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4" data-testid="service-breakdown">
                    {sortedServices.length > 0 ? (
                      sortedServices.map(([service, cost]) => (
                        <div key={service} className="flex justify-between items-center">
                          <div className="flex items-center space-x-3">
                            <div className="w-3 h-3 bg-primary rounded-full"></div>
                            <span className="text-sm font-medium">{service}</span>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-bold">{formatCurrency(cost)}/mo</div>
                            <div className="text-xs text-muted-foreground">
                              {((cost / (metrics?.monthlySpend || 1)) * 100).toFixed(1)}%
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <ChartLine className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No cost data available</p>
                        <p className="text-sm text-muted-foreground mt-2">
                          Cost breakdown will appear here once resources are analyzed
                        </p>
                      </div>
                    )}
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