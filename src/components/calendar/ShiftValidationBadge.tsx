import { CheckCircle2, XCircle, Circle } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useState } from "react";
import { cn } from "@/lib/utils";

export type ValidationStatus = 'pending' | 'validated' | 'invalidated';

interface ShiftValidationBadgeProps {
  status: ValidationStatus;
  onStatusChange?: (newStatus: ValidationStatus) => void;
  canEdit: boolean;
  size?: 'sm' | 'xs';
}

const STATUS_CONFIG: Record<ValidationStatus, {
  icon: typeof CheckCircle2;
  className: string;
  label: string;
}> = {
  pending: {
    icon: Circle,
    className: 'text-gray-400',
    label: 'Pendiente',
  },
  validated: {
    icon: CheckCircle2,
    className: 'text-green-500',
    label: 'Validado',
  },
  invalidated: {
    icon: XCircle,
    className: 'text-red-500',
    label: 'Invalidado',
  },
};

const ALL_STATUSES: ValidationStatus[] = ['pending', 'validated', 'invalidated'];

export function ShiftValidationBadge({
  status,
  onStatusChange,
  canEdit,
  size = 'xs',
}: ShiftValidationBadgeProps) {
  const [open, setOpen] = useState(false);

  const config = STATUS_CONFIG[status];
  const Icon = config.icon;
  const iconSize = size === 'xs' ? 'h-3 w-3' : 'h-4 w-4';

  if (!canEdit) {
    // Read-only: just show the icon, hidden when pending to keep UI minimal
    if (status === 'pending') return null;
    return (
      <span title={config.label}>
        <Icon className={cn(iconSize, config.className)} />
      </span>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            'flex items-center justify-center rounded-full transition-opacity',
            'opacity-0 group-hover:opacity-100',
            status !== 'pending' && 'opacity-100',
            'hover:scale-110 transition-transform'
          )}
          onClick={(e) => {
            e.stopPropagation();
          }}
          title={config.label}
          aria-label={`Estado de validación: ${config.label}`}
        >
          <Icon className={cn(iconSize, config.className)} />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-36 p-1 bg-white shadow-xl border border-border/50"
        align="end"
        side="bottom"
        sideOffset={2}
        avoidCollisions
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="flex flex-col">
          {ALL_STATUSES.map((s) => {
            const c = STATUS_CONFIG[s];
            const StatusIcon = c.icon;
            return (
              <button
                key={s}
                className={cn(
                  'flex items-center gap-2 px-2 py-1.5 rounded text-xs w-full text-left',
                  'hover:bg-accent transition-colors',
                  s === status && 'bg-accent/60 font-medium'
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  onStatusChange?.(s);
                  setOpen(false);
                }}
              >
                <StatusIcon className={cn('h-3.5 w-3.5', c.className)} />
                <span>{c.label}</span>
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
