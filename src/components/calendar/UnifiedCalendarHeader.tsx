import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  ChevronRight,
  Save,
  Settings,
  Trash2,
  History,
  Shield,
  Users,
  Calendar as CalendarIcon,
  Eraser,
  Wand2,
  Copy,
} from "lucide-react";
import { format, addDays, subDays, addWeeks, subWeeks, startOfWeek, addMonths, subMonths } from "date-fns";
import { es } from "date-fns/locale";
import { ViewModeSelector } from "./ViewModeSelector";
import { CalendarPublishButton } from "@/components/CalendarPublishButton";
import { UndoRedoToolbar } from "./UndoRedoToolbar";
import { AuditPanelSheet } from "@/components/audit/AuditPanel";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import type { AuditResult } from "@/types/audit";

interface UnifiedCalendarHeaderProps {
  // View mode
  viewMode: 'day' | 'week' | 'biweek' | 'month';
  
  // Navigation
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  
  // Save/Export
  hasUnsavedChanges?: boolean;
  changeCount?: number;
  onSave?: () => void;
  onPrint?: () => void;
  onExport?: () => void;
  
  // Undo/Redo
  canUndo?: boolean;
  canRedo?: boolean;
  historySize?: number;
  futureSize?: number;
  onUndo?: () => void;
  onRedo?: () => void;
  
  // History/Backups
  onShowHistory?: () => void;
  onShowBackups?: () => void;
  
  // Clean
  onClean?: () => void;
  
  // Settings/Delete
  onOpenSettings?: () => void;
  onDelete?: () => void;
  canEdit?: boolean;
  
  // Publishing
  isPublished?: boolean;
  isDraft?: boolean;
  canPublish?: boolean;
  isPublishing?: boolean;
  publishedAt?: string;
  version?: number;
  onPublish?: () => Promise<boolean>;
  onUnpublish?: () => Promise<boolean>;
  
  // Audit
  auditResult?: AuditResult | null;
  isAuditing?: boolean;
  onRefreshAudit?: () => void;
  
  // Generate SMART schedule
  onGenerate?: () => void;
  isGenerating?: boolean;

  // Duplicate week (biweek view only)
  onDuplicateWeek?: () => void;

  // iCal export button (passed as a ReactNode slot)
  exportButton?: React.ReactNode;

  // Badges
  employeeCount?: number;
  dayCount?: number;
}

export function UnifiedCalendarHeader({
  viewMode,
  selectedDate,
  onDateChange,
  hasUnsavedChanges = false,
  changeCount = 0,
  onSave,
  onPrint,
  onExport,
  canUndo = false,
  canRedo = false,
  historySize = 0,
  futureSize = 0,
  onUndo,
  onRedo,
  onShowHistory,
  onShowBackups,
  onClean,
  onOpenSettings,
  onDelete,
  canEdit = true,
  isPublished,
  isDraft,
  canPublish,
  isPublishing,
  publishedAt,
  version,
  onPublish,
  onUnpublish,
  auditResult,
  isAuditing = false,
  onRefreshAudit,
  onGenerate,
  isGenerating = false,
  onDuplicateWeek,
  exportButton,
  employeeCount,
  dayCount,
}: UnifiedCalendarHeaderProps) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Navigation handlers
  const handlePrevious = () => {
    if (viewMode === 'day') {
      onDateChange(subDays(selectedDate, 1));
    } else if (viewMode === 'month') {
      onDateChange(subMonths(selectedDate, 1));
    } else {
      onDateChange(subWeeks(selectedDate, 1));
    }
  };

  const handleNext = () => {
    if (viewMode === 'day') {
      onDateChange(addDays(selectedDate, 1));
    } else if (viewMode === 'month') {
      onDateChange(addMonths(selectedDate, 1));
    } else {
      onDateChange(addWeeks(selectedDate, 1));
    }
  };

  const handleToday = () => {
    if (viewMode === 'week' || viewMode === 'biweek') {
      onDateChange(startOfWeek(new Date(), { weekStartsOn: 1 }));
    } else {
      onDateChange(new Date());
    }
  };

  const getDateLabel = () => {
    if (viewMode === 'month') {
      return format(selectedDate, 'MMMM yyyy', { locale: es });
    }
    if (viewMode === 'day') {
      return format(selectedDate, "EEEE, d 'de' MMMM", { locale: es });
    }
    if (viewMode === 'week') {
      const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
      const weekEnd = addDays(weekStart, 6);
      return `${format(weekStart, 'dd MMM', { locale: es })} - ${format(weekEnd, 'dd MMM yyyy', { locale: es })}`;
    }
    if (viewMode === 'biweek') {
      const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
      const biWeekEnd = addDays(weekStart, 13);
      return `${format(weekStart, 'dd MMM', { locale: es })} - ${format(biWeekEnd, 'dd MMM yyyy', { locale: es })}`;
    }
    return format(selectedDate, 'dd MMM yyyy', { locale: es });
  };

  return (
    <div className="space-y-2 pt-3">
      {/* Primera fila: Guardar, Exportar, Navegación, Vista, Settings, Papelera, Publicar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        {/* IZQUIERDA: Guardar + Exportar */}
        <div className="flex items-center gap-1 justify-center sm:justify-start">
          {canEdit && onSave && (
            <Button
              variant={hasUnsavedChanges ? "default" : "ghost"}
              size="sm"
              onClick={onSave}
              className="gap-1.5 h-8 text-muted-foreground hover:text-foreground"
            >
              <Save className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Guardar</span>
            </Button>
          )}

          {canEdit && onGenerate && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onGenerate}
              disabled={isGenerating}
              className="gap-1.5 h-8 text-violet-600 hover:text-violet-700 hover:bg-violet-50 dark:text-violet-400 dark:hover:bg-violet-950"
            >
              <Wand2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{isGenerating ? "Generando…" : "Generar"}</span>
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 text-muted-foreground hover:text-foreground">
                Exportar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="bg-popover border border-border shadow-lg">
              <DropdownMenuItem onClick={onPrint}>Imprimir</DropdownMenuItem>
              <DropdownMenuItem onClick={onExport}>PDF</DropdownMenuItem>
              <DropdownMenuItem onClick={onExport}>Excel</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* iCal export slot — rendered only when provided */}
          {exportButton}
        </div>

        {/* CENTRO: Navegación + Selector de vista */}
        <div className="flex items-center gap-1 justify-center flex-wrap sm:flex-nowrap">
          <Button variant="ghost" size="icon" onClick={handlePrevious} className="h-8 w-8 text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className={cn("h-8 px-3 font-medium capitalize", !selectedDate && "text-muted-foreground")}>
                <CalendarIcon className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
                {getDateLabel()}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-popover border border-border shadow-lg" align="center">
              <Calendar 
                mode="single" 
                selected={selectedDate} 
                onSelect={(date) => { 
                  if (date) { 
                    if (viewMode === 'week' || viewMode === 'biweek') {
                      onDateChange(startOfWeek(date, { weekStartsOn: 1 }));
                    } else {
                      onDateChange(date);
                    }
                    setIsCalendarOpen(false); 
                  } 
                }} 
                initialFocus 
                className="pointer-events-auto" 
              />
            </PopoverContent>
          </Popover>
          
          <Button variant="ghost" size="icon" onClick={handleNext} className="h-8 w-8 text-muted-foreground hover:text-foreground">
            <ChevronRight className="h-4 w-4" />
          </Button>

          <div className="h-4 w-px bg-border mx-1 hidden sm:block" />
          <ViewModeSelector />
        </div>

        {/* DERECHA: Settings + Papelera + Publicar */}
        <div className="flex items-center gap-1 justify-center sm:justify-end">
          {canEdit && onOpenSettings && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                  <Settings className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-popover border border-border shadow-lg">
                <DropdownMenuItem onClick={onOpenSettings}>Configuración</DropdownMenuItem>
                <DropdownMenuItem>Horarios rotativos</DropdownMenuItem>
                <DropdownMenuItem>Balance anual</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          
          {canEdit && onDelete && (
            <Button variant="ghost" size="icon" onClick={onDelete} className="h-8 w-8 text-muted-foreground hover:text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          )}

          {onPublish && onUnpublish && (
            <CalendarPublishButton
              isPublished={isPublished}
              isDraft={isDraft}
              canPublish={canPublish}
              isPublishing={isPublishing}
              publishedAt={publishedAt}
              version={version}
              onPublish={onPublish}
              onUnpublish={onUnpublish}
            />
          )}
        </div>
      </div>

      {/* Segunda fila: Undo/Redo, Historial, Backups, Badge semana, flex, Auditoría, Limpiar, Badges */}
      {canEdit && (
        <div className="flex items-center gap-2 px-1 flex-wrap">
          {/* Undo/Redo */}
          {onUndo && onRedo && (
            <UndoRedoToolbar
              canUndo={canUndo}
              canRedo={canRedo}
              historySize={historySize}
              futureSize={futureSize}
              onUndo={onUndo}
              onRedo={onRedo}
              hasUnsavedChanges={hasUnsavedChanges}
              changeCount={changeCount}
            />
          )}
          
          {(onUndo && onRedo) && <div className="h-6 w-px bg-border" />}
          
          {/* Historial */}
          {onShowHistory && (
            <Button
              variant="outline"
              size="sm"
              onClick={onShowHistory}
              className="h-8"
            >
              <History className="h-4 w-4 mr-1.5" />
              Historial
            </Button>
          )}
          
          {/* Backups */}
          {onShowBackups && (
            <Button
              variant="outline"
              size="sm"
              onClick={onShowBackups}
              className="h-8"
            >
              <Shield className="h-4 w-4 mr-1.5" />
              Backups
            </Button>
          )}

          {/* Duplicate week — only shown in biweek view when handler is provided */}
          {onDuplicateWeek && viewMode === 'biweek' && (
            <Button
              variant="outline"
              size="sm"
              onClick={onDuplicateWeek}
              className="h-8 gap-1.5"
            >
              <Copy className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Duplicar semana</span>
            </Button>
          )}


          <div className="flex-1" />
          
          {/* Auditoría - ahora a la izquierda de badges */}
          {onRefreshAudit && (
            <AuditPanelSheet
              auditResult={auditResult || null}
              isAuditing={isAuditing}
              onRefresh={onRefreshAudit}
            />
          )}
          
          {/* Limpiar - al lado de auditoría */}
          {onClean && (
            <Button variant="outline" size="sm" onClick={onClean} className="h-8 gap-1.5">
              <Eraser className="h-3.5 w-3.5" />
              Limpiar
            </Button>
          )}
          
          {(onRefreshAudit || onClean) && (employeeCount !== undefined || dayCount !== undefined) && (
            <div className="h-6 w-px bg-border" />
          )}
          
          {/* Badges de empleados y días */}
          {employeeCount !== undefined && (
            <Badge variant="secondary" className="gap-1 text-xs">
              <Users className="h-3 w-3" />
              {employeeCount}
            </Badge>
          )}
          {dayCount !== undefined && (
            <Badge variant="outline" className="gap-1 text-xs">
              <CalendarIcon className="h-3 w-3" />
              {dayCount}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
