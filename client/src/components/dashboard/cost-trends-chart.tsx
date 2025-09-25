import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { formatCurrencyK, formatCurrency } from '@/lib/currency';
import { useState } from "react";
import { TrendingUp } from "lucide-react";

interface CostTrend {
  month: string;
  totalCost: number;
}

export function CostTrendsChart() {
  const [timeRange, setTimeRange] = useState('6M');
  
  const { data: trends, isLoading } = useQuery<CostTrend[]>({
    queryKey: ['/api/dashboard/cost-trends'],
    refetchInterval: 300000, // Refresh every 5 minutes
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cost Trends & Optimization Impact</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Loading chart data...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!trends || trends.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cost Trends & Optimization Impact</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-center">
            <div>
              <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No cost data available</p>
              <p className="text-sm text-muted-foreground mt-2">Cost trends will appear here once data is synced</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Transform data for chart
  const chartData = trends.map(trend => ({
    month: new Date(trend.month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
    actualSpend: trend.totalCost,
    projectedSavings: trend.totalCost * 0.15 // Simplified projection
  }));

  return (
    <Card data-testid="cost-trends-chart">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-foreground">Cost Trends & Optimization Impact</CardTitle>
            <p className="text-muted-foreground text-sm">Monthly spend vs. projected savings</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              variant={timeRange === '3M' ? "default" : "outline"} 
              size="sm"
              onClick={() => setTimeRange('3M')}
              data-testid="button-3m"
            >
              3M
            </Button>
            <Button 
              variant={timeRange === '6M' ? "default" : "outline"} 
              size="sm"
              onClick={() => setTimeRange('6M')}
              data-testid="button-6m"
            >
              6M
            </Button>
            <Button 
              variant={timeRange === '12M' ? "default" : "outline"} 
              size="sm"
              onClick={() => setTimeRange('12M')}
              data-testid="button-12m"
            >
              12M
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64" data-testid="chart-container">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="month" 
                axisLine={false}
                tickLine={false}
                className="text-sm"
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                className="text-sm"
                tickFormatter={(value) => formatCurrencyK(value)}
              />
              <Tooltip 
                formatter={(value: number) => [formatCurrency(value), '']}
                labelFormatter={(label) => `Month: ${label}`}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  color: 'hsl(var(--foreground))'
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="actualSpend" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                name="Actual Spend"
                dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2 }}
              />
              <Line 
                type="monotone" 
                dataKey="projectedSavings" 
                stroke="hsl(var(--accent))" 
                strokeWidth={2}
                name="Projected Savings"
                dot={{ fill: 'hsl(var(--accent))', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-center space-x-4 mt-4 text-sm">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-primary rounded mr-2"></div>
            <span>Actual Spend</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-accent rounded mr-2"></div>
            <span>Projected Savings</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
