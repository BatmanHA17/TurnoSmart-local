import { useEffect, useState } from "react";
import { HRSidebar } from "@/components/HRSidebar";
import { MainLayout } from "@/components/MainLayout";
import { OverviewFilters } from "@/components/overview/OverviewFilters";
import { OverviewStatsCard } from "@/components/overview/OverviewStatsCard";
import { OverviewExportMenu } from "@/components/overview/OverviewExportMenu";
import { Button } from "@/components/ui/button";
import { RefreshCw, MoreHorizontal } from "lucide-react";
import { esOverview } from "@/i18n/es-overview";
import { toast } from "@/hooks/use-toast";

export default function HROverview() {
  const [filters, setFilters] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({
    plantilla: { total: 156, presencial: 124, ausencia: 32 },
    vacaciones: { total: 18, percentage: 11.5 },
    enfermos: { total: 8, percentage: 5.1 },
    faltas: { total: 3, percentage: 1.9 },
    accidentes: { total: 1, percentage: 0.6 },
    permisos: { total: 2, percentage: 1.3 },
    absentismo: { percentage: 20.5, trend: { value: -2.3, isPositive: true } },
    rotacion: { percentage: 8.2, trend: { value: 1.5, isPositive: false } },
  });

  useEffect(() => {
    document.title = "Visión general – TurnoSmart";
  }, []);

  const handleFiltersChange = (newFilters: any) => {
    setFilters(newFilters);
    // TODO: Fetch data based on filters
    console.log('Filters changed:', newFilters);
  };

  const handleExport = async (format: 'csv' | 'excel' | 'pdf') => {
    // TODO: Implement actual export functionality
    console.log(`Exporting as ${format}`);
    
    // Simulate export process
    return new Promise((resolve) => {
      setTimeout(resolve, 1500);
    });
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    
    toast({
      title: esOverview.states.actualizando,
      description: "Obteniendo los datos más recientes...",
    });

    try {
      // TODO: Fetch fresh data
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Datos actualizados",
        description: "Los datos se han actualizado correctamente.",
      });
    } catch (error) {
      toast({
        title: "Error al actualizar",
        description: "No se pudieron actualizar los datos. Inténtelo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="flex min-h-screen bg-muted/20">
        <HRSidebar />
        <div className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-foreground">{esOverview.title}</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {esOverview.subtitle}
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isLoading}
                  className="h-10 px-4 border-border/50 bg-card hover:bg-muted/50"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  {esOverview.actions.actualizar}
                </Button>
                
                <OverviewExportMenu onExport={handleExport} />
                
                <Button
                  variant="outline"
                  size="sm"
                  className="h-10 px-4 border-border/50 bg-card hover:bg-muted/50"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Filtros */}
            <OverviewFilters onFiltersChange={handleFiltersChange} />

            {/* Cards de estadísticas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Plantilla */}
              <OverviewStatsCard
                title={esOverview.stats.plantilla}
                value={stats.plantilla.total}
                subtitle={`${stats.plantilla.presencial} presenciales, ${stats.plantilla.ausencia} ausencias`}
                variant="default"
              />

              {/* Presencial */}
              <OverviewStatsCard
                title={esOverview.stats.presencial}
                value={stats.plantilla.presencial}
                subtitle={`${((stats.plantilla.presencial / stats.plantilla.total) * 100).toFixed(1)}% de la plantilla`}
                variant="success"
              />

              {/* Ausencia */}
              <OverviewStatsCard
                title={esOverview.stats.ausencia}
                value={stats.plantilla.ausencia}
                subtitle={`${((stats.plantilla.ausencia / stats.plantilla.total) * 100).toFixed(1)}% de la plantilla`}
                variant="warning"
              />

              {/* Vacaciones */}
              <OverviewStatsCard
                title={esOverview.stats.vacaciones}
                value={stats.vacaciones.total}
                subtitle={`${stats.vacaciones.percentage}% de la plantilla`}
                variant="info"
              />

              {/* Enfermos */}
              <OverviewStatsCard
                title={esOverview.stats.enfermos}
                value={stats.enfermos.total}
                subtitle={`${stats.enfermos.percentage}% de la plantilla`}
                variant="danger"
              />

              {/* Faltas */}
              <OverviewStatsCard
                title={esOverview.stats.faltas}
                value={stats.faltas.total}
                subtitle={`${stats.faltas.percentage}% de la plantilla`}
                variant="warning"
              />

              {/* Accidentes */}
              <OverviewStatsCard
                title={esOverview.stats.accidentes}
                value={stats.accidentes.total}
                subtitle={`${stats.accidentes.percentage}% de la plantilla`}
                variant="danger"
              />

              {/* Permisos */}
              <OverviewStatsCard
                title={esOverview.stats.permisos}
                value={stats.permisos.total}
                subtitle={`${stats.permisos.percentage}% de la plantilla`}
                variant="info"
              />

              {/* Absentismo */}
              <OverviewStatsCard
                title={esOverview.stats.absentismo}
                value={`${stats.absentismo.percentage}%`}
                trend={stats.absentismo.trend}
                variant="warning"
                className="md:col-span-2"
              />

              {/* Rotación */}
              <OverviewStatsCard
                title={esOverview.stats.rotacion}
                value={`${stats.rotacion.percentage}%`}
                trend={stats.rotacion.trend}
                variant="danger"
                className="md:col-span-2"
              />
            </div>

            {/* Información adicional */}
            <div className="text-center text-sm text-muted-foreground">
              <p>Datos actualizados cada 15 minutos • Última actualización: {new Date().toLocaleTimeString()}</p>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}