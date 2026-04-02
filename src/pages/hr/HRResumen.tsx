import { HRSidebar } from "@/components/HRSidebar";
import { MainLayout } from "@/components/MainLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, Calendar, DoorOpen, User, Settings, FileText, DoorClosed, Users, Calculator } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";
import { PlantillaCalculator, calculatePlantilla } from "@/components/calendar/PlantillaCalculator";

export default function HRResumen() {
  const navigate = useNavigate();
  const { org } = useCurrentOrganization();
  const [colaboradores, setColaboradores] = useState([]);
  const [colaboradoresSalidas, setColaboradoresSalidas] = useState([]);
  const [totalActivos, setTotalActivos] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingSalidas, setLoadingSalidas] = useState(true);

  useEffect(() => {
    document.title = "HR Home – TurnoSmart";
    fetchColaboradores();
    fetchColaboradoresSalidas();
    fetchTotalActivos();
  }, [org?.id]);

  const fetchColaboradores = async () => {
    try {
      const today = new Date();
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      const { data, error } = await supabase
        .from('colaborador_full')
        .select('id, nombre, apellidos, status, fecha_inicio_contrato')
        .gte('fecha_inicio_contrato', today.toISOString().split('T')[0])
        .lte('fecha_inicio_contrato', nextWeek.toISOString().split('T')[0])
        .order('fecha_inicio_contrato', { ascending: true })
        .limit(10);

      if (error) throw error;
      setColaboradores(data || []);
    } catch (error) {
      console.error('Error fetching colaboradores:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchColaboradoresSalidas = async () => {
    try {
      const today = new Date();
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      const { data, error } = await supabase
        .from('colaborador_full')
        .select('id, nombre, apellidos, status, fecha_fin_contrato')
        .gte('fecha_fin_contrato', today.toISOString().split('T')[0])
        .lte('fecha_fin_contrato', nextWeek.toISOString().split('T')[0])
        .order('fecha_fin_contrato', { ascending: true })
        .limit(10);

      if (error) throw error;
      setColaboradoresSalidas(data || []);
    } catch (error) {
      console.error('Error fetching colaboradores salidas:', error);
    } finally {
      setLoadingSalidas(false);
    }
  };

  const fetchTotalActivos = async () => {
    try {
      if (!org?.id) return;
      const { count, error } = await supabase
        .from('colaboradores')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', org.id)
        .or('status.eq.activo,status.eq.active');
      if (!error && count !== null) setTotalActivos(count);
    } catch { /* graceful */ }
  };

  const plantilla = calculatePlantilla(totalActivos);

  const getInitials = (nombre, apellidos) => {
    const firstInitial = nombre?.charAt(0)?.toUpperCase() || '';
    const lastInitial = apellidos?.charAt(0)?.toUpperCase() || '';
    return firstInitial + lastInitial;
  };

  const handleColaboradorClick = (colaboradorId) => {
    navigate(`/colaboradores/${colaboradorId}/profile`);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  return (
    <MainLayout>
      <div className="flex min-h-screen bg-muted/20">
        <HRSidebar />
        <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-foreground">HR Home</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Encuentra aquí las tareas de RRHH principales
            </p>
          </div>
          
          {/* Filtros */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Todos los establecimientos</span>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </div>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>{new Date(new Date().getFullYear(), new Date().getMonth(), 1).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
              <span>-</span>
              <span>{new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
            </div>
          </div>

          {/* Plantilla RRHH — T2-3 Calculadora */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Plantilla bruta</p>
                  <p className="text-2xl font-semibold mt-1">{totalActivos}</p>
                </div>
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">Contratos activos</p>
            </Card>

            <Card className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Plantilla activa</p>
                  <p className="text-2xl font-semibold mt-1">{plantilla.activa.toFixed(1)}</p>
                </div>
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <User className="w-5 h-5 text-green-600" />
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">Bruta - cobertura vacaciones ({plantilla.coberturaVacaciones.toFixed(1)})</p>
            </Card>

            <Card className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Presencial/día</p>
                  <p className="text-2xl font-semibold mt-1">{plantilla.presencialRounded}</p>
                </div>
                <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
                  <Calculator className="w-5 h-5 text-violet-600" />
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">Techo personas/día (activa ÷ 1.4)</p>
            </Card>

            <Card className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Vacaciones/año</p>
                  <p className="text-2xl font-semibold mt-1">48</p>
                </div>
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-orange-600" />
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">30 naturales + 18 festivos (Hostelería)</p>
            </Card>
          </div>

          {/* Entradas y Salidas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Entradas */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <DoorOpen className="w-4 h-4 text-green-600" />
                  </div>
                  <h3 className="font-semibold">Entradas</h3>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-primary hover:text-primary/80"
                  onClick={() => navigate('/hr/onboarding')}
                >
                  Ver todo
                </Button>
              </div>

              <div className="space-y-3">
                {loading ? (
                  <div className="text-center text-muted-foreground">
                    Cargando colaboradores...
                  </div>
                ) : colaboradores.length > 0 ? (
                  colaboradores.map((colaborador) => (
                    <div 
                      key={colaborador.id}
                      className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-md cursor-pointer"
                      onClick={() => handleColaboradorClick(colaborador.id)}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-primary font-medium hover:underline cursor-pointer">
                          {colaborador.nombre} {colaborador.apellidos}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          colaborador.status === 'activo' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {colaborador.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(colaborador.fecha_inicio_contrato)}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-8">
                    <div className="text-6xl mb-2">🚀</div>
                    <div className="text-xs text-muted-foreground">
                      No hay colaboradores pendientes de entrada
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Salidas */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                    <DoorClosed className="w-4 h-4 text-red-600" />
                  </div>
                  <h3 className="font-semibold">Salidas</h3>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-primary hover:text-primary/80"
                  onClick={() => navigate('/hr/exits')}
                >
                  Ver todo
                </Button>
              </div>

              <div className="space-y-3">
                {loadingSalidas ? (
                  <div className="text-center text-muted-foreground">
                    Cargando colaboradores...
                  </div>
                ) : colaboradoresSalidas.length > 0 ? (
                  colaboradoresSalidas.map((colaborador) => (
                    <div 
                      key={colaborador.id}
                      className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-md cursor-pointer"
                      onClick={() => handleColaboradorClick(colaborador.id)}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-primary font-medium hover:underline cursor-pointer">
                          {colaborador.nombre} {colaborador.apellidos}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          colaborador.status === 'activo' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {colaborador.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(colaborador.fecha_fin_contrato)}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-8">
                    <div className="text-6xl mb-2">🚪</div>
                    <div className="text-xs text-muted-foreground" style={{ fontSize: '9px' }}>
                      No hay colaboradores pendiente de finalizar contrato
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
        </div>
      </div>
    </MainLayout>
  );
}