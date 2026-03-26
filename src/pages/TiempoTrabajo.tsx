import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MainLayout } from '@/components/MainLayout';
import { supabase } from '@/integrations/supabase/client';

interface WorkTimeData {
  day: number;
  dayName: string;
  date: string;
  establishment: string;
  planned: string;
  actual: string;
  difference: string;
  workTime: string;
  meals: string;
  comments: string;
}

interface Colaborador {
  id: string;
  nombre: string;
  apellidos: string;
  fecha_inicio_contrato: string;
  tiempo_trabajo_semanal: number;
  // establecimiento_por_defecto: string; // ELIMINADO en Fase 5C
}

const getMonthName = (monthString: string): string => {
  const [year, month] = monthString.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, 1);
  return date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
};

export default function TiempoTrabajo() {
  const { empleadoId } = useParams();
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState("2025-09");
  const [colaborador, setColaborador] = useState<Colaborador | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchColaborador = async () => {
      if (!empleadoId) return;
      
      try {
        const { data, error } = await supabase
          .from('colaborador_full')
          .select('id, nombre, apellidos, fecha_inicio_contrato, tiempo_trabajo_semanal')
          // establecimiento_por_defecto eliminado en Fase 5C
          .eq('id', empleadoId)
          .single();

        if (error) throw error;
        setColaborador(data);
      } catch (error) {
        console.error('Error fetching colaborador:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchColaborador();
  }, [empleadoId]);

  // Generar datos vacíos para el mes actual
  const generateEmptyData = (year: number, month: number): WorkTimeData[] => {
    const daysInMonth = new Date(year, month, 0).getDate();
    const data: WorkTimeData[] = [];
    
    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      const dayOfWeek = date.getDay();
      
      data.push({
        day,
        dayName: dayNames[dayOfWeek],
        date: day.toString().padStart(2, '0'),
        establishment: '-',
        planned: '-',
        actual: '-',
        difference: '-',
        workTime: '-',
        meals: '-',
        comments: ''
      });
    }
    
    return data;
  };

  const getCurrentData = (): WorkTimeData[] => {
    const [year, monthStr] = currentMonth.split('-');
    return generateEmptyData(parseInt(year), parseInt(monthStr));
  };

  const currentData = getCurrentData();

  const goToPreviousMonth = () => {
    const [year, month] = currentMonth.split('-').map(Number);
    const prevDate = new Date(year, month - 2, 1); // month - 2 porque los meses en Date son 0-indexed
    const newMonth = `${prevDate.getFullYear()}-${(prevDate.getMonth() + 1).toString().padStart(2, '0')}`;
    setCurrentMonth(newMonth);
  };

  const goToNextMonth = () => {
    const [year, month] = currentMonth.split('-').map(Number);
    const nextDate = new Date(year, month, 1); // month porque ya suma 1
    const newMonth = `${nextDate.getFullYear()}-${(nextDate.getMonth() + 1).toString().padStart(2, '0')}`;
    setCurrentMonth(newMonth);
  };

  const handleBack = () => {
    navigate(`/colaboradores/${empleadoId}`);
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-background p-6 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando datos del empleado...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!colaborador) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-background p-6 flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground">No se encontró el empleado</p>
            <Button onClick={handleBack} className="mt-4">
              Volver
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-background p-6">
        {/* Header */}
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={handleBack}
            className="mb-4 p-0 h-auto text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Atrás
          </Button>
          
          <h1 className="text-2xl font-bold text-foreground mb-6">
            Tiempo de trabajo de {colaborador.nombre} {colaborador.apellidos}
          </h1>

          {/* Navigation Controls */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={goToPreviousMonth}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            <span className="text-lg font-medium px-4 py-2 border border-border rounded-lg bg-background">
              {getMonthName(currentMonth)}
            </span>
            
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={goToNextMonth}
              className="flex items-center gap-2"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-background">
          {/* Table Headers */}
          <div className="grid grid-cols-8 gap-4 p-4 bg-muted/30 text-sm font-medium text-foreground border-b border-border">
            <span>Fecha</span>
            <span>Establecimiento</span>
            <span>Planificado</span>
            <span>Real</span>
            <span>Diferencia</span>
            <span>Tiempo de trabajo</span>
            <span>Comidas</span>
            <span>Comentario</span>
          </div>

          {/* Table Data */}
          <div className="divide-y divide-border">
            {currentData.map((day) => (
              <div key={day.day} className="grid grid-cols-8 gap-4 p-4 hover:bg-muted/10 transition-colors text-sm">
                <span className="font-medium">
                  {day.dayName} {day.date}
                </span>
                <span className="text-muted-foreground">{day.establishment}</span>
                <span>{day.planned}</span>
                <span className="text-muted-foreground">{day.actual}</span>
                <span className="text-muted-foreground">{day.difference}</span>
                <span className="text-muted-foreground">{day.workTime}</span>
                <span className="text-muted-foreground">{day.meals}</span>
                <span className="text-muted-foreground">{day.comments}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Summary */}
        <Card className="mt-8 p-6 bg-muted/10 border border-border">
          <h3 className="text-lg font-semibold mb-4 text-foreground">Resumen</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total de las horas planificadas:</span>
              <span className="font-medium">-</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total de las horas trabajadas:</span>
              <span className="font-medium">-</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total de las comidas:</span>
              <span className="font-medium">-</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Número de días trabajados:</span>
              <span className="font-medium">-</span>
            </div>
          </div>
        </Card>
      </div>
    </MainLayout>
  );
}

// Helper functions
function parseTimeToMinutes(timeStr: string): number {
  if (timeStr === "-" || !timeStr) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

function formatMinutesToHours(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h${mins.toString().padStart(2, '0')}`;
}