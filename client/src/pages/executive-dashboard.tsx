import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { TopNav } from "@/components/layout/top-nav";
import { useAgentConfig } from "@/hooks/use-agent-config";
import { AiModeIndicator } from "@/components/ai-mode-indicator";
import { AiModeHistory } from "@/components/ai-mode-history";
import { OptimizationMix } from "@/components/dashboard/optimization-mix";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { formatCurrencyCompact as formatCurrency } from "@/lib/currency";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, AreaChart, Area
} from "recharts";
import { 
  TrendingUp, TrendingDown, DollarSign, Zap, Database, Network, 
  HardDrive, Cpu, AlertTriangle, CheckCircle, Clock, Target
} from "lucide-react";

type Timeframe = "month" | "quarter" | "ytd" | "annual";
type Environment = "prod" | "stage" | "synthetic";

export default function ExecutiveDashboard() {
  const [timeframe, setTimeframe] = useState<Timeframe>("month");
  const [environment, setEnvironment] = useState<Environment>("synthetic");
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [optimizationAdoption, setOptimizationAdoption] = useState([60]);

  const { agentConfig, updateProdMode } = useAgentConfig();
  const { data: resources = [] } = useQuery<any[]>({ queryKey: ["/api/aws-resources"] });
  const { data: recommendations = [] } = useQuery<any[]>({ queryKey: ["/api/recommendations"] });
  const { data: optimizationHistory = [] } = useQuery<any[]>({ queryKey: ["/api/optimization-history"] });
  
  // Use the new metrics summary endpoint with 3s refresh for real-time feel
  const { data: metricsSummary } = useQuery<any>({ 
    queryKey: ["/api/metrics/summary"],
    refetchInterval: 3000 
  });

  // Calculate metrics
  const monthlySpend = metricsSummary?.monthlySpend || 0;
  const ytdSpend = metricsSummary?.ytdSpend || 0;
  const identifiedSavings = metricsSummary?.identifiedSavingsAwaitingApproval || 0;
  const realizedSavings = metricsSummary?.realizedSavingsYTD || 0;
  const wastePercent = metricsSummary?.wastePercentOptimizedYTD || 0;
  const monthlySpendChange = metricsSummary?.monthlySpendChange || 0;
  const ytdSpendChange = metricsSummary?.ytdSpendChange || 0;

  const roi = monthlySpend > 0 
    ? ((realizedSavings / monthlySpend) * 100).toFixed(2) 
    : "0";

  // Spend breakdown by category
  const spendBreakdown = [
    { name: "Compute", value: Math.floor(monthlySpend * 0.40), icon: Cpu, color: "#0BCAD9" },
    { name: "Storage", value: Math.floor(monthlySpend * 0.25), icon: HardDrive, color: "#08A0AE" },
    { name: "Database", value: Math.floor(monthlySpend * 0.20), icon: Database, color: "#067682" },
    { name: "Network", value: Math.floor(monthlySpend * 0.10), icon: Network, color: "#044C56" },
    { name: "Other", value: Math.floor(monthlySpend * 0.05), icon: Zap, color: "#02222A" },
  ];

  // Monthly trend data (simulated)
  const monthlyTrend = [
    { month: "Jan", spend: monthlySpend * 0.85, savings: realizedSavings * 0.70 },
    { month: "Feb", spend: monthlySpend * 0.88, savings: realizedSavings * 0.75 },
    { month: "Mar", spend: monthlySpend * 0.92, savings: realizedSavings * 0.80 },
    { month: "Apr", spend: monthlySpend * 0.95, savings: realizedSavings * 0.85 },
    { month: "May", spend: monthlySpend * 0.98, savings: realizedSavings * 0.90 },
    { month: "Jun", spend: monthlySpend, savings: realizedSavings },
  ];

  // Utilization distribution
  const utilizationDist = [
    { range: "0-20%", count: resources.filter((r: any) => (r.utilizationMetrics?.cpuUtilization || 0) < 20).length },
    { range: "20-40%", count: resources.filter((r: any) => (r.utilizationMetrics?.cpuUtilization || 0) >= 20 && (r.utilizationMetrics?.cpuUtilization || 0) < 40).length },
    { range: "40-60%", count: resources.filter((r: any) => (r.utilizationMetrics?.cpuUtilization || 0) >= 40 && (r.utilizationMetrics?.cpuUtilization || 0) < 60).length },
    { range: "60-80%", count: resources.filter((r: any) => (r.utilizationMetrics?.cpuUtilization || 0) >= 60 && (r.utilizationMetrics?.cpuUtilization || 0) < 80).length },
    { range: "80-100%", count: resources.filter((r: any) => (r.utilizationMetrics?.cpuUtilization || 0) >= 80).length },
  ];


  const avgUtilization = resources.length > 0
    ? resources.reduce((sum: number, r: any) => sum + (r.utilizationMetrics?.cpuUtilization || 0), 0) / resources.length
    : 0;

  const underutilizedResources = resources.filter((r: any) => (r.utilizationMetrics?.cpuUtilization || 0) < 30);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AiModeIndicator />
      <TopNav 
        lastSync="2 min ago"
        prodMode={agentConfig?.prodMode || false}
        onProdModeChange={updateProdMode}
      />
      <div className="flex-1 flex pt-[60px]">
        <Sidebar />
        <main className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto bg-[#0A0E13] text-white p-6" data-testid="executive-dashboard">
            <div className="mb-6">
              <h1 className="text-3xl font-bold tracking-tight">Executive Dashboard</h1>
              <p className="text-gray-400 mt-1">
                Summary of AWS Financial Operations Agentic Actions
              </p>
            </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-[#1B1E23] border-[#0BCAD9]/20">
          <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
          <TabsTrigger value="trends" data-testid="tab-trends">Cost Trends</TabsTrigger>
          <TabsTrigger value="optimization" data-testid="tab-optimization">Optimization</TabsTrigger>
          <TabsTrigger value="governance" data-testid="tab-governance">Governance</TabsTrigger>
        </TabsList>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-6">
          {/* Executive Summary - Financial Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card className="bg-[#1B1E23] border-[#0BCAD9]/20" data-testid="card-monthly-spend">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Monthly AWS Spend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col justify-center">
                  <div className="text-3xl font-bold text-[#0BCAD9]">{formatCurrency(monthlySpend)}</div>
                  <div className={`text-sm mt-1 flex items-center gap-1 ${monthlySpendChange > 0 ? 'text-red-500' : 'text-green-500'}`}>
                    {monthlySpendChange > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                    {Math.abs(monthlySpendChange).toFixed(1)}% vs last month
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#1B1E23] border-[#0BCAD9]/20" data-testid="card-ytd-spend">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">YTD AWS Spend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col justify-center">
                  <div className="text-3xl font-bold text-[#0BCAD9]">{formatCurrency(ytdSpend)}</div>
                  <div className={`text-sm mt-1 flex items-center gap-1 ${ytdSpendChange > 0 ? 'text-red-500' : 'text-green-500'}`}>
                    {ytdSpendChange > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                    {Math.abs(ytdSpendChange).toFixed(1)}% vs prior-year YTD
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#1B1E23] border-[#0BCAD9]/20" data-testid="card-identified-savings">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Identified Savings Awaiting Approval</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col justify-center">
                  <div className="text-3xl font-bold text-green-500">{formatCurrency(identifiedSavings)}</div>
                  <div className="text-sm text-[#0BCAD9] mt-1">
                    {recommendations.filter((r: any) => r.status === 'pending' || r.status === 'approved').length} recommendations
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#1B1E23] border-[#0BCAD9]/20" data-testid="card-realized-savings">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Realized Savings YTD</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col justify-center">
                  <div className="text-3xl font-bold text-[#0BCAD9]">{formatCurrency(realizedSavings)}</div>
                  <div className="text-sm text-gray-400 mt-1">
                    {optimizationHistory.filter((h: any) => h.status === 'success').length} executed
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#1B1E23] border-[#0BCAD9]/20" data-testid="card-waste-percentage">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Waste % Optimized YTD</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col justify-center">
                  <div className="text-3xl font-bold text-orange-500">{(wastePercent || 0).toFixed(1)}%</div>
                  <div className="text-sm text-gray-400 mt-1">
                    YTD Performance
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Optimization Mix */}
          <OptimizationMix />

          {/* AWS Spend Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-[#1B1E23] border-[#0BCAD9]/20" data-testid="card-spend-breakdown">
              <CardHeader>
                <CardTitle className="text-[#0BCAD9]">AWS Spend Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={spendBreakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {spendBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: any) => formatCurrency(value)}
                      contentStyle={{ backgroundColor: '#1B1E23', border: '1px solid #0BCAD9' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {spendBreakdown.map((item) => (
                    <div key={item.name} className="flex items-center gap-2 text-sm">
                      <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: item.color }} />
                      <span className="text-gray-400">{item.name}:</span>
                      <span className="text-white font-semibold">{formatCurrency(item.value)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#1B1E23] border-[#0BCAD9]/20" data-testid="card-utilization-dist">
              <CardHeader>
                <CardTitle className="text-[#0BCAD9]">Utilization Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={utilizationDist}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="range" stroke="#888" />
                    <YAxis stroke="#888" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1B1E23', border: '1px solid #0BCAD9' }}
                    />
                    <Bar dataKey="count" fill="#0BCAD9" />
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-4 text-sm text-gray-400">
                  <p>Average CPU Utilization: <span className="text-[#0BCAD9] font-semibold">{avgUtilization.toFixed(1)}%</span></p>
                  <p>Underutilized Resources (&lt;30%): <span className="text-orange-500 font-semibold">{underutilizedResources.length}</span></p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* AI Mode History */}
          <AiModeHistory />
        </TabsContent>

        {/* COST TRENDS TAB */}
        <TabsContent value="trends" className="space-y-6">
          <Card className="bg-[#1B1E23] border-[#0BCAD9]/20" data-testid="card-monthly-trend">
            <CardHeader>
              <CardTitle className="text-[#0BCAD9]">Monthly Spend & Savings Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="month" stroke="#888" />
                  <YAxis stroke="#888" tickFormatter={(value) => formatCurrency(value)} />
                  <Tooltip 
                    formatter={(value: any) => formatCurrency(value)}
                    contentStyle={{ backgroundColor: '#1B1E23', border: '1px solid #0BCAD9' }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="spend" stroke="#0BCAD9" strokeWidth={2} name="Monthly Spend" />
                  <Line type="monotone" dataKey="savings" stroke="#10B981" strokeWidth={2} name="Realized Savings" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* OPTIMIZATION TAB */}
        <TabsContent value="optimization" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-[#1B1E23] border-[#0BCAD9]/20" data-testid="card-top-recommendations">
              <CardHeader>
                <CardTitle className="text-[#0BCAD9]">Top Optimization Opportunities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recommendations.slice(0, 5).map((rec: any) => (
                    <div key={rec.id} className="flex items-center justify-between p-3 bg-[#0A0E13] rounded-lg" data-testid={`recommendation-${rec.id}`}>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">{rec.title}</p>
                        <p className="text-xs text-gray-400 mt-1">{rec.type}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-green-500">{formatCurrency(rec.projectedMonthlySavings)}/mo</p>
                        <p className="text-xs text-gray-400">{rec.priority} priority</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#1B1E23] border-[#0BCAD9]/20" data-testid="card-forecast-simulation">
              <CardHeader>
                <CardTitle className="text-[#0BCAD9]">Forecast & Simulation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">
                      Optimization Adoption Rate: {optimizationAdoption[0]}%
                    </label>
                    <Slider
                      value={optimizationAdoption}
                      onValueChange={setOptimizationAdoption}
                      max={100}
                      step={10}
                      className="mb-4"
                      data-testid="slider-adoption-rate"
                    />
                  </div>
                  
                  <div className="p-4 bg-[#0A0E13] rounded-lg space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Current Annual Spend:</span>
                      <span className="text-white font-semibold">{formatCurrency(monthlySpend * 12)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Projected Annual Savings:</span>
                      <span className="text-green-500 font-semibold">
                        {formatCurrency((identifiedSavings * 12 * optimizationAdoption[0]) / 100)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Optimized Annual Spend:</span>
                      <span className="text-[#0BCAD9] font-semibold">
                        {formatCurrency(monthlySpend * 12 - (identifiedSavings * 12 * optimizationAdoption[0]) / 100)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* GOVERNANCE TAB */}
        <TabsContent value="governance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="bg-[#1B1E23] border-[#0BCAD9]/20" data-testid="card-policy-status">
              <CardHeader>
                <CardTitle className="text-[#0BCAD9]">Policy Compliance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Tagged Resources</span>
                    <span className="text-green-500 font-semibold">95%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Cost Threshold Alerts</span>
                    <span className="text-orange-500 font-semibold">3 active</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Compliance Score</span>
                    <span className="text-[#0BCAD9] font-semibold">87/100</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#1B1E23] border-[#0BCAD9]/20" data-testid="card-approval-queue">
              <CardHeader>
                <CardTitle className="text-[#0BCAD9]">Approval Queue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="p-3 bg-[#0A0E13] rounded-lg">
                    <p className="text-sm font-medium text-white">Pending Reviews</p>
                    <p className="text-2xl font-bold text-orange-500 mt-1">
                      {recommendations.filter((r: any) => r.status === 'pending').length}
                    </p>
                  </div>
                  <div className="p-3 bg-[#0A0E13] rounded-lg">
                    <p className="text-sm font-medium text-white">Approved This Month</p>
                    <p className="text-2xl font-bold text-green-500 mt-1">
                      {recommendations.filter((r: any) => r.status === 'approved').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#1B1E23] border-[#0BCAD9]/20" data-testid="card-agent-activity">
              <CardHeader>
                <CardTitle className="text-[#0BCAD9]">Agent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {optimizationHistory.slice(0, 3).map((item: any) => (
                    <div key={item.id} className="flex items-start gap-2 text-sm" data-testid={`activity-${item.id}`}>
                      <Clock className="w-4 h-4 text-[#0BCAD9] mt-0.5" />
                      <div className="flex-1">
                        <p className="text-white">{item.recommendationType || 'Optimization'}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(item.executionDate).toLocaleString()}
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded ${
                        item.status === 'success' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}
