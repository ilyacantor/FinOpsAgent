import { Activity, Bot, ChartLine, Cog, Shield, Lightbulb, BarChart3, Presentation } from "lucide-react";
import { Link, useLocation } from "wouter";

export function Sidebar() {
  const [location] = useLocation();
  
  const isActive = (path: string) => location === path;
  
  return (
    <aside className="w-64 bg-card border-r border-border flex-shrink-0">
      <div className="p-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <Bot className="text-primary-foreground text-lg" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">FinOps Autopilot</h1>
            <p className="text-xs text-muted-foreground">Enterprise Cloud Optimization</p>
          </div>
        </div>
      </div>
      
      <nav className="px-4 pb-4">
        <ul className="space-y-2">
          <li>
            <Link 
              href="/executive" 
              className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium ${
                isActive('/executive') 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
              data-testid="nav-executive"
            >
              <Presentation className="w-5 h-5 mr-3" />
              Executive Dashboard
            </Link>
          </li>
          <li>
            <Link 
              href="/" 
              className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium ${
                isActive('/') 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
              data-testid="nav-dashboard"
            >
              <BarChart3 className="w-5 h-5 mr-3" />
              Dashboard
            </Link>
          </li>
          <li>
            <Link 
              href="/cost-analysis" 
              className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium ${
                isActive('/cost-analysis') 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
              data-testid="nav-cost-analysis"
            >
              <ChartLine className="w-5 h-5 mr-3" />
              Cost Analysis
            </Link>
          </li>
          <li>
            <Link 
              href="/recommendations" 
              className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium ${
                isActive('/recommendations') 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
              data-testid="nav-recommendations"
            >
              <Lightbulb className="w-5 h-5 mr-3" />
              Recommendations
            </Link>
          </li>
          <li>
            <Link 
              href="/automation" 
              className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium ${
                isActive('/automation') 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
              data-testid="nav-automation"
            >
              <Cog className="w-5 h-5 mr-3" />
              Automation
            </Link>
          </li>
          <li>
            <Link 
              href="/governance" 
              className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium ${
                isActive('/governance') 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
              data-testid="nav-governance"
            >
              <Shield className="w-5 h-5 mr-3" />
              Governance
            </Link>
          </li>
          <li>
            <Link 
              href="/agent-config" 
              className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium ${
                isActive('/agent-config') 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
              data-testid="nav-agent-config"
            >
              <Bot className="w-5 h-5 mr-3" />
              Agent Config
            </Link>
          </li>
        </ul>
        
        <div className="mt-8">
          <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">AWS Services</h3>
          <ul className="mt-3 space-y-2">
            <li>
              <div className="flex items-center px-3 py-1 text-sm text-muted-foreground">
                <div className="w-2 h-2 bg-accent rounded-full mr-3 animate-pulse"></div>
                Cost & Usage Reports
              </div>
            </li>
            <li>
              <div className="flex items-center px-3 py-1 text-sm text-muted-foreground">
                <div className="w-2 h-2 bg-accent rounded-full mr-3 animate-pulse"></div>
                CloudWatch
              </div>
            </li>
            <li>
              <div className="flex items-center px-3 py-1 text-sm text-muted-foreground">
                <div className="w-2 h-2 bg-accent rounded-full mr-3 animate-pulse"></div>
                Trusted Advisor
              </div>
            </li>
          </ul>
        </div>
      </nav>
    </aside>
  );
}
