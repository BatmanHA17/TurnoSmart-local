import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface NotificationBannerProps {
  type: 'info' | 'warning' | 'success' | 'error';
  title: string;
  description?: string;
  className?: string;
  onDismiss?: () => void;
}

export function NotificationBanner({
  type,
  title,
  description,
  className,
  onDismiss,
}: NotificationBannerProps) {
  const getIcon = () => {
    switch (type) {
      case 'info':
        return <Info className="h-4 w-4" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />;
      case 'success':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'error':
        return <XCircle className="h-4 w-4" />;
    }
  };

  const getVariantClass = () => {
    switch (type) {
      case 'info':
        return 'border-primary bg-primary/10 text-primary';
      case 'warning':
        return 'border-warning bg-warning/10 text-warning';
      case 'success':
        return 'border-success bg-success/10 text-success';
      case 'error':
        return 'border-destructive bg-destructive/10 text-destructive';
    }
  };

  return (
    <Alert className={cn(getVariantClass(), className)}>
      <div className="flex items-start gap-3">
        {getIcon()}
        <div className="flex-1">
          <AlertTitle className="mb-1">{title}</AlertTitle>
          {description && <AlertDescription>{description}</AlertDescription>}
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-current opacity-70 hover:opacity-100 transition-opacity"
            aria-label="Cerrar"
          >
            <XCircle className="h-4 w-4" />
          </button>
        )}
      </div>
    </Alert>
  );
}
