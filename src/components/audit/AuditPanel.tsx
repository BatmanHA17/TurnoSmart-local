// Panel resumen de auditoría
import { useState } from 'react';
import { 
  AuditResult, 
  AuditViolation, 
  VIOLATION_TYPE_LABELS,
  ViolationType,
  ViolationSeverity 
} from '@/types/audit';
import { ViolationIcon } from './AuditViolationBadge';
import { DetailedViolationTooltip } from './AuditViolationTooltip';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from '@/components/ui/sheet';
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger 
} from '@/components/ui/collapsible';
import { 
  AlertTriangle, 
  CheckCircle, 
  ChevronDown, 
  ChevronRight,
  RefreshCw,
  Filter,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface AuditPanelProps {
  auditResult: AuditResult | null;
  isAuditing: boolean;
  onRefresh: () => void;
  onViolationClick?: (violation: AuditViolation) => void;
}

export function AuditPanel({ 
  auditResult, 
  isAuditing, 
  onRefresh,
  onViolationClick 
}: AuditPanelProps) {
  const [filterType, setFilterType] = useState<ViolationType | 'all'>('all');
  const [filterSeverity, setFilterSeverity] = useState<ViolationSeverity | 'all'>('all');
  const [expandedEmployees, setExpandedEmployees] = useState<Set<string>>(new Set());

  if (!auditResult) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
        <AlertTriangle className="h-10 w-10 mb-3 opacity-50" />
        <p className="text-sm">No hay datos de auditoría</p>
        <Button 
          variant="outline" 
          size="sm" 
          className="mt-3"
          onClick={onRefresh}
          disabled={isAuditing}
        >
          <RefreshCw className={cn("h-4 w-4 mr-2", isAuditing && "animate-spin")} />
          Ejecutar auditoría
        </Button>
      </div>
    );
  }

  const { violations, summary } = auditResult;

  // Filtrar violaciones
  const filteredViolations = violations.filter(v => {
    if (filterType !== 'all' && v.type !== filterType) return false;
    if (filterSeverity !== 'all' && v.severity !== filterSeverity) return false;
    return true;
  });

  // Agrupar por empleado
  const violationsByEmployee = filteredViolations.reduce((acc, v) => {
    const key = v.employeeId || 'general';
    if (!acc[key]) {
      acc[key] = { name: v.employeeName || 'General', violations: [] };
    }
    acc[key].violations.push(v);
    return acc;
  }, {} as Record<string, { name: string; violations: AuditViolation[] }>);

  const toggleEmployee = (employeeId: string) => {
    const newExpanded = new Set(expandedEmployees);
    if (newExpanded.has(employeeId)) {
      newExpanded.delete(employeeId);
    } else {
      newExpanded.add(employeeId);
    }
    setExpandedEmployees(newExpanded);
  };

  const hasFilters = filterType !== 'all' || filterSeverity !== 'all';

  return (
    <div className="h-full flex flex-col">
      {/* Header con resumen */}
      <div className="p-4 border-b border-border bg-muted/30">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm">Auditoría de Turnos</h3>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={onRefresh}
            disabled={isAuditing}
          >
            <RefreshCw className={cn("h-4 w-4", isAuditing && "animate-spin")} />
          </Button>
        </div>

        {/* Contadores de resumen */}
        <div className="flex gap-2 flex-wrap">
          <Badge 
            variant={summary.bySeverity.error > 0 ? "destructive" : "secondary"}
            className="text-xs"
          >
            {summary.bySeverity.error} errores
          </Badge>
          <Badge 
            variant="outline" 
            className={cn(
              "text-xs",
              summary.bySeverity.warning > 0 && "border-amber-500 text-amber-600"
            )}
          >
            {summary.bySeverity.warning} advertencias
          </Badge>
          {summary.total === 0 && (
            <Badge variant="outline" className="text-xs border-green-500 text-green-600">
              <CheckCircle className="h-3 w-3 mr-1" />
              Sin problemas
            </Badge>
          )}
        </div>

        {/* Período auditado */}
        <p className="text-[10px] text-muted-foreground mt-2">
          Período: {format(new Date(auditResult.auditedPeriod.startDate), "d MMM", { locale: es })} - {format(new Date(auditResult.auditedPeriod.endDate), "d MMM yyyy", { locale: es })}
        </p>
      </div>

      {/* Filtros */}
      {summary.total > 0 && (
        <div className="px-4 py-2 border-b border-border flex gap-2 items-center flex-wrap">
          <Filter className="h-3 w-3 text-muted-foreground" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as ViolationType | 'all')}
            className="text-xs bg-background border border-input rounded px-2 py-1"
          >
            <option value="all">Todos los tipos</option>
            {Object.entries(VIOLATION_TYPE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value as ViolationSeverity | 'all')}
            className="text-xs bg-background border border-input rounded px-2 py-1"
          >
            <option value="all">Todas las severidades</option>
            <option value="error">Solo errores</option>
            <option value="warning">Solo advertencias</option>
            <option value="info">Solo info</option>
          </select>
          {hasFilters && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 px-1"
              onClick={() => { setFilterType('all'); setFilterSeverity('all'); }}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      )}

      {/* Lista de violaciones */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {filteredViolations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <p className="text-sm">
                {hasFilters ? 'No hay problemas con estos filtros' : '¡Todo está correcto!'}
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {Object.entries(violationsByEmployee).map(([employeeId, data]) => (
                <Collapsible
                  key={employeeId}
                  open={expandedEmployees.has(employeeId)}
                  onOpenChange={() => toggleEmployee(employeeId)}
                >
                  <CollapsibleTrigger className="w-full">
                    <div className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-2">
                        {expandedEmployees.has(employeeId) 
                          ? <ChevronDown className="h-3 w-3" />
                          : <ChevronRight className="h-3 w-3" />
                        }
                        <span className="text-sm font-medium">
                          {data.name || 'General'}
                        </span>
                      </div>
                      <Badge variant="outline" className="text-[10px]">
                        {data.violations.length}
                      </Badge>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="ml-5 pl-2 border-l border-border/50 space-y-1 py-1">
                      {data.violations.map((violation) => (
                        <ViolationListItem 
                          key={violation.id} 
                          violation={violation}
                          onClick={() => onViolationClick?.(violation)}
                        />
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

// Item de violación en la lista
interface ViolationListItemProps {
  violation: AuditViolation;
  onClick?: () => void;
}

function ViolationListItem({ violation, onClick }: ViolationListItemProps) {
  return (
    <DetailedViolationTooltip violation={violation}>
      <button
        onClick={onClick}
        className={cn(
          "w-full text-left px-2 py-1.5 rounded text-xs transition-colors",
          "hover:bg-muted/50 flex items-start gap-2",
          violation.severity === 'error' && "bg-destructive/5",
          violation.severity === 'warning' && "bg-amber-500/5"
        )}
      >
        <ViolationIcon 
          type={violation.type} 
          severity={violation.severity} 
          size={12}
          className="mt-0.5 flex-shrink-0" 
        />
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{violation.message}</p>
          <p className="text-[10px] text-muted-foreground">
            {format(new Date(violation.date), "d MMM", { locale: es })}
          </p>
        </div>
      </button>
    </DetailedViolationTooltip>
  );
}

// Botón trigger para abrir el panel como sheet
interface AuditPanelTriggerProps {
  auditResult: AuditResult | null;
  isAuditing: boolean;
  onRefresh: () => void;
  onViolationClick?: (violation: AuditViolation) => void;
}

export function AuditPanelSheet(props: AuditPanelTriggerProps) {
  const { auditResult } = props;
  const totalViolations = auditResult?.summary.total || 0;
  const hasErrors = (auditResult?.summary.bySeverity.error || 0) > 0;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "gap-2",
            hasErrors && "border-destructive text-destructive",
            !hasErrors && totalViolations > 0 && "border-amber-500 text-amber-600"
          )}
        >
          <AlertTriangle className="h-4 w-4" />
          <span>Auditoría</span>
          {totalViolations > 0 && (
            <Badge 
              variant={hasErrors ? "destructive" : "secondary"}
              className="h-5 px-1.5 text-[10px]"
            >
              {totalViolations}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[350px] sm:w-[400px] p-0">
        <SheetHeader className="sr-only">
          <SheetTitle>Panel de Auditoría</SheetTitle>
        </SheetHeader>
        <AuditPanel {...props} />
      </SheetContent>
    </Sheet>
  );
}
