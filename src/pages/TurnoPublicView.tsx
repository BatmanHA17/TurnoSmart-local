import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { TurnoViewer } from "@/components/TurnoViewer";
import { Loader2, Lock } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

interface TurnoPublico {
  id: string;
  name: string;
  date_range_start: string;
  date_range_end: string;
  status: string; // Cambiado a string para coincidir con Supabase
  employee_count: number;
  shift_data?: any;
  created_at: string;
  version: number;
  parent_turno_id?: string;
  is_current_version: boolean;
  published_at?: string;
  sent_emails?: string[];
}

const TurnoPublicView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [turno, setTurno] = useState<TurnoPublico | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(false);

  useEffect(() => {
    const fetchTurno = async () => {
      if (authLoading) return; // Wait for auth to load
      
      if (!user) {
        setAuthError(true);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('turnos_publicos')
          .select('*')
          .eq('id', id)
          .single();
        
        if (error) {
          if (error.code === 'PGRST116' || error.message.includes('insufficient_privilege')) {
            setAuthError(true);
            toast({ 
              title: 'Acceso restringido', 
              description: 'Este turno solo está disponible para personal autorizado', 
              variant: 'destructive' 
            });
          } else {
            throw error;
          }
          return;
        }
        
        setTurno(data as TurnoPublico);
        document.title = `${data.name} – Horario Público`;
      } catch (e) {
        console.error('Error fetching horario público:', e);
        toast({ 
          title: 'Error', 
          description: 'No se pudo cargar este horario público', 
          variant: 'destructive' 
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchTurno();
  }, [id, user, authLoading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" /> Cargando turno...
        </div>
      </div>
    );
  }

  if (authError || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md mx-auto p-6">
          <div className="flex justify-center">
            <Lock className="h-12 w-12 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-medium text-foreground">Acceso Restringido</h2>
          <p className="text-muted-foreground">
            Esta página requiere autenticación. Solo el personal autorizado puede ver los horarios de trabajo.
          </p>
          <div className="flex flex-col gap-2">
            <Button onClick={() => navigate('/auth')} className="w-full border border-gray-300">
              Iniciar Sesión
            </Button>
            <Button variant="outline" onClick={() => navigate('/')} className="w-full border-gray-300">
              Volver al Inicio
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!turno) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center text-muted-foreground">Turno no encontrado o no disponible</div>
      </div>
    );
  }

  // Modo visualización: no pasamos onEdit
  return (
    <div className="container mx-auto p-6">
      <TurnoViewer 
        turno={turno}
        onBack={() => navigate(-1)}
        onCreateRevision={undefined}
        onSendEmail={undefined}
        onDownload={undefined}
      />
    </div>
  );
};

export default TurnoPublicView;
