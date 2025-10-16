import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3001;

// Enable JSON body parsing
app.use(express.json());

// In-memory storage for actions and feedback
const actionsLog = [];
const feedbackLog = [];

// Load mock AWS resources data
const awsResourcesPath = join(__dirname, 'aws_resources.json');
const awsResources = JSON.parse(readFileSync(awsResourcesPath, 'utf-8'));

// Generate mock historical spend data for last 6 months
function generateHistoricalSpend() {
  const months = ['May 2024', 'Jun 2024', 'Jul 2024', 'Aug 2024', 'Sep 2024', 'Oct 2024'];
  const baseSpend = 3000;
  return months.map((month, index) => ({
    month,
    spend: baseSpend + (Math.random() * 500) + (index * 100) // Slight upward trend
  }));
}

// Calculate spend summary analytics
function calculateSpendSummary() {
  const historicalData = generateHistoricalSpend();
  const currentMonthSpend = awsResources.reduce((sum, r) => sum + r.monthlyCost, 0);
  
  // Calculate YTD (Jan-Oct = 10 months)
  const ytdSpend = historicalData.reduce((sum, d) => sum + d.spend, 0) + (currentMonthSpend * 4); // Add 4 months before May
  
  // Annual projection
  const avgMonthlySpend = ytdSpend / 10; // 10 months so far
  const annualProjection = avgMonthlySpend * 12;
  
  // Calculate average CPU and Memory utilization
  const computeResources = awsResources.filter(r => ['EC2', 'RDS', 'ElastiCache'].includes(r.type));
  const avgCpuUtilization = Math.round(
    computeResources.reduce((sum, r) => sum + r.utilizationPercent, 0) / computeResources.length
  );
  const avgMemoryUtilization = Math.round(avgCpuUtilization * 0.85); // Simulate memory being slightly lower
  
  // Spend breakdown by resource type
  const spendByType = {};
  awsResources.forEach(resource => {
    if (!spendByType[resource.type]) {
      spendByType[resource.type] = 0;
    }
    spendByType[resource.type] += resource.monthlyCost;
  });
  
  return {
    monthlySpend: currentMonthSpend,
    ytdSpend: Math.round(ytdSpend * 100) / 100,
    annualProjection: Math.round(annualProjection * 100) / 100,
    avgCpuUtilization,
    avgMemoryUtilization,
    spendByType,
    historicalTrend: historicalData
  };
}

// Mission 2: Generate optimization recommendations
function generateRecommendations() {
  const recommendations = [];
  
  awsResources.forEach(resource => {
    const cpuUtil = resource.utilizationPercent;
    const memUtil = cpuUtil * 0.85; // Simulate memory being slightly lower
    
    // Flag low CPU (<25%) or low Memory (<30%)
    if (cpuUtil < 25 || memUtil < 30) {
      const potentialSavings = Math.round(resource.monthlyCost * 0.20 * 100) / 100;
      const confidence = 0.6 + (Math.random() * 0.3); // 0.6 - 0.9
      
      let reason = '';
      if (cpuUtil < 25 && memUtil < 30) {
        reason = `Low CPU (${cpuUtil}%) and Memory (${Math.round(memUtil)}%) utilization`;
      } else if (cpuUtil < 25) {
        reason = `Low CPU utilization (${cpuUtil}%)`;
      } else {
        reason = `Low Memory utilization (${Math.round(memUtil)}%)`;
      }
      
      recommendations.push({
        id: `rec-${resource.resourceId}`,
        resourceId: resource.resourceId,
        resourceType: resource.type,
        region: resource.region,
        recommendation: `Consider downsizing or removing this ${resource.type} resource`,
        reason,
        potentialSavings,
        confidence: Math.round(confidence * 100) / 100,
        currentCost: resource.monthlyCost
      });
    }
  });
  
  return recommendations;
}

// Mission 4: Generate forecast with optional adoption rate
function generateForecast(adoptionRate = 0) {
  const historicalData = generateHistoricalSpend();
  
  // Calculate linear trend
  const n = historicalData.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  
  historicalData.forEach((d, i) => {
    sumX += i;
    sumY += d.spend;
    sumXY += i * d.spend;
    sumX2 += i * i;
  });
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  // Project next 3 months
  const forecast = [];
  const nextMonths = ['Nov 2024', 'Dec 2024', 'Jan 2025'];
  
  const recommendations = generateRecommendations();
  const totalPotentialSavings = recommendations.reduce((sum, r) => sum + r.potentialSavings, 0);
  const savingsReduction = totalPotentialSavings * (adoptionRate / 100);
  
  nextMonths.forEach((month, i) => {
    const x = n + i;
    const projectedSpend = slope * x + intercept;
    forecast.push({
      month,
      spend: Math.round((projectedSpend - savingsReduction) * 100) / 100
    });
  });
  
  return {
    historical: historicalData,
    forecast,
    trend: { slope: Math.round(slope * 100) / 100, intercept: Math.round(intercept * 100) / 100 },
    adoptionRate,
    projectedSavings: Math.round(savingsReduction * 100) / 100
  };
}

// Mission 5: Evaluate policy violations
const policies = [
  { id: 'pol-1', name: 'Low CPU Utilization', threshold: 25, type: 'cpu', severity: 'medium' },
  { id: 'pol-2', name: 'Very Low Utilization', threshold: 15, type: 'cpu', severity: 'high' },
  { id: 'pol-3', name: 'Unoptimized EBS', threshold: 40, type: 'utilization', resourceType: 'EBS', severity: 'low' }
];

function evaluateViolations() {
  const violations = [];
  
  awsResources.forEach(resource => {
    policies.forEach(policy => {
      let isViolation = false;
      
      if (policy.type === 'cpu' && resource.utilizationPercent < policy.threshold) {
        isViolation = true;
      } else if (policy.type === 'utilization' && policy.resourceType === resource.type && resource.utilizationPercent < policy.threshold) {
        isViolation = true;
      }
      
      if (isViolation) {
        violations.push({
          id: `viol-${resource.resourceId}-${policy.id}`,
          policyId: policy.id,
          policyName: policy.name,
          resourceId: resource.resourceId,
          resourceType: resource.type,
          severity: policy.severity,
          costImpact: Math.round(resource.monthlyCost * 0.1 * 100) / 100,
          details: `${resource.type} ${resource.resourceId} has ${resource.utilizationPercent}% utilization (threshold: ${policy.threshold}%)`
        });
      }
    });
  });
  
  return violations;
}

// Mission 6: Generate aggregated report
function generateReport() {
  const summary = calculateSpendSummary();
  const recommendations = generateRecommendations();
  const actions = actionsLog.filter(a => a.actionType === 'apply');
  
  const totalSavingsIdentified = recommendations.reduce((sum, r) => sum + r.potentialSavings, 0);
  const totalSavingsRealized = actions.reduce((sum, a) => {
    const rec = recommendations.find(r => r.resourceId === a.resourceId);
    return sum + (rec ? rec.potentialSavings : 0);
  }, 0);
  
  const adoptionRate = recommendations.length > 0 
    ? Math.round((actions.length / recommendations.length) * 100)
    : 0;
  
  return {
    reportDate: new Date().toISOString(),
    totalSpend: summary.monthlySpend,
    ytdSpend: summary.ytdSpend,
    annualProjection: summary.annualProjection,
    savingsIdentified: Math.round(totalSavingsIdentified * 100) / 100,
    savingsRealized: Math.round(totalSavingsRealized * 100) / 100,
    adoptionRate,
    totalResources: awsResources.length,
    recommendationsCount: recommendations.length,
    actionsCount: actions.length
  };
}

// Serve static HTML
app.use(express.static(__dirname));

// API endpoint to get all resources
app.get('/api/resources', (req, res) => {
  res.json(awsResources);
});

// API endpoint for spend summary
app.get('/api/finops/spend-summary', (req, res) => {
  const summary = calculateSpendSummary();
  res.json(summary);
});

// Mission 2: API endpoint for recommendations
app.get('/api/finops/recommendations', (req, res) => {
  const recommendations = generateRecommendations();
  
  // Apply feedback adjustments to confidence scores
  const adjustedRecs = recommendations.map(rec => {
    const feedback = feedbackLog.filter(f => f.recommendationId === rec.id);
    const positiveCount = feedback.filter(f => f.outcome === 1).length;
    const negativeCount = feedback.filter(f => f.outcome === -1).length;
    const totalFeedback = positiveCount + negativeCount;
    
    if (totalFeedback > 0) {
      const feedbackScore = (positiveCount - negativeCount) / totalFeedback;
      const adjustedConfidence = Math.max(0.1, Math.min(0.99, rec.confidence + (feedbackScore * 0.2)));
      return { ...rec, confidence: Math.round(adjustedConfidence * 100) / 100 };
    }
    return rec;
  });
  
  res.json(adjustedRecs);
});

// Mission 3: Action tracking endpoints
app.post('/api/finops/actions', (req, res) => {
  const { resourceId, actionType, result } = req.body;
  
  const action = {
    id: `action-${Date.now()}`,
    resourceId,
    actionType,
    result: result || 'pending',
    timestamp: new Date().toISOString()
  };
  
  actionsLog.push(action);
  res.json({ success: true, action });
});

app.get('/api/finops/actions', (req, res) => {
  res.json(actionsLog);
});

// Mission 4: Forecast endpoint
app.get('/api/finops/forecast', (req, res) => {
  const adoptionRate = parseInt(req.query.adoptionRate) || 0;
  const forecast = generateForecast(adoptionRate);
  res.json(forecast);
});

// Mission 5: Violations endpoint
app.get('/api/finops/violations', (req, res) => {
  const violations = evaluateViolations();
  res.json(violations);
});

// Mission 6: Report and CSV export
app.get('/api/finops/report', (req, res) => {
  const format = req.query.format;
  const report = generateReport();
  
  if (format === 'csv') {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const csvRows = [
      ['Metric', 'Value'],
      ['Report Date', report.reportDate],
      ['Total Spend', `$${report.totalSpend}`],
      ['YTD Spend', `$${report.ytdSpend}`],
      ['Annual Projection', `$${report.annualProjection}`],
      ['Savings Identified', `$${report.savingsIdentified}`],
      ['Savings Realized', `$${report.savingsRealized}`],
      ['Adoption Rate', `${report.adoptionRate}%`],
      ['Total Resources', report.totalResources],
      ['Recommendations Count', report.recommendationsCount],
      ['Actions Count', report.actionsCount]
    ];
    
    const csv = csvRows.map(row => row.join(',')).join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=finops-report-${timestamp}.csv`);
    res.send(csv);
  } else {
    res.json(report);
  }
});

// Mission 7: Feedback endpoint
app.post('/api/finops/feedback', (req, res) => {
  const { recommendationId, outcome } = req.body;
  
  const feedback = {
    id: `feedback-${Date.now()}`,
    recommendationId,
    outcome, // +1 or -1
    timestamp: new Date().toISOString()
  };
  
  feedbackLog.push(feedback);
  res.json({ success: true, feedback });
});

app.get('/api/finops/feedback', (req, res) => {
  const totalFeedback = feedbackLog.length;
  const positiveFeedback = feedbackLog.filter(f => f.outcome === 1).length;
  const positivePercentage = totalFeedback > 0 
    ? Math.round((positiveFeedback / totalFeedback) * 100)
    : 0;
  
  res.json({
    total: totalFeedback,
    positive: positiveFeedback,
    negative: totalFeedback - positiveFeedback,
    positivePercentage
  });
});

// Root redirect to dashboard
app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'dashboard.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n✅ FinOps Phase 1 Prototype running on http://0.0.0.0:${PORT}`);
  console.log(`📊 Dashboard: http://0.0.0.0:${PORT}/dashboard.html`);
  console.log(`\n🔌 API Endpoints:`);
  console.log(`   - GET  /api/resources - All AWS resources`);
  console.log(`   - GET  /api/finops/spend-summary - Spend analytics & trends`);
  console.log(`   - GET  /api/finops/recommendations - Optimization recommendations`);
  console.log(`   - POST /api/finops/actions - Record actions`);
  console.log(`   - GET  /api/finops/actions - Action history`);
  console.log(`   - GET  /api/finops/forecast?adoptionRate=X - Spend forecast`);
  console.log(`   - GET  /api/finops/violations - Policy violations`);
  console.log(`   - GET  /api/finops/report?format=csv - Export CSV report`);
  console.log(`   - POST /api/finops/feedback - Submit feedback`);
  console.log(`   - GET  /api/finops/feedback - Feedback statistics`);
  
  const recommendations = generateRecommendations();
  const violations = evaluateViolations();
  const avgSavings = recommendations.length > 0 
    ? Math.round(recommendations.reduce((sum, r) => sum + r.potentialSavings, 0) / recommendations.length)
    : 0;
  
  console.log(`\n📈 Analytics Summary:`);
  console.log(`   - ${recommendations.length} optimization opportunities identified`);
  console.log(`   - $${avgSavings} avg potential savings per recommendation`);
  console.log(`   - ${violations.length} policy violations detected`);
  console.log(`   - 0 actions logged (in-memory storage)`);
});
