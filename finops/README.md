# FinOps Phase 1 Prototype

A lightweight AWS resource dashboard prototype with mock data, designed for DCL integration testing.

## 🎯 Overview

This is a standalone Phase 1 prototype that simulates a Supabase-style `aws_resources` table with mock JSON data. It provides a simple Express.js API and a dark-themed UI shell.

## 🚀 Quick Start

```bash
cd finops
npm start
```

The server will start on port 3001:
- **Dashboard**: http://localhost:3001/dashboard.html
- **API**: http://localhost:3001/api/resources

## 📁 Structure

```
finops/
├── index.js              # Express.js backend server
├── dashboard.html        # Frontend UI shell
├── aws_resources.json    # Mock AWS resource data
├── package.json          # Node.js dependencies
└── README.md            # This file
```

## 🔌 API Endpoints

### GET /api/resources
Returns all AWS resource data from the mock JSON file.

**Response:**
```json
[
  {
    "resourceId": "i-0a1b2c3d4e5f6g7h8",
    "type": "EC2",
    "region": "us-east-1",
    "monthlyCost": 245.50,
    "utilizationPercent": 35,
    "instanceType": "t3.large"
  },
  ...
]
```

## 🎨 Design

- **Background**: `#1B1E23` (Dark blue-black)
- **Accent**: `#0BCAD9` (Cyan)
- **Theme**: Dark mode, minimal, data-focused

## 📊 Features

### Dashboard Display
- Total resources count
- Total monthly cost
- Average utilization percentage
- Number of unique regions

### Resource Table
- Resource ID
- Type (EC2, RDS, S3, etc.)
- Region
- Monthly cost
- Utilization percentage with visual bar

## 🔄 Next Steps (Phase 2)

This prototype will be migrated to:
- **Framework**: Next.js with `/app/dcl` structure
- **Database**: Real Supabase table `aws_resources`
- **API Routes**: Next.js API routes at `/api/resources`
- **Enhanced Features**: Real-time updates, filtering, sorting

## 📝 Notes

- Mock data includes 10 AWS resources across multiple types and regions
- No authentication required (prototype only)
- Static data (no database required)
- Lightweight and fast for testing DCL integration patterns
