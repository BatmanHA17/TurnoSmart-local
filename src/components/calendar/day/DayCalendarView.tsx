import { useState, useMemo, useEffect, useRef } from "react";
import { CalendarToolbar } from "../CalendarToolbar";
import { DayEmployeeList } from "./DayEmployeeList";
import { SingleDayTimeAxis } from "./SingleDayTimeAxis";
import { DayGrid } from "./DayGrid";
import { DayCapacityBar } from "./DayCapacityBar";
import { DayEmptyState } from "../DayEmptyState";
import { useDayCalendarData } from "@/hooks/useDayCalendarData";
import { useDayCalendarActions } from "@/hooks/useDayCalendarActions";
import { useCalendarPublishState } from "@/hooks/useCalendarPublishState";
import { useUserRoleCanonical } from "@/hooks/useUserRoleCanonical";
import { format, addDays, subDays } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Clock } from "lucide-react";

interface Employee {
  id: string;
  nombre: string;
  apellidos: string;
  avatar_url?: string;
  email?: string;
  tiempo_trabajo_semanal?: number;
}

interface DayCalendarViewProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  selectedOrgId: string;
  onOrgChange: (orgId: string) => void;
  employees: Employee[];
}

export function DayCalendarView({
  selectedDate,
  onDateChange,
  selectedOrgId,
  onOrgChange,
  employees
}: DayCalendarViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const { role, loading: roleLoading } = useUserRoleCanonical();
  const isEmployee = role === 'EMPLOYEE';

  // Load shifts for single day
  const { shifts, loading: shiftsLoading, refresh } = useDayCalendarData(selectedDate, selectedOrgId);
  
  // Actions for shifts
  const { updateShift, deleteShift, createShift } = useDayCalendarActions(refresh);

  // Publishing state
  const {
    publishState,
    isPublished,
    isDraft,
    canPublish,
    publishCalendar,
    unpublishCalendar
  } = useCalendarPublishState(selectedDate);

  // Sync scroll between employee list and grid
  useEffect(() => {
    const employeeScroll = document.getElementById('employee-scroll');
    const gridScroll = document.getElementById('grid-scroll');

    if (!employeeScroll || !gridScroll) return;

    const syncScroll = (source: HTMLElement, target: HTMLElement) => {
      target.scrollTop = source.scrollTop;
    };

    const handleEmployeeScroll = () => syncScroll(employeeScroll, gridScroll);
    const handleGridScroll = () => syncScroll(gridScroll, employeeScroll);

    employeeScroll.addEventListener('scroll', handleEmployeeScroll);
    gridScroll.addEventListener('scroll', handleGridScroll);

    return () => {
      employeeScroll.removeEventListener('scroll', handleEmployeeScroll);
      gridScroll.removeEventListener('scroll', handleGridScroll);
    };
  }, []);

  // Declarar handlers ANTES de usarlos
  const handleSave = () => {
    console.log("Guardando cambios...");
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    console.log("Exportando...");
  };

  const handleOpenSettings = () => {
    console.log("Abriendo configuración...");
  };

  const handleDelete = () => {
    if (confirm("¿Estás seguro de que deseas eliminar este calendario?")) {
      console.log("Eliminando calendario...");
    }
  };

  // Handlers para publicar
  const handlePublish = async () => {
    // Para day view, usamos los shifts del día y los empleados filtrados
    const dayShifts = shifts.map(s => ({
      employeeId: s.employee_id,
      date: s.date,
      startTime: s.start_time,
      endTime: s.end_time,
      name: s.shift_name || 'Turno',
      color: s.color,
      notes: s.notes,
      breakDuration: s.break_duration
    }));

    const dayEmployees = employees.map(emp => ({
      id: emp.id,
      name: `${emp.nombre} ${emp.apellidos}`,
      role: 'Empleado',
      department: 'General'
    }));

    return await publishCalendar(dayShifts, dayEmployees);
  };

  const handleUnpublish = async () => {
    return await unpublishCalendar();
  };

  // 🔒 EMPLOYEE LOCKDOWN: Solo mostrar empty state cuando NO está cargando Y NO hay turnos
  // Esto mantiene turnos antiguos visibles durante la carga (Optimistic UI), evitando flashes
  if (role === 'EMPLOYEE' && !roleLoading && !shiftsLoading && shifts.length === 0) {
    return (
      <div className="flex h-screen flex-col bg-background">
        <CalendarToolbar
          viewMode="day"
          selectedDate={selectedDate}
          onDateChange={onDateChange}
          hasUnsavedChanges={false}
          onSave={handleSave}
          onPrint={handlePrint}
          onExport={handleExport}
          onOpenSettings={handleOpenSettings}
          onDelete={handleDelete}
          isPublished={isPublished}
          isDraft={isDraft}
          canPublish={false} // EMPLOYEE no puede publicar
          isPublishing={false}
          publishedAt={publishState.published_at}
          version={publishState.version}
          onPublish={handlePublish}
          onUnpublish={handleUnpublish}
          canEdit={!isEmployee}
        />
        
        {/* Contenedor flex-1 para que DayEmptyState ocupe el espacio restante */}
        <div className="flex-1 flex items-center justify-center p-6">
          <DayEmptyState
            currentDate={selectedDate}
            onDateChange={onDateChange}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Calendar Toolbar */}
      <CalendarToolbar
        viewMode="day"
        selectedDate={selectedDate}
        onDateChange={onDateChange}
        hasUnsavedChanges={false}
        onSave={handleSave}
        onPrint={handlePrint}
        onExport={handleExport}
        onOpenSettings={handleOpenSettings}
        onDelete={handleDelete}
        isPublished={isPublished}
        isDraft={isDraft}
        canPublish={canPublish}
        isPublishing={publishState.isPublishing}
        publishedAt={publishState.published_at}
        version={publishState.version}
        onPublish={handlePublish}
        onUnpublish={handleUnpublish}
        canEdit={!isEmployee}
      />

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Right Panel: Single Day Timeline with horizontal scroll */}
        <div className="flex-1 flex flex-col overflow-hidden bg-muted/20">
          {/* Header Row - Fixed */}
          <div className="flex border-b bg-background">
            {/* Left: Empty header space */}
            <div className="w-64 border-r flex items-center px-4 h-10">
              {/* Espacio vacío */}
            </div>
            
            {/* Right: Time Axis (sin contador de personas) */}
            <div className="flex-1 overflow-x-auto">
              <SingleDayTimeAxis 
                selectedDate={selectedDate}
                shifts={shifts}
              />
            </div>
          </div>

          {/* Scrollable content area */}
          <div className="flex flex-1 overflow-hidden">
            {/* Left Panel: Employee List (synchronized scroll) */}
            <div className="w-64 border-r bg-background overflow-y-auto" id="employee-scroll">
              <DayEmployeeList 
                employees={employees}
                searchTerm={searchTerm}
                shifts={shifts}
              />
            </div>

            {/* Grid with shifts (scrollable) */}
            <div className="flex-1 overflow-x-auto overflow-y-auto" id="grid-scroll">
              {shiftsLoading ? (
                <div className="flex h-full items-center justify-center">
                  <p className="text-sm text-muted-foreground">Cargando turnos...</p>
                </div>
              ) : (
                <DayGrid
                  employees={employees}
                  selectedDate={selectedDate}
                  shifts={shifts}
                  onUpdate={updateShift}
                  onDelete={deleteShift}
                  onCreate={async (employeeId: string, date: Date, shiftData: any) => {
                    await createShift({
                      date: date.toISOString().split('T')[0],
                      employee_id: employeeId,
                      shift_name: shiftData.name || shiftData.shift_name || 'Turno',
                      start_time: shiftData.startTime || shiftData.start_time,
                      end_time: shiftData.endTime || shiftData.end_time,
                      org_id: selectedOrgId,
                      break_duration: shiftData.breakDuration || shiftData.break_duration,
                      notes: shiftData.notes,
                      color: shiftData.color || '#86efac'
                    });
                  }}
                  readOnly={false}
                  isPublished={isPublished}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
