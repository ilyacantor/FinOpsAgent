import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, XCircle, Clock } from "lucide-react";
import { TaskStatusResponse } from "@/lib/aosClient";

interface TaskStatusBadgeProps {
  status: TaskStatusResponse | null;
  className?: string;
}

export function TaskStatusBadge({ status, className }: TaskStatusBadgeProps) {
  if (!status) {
    return null;
  }

  const getBadgeContent = () => {
    switch (status.status) {
      case 'pending':
        return {
          icon: <Clock className="w-3 h-3" />,
          text: 'Pending',
          variant: 'secondary' as const,
        };
      case 'running':
        return {
          icon: <Loader2 className="w-3 h-3 animate-spin" />,
          text: `Running${status.progress ? ` ${status.progress}%` : ''}`,
          variant: 'default' as const,
        };
      case 'completed':
        return {
          icon: <CheckCircle2 className="w-3 h-3" />,
          text: 'Completed',
          variant: 'default' as const,
          className: 'bg-green-500/20 text-green-400 border-green-500/30',
        };
      case 'failed':
        return {
          icon: <XCircle className="w-3 h-3" />,
          text: 'Failed',
          variant: 'destructive' as const,
        };
      default:
        return null;
    }
  };

  const content = getBadgeContent();
  if (!content) return null;

  return (
    <Badge
      variant={content.variant}
      className={`flex items-center gap-1.5 ${content.className || ''} ${className || ''}`}
      data-testid={`badge-task-${status.status}`}
    >
      {content.icon}
      <span className="text-xs">{content.text}</span>
    </Badge>
  );
}
