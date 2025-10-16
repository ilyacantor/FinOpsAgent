import { Card } from "@/components/ui/card";
import { Database, Server, Cloud, Activity, TrendingDown, CheckCircle2, DollarSign, Zap } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/currency";
import type { AwsResource, Recommendation, OptimizationHistory } from "@shared/schema";

export function DataFlowVisualization() {
  const { data: resources = [] } = useQuery<AwsResource[]>({ 
    queryKey: ['/api/aws-resources']
  });
  
  const { data: recommendations = [] } = useQuery<Recommendation[]>({ 
    queryKey: ['/api/recommendations']
  });
  
  const { data: history = [] } = useQuery<OptimizationHistory[]>({ 
    queryKey: ['/api/optimization-history']
  });

  const { data: metrics } = useQuery<{
    monthlySpend: number;
    identifiedSavings: number;
    executedSavings: number;
    activeResources: number;
  }>({ 
    queryKey: ['/api/dashboard/metrics']
  });

  const ec2Count = resources.filter(r => r.resourceType === 'EC2').length;
  const rdsCount = resources.filter(r => r.resourceType === 'RDS').length;
  const s3Count = resources.filter(r => r.resourceType === 'S3').length;
  const activeRecommendations = recommendations.filter(r => r.status === 'pending' || r.status === 'approved').length;
  const appliedOptimizations = history.filter(h => h.status === 'completed').length;
  const totalResources = resources.length;
  const totalOutputs = activeRecommendations + appliedOptimizations + (history.length > 0 ? 1 : 0);
  return (
    <Card className="p-6 bg-card border-border">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-foreground" data-testid="text-dataflow-title">Data Flow Pipeline</h3>
        <p className="text-sm text-muted-foreground" data-testid="text-dataflow-description">
          AWS Resource Analysis → AI Processing → Cost Optimization
        </p>
      </div>

      <div className="relative">
        {/* Flow Diagram */}
        <div className="grid grid-cols-3 gap-8">
          {/* Input Sources */}
          <div className="space-y-3">
            <div className="text-xs font-semibold text-primary mb-3" data-testid="text-input-label">INPUT SOURCES</div>
            
            <div className="group relative" data-testid="card-input-ec2">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 border border-border hover:border-primary/50 transition-all">
                <Server className="w-5 h-5 text-chart-1" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-foreground">EC2 Instances</div>
                  <div className="text-xs text-muted-foreground">{ec2Count} resources</div>
                </div>
              </div>
              <div className="absolute -right-4 top-1/2 -translate-y-1/2 w-4 h-0.5 bg-gradient-to-r from-chart-1 to-transparent"></div>
            </div>

            <div className="group relative" data-testid="card-input-rds">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 border border-border hover:border-primary/50 transition-all">
                <Database className="w-5 h-5 text-chart-3" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-foreground">RDS Databases</div>
                  <div className="text-xs text-muted-foreground">{rdsCount} resources</div>
                </div>
              </div>
              <div className="absolute -right-4 top-1/2 -translate-y-1/2 w-4 h-0.5 bg-gradient-to-r from-chart-3 to-transparent"></div>
            </div>

            <div className="group relative" data-testid="card-input-s3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 border border-border hover:border-primary/50 transition-all">
                <Cloud className="w-5 h-5 text-chart-2" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-foreground">S3 Buckets</div>
                  <div className="text-xs text-muted-foreground">{s3Count} resources</div>
                </div>
              </div>
              <div className="absolute -right-4 top-1/2 -translate-y-1/2 w-4 h-0.5 bg-gradient-to-r from-chart-2 to-transparent"></div>
            </div>

            <div className="group relative" data-testid="card-input-metrics">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 border border-border hover:border-primary/50 transition-all">
                <Activity className="w-5 h-5 text-chart-4" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-foreground">CloudWatch</div>
                  <div className="text-xs text-muted-foreground">Metrics & Logs</div>
                </div>
              </div>
              <div className="absolute -right-4 top-1/2 -translate-y-1/2 w-4 h-0.5 bg-gradient-to-r from-chart-4 to-transparent"></div>
            </div>
          </div>

          {/* Processing Stage */}
          <div className="flex items-center justify-center">
            <div className="relative w-full" data-testid="card-processing">
              <div className="text-xs font-semibold text-primary mb-3 text-center" data-testid="text-processing-label">AI PROCESSING</div>
              <div className="relative p-6 rounded-xl bg-gradient-to-br from-primary/10 via-accent/10 to-chart-2/10 border-2 border-primary/30">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent rounded-xl animate-pulse"></div>
                <div className="relative space-y-3">
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-primary animate-pulse" />
                    <span className="text-sm font-semibold text-foreground">FinOps AI Agent</span>
                  </div>
                  <div className="space-y-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-chart-1"></div>
                      <span>Resource Analysis</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-chart-3"></div>
                      <span>Cost Pattern Detection</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-chart-2"></div>
                      <span>Utilization Optimization</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-chart-4"></div>
                      <span>Recommendation Engine</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Output Results */}
          <div className="space-y-3">
            <div className="text-xs font-semibold text-primary mb-3" data-testid="text-output-label">OUTPUT RESULTS</div>
            
            <div className="group relative" data-testid="card-output-recommendations">
              <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-4 h-0.5 bg-gradient-to-r from-transparent to-chart-1"></div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 border border-border hover:border-accent/50 transition-all">
                <CheckCircle2 className="w-5 h-5 text-accent" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-foreground">Recommendations</div>
                  <div className="text-xs text-accent">{activeRecommendations} active</div>
                </div>
              </div>
            </div>

            <div className="group relative" data-testid="card-output-savings">
              <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-4 h-0.5 bg-gradient-to-r from-transparent to-chart-3"></div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 border border-border hover:border-accent/50 transition-all">
                <DollarSign className="w-5 h-5 text-chart-3" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-foreground">Identified Savings</div>
                  <div className="text-xs text-chart-3">{formatCurrency(metrics?.identifiedSavings || 0)}/month</div>
                </div>
              </div>
            </div>

            <div className="group relative" data-testid="card-output-optimizations">
              <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-4 h-0.5 bg-gradient-to-r from-transparent to-chart-2"></div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 border border-border hover:border-accent/50 transition-all">
                <TrendingDown className="w-5 h-5 text-chart-2" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-foreground">Auto-Optimizations</div>
                  <div className="text-xs text-chart-2">{appliedOptimizations} applied</div>
                </div>
              </div>
            </div>

            <div className="group relative" data-testid="card-output-reports">
              <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-4 h-0.5 bg-gradient-to-r from-transparent to-chart-4"></div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 border border-border hover:border-accent/50 transition-all">
                <Activity className="w-5 h-5 text-chart-4" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-foreground">Cost Reports</div>
                  <div className="text-xs text-chart-4">Real-time updates</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Flow Lines Overlay (decorative) */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: -1 }}>
          <defs>
            <linearGradient id="flowGradient1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(186, 100%, 50%)" stopOpacity="0.1" />
              <stop offset="50%" stopColor="hsl(186, 100%, 50%)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="hsl(152, 70%, 45%)" stopOpacity="0.1" />
            </linearGradient>
          </defs>
          <path
            d="M 33% 30% Q 50% 30%, 67% 25%"
            stroke="url(#flowGradient1)"
            strokeWidth="2"
            fill="none"
            opacity="0.3"
          />
          <path
            d="M 33% 50% Q 50% 50%, 67% 45%"
            stroke="url(#flowGradient1)"
            strokeWidth="2"
            fill="none"
            opacity="0.3"
          />
          <path
            d="M 33% 70% Q 50% 70%, 67% 65%"
            stroke="url(#flowGradient1)"
            strokeWidth="2"
            fill="none"
            opacity="0.3"
          />
        </svg>
      </div>

      {/* Stats Footer */}
      <div className="mt-6 pt-4 border-t border-border">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div data-testid="stat-input-count">
            <div className="text-2xl font-bold text-primary">{totalResources}</div>
            <div className="text-xs text-muted-foreground">Resources Monitored</div>
          </div>
          <div data-testid="stat-processing-rate">
            <div className="text-2xl font-bold text-accent">Real-time</div>
            <div className="text-xs text-muted-foreground">Processing Speed</div>
          </div>
          <div data-testid="stat-output-count">
            <div className="text-2xl font-bold text-chart-3">{totalOutputs}</div>
            <div className="text-xs text-muted-foreground">Active Outputs</div>
          </div>
        </div>
      </div>
    </Card>
  );
}
