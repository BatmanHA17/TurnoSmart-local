// Tooltip + Popover para mostrar detalles de violaciones con acción "Aplicar"
import { AuditViolation, SuggestedFix, VIOLATION_TYPE_LABELS } from '@/types/audit';
import { ViolationIcon } from './AuditViolationBadge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AuditViolationTooltipProps {
  violations: AuditViolation[];
  children: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  /** Callback to apply a suggested fix. If provided, shows "Aplicar" button. */
  onApplyFix?: (fix: SuggestedFix, violation: AuditViolation) => void;
}

export function AuditViolationTooltip({
  violations,
  children,
  side = 'top',
  align = 'center',
  onApplyFix,
}: AuditViolationTooltipProps) {
  if (violations.length === 0) return <>{children}</>;

  const hasFixes = onApplyFix && violations.some(v => v.suggestedFix);

  // If there are actionable fixes, use Popover (clickable) instead of Tooltip (hover-only)
  if (hasFixes) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          {children}
        </PopoverTrigger>
        <PopoverContent
          side={side}
          align={align}
          className="max-w-xs p-0 overflow-hidden"
        >
          <div className="px-3 py-2 border-b border-border bg-muted/50">
            <span className="text-xs font-semibold text-foreground">
              {violations.length} problema{violations.length > 1 ? 's' : ''} detectado{violations.length > 1 ? 's' : ''}
            </span>
          </div>
          <div className="max-h-56 overflow-y-auto">
            {violations.map((violation, index) => (
              <ViolationItemWithAction
                key={violation.id}
                violation={violation}
                isLast={index === violations.length - 1}
                onApplyFix={onApplyFix}
              />
            ))}
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  // No fixes available: use regular hover tooltip
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
            {violation.suggestion}
          </p>
        )}
      </div>
    </div>
  );
}

/** Violation item with an "Aplicar" button when a fix is available */
function ViolationItemWithAction({
  violation,
  isLast,
  onApplyFix,
}: ViolationItemProps & { onApplyFix?: (fix: SuggestedFix, violation: AuditViolation) => void }) {
  const fix = violation.suggestedFix;

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
            {violation.suggestion}
          </p>
        )}
        {fix && onApplyFix && (
          <Button
            size="sm"
            variant="outline"
            className="mt-1.5 h-6 text-[10px] gap-1 px-2"
            onClick={(e) => {
              e.stopPropagation();
              onApplyFix(fix, violation);
            }}
          >
            <Wrench className="h-3 w-3" />
            Aplicar: {fix.label || `${fix.fromShift} → ${fix.toShift}`}
          </Button>
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
