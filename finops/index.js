import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3001;

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

// Root redirect to dashboard
app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'dashboard.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ FinOps Phase 1 Prototype running on http://0.0.0.0:${PORT}`);
  console.log(`📊 Dashboard: http://0.0.0.0:${PORT}/dashboard.html`);
  console.log(`🔌 API Endpoints:`);
  console.log(`   - GET /api/resources - All AWS resources`);
  console.log(`   - GET /api/finops/spend-summary - Spend analytics & trends`);
});
