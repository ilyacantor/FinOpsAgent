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
- Auto-refresh: 3-second intervals across all dashboards for real-time visibility
- Display: K-scale formatting ($260 K, $1,235 K) via formatCurrencyK utility (no decimals)

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
- **High-Velocity Demo Mode**: Data evolution runs every 3 seconds (accelerated from 5s) for maximum visibility
- **Utilization Changes**: Each cycle randomly adjusts CPU/memory utilization by ±1-7% for realistic variance
- **Guard Protection**: `isSimulationRunning` flag prevents overlapping executions and race conditions
- **What Changes**: Resource utilization percentages (CPU, memory) evolve continuously
- **What Stays Stable**: Resource counts remain stable; monthly costs scaled 10× for enterprise realism
- **Batch Operations**: Multiple resource updates processed together for better performance
- **10× Monetary Multiplier**: All cost values multiplied by 10 at source ($1.2K-$216K monthly costs)
- **K-Scale Currency Formatting**: All monetary values display in thousands (K-scale) with no decimals
  - formatCurrencyK is the primary formatter across entire application
  - Format: "$X K" or "$X,XXX K" (space before K, comma separators for large numbers)
  - Examples: $1,234.56 → $1 K, $260,000 → $260 K, $1,234,567 → $1,235 K
  - Small values (<$1,000) round to $0 K or $1 K per specification
  - Applied universally: dashboards, charts, tooltips, recommendations, modals

### Heuristic Recommendation Engine (Updated October 2025)
- **Automated Generation**: Runs every cycle (3 seconds) generating 2-5 recommendations per cycle
- **Waste Detection**: Analyzes resources for underutilization (CPU < 30%, Memory < 40%)
- **Recommendation Types**: Rightsizing, scheduling (off-hours shutdown), storage-tiering
- **Risk Distribution**: 80% low-risk (autonomous) / 10% medium-risk (HITL) / 10% high-risk (HITL)
- **Execution Modes**:
  - **Autonomous (80%)**: Low-risk recommendations auto-execute immediately without approval
  - **HITL (20%)**: Medium/high-risk recommendations require human approval before execution
- **Integration with Prod Mode**: Pauses when RAG is active, resumes after auto-revert
- **Telemetry Logs**: Enhanced with emojis showing "⚡💰💡✅🕒🧠 Cycle X → N new (X Auto / Y HITL)"
- **Metrics Impact**: Identified Savings (pending+approved), Realized Savings YTD (auto-executed), Waste % Optimized
- **Savings Range**: $250-$3000/month per recommendation (10× multiplier applied)

### HITL vs Autonomous Labeling System (Added October 2025)
- **executionMode Field**: All recommendations tagged as "autonomous" or "hitl" in database schema
- **Visual Badges**: 
  - Green "✅ Auto-Optimized" badge for autonomous recommendations (already executed)
  - Amber "🕒 Awaiting Approval" badge for HITL recommendations (pending approval)
- **Optimization Mix Widget**: Real-time dashboard widget showing 80/20 execution split
  - Bar chart visualization with autonomous (green) and HITL (amber) sections
  - Legend with counts for both categories
  - Summary text: "X auto-executed / Y awaiting approval"
  - Auto-refreshes every 10 seconds
  - Displayed on both Executive Dashboard and Operations Dashboard
- **API Endpoint**: `/api/metrics/optimization-mix` returns autonomousCount, hitlCount, and percentages
- **Approval Workflow**: HITL recommendations can be approved/rejected via existing controls in Recommendations Panel

### Currency Formatting System (Added October 2025)
- **Global K-Scale Normalization**: All monetary values throughout the application use thousand-scale formatting
- **formatCurrencyK Utility**: Single shared formatter in `client/src/lib/currency.ts`
  - Input: Numeric value (stored as integer × 1000)
  - Processing: Divides by 1000 to get dollars, then divides by 1000 again for K-scale
  - Rounding: Math.round() to nearest integer thousand
  - Output: "$X K" or "$X,XXX K" format with comma separators
- **No Decimals Policy**: All currency displays show whole numbers only
- **Small Value Handling**: Values <$1,000 display as "$0 K" or "$1 K" after rounding
- **Backward Compatibility**: formatCurrencyCompact aliased to formatCurrencyK for seamless transition
- **Coverage**: Applied to all dashboards, charts, tooltips, recommendations, modals, and notifications

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