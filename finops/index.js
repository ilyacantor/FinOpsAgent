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

// Serve static HTML
app.use(express.static(__dirname));

// API endpoint to get all resources
app.get('/api/resources', (req, res) => {
  res.json(awsResources);
});

// Root redirect to dashboard
app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'dashboard.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ FinOps Phase 1 Prototype running on http://0.0.0.0:${PORT}`);
  console.log(`📊 Dashboard: http://0.0.0.0:${PORT}/dashboard.html`);
  console.log(`🔌 API: http://0.0.0.0:${PORT}/api/resources`);
});
