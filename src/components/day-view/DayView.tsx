import { useState, useMemo, useEffect, useRef } from "react";
import { useDayScrollSync } from "./hooks/useDayScrollSync";
import { useDayZoom } from "./hooks/useDayZoom";
import { DayToolbar } from "./DayToolbar";
import { DayLeftPane } from "./DayLeftPane";
import { DayTimeAxis } from "./DayTimeAxis";
import { DayGrid } from "./DayGrid";
import { AdvancedShiftDialog } from "@/components/AdvancedShiftDialog";

interface DayViewProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  employees: any[];
  shifts: any[];
  orgId: string;
}

export function DayView({ selectedDate, onDateChange, employees, shifts, orgId }: DayViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedShift, setSelectedShift] = useState<any>(null);
  const [showShiftDialog, setShowShiftDialog] = useState(false);
  const [containerHeight, setContainerHeight] = useState(600);

  const containerRef = useRef<HTMLDivElement>(null);

  const { gridRef, topRef, leftRef, onGridScroll, onTopScroll, onLeftScroll } = useDayScrollSync();
  const { pxPerHour, pxPerSlot, zoomIn, zoomOut } = useDayZoom();

  const ROW_HEIGHT = 48; // px

  // Calcular altura del contenedor
  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerHeight(window.innerHeight - rect.top);
      }
    };
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  // Filtrar empleados por búsqueda
  const filteredEmployees = useMemo(() => {
    if (!searchTerm) return employees;
    const term = searchTerm.toLowerCase();
    return employees.filter(emp =>
      `${emp.nombre} ${emp.apellidos}`.toLowerCase().includes(term)
    );
  }, [employees, searchTerm]);

  // Calcular si es hoy y posición de "ahora"
  const isToday = useMemo(() => {
    const today = new Date();
    return selectedDate.toDateString() === today.toDateString();
  }, [selectedDate]);

  const currentTimePercent = useMemo(() => {
    if (!isToday) return undefined;
    const now = new Date();
    const minutes = now.getHours() * 60 + now.getMinutes();
    return (minutes / (24 * 60)) * 100;
  }, [isToday]);

  const handleShiftClick = (shift: any) => {
    setSelectedShift(shift);
    setShowShiftDialog(true);
  };

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Toolbar */}
      <DayToolbar
        selectedDate={selectedDate}
        onDateChange={onDateChange}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
      />

      {/* Layout principal */}
      <div ref={containerRef} className="flex flex-1 overflow-hidden">
        <div className="flex flex-col flex-1">
          {/* Fila superior: esquina + time axis */}
          <div className="flex shrink-0">
            {/* Esquina superior izquierda (sticky) */}
            <div className="w-64 h-12 border-r border-b bg-background flex items-center justify-center shrink-0">
              <span className="text-xs font-medium text-muted-foreground">Empleados</span>
            </div>

            {/* Time Axis (scrollable X) */}
            <div
              ref={topRef}
              className="flex-1 overflow-x-auto overflow-y-hidden scrollbar-thin"
              onScroll={onTopScroll}
            >
              <DayTimeAxis
                pxPerHour={pxPerHour}
                showNowLine={isToday}
                currentTimePercent={currentTimePercent}
              />
            </div>
          </div>

          {/* Fila inferior: left pane + grid */}
          <div className="flex flex-1 overflow-hidden">
            {/* Left pane (scrollable Y) */}
            <div
              ref={leftRef}
              className="w-64 overflow-y-auto overflow-x-hidden scrollbar-thin shrink-0"
              onScroll={onLeftScroll}
            >
              <DayLeftPane
                employees={filteredEmployees}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                rowHeight={ROW_HEIGHT}
                containerHeight={containerHeight}
              />
            </div>

            {/* Grid principal (scroll X+Y) */}
            <div
              ref={gridRef}
              className="flex-1 overflow-auto scrollbar-thin"
              onScroll={onGridScroll}
            >
              <DayGrid
                employees={filteredEmployees}
                shifts={shifts}
                pxPerSlot={pxPerSlot}
                rowHeight={ROW_HEIGHT}
                onShiftClick={handleShiftClick}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Shift Dialog */}
      {showShiftDialog && (
        <AdvancedShiftDialog
          isOpen={showShiftDialog}
          onClose={() => {
            setShowShiftDialog(false);
            setSelectedShift(null);
          }}
          employee={employees.find(e => e.id === selectedShift?.employee_id)}
          date={selectedDate}
          editingShift={selectedShift}
        />
      )}
    </div>
  );
}
