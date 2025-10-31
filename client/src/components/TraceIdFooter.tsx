import { useState } from "react";
import { Copy, Check } from "lucide-react";

interface TraceIdFooterProps {
  traceId?: string | null;
}

export function TraceIdFooter({ traceId }: TraceIdFooterProps) {
  const [copied, setCopied] = useState(false);
  
  // Only show in development mode
  const isDev = import.meta.env.DEV;
  
  if (!isDev || !traceId) {
    return null;
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(traceId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 bg-gray-900/80 backdrop-blur-sm border-t border-gray-700/50 px-4 py-2 z-50"
      data-testid="footer-trace-id"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-gray-400">
          <span className="font-mono">trace_id:</span>
          <code className="text-cyan-400 font-mono">{traceId}</code>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-gray-800 transition-colors text-gray-400 hover:text-gray-200"
          data-testid="button-copy-trace-id"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3" />
              <span>Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
