/**
 * autonomOS Platform Integration Client
 * Handles Views (read) and Intents (actions) with HITL-safe execution modes
 */

// Configuration (line 6-7)
const PLATFORM_BASE_URL = import.meta.env.VITE_AOS_BASE_URL || import.meta.env.VITE_PLATFORM_URL || 'https://autonomos-platform.replit.app';
const USE_PLATFORM = import.meta.env.VITE_USE_PLATFORM === 'true';

// Export configuration for testing
export const AOS_CONFIG = {
  baseUrl: PLATFORM_BASE_URL,
  usePlatform: USE_PLATFORM,
};

export interface PlatformViewResponse<T = any> {
  data: T;
  trace_id?: string;
  timestamp?: string;
}

export interface PlatformIntentRequest {
  intent: string;
  targets?: string[];
  dry_run?: boolean;
  explain_only?: boolean;
  metadata?: Record<string, any>;
}

export interface PlatformIntentResponse {
  task_id: string;
  trace_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  message?: string;
  result?: any;
}

export interface TaskStatusResponse {
  task_id: string;
  trace_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress?: number;
  message?: string;
  result?: any;
  error?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Map platform view names to local API endpoints
 */
const VIEW_TO_LOCAL_ENDPOINT: Record<string, string> = {
  'accounts': '/api/aws-resources',
  'resources': '/api/aws-resources',
  'opportunities': '/api/recommendations',
  'recommendations': '/api/recommendations',
  'history': '/api/optimization-history',
  'optimization-history': '/api/optimization-history',
  'metrics': '/api/metrics/summary',
  'summary': '/api/metrics/summary',
};

/**
 * Fetch data from a platform view
 * Falls back to local API endpoints if USE_PLATFORM=false
 */
export async function getView<T = any>(viewName: string): Promise<PlatformViewResponse<T>> {
  if (!USE_PLATFORM) {
    // Fallback to existing local API endpoints
    const localEndpoint = VIEW_TO_LOCAL_ENDPOINT[viewName] || `/api/${viewName}`;
    console.log(`[aosClient] USE_PLATFORM=false, falling back to local endpoint: ${localEndpoint}`);
    
    try {
      const res = await fetch(localEndpoint, {
        method: 'GET',
        credentials: 'include',
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Local API fetch failed (${res.status}): ${errorText}`);
      }

      const data = await res.json();
      return {
        data,
        trace_id: `local-${Date.now()}`,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error(`[aosClient] Local fallback error for ${viewName}:`, error);
      throw error;
    }
  }

  // Try platform first, fall back to local on error
  try {
    const res = await fetch(`${PLATFORM_BASE_URL}/api/v1/dcl/views/${viewName}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.warn(`[aosClient] Platform view fetch failed (${res.status}), falling back to local`, errorText);
      
      // Graceful fallback to local API
      const localEndpoint = VIEW_TO_LOCAL_ENDPOINT[viewName] || `/api/${viewName}`;
      const localRes = await fetch(localEndpoint, {
        method: 'GET',
        credentials: 'include',
      });
      
      if (!localRes.ok) {
        throw new Error(`Both platform and local API failed for view ${viewName}`);
      }
      
      const data = await localRes.json();
      return {
        data,
        trace_id: `fallback-${Date.now()}`,
        timestamp: new Date().toISOString()
      };
    }

    return await res.json();
  } catch (error) {
    console.error(`[aosClient] Platform error, falling back to local for ${viewName}:`, error);
    
    // Final fallback to local API
    const localEndpoint = VIEW_TO_LOCAL_ENDPOINT[viewName] || `/api/${viewName}`;
    const localRes = await fetch(localEndpoint, {
      method: 'GET',
      credentials: 'include',
    });
    
    if (!localRes.ok) {
      throw new Error(`Both platform and local API failed for view ${viewName}`);
    }
    
    const data = await localRes.json();
    return {
      data,
      trace_id: `error-fallback-${Date.now()}`,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Execute a platform intent with HITL-safe parameters
 * 
 * @param agentId - The agent identifier (e.g., 'finops')
 * @param action - The action to perform (e.g., 'execute', 'analyze')
 * @param params - Intent parameters including intent name, targets, and execution mode
 * @param options - Additional options like idempotencyKey
 */
export async function postIntent(
  agentId: string,
  action: string,
  params: PlatformIntentRequest,
  options?: {
    idempotencyKey?: string;
  }
): Promise<PlatformIntentResponse> {
  if (!USE_PLATFORM) {
    // Fallback to mock response
    console.log(`[aosClient] USE_PLATFORM=false, mocking intent: ${agentId}/${action}`, params);
    return {
      task_id: `mock-task-${Date.now()}`,
      trace_id: `mock-trace-${Date.now()}`,
      status: 'completed',
      message: 'Mock intent execution (USE_PLATFORM=false)',
      result: { success: true, mode: 'mock' }
    };
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (options?.idempotencyKey) {
    headers['Idempotency-Key'] = options.idempotencyKey;
  }

  // Try platform first, fall back to mock on error
  try {
    const res = await fetch(`${PLATFORM_BASE_URL}/api/v1/intents/${agentId}/${action}`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.warn(`[aosClient] Platform intent failed (${res.status}), falling back to degraded mode`, errorText);
      
      // Graceful fallback with failed status to indicate degraded mode
      return {
        task_id: `fallback-task-${Date.now()}`,
        trace_id: `fallback-trace-${Date.now()}`,
        status: 'failed',
        message: `Platform unavailable (${res.status}), operation not executed - using degraded mode`,
        result: { 
          success: false, 
          mode: 'fallback',
          reason: `platform_unavailable_${res.status}`,
          degraded: true
        }
      };
    }

    return await res.json();
  } catch (error) {
    console.error(`[aosClient] Platform error, falling back to degraded mode for ${agentId}/${action}:`, error);
    
    // Final fallback with failed status to indicate degraded mode
    return {
      task_id: `error-fallback-task-${Date.now()}`,
      trace_id: `error-fallback-trace-${Date.now()}`,
      status: 'failed',
      message: `Platform error, operation not executed: ${error instanceof Error ? error.message : String(error)}`,
      result: { 
        success: false, 
        mode: 'error-fallback',
        error: error instanceof Error ? error.message : String(error),
        degraded: true
      }
    };
  }
}

/**
 * Poll task status until completion or timeout
 * 
 * @param taskId - The task ID to poll
 * @param options - Polling configuration
 */
export async function pollTaskStatus(
  taskId: string,
  options?: {
    intervalMs?: number;
    timeoutMs?: number;
    onProgress?: (status: TaskStatusResponse) => void;
  }
): Promise<TaskStatusResponse> {
  const intervalMs = options?.intervalMs || 1000;
  const timeoutMs = options?.timeoutMs || 30000;
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    const status = await getTaskStatus(taskId);
    
    if (options?.onProgress) {
      options.onProgress(status);
    }

    if (status.status === 'completed' || status.status === 'failed') {
      return status;
    }

    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }

  throw new Error(`Task ${taskId} polling timeout after ${timeoutMs}ms`);
}

/**
 * Get current task status
 */
export async function getTaskStatus(taskId: string): Promise<TaskStatusResponse> {
  if (!USE_PLATFORM) {
    // Mock completed task
    return {
      task_id: taskId,
      trace_id: `mock-trace-${Date.now()}`,
      status: 'completed',
      progress: 100,
      message: 'Mock task complete',
      result: { success: true }
    };
  }

  const res = await fetch(`${PLATFORM_BASE_URL}/api/tasks/${taskId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Task status fetch failed (${res.status}): ${errorText}`);
  }

  return await res.json();
}

/**
 * Map HITL mode to platform intent parameters
 */
export function mapHITLToIntentParams(hitlMode: boolean): { dry_run: boolean; explain_only: boolean } {
  if (hitlMode) {
    // HITL mode: explain only, don't execute
    return {
      dry_run: true,
      explain_only: true
    };
  } else {
    // Autonomous mode: execute immediately
    return {
      dry_run: false,
      explain_only: false
    };
  }
}
