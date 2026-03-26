// Tooltip para mostrar detalles de violaciones
import { AuditViolation, VIOLATION_TYPE_LABELS } from '@/types/audit';
import { ViolationIcon } from './AuditViolationBadge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface AuditViolationTooltipProps {
  violations: AuditViolation[];
  children: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
}

export function AuditViolationTooltip({
  violations,
  children,
  side = 'top',
  align = 'center'
}: AuditViolationTooltipProps) {
  if (violations.length === 0) return <>{children}</>;

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent 
          side={side} 
          align={align}
          className="max-w-xs p-0 overflow-hidden"
        >
          <div className="bg-popover border border-border rounded-md shadow-lg">
            <div className="px-3 py-2 border-b border-border bg-muted/50">
              <span className="text-xs font-semibold text-foreground">
                {violations.length} problema{violations.length > 1 ? 's' : ''} detectado{violations.length > 1 ? 's' : ''}
              </span>
            </div>
            <div className="max-h-48 overflow-y-auto">
              {violations.map((violation, index) => (
                <ViolationItem key={violation.id} violation={violation} isLast={index === violations.length - 1} />
              ))}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface ViolationItemProps {
  violation: AuditViolation;
  isLast?: boolean;
}

function ViolationItem({ violation, isLast }: ViolationItemProps) {
  return (
    <div 
      className={cn(
        'px-3 py-2 flex gap-2 items-start',
        !isLast && 'border-b border-border/50'
      )}
    >
      <ViolationIcon 
        type={violation.type} 
        severity={violation.severity} 
        size={14}
        className="mt-0.5 flex-shrink-0" 
      />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-foreground leading-tight">
          {violation.message}
        </p>
        {violation.suggestion && (
          <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">
            💡 {violation.suggestion}
          </p>
        )}
      </div>
    </div>
  );
}

// Tooltip más detallado para panel de auditoría
interface DetailedViolationTooltipProps {
  violation: AuditViolation;
  children: React.ReactNode;
}

export function DetailedViolationTooltip({ violation, children }: DetailedViolationTooltipProps) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent side="right" align="start" className="max-w-sm p-3">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <ViolationIcon type={violation.type} severity={violation.severity} size={16} />
              <span className="font-semibold text-sm">
                {VIOLATION_TYPE_LABELS[violation.type]}
              </span>
            </div>
            
            <p className="text-xs text-muted-foreground">
              {violation.details}
            </p>
            
            {violation.suggestion && (
              <div className="pt-1 border-t border-border">
                <p className="text-xs text-primary">
                  <span className="font-medium">Sugerencia:</span> {violation.suggestion}
                </p>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
