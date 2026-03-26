import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  ChevronLeft, 
  ChevronRight, 
  Save, 
  Settings, 
  Trash2,
  ChevronsLeft,
  ChevronsRight,
  MoreVertical
} from "lucide-react";
import { format, addDays, subDays, addWeeks, subWeeks, startOfWeek, addMonths, subMonths } from "date-fns";
import { es } from "date-fns/locale";
import { ViewModeSelector } from "./ViewModeSelector";
import { CalendarPublishButton } from "@/components/CalendarPublishButton";
import { OrganizationFilter } from "@/components/filters/OrganizationFilter";
import { Input } from "@/components/ui/input";
import { X, ArrowUpDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface CalendarToolbarProps {
  // Navigation
  viewMode: 'day' | 'week' | 'biweek' | 'month';
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  
  // Organization & Search (optional, for day view)
  selectedOrgId?: string | null;
  onOrgChange?: (orgId: string | null) => void;
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
  
  // Actions
  hasUnsavedChanges?: boolean;
  onSave?: () => void;
  onPrint?: () => void;
  onExport?: () => void;
  
  // Publishing
  isPublished?: boolean;
  isDraft?: boolean;
  canPublish?: boolean;
  isPublishing?: boolean;
  publishedAt?: string;
  version?: number;
  onPublish?: () => Promise<boolean>;
  onUnpublish?: () => Promise<boolean>;
  
  // Settings
  onOpenSettings?: () => void;
  onDelete?: () => void;
  canEdit?: boolean;
  
  // Day-specific
  sortByTime?: boolean;
  onToggleSort?: () => void;
  
  // Month-specific
  onClean?: () => void;
}

export function CalendarToolbar({
  viewMode,
  selectedDate,
  onDateChange,
  selectedOrgId,
  onOrgChange,
  searchTerm,
  onSearchChange,
  hasUnsavedChanges,
  onSave,
  onPrint,
  onExport,
  isPublished,
  isDraft,
  canPublish,
  isPublishing,
  publishedAt,
  version,
  onPublish,
  onUnpublish,
  onOpenSettings,
  onDelete,
  canEdit = true,
  sortByTime,
  onToggleSort,
  onClean,
}: CalendarToolbarProps) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const handlePreviousWeek = () => {
    const weeksToMove = 1;
    const prevWeek = subWeeks(selectedDate, weeksToMove);
    const monday = startOfWeek(prevWeek, { weekStartsOn: 1 });
    onDateChange(monday);
  };

  const handleNextWeek = () => {
    const weeksToMove = 1;
    const nextWeek = addWeeks(selectedDate, weeksToMove);
    const monday = startOfWeek(nextWeek, { weekStartsOn: 1 });
    onDateChange(monday);
  };

  const handlePreviousDay = () => {
    onDateChange(subDays(selectedDate, 1));
  };

  const handleNextDay = () => {
    onDateChange(addDays(selectedDate, 1));
  };

  const handlePreviousMonth = () => {
    onDateChange(subMonths(selectedDate, 1));
  };

  const handleNextMonth = () => {
    onDateChange(addMonths(selectedDate, 1));
  };

  const handleToday = () => {
    onDateChange(new Date());
  };

  const getDateLabel = () => {
    if (viewMode === 'month') {
      return format(selectedDate, 'MMMM yyyy', { locale: es });
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
      {/* Primera fila: Acciones principales */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        {/* IZQUIERDA: Acciones de guardar/exportar */}
        <div className="flex items-center gap-1 justify-center sm:justify-start">
          {onSave && (
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
        </div>

        {/* CENTRO: Navegación + Selector de vista */}
        <div className="flex items-center gap-1 justify-center flex-wrap sm:flex-nowrap">
          {/* Navegación de fecha */}
          <div className="flex items-center gap-0.5">
            {viewMode === 'day' && (
              <>
                <Button variant="ghost" size="icon" onClick={handlePreviousWeek} className="h-8 w-8 text-muted-foreground hover:text-foreground">
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={handlePreviousDay} className="h-8 w-8 text-muted-foreground hover:text-foreground">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="sm" className={cn("h-8 px-3 font-medium", !selectedDate && "text-muted-foreground")}>
                      <CalendarIcon className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
                      {getDateLabel()}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-popover border border-border shadow-lg" align="center">
                    <Calendar mode="single" selected={selectedDate} onSelect={(date) => { if (date) { onDateChange(date); setIsCalendarOpen(false); } }} initialFocus className="pointer-events-auto" />
                  </PopoverContent>
                </Popover>
                <Button variant="ghost" size="icon" onClick={handleNextDay} className="h-8 w-8 text-muted-foreground hover:text-foreground">
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={handleNextWeek} className="h-8 w-8 text-muted-foreground hover:text-foreground">
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </>
            )}

            {(viewMode === 'week' || viewMode === 'biweek') && (
              <>
                <Button variant="ghost" size="icon" onClick={handlePreviousWeek} className="h-8 w-8 text-muted-foreground hover:text-foreground">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="sm" className={cn("h-8 px-3 font-medium", !selectedDate && "text-muted-foreground")}>
                      <CalendarIcon className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
                      {getDateLabel()}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-popover border border-border shadow-lg" align="center">
                    <Calendar mode="single" selected={selectedDate} onSelect={(date) => { if (date) { const monday = startOfWeek(date, { weekStartsOn: 1 }); onDateChange(monday); setIsCalendarOpen(false); } }} initialFocus className="pointer-events-auto" />
                  </PopoverContent>
                </Popover>
                <Button variant="ghost" size="icon" onClick={handleNextWeek} className="h-8 w-8 text-muted-foreground hover:text-foreground">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            )}

            {viewMode === 'month' && (
              <>
                <Button variant="ghost" size="icon" onClick={handlePreviousMonth} className="h-8 w-8 text-muted-foreground hover:text-foreground">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={handleToday} className="h-8 text-muted-foreground hover:text-foreground">
                  Hoy
                </Button>
                <Button variant="ghost" size="icon" onClick={handleNextMonth} className="h-8 w-8 text-muted-foreground hover:text-foreground">
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <span className="text-sm font-semibold ml-2 capitalize">
                  {getDateLabel()}
                </span>
              </>
            )}
          </div>

          <div className="h-4 w-px bg-border mx-1 hidden sm:block" />
          <ViewModeSelector />
        </div>

        {/* DERECHA: Settings + Publicar */}
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

          {canEdit && onClean && (
            <Button variant="ghost" size="sm" onClick={onClean} className="h-8 gap-1 text-muted-foreground hover:text-foreground">
              <Trash2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Limpiar</span>
            </Button>
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

      {/* Segunda fila OPCIONAL (solo para vista día) */}
      {viewMode === 'day' && (onOrgChange || onSearchChange || onToggleSort) && (
        <div className="flex items-center gap-2">
          {onOrgChange && (
            <OrganizationFilter
              value={selectedOrgId || 'all'}
              onChange={onOrgChange}
            />
          )}
          
          {onSearchChange && (
            <div className="relative flex-1 max-w-md">
              <Input
                type="text"
                placeholder="Buscar empleado..."
                value={searchTerm || ''}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pr-8"
              />
              {searchTerm && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          )}

          {onToggleSort && (
            <Button
              variant={sortByTime ? "default" : "outline"}
              size="sm"
              onClick={onToggleSort}
              className="gap-2"
            >
              <ArrowUpDown className="h-4 w-4" />
              Ordenar por hora
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
