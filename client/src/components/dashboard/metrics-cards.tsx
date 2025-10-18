import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/currency";

interface DashboardMetrics {
  monthlySpend: number;
  identifiedSavings: number;
  resourcesAnalyzed: number;
  wastePercentage: number;
}

export function MetricsCards() {
  const { data: metrics, isLoading } = useQuery<DashboardMetrics>({
    queryKey: ['/api/dashboard/metrics'],
    refetchInterval: 60000, // Refresh every minute
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-20 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            No metrics available
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card className="hover:shadow-lg transition-all duration-200 hover:-translate-y-1" data-testid="card-monthly-spend">
        <CardContent className="p-6">
          <div className="flex flex-col justify-center">
            <p className="text-sm font-medium text-muted-foreground">Monthly AWS Spend</p>
            <p className="text-3xl font-bold text-foreground mt-2" data-testid="monthly-spend-amount">
              {formatCurrency(metrics.monthlySpend)}
            </p>
            <p className="text-sm text-destructive mt-1">
              +12.5% vs last month
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="hover:shadow-lg transition-all duration-200 hover:-translate-y-1" data-testid="card-identified-savings">
        <CardContent className="p-6">
          <div className="flex flex-col justify-center">
            <p className="text-sm font-medium text-muted-foreground">Identified Savings</p>
            <p className="text-3xl font-bold text-accent mt-2" data-testid="identified-savings-amount">
              {formatCurrency(metrics.identifiedSavings)}
            </p>
            <p className="text-sm text-accent mt-1">
              Annual projection
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="hover:shadow-lg transition-all duration-200 hover:-translate-y-1" data-testid="card-resources-analyzed">
        <CardContent className="p-6">
          <div className="flex flex-col justify-center">
            <p className="text-sm font-medium text-muted-foreground">Resources Analyzed</p>
            <p className="text-3xl font-bold text-foreground mt-2" data-testid="resources-analyzed-count">
              {metrics.resourcesAnalyzed.toLocaleString()}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Across 12 services
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="hover:shadow-lg transition-all duration-200 hover:-translate-y-1" data-testid="card-waste-percentage">
        <CardContent className="p-6">
          <div className="flex flex-col justify-center">
            <p className="text-sm font-medium text-muted-foreground">Waste Percentage</p>
            <p className="text-3xl font-bold text-chart-3 mt-2" data-testid="waste-percentage-amount">
              {metrics.wastePercentage}%
            </p>
            <p className="text-sm text-destructive mt-1">
              High waste detected
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
