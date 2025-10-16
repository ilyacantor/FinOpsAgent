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

### Synthetic Data Optimization
- **Reduced Frequency**: Data evolution runs every 30 minutes (previously 15) to reduce CPU load
- **Resource Addition**: New synthetic resources added every 4 hours (previously 2) for efficiency
- **Batch Operations**: Multiple resource updates processed together for better performance

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