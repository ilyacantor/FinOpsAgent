# FinOps Autopilot - Enterprise Cloud Cost Optimization Platform

## Overview

FinOps Autopilot is a comprehensive cloud cost optimization platform designed for enterprise environments. The system automatically analyzes AWS resources, identifies cost-saving opportunities, and provides actionable recommendations to reduce cloud spending. It features real-time monitoring, automated analysis, and executive-level dashboards with approval workflows for implementing optimizations.

The platform combines intelligent resource analysis with financial operations (FinOps) best practices, providing both automated insights and human oversight for cost optimization decisions.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **UI Library**: Shadcn/ui components built on Radix UI primitives for accessibility
- **Styling**: Tailwind CSS with CSS custom properties for theming
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Real-time Updates**: WebSocket connection for live dashboard updates

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ESM modules
- **Database ORM**: Drizzle ORM for type-safe database operations
- **API Design**: RESTful endpoints with WebSocket support for real-time features
- **Session Management**: Express sessions with PostgreSQL session store
- **Background Processing**: Node-cron for scheduled tasks (resource analysis, cost sync)

### Data Storage Solutions
- **Primary Database**: PostgreSQL with Neon serverless hosting
- **Schema Management**: Drizzle migrations with shared schema definitions
- **Data Models**: 
  - Users and authentication
  - AWS resources with utilization metrics
  - Cost reports and historical data
  - Optimization recommendations
  - Approval workflows and history

### Authentication and Authorization
- **Session-based Authentication**: Express sessions with PostgreSQL storage
- **Role-based Access**: User roles (admin, user, CFO) for different permission levels
- **Approval Workflows**: Multi-stage approval process for high-impact optimizations

### Real-time Communication
- **WebSocket Server**: Integrated WebSocket support for dashboard updates
- **Event Broadcasting**: Real-time notifications for new recommendations and optimization completions
- **Client Synchronization**: Automatic query invalidation and UI updates

## External Dependencies

### Cloud Services
- **AWS SDK v2**: Complete AWS service integration for cost analysis and resource management
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **AWS Cost Explorer**: Cost and usage report analysis
- **AWS CloudWatch**: Resource utilization metrics collection
- **AWS Trusted Advisor**: Additional optimization recommendations

### Third-party Integrations
- **Pinecone**: Vector database for RAG (Retrieval Augmented Generation) historical context storage
- **Slack Web API**: Automated notifications for optimization opportunities and approvals
- **AWS Support API**: Enhanced recommendation data for enterprise accounts

### Development and Deployment
- **Replit Platform**: Development environment with integrated deployment
- **Vite Plugins**: Development tooling including error overlay and dev banner
- **PostCSS**: CSS processing with Tailwind integration

### Analytics and Monitoring
- **Built-in Metrics**: Custom dashboard metrics calculation
- **Cost Trend Analysis**: Historical cost data processing and visualization
- **Resource Utilization Tracking**: Performance metrics collection and analysis

## Dashboard Structure (Updated October 2025)

### Executive Dashboard (/executive)
Displays comprehensive financial overview with 5 key metric cards:
- **Monthly AWS Spend**: Current month total with +/- change indicator vs last month
- **YTD AWS Spend**: Year-to-date total with +/- change indicator vs prior-year YTD
- **Identified Savings Awaiting Approval**: Dollar amount with filtered recommendation count (pending/approved only)
- **Realized Savings YTD**: Total savings achieved year-to-date
- **Waste % Optimized YTD**: Percentage of waste eliminated

**Technical Details**:
- Uses `/api/metrics/summary` endpoint with 10-second auto-refresh
- All recommendation counts filtered to pending/approved status only
- Change indicators: red (increase) / green (decrease)
- Null/undefined guards prevent crashes on missing data
- Dark theme with cyan accent (#0BCAD9)

### Operations Dashboard (/)
Main operational dashboard with integrated metrics inside Data Flow Pipeline:

**Data Flow Pipeline Container**:
- Visual flow diagram: Input Sources → AI Processing → Output Results
- Integrated metrics in footer with two sections:
  1. **Financial Metrics** (primary):
     - Monthly AWS Spend (+/- change)
     - YTD AWS Spend (+/- change)
     - Identified Savings Awaiting Approval (with recommendation count)
  2. **Pipeline Operations Stats** (secondary, separated by border):
     - Resources Monitored
     - Processing Speed (Real-time)
     - Active Outputs

**Design Changes**:
- Removed standalone MetricsCards component
- All metrics now live inside Data Flow Pipeline container
- Maintains both financial KPIs and operational telemetry
- 10-second auto-refresh for all metrics

**Data Source**:
- Primary endpoint: `/api/metrics/summary` (replaces `/api/dashboard/metrics`)
- Returns all 7 metrics including YTD calculations and change percentages

## Performance Optimizations

The system is optimized for maximum speed when running in AI mode with synthetic data:

### AI & RAG Performance
- **Gemini 2.5 Flash**: Uses Google's fastest Gemini model for optimal AI response times
- **Pinecone Vector Database**: Semantic search for relevant historical context using vector embeddings
- **Smart Caching**: 5-minute TTL cache for RAG retrieval results to minimize vector database queries
- **Text Embedding Model**: Gemini text-embedding-004 for high-quality vector representations
- **Parallel Processing**: Independent operations run concurrently using Promise.all
- **Auto Cache Invalidation**: Cache automatically refreshes after new recommendations are generated
- **Automatic Vector Storage**: All recommendations and optimization history automatically stored in Pinecone

### Continuous Simulation (Updated October 2025)
- **Real-time Evolution**: Data evolution runs every 5 seconds (previously 30 minutes) for visible, continuous simulation
- **Utilization Changes**: Each cycle randomly adjusts CPU/memory utilization by ±1-7% for realistic variance
- **Guard Protection**: `isSimulationRunning` flag prevents overlapping executions and race conditions
- **What Changes**: Resource utilization percentages (CPU, memory) evolve continuously
- **What Stays Stable**: Resource counts, monthly costs, and aggregate metrics remain stable
- **Batch Operations**: Multiple resource updates processed together for better performance

### Heuristic Recommendation Engine (Added October 2025)
- **Automated Generation**: Runs every 3 simulation cycles (~15 seconds) to identify cost-saving opportunities
- **Waste Detection**: Analyzes resources for underutilization (CPU < 30%, Memory < 40%)
- **Recommendation Types**: Rightsizing, scheduling (off-hours shutdown), storage-tiering
- **Risk Levels**: Low (60%), Medium (28%), High (12%) with corresponding savings estimates ($25-$300/month)
- **Auto-Optimization**: Low-risk recommendations auto-execute immediately; medium/high-risk await approval
- **Integration with Prod Mode**: Pauses when RAG is active, resumes after auto-revert
- **Telemetry Logs**: Shows "💡 New Recommendations Generated", "💰 Total Potential Savings", "✅ Auto-Optimizations Applied"
- **Metrics Impact**: Identified Savings (pending+approved), Realized Savings YTD (auto-executed), Waste % Optimized

### Database Optimizations
- **Vector-Based RAG**: Pinecone handles historical context retrieval via semantic search (no database queries for RAG)
- **PostgreSQL for Core Data**: Primary storage for resources, recommendations, and execution history
- **Optimized Storage Methods**: Database queries use LIMIT for efficient record fetching
- **Indexed Queries**: All queries use database indexes for faster retrieval
- **Minimal Data Transfer**: Only essential fields retrieved from database

### Expected Performance
- **AI Analysis**: Sub-3-second response times with Pinecone RAG context
- **Vector Search**: <200ms for semantic similarity queries in Pinecone
- **Cache Hit Rate**: 80%+ for repeated RAG queries within 5 minutes
- **Database Queries**: <100ms for optimized record fetches
- **Synthetic Data Evolution**: <500ms for full dataset update

The architecture prioritizes real-time data processing, enterprise-grade security, and scalable cost optimization workflows while maintaining a clean separation between frontend presentation, backend business logic, and external service integrations.

## Phase 1 Prototype (/finops)

A standalone lightweight prototype for DCL integration testing, separate from the main application.

### Architecture
- **Framework**: Pure Express.js (no TypeScript, no build tools)
- **Data Source**: Mock JSON file simulating Supabase `aws_resources` table
- **Port**: 3001 (independent from main app on port 5000)
- **Design**: Dark background (#1B1E23) with cyan accent (#0BCAD9)

### Structure
```
/finops/
├── index.js              # Express.js backend server
├── dashboard.html        # Simple static HTML UI
├── aws_resources.json    # Mock AWS resource data (10 resources)
├── package.json          # Node.js configuration
└── README.md            # Prototype documentation
```

### API Endpoints
- `GET /api/resources` - Returns all mock AWS resources

### Features
- Resource table display (ResourceId, Type, Region, Monthly Cost, Utilization)
- Dashboard statistics (total resources, cost, utilization, regions)
- Visual utilization bars
- Responsive dark theme UI

### Next Steps (Phase 2)
- Migrate to Next.js with `/app/dcl` structure
- Replace mock JSON with real Supabase table `aws_resources`
- Implement Next.js API routes
- Add real-time updates and advanced filtering

### Running the Prototype
```bash
cd finops
npm start
```
Access at: http://localhost:3001/dashboard.html