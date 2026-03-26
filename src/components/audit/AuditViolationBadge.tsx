// Componente Badge para indicar violaciones de auditoría
import { AuditViolation, VIOLATION_TYPE_ICONS, ViolationSeverity } from '@/types/audit';
import { cn } from '@/lib/utils';
import { AlertTriangle, AlertCircle, Info, Clock, Calendar, Users, Palmtree, UserX } from 'lucide-react';

interface AuditViolationBadgeProps {
  violations: AuditViolation[];
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  className?: string;
}

const severityColors: Record<ViolationSeverity, string> = {
  error: 'bg-destructive text-destructive-foreground',
  warning: 'bg-amber-500 text-white',
  info: 'bg-primary text-primary-foreground'
};

const severityBorderColors: Record<ViolationSeverity, string> = {
  error: 'border-destructive',
  warning: 'border-amber-500',
  info: 'border-primary'
};

const positionClasses: Record<string, string> = {
  'top-left': 'top-0 left-0',
  'top-right': 'top-0 right-0',
  'bottom-left': 'bottom-0 left-0',
  'bottom-right': 'bottom-0 right-0'
};

const sizeClasses = {
  sm: 'h-3 w-3 text-[8px]',
  md: 'h-4 w-4 text-[10px]',
  lg: 'h-5 w-5 text-xs'
};

export function AuditViolationBadge({
  violations,
  size = 'sm',
  showCount = true,
  position = 'top-right',
  className
}: AuditViolationBadgeProps) {
  if (violations.length === 0) return null;

  // Determinar la severidad más alta
  const maxSeverity: ViolationSeverity = violations.some(v => v.severity === 'error') 
    ? 'error' 
    : violations.some(v => v.severity === 'warning') 
      ? 'warning' 
      : 'info';

  const count = violations.length;

  return (
    <div
      className={cn(
        'absolute z-10 rounded-full flex items-center justify-center font-bold',
        'transform translate-x-1/3 -translate-y-1/3',
        sizeClasses[size],
        severityColors[maxSeverity],
        positionClasses[position],
        className
      )}
      title={`${count} problema(s) detectado(s)`}
    >
      {showCount && count > 1 ? count : '!'}
    </div>
  );
}

// Componente para mostrar el borde de violación en una celda
interface AuditCellHighlightProps {
  severity: ViolationSeverity | null;
  children: React.ReactNode;
  className?: string;
}

export function AuditCellHighlight({ severity, children, className }: AuditCellHighlightProps) {
  if (!severity) return <>{children}</>;

  return (
    <div
      className={cn(
        'relative ring-2 ring-inset rounded',
        severity === 'error' && 'ring-destructive/60',
        severity === 'warning' && 'ring-amber-500/60',
        severity === 'info' && 'ring-primary/40',
        className
      )}
    >
      {children}
    </div>
  );
}

// Icono según tipo de violación
interface ViolationIconProps {
  type: AuditViolation['type'];
  severity: ViolationSeverity;
  size?: number;
  className?: string;
}

export function ViolationIcon({ type, severity, size = 14, className }: ViolationIconProps) {
  const iconProps = {
    size,
    className: cn(
      severity === 'error' && 'text-destructive',
      severity === 'warning' && 'text-amber-500',
      severity === 'info' && 'text-primary',
      className
    )
  };

  switch (type) {
    case 'INSUFFICIENT_REST':
      return <Clock {...iconProps} />;
    case 'MISSING_FREE_DAYS':
    case 'NON_CONSECUTIVE_FREE_DAYS':
      return <Calendar {...iconProps} />;
    case 'MISSING_COVERAGE':
      return <Users {...iconProps} />;
    case 'VACATION_NO_FREE_DAYS':
      return <Palmtree {...iconProps} />;
    case 'EMPLOYEE_RESTRICTION':
      return <UserX {...iconProps} />;
    default:
      return severity === 'error' 
        ? <AlertCircle {...iconProps} />
        : severity === 'warning'
          ? <AlertTriangle {...iconProps} />
          : <Info {...iconProps} />;
  }
}

// Badge compacto para header de empleado
interface EmployeeViolationBadgeProps {
  count: number;
  maxSeverity: ViolationSeverity;
  className?: string;
}

export function EmployeeViolationBadge({ count, maxSeverity, className }: EmployeeViolationBadgeProps) {
  if (count === 0) return null;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium',
        severityColors[maxSeverity],
        className
      )}
    >
      {maxSeverity === 'error' ? <AlertCircle size={10} /> : <AlertTriangle size={10} />}
      {count}
    </span>
  );
}
