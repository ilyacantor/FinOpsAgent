# 🚀 Deployment Guide: Render

This guide covers deploying the FinOps Agent to Render.com, replacing the current Replit deployment.

## 📋 Prerequisites

1. **Render Account**: Sign up at [render.com](https://render.com)
2. **GitHub Repository**: Your code should be in a GitHub repository
3. **Environment Variables**: Have your API keys ready (AWS, Gemini, Pinecone, Slack)

## 🎯 Quick Deploy

### Option 1: Deploy via Dashboard (Recommended for First Time)

1. **Connect GitHub Repository**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New +" → "Blueprint"
   - Connect your GitHub account and select this repository
   - Render will automatically detect `render.yaml` and set up services

2. **Configure Environment Variables**

   After services are created, add these environment variables in the Render dashboard:

   **Web Service (finops-agent):**
   ```
   AWS_ACCESS_KEY_ID=<your_aws_key>
   AWS_SECRET_ACCESS_KEY=<your_aws_secret>
   GEMINI_API_KEY=<your_gemini_key>
   PINECONE_API_KEY=<your_pinecone_key>
   SLACK_BOT_TOKEN=<your_slack_token> (optional)
   SLACK_CHANNEL_ID=<your_channel_id> (optional)
   ```

3. **Database Setup**
   - Render will automatically create PostgreSQL database
   - Connection string will be injected as `DATABASE_URL`
   - Run initial migration: `npm run db:push` (via Render shell)

4. **Deploy**
   - Click "Apply" and Render will build and deploy your services
   - First deployment takes 5-10 minutes

### Option 2: Deploy via render.yaml (Infrastructure as Code)

```bash
# 1. Install Render CLI (optional)
brew tap render-oss/render
brew install render

# 2. Authenticate
render login

# 3. Deploy from render.yaml
render up
```

## 🗄️ Database Migration

After your database is provisioned:

1. **Access Render Shell**
   - Go to your web service in Render dashboard
   - Click "Shell" tab
   - Run migration command:
   ```bash
   npm run db:push
   ```

2. **Verify Database**
   ```bash
   # In Render shell
   node -e "console.log(process.env.DATABASE_URL)"
   ```

3. **Run Initial Data Setup** (if needed)
   - Access your app at `https://your-app.onrender.com`
   - Go to Agent Config page
   - Enable "Simulation Mode" to generate test data

## 🔧 Configuration Details

### render.yaml Configuration

The `render.yaml` file defines:

1. **Web Service** (finops-agent)
   - Node.js runtime
   - Automatic deploys from main branch
   - Health check endpoint
   - Environment variables
   - Build & start commands

2. **PostgreSQL Database** (finops-db)
   - Managed PostgreSQL instance
   - Automatic backups
   - Connection string auto-injected

### Build & Start Commands

```json
{
  "build": "npm install && npm run build",
  "start": "npm run start"
}
```

- **Build**: Installs dependencies and builds Vite frontend
- **Start**: Runs Express server with `NODE_ENV=production`

## 🌐 Custom Domain (Optional)

1. **Add Custom Domain in Render**
   - Go to your web service settings
   - Click "Add Custom Domain"
   - Enter your domain (e.g., `finops.yourdomain.com`)

2. **Configure DNS**
   - Add CNAME record pointing to your Render URL
   - Render provides automatic SSL certificates

3. **Update Environment Variables**
   - If your app uses absolute URLs, update accordingly

## 🔐 Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ Yes | PostgreSQL connection (auto-injected by Render) |
| `AWS_ACCESS_KEY_ID` | ✅ Yes | AWS API credentials for Cost Explorer |
| `AWS_SECRET_ACCESS_KEY` | ✅ Yes | AWS API credentials |
| `AWS_REGION` | ✅ Yes | Default AWS region (e.g., us-east-1) |
| `GEMINI_API_KEY` | ✅ Yes | Google Generative AI API key |
| `PINECONE_API_KEY` | ✅ Yes | Pinecone vector database API key |
| `SLACK_BOT_TOKEN` | ❌ No | Slack notifications (optional) |
| `SLACK_CHANNEL_ID` | ❌ No | Slack channel for notifications |
| `NODE_ENV` | Auto | Set to `production` automatically |
| `PORT` | Auto | Set to `5000` automatically |

## 🚨 Troubleshooting

### Build Fails

**Issue**: Build command fails during deployment

**Solutions**:
1. Check build logs in Render dashboard
2. Verify all dependencies are in `package.json`
3. Ensure TypeScript compiles: `npm run check`
4. Test build locally: `npm run build`

### Database Connection Errors

**Issue**: App can't connect to PostgreSQL

**Solutions**:
1. Verify `DATABASE_URL` is set correctly
2. Check database service is running
3. Ensure database and web service are in same region
4. Test connection in Render shell:
   ```bash
   node -e "const { Pool } = require('pg'); new Pool({ connectionString: process.env.DATABASE_URL }).query('SELECT NOW()')"
   ```

### Health Check Failing

**Issue**: Service shows as unhealthy

**Solutions**:
1. Verify `/api/dashboard/metrics` endpoint returns 200
2. Check application logs for startup errors
3. Ensure all required env vars are set
4. Test locally with production build:
   ```bash
   NODE_ENV=production npm run start
   ```

### WebSocket Issues

**Issue**: Real-time updates not working

**Solutions**:
1. Render supports WebSockets on all plans
2. Ensure WebSocket path is `/ws`
3. Update client WebSocket URL to use `wss://` (not `ws://`)
4. Check browser console for connection errors

### High Memory Usage

**Issue**: App consuming too much memory

**Solutions**:
1. Upgrade to higher Render plan (Standard or Pro)
2. Optimize scheduler polling intervals (server/services/scheduler.ts)
3. Add database connection pooling limits
4. Consider separating scheduler to Worker service

## 📊 Monitoring

### Render Built-in Metrics
- CPU usage
- Memory usage
- Request count
- Response time
- Disk usage

### Custom Health Checks
```typescript
// Already configured in render.yaml
healthCheckPath: /api/dashboard/metrics
```

### Logs
```bash
# View logs in real-time
render logs -f finops-agent

# Or use Render dashboard Logs tab
```

## 🔄 CI/CD Pipeline

Render automatically deploys when you push to your main branch:

```bash
# Make changes
git add .
git commit -m "Update feature"
git push origin main

# Render will automatically:
# 1. Detect the push
# 2. Run build command
# 3. Run tests (if configured)
# 4. Deploy to production
# 5. Run health checks
```

### Deploy Hooks (Optional)

Create a deploy hook for manual deployments:

1. Go to Settings → Deploy Hook
2. Copy the webhook URL
3. Trigger deployments:
   ```bash
   curl -X POST https://api.render.com/deploy/srv-xxx?key=xxx
   ```

## 💰 Cost Estimation

### Starter Plan (Recommended for Testing)
- **Web Service**: $7/month
- **PostgreSQL**: $7/month
- **Total**: ~$14/month

### Standard Plan (Production)
- **Web Service**: $25/month (more resources)
- **PostgreSQL**: $20/month (larger database)
- **Total**: ~$45/month

### Free Tier
- Free services spin down after inactivity
- PostgreSQL free tier available (expires after 90 days)

## 🎯 Next Steps After Deployment

1. **Verify Deployment**
   - Visit your Render URL
   - Check all pages load correctly
   - Test dashboard metrics
   - Verify AWS integration works

2. **Configure Monitoring**
   - Set up uptime monitoring (UptimeRobot, Pingdom)
   - Configure error tracking (Sentry)
   - Set up log aggregation (Logtail)

3. **Performance Optimization**
   - Enable CDN (Cloudflare)
   - Optimize database queries
   - Add Redis caching layer
   - Implement database connection pooling

4. **Security Hardening**
   - Add rate limiting
   - Implement proper authentication
   - Set up CORS properly
   - Enable security headers (helmet.js)

5. **Documentation**
   - Document API endpoints (Swagger)
   - Create user guide
   - Write runbook for operations

## 📚 Additional Resources

- [Render Documentation](https://render.com/docs)
- [Render PostgreSQL Guide](https://render.com/docs/databases)
- [Render Environment Variables](https://render.com/docs/environment-variables)
- [Render Deploy Hooks](https://render.com/docs/deploy-hooks)
- [Render Blueprints](https://render.com/docs/infrastructure-as-code)

## 🆘 Support

- **Render Support**: support@render.com
- **Community**: [Render Community Forum](https://community.render.com)
- **Status**: [status.render.com](https://status.render.com)

---

**Ready to deploy?** Follow the Quick Deploy steps above and you'll be live in minutes! 🚀
