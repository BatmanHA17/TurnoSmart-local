import { useEffect, useState } from "react";
import { HRSidebar } from "@/components/HRSidebar";
import { MainLayout } from "@/components/MainLayout";
import { Card } from "@/components/ui/card";
import { EnhancedDateRangePicker } from "@/components/entradas/EnhancedDateRangePicker";
import { OrganizationFilter } from "@/components/filters/OrganizationFilter";
import { AbsenceLogTable, type Ausencia } from "@/components/absence-log/AbsenceLogTable";
import { esStrings } from "@/i18n/es";
import { designTokens } from "@/design-tokens";
import { startOfDay } from "date-fns";

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

export default function HRAbsenceLog() {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: startOfDay(new Date(2025, 8, 1)), // 01/09/2025
    to: startOfDay(new Date(2025, 8, 30)), // 30/09/2025
  });
  
  const [establishmentFilter, setEstablishmentFilter] = useState("all");

  useEffect(() => {
    document.title = "HR Registro de Ausencias – TurnoSmart";
  }, []);

  const handleEmpleadoClick = (ausencia: Ausencia) => {
    // TODO: Navegación a página de datos personales del empleado
    // Simular navegación como en el tutorial
    alert(`Navegando a datos personales de ${ausencia.nombre}`);
  };

  return (
    <MainLayout>
      <div className="flex min-h-screen bg-muted/20">
        <HRSidebar />
        <div className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-2xl font-semibold text-foreground" style={{ fontFamily: designTokens.typography.fontFamily }}>
                {esStrings.registroAusencias}
              </h1>
              <p className="text-sm text-muted-foreground mt-1" style={{ fontFamily: designTokens.typography.fontFamily }}>
                Gestión del registro de ausencias de empleados
              </p>
            </div>
            
            {/* Filtros */}
            <div className="flex items-center gap-6 mb-6">
              <OrganizationFilter
                value={establishmentFilter}
                onChange={setEstablishmentFilter}
                variant="popover"
              />
              
              <EnhancedDateRangePicker
                value={dateRange}
                onChange={setDateRange}
              />
            </div>

            {/* Tabla de registro de ausencias */}
            <AbsenceLogTable
              onEmpleadoClick={handleEmpleadoClick}
            />
          </div>
        </div>
      </div>
    </MainLayout>
  );
}