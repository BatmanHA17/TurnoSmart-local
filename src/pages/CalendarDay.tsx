import { useEffect, useState } from "react";
import { format } from "date-fns";
import { DayCalendarView } from "@/components/calendar/day/DayCalendarView";
import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";
import { useUserRoleCanonical } from "@/hooks/useUserRoleCanonical";
import { useAuth } from "@/hooks/useAuth";
import { useCalendarEmployeeFilter } from "@/hooks/useCalendarEmployeeFilter";
import { useEmployeeSortOrder } from "@/hooks/useEmployeeSortOrder";
import { supabase } from "@/integrations/supabase/client";

export default function CalendarDay() {
  const { role } = useUserRoleCanonical();
  const { user } = useAuth();
  const { org: currentOrg } = useCurrentOrganization();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [employees, setEmployees] = useState<any[]>([]);

  // 🆕 Hook para sincronizar filtro de empleados eliminados entre vistas
  const { filteredEmployees } = useCalendarEmployeeFilter(employees, selectedOrgId);

  // 🆕 Hook para sincronizar ordenamiento consistente entre todas las vistas
  const { sortedEmployees } = useEmployeeSortOrder(filteredEmployees);

  useEffect(() => {
    document.title = "Calendario Día – TurnoSmart";
  }, []);

  useEffect(() => {
    if (currentOrg) {
      setSelectedOrgId(currentOrg.org_id);
    }
  }, [currentOrg]);

  useEffect(() => {
    if (selectedOrgId) {
      fetchEmployees();
    }
  }, [selectedOrgId, role, user, selectedDate]);

  const fetchEmployees = async () => {
    if (!selectedOrgId) return;

    try {
      // ✅ TODOS LOS ROLES (incluido EMPLOYEE) ven todos los colaboradores
      // La restricción de edición se maneja en DayGrid con useEmployeeViewPermissions
      // Usar la fecha seleccionada en el calendario, no la fecha actual del sistema
      const dateToCompare = format(selectedDate, 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('colaboradores')
        .select('id, nombre, apellidos, avatar_url, email, tiempo_trabajo_semanal, tipo_contrato, fecha_inicio_contrato, fecha_fin_contrato')
        .eq('org_id', selectedOrgId)
        .or(`status.eq.activo,and(status.eq.inactivo,fecha_fin_contrato.gte.${dateToCompare})`)
        .order('nombre', { ascending: true });
      
      if (!error && data) {
        setEmployees(data);
      } else if (error) {
        console.error('❌ Error cargando empleados:', error);
        setEmployees([]);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      setEmployees([]);
    }
  };

  if (!selectedOrgId) {
    return <div>Cargando...</div>;
  }

  return (
    <DayCalendarView
      selectedDate={selectedDate}
      onDateChange={setSelectedDate}
      selectedOrgId={selectedOrgId}
      onOrgChange={setSelectedOrgId}
      employees={sortedEmployees}
    />
  );
}
