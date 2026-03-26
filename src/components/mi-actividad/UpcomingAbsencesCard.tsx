import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Palmtree, Calendar, FileText, Heart, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { UpcomingAbsence } from "@/hooks/useEmployeeUpcomingAbsences";

interface UpcomingAbsencesCardProps {
  absences: UpcomingAbsence[];
  loading: boolean;
}

const getAbsenceConfig = (type: string) => {
  const configs: Record<string, { icon: any; label: string; colorClass: string; bgClass: string }> = {
    vacation: {
      icon: Palmtree,
      label: 'Vacaciones',
      colorClass: 'text-notion-green-text',
      bgClass: 'bg-notion-green-bg'
    },
    libre: {
      icon: Calendar,
      label: 'Día libre',
      colorClass: 'text-notion-blue-text',
      bgClass: 'bg-notion-blue-bg'
    },
    permiso: {
      icon: FileText,
      label: 'Permiso',
      colorClass: 'text-notion-yellow-text',
      bgClass: 'bg-notion-yellow-bg'
    },
    sick: {
      icon: Heart,
      label: 'Baja médica',
      colorClass: 'text-notion-red-text',
      bgClass: 'bg-notion-red-bg'
    }
  };

  return configs[type.toLowerCase()] || configs.permiso;
};

const getStatusBadge = (status: string) => {
  const variants: Record<string, { label: string; variant: any }> = {
    approved: { label: 'Aprobada', variant: 'default' },
    pending: { label: 'Pendiente', variant: 'secondary' },
    rejected: { label: 'Rechazada', variant: 'destructive' }
  };

  return variants[status] || variants.pending;
};

export const UpcomingAbsencesCard = ({ absences, loading }: UpcomingAbsencesCardProps) => {
  const navigate = useNavigate();

  if (loading) {
    return (
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Próximas ausencias</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-muted/50 rounded-2xl" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
      <CardHeader>
        <div>
          <CardTitle className="text-xl font-semibold">Próximas ausencias</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Tus próximas vacaciones, permisos y días libres
          </p>
        </div>
      </CardHeader>
      <CardContent>
        {absences.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground mb-4">
              No tienes ausencias programadas próximamente
            </p>
            <Button
              variant="outline"
              className="rounded-full"
              onClick={() => navigate('/ausencias/request/new')}
            >
              Solicitar ausencia
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {absences.map(absence => {
              const config = getAbsenceConfig(absence.leaveType);
              const statusBadge = getStatusBadge(absence.status);
              const Icon = config.icon;
              const startDate = parseISO(absence.startDate);
              
              return (
                <div
                  key={absence.id}
                  className="flex items-center gap-4 p-4 rounded-2xl border border-border/50 transition-all"
                >
                  <div className={`w-12 h-12 rounded-2xl ${config.bgClass} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-6 h-6 ${config.colorClass}`} strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-foreground">{config.label}</p>
                      <Badge variant={statusBadge.variant} className="text-xs">
                        {statusBadge.label}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {format(startDate, "d 'de' MMMM", { locale: es })} · {absence.duration} {absence.duration === 1 ? 'día' : 'días'}
                    </p>
                    {absence.daysUntil === 0 && (
                      <p className="text-xs text-notion-blue-text font-medium mt-1">
                        ¡Comienza hoy!
                      </p>
                    )}
                    {absence.daysUntil === 1 && (
                      <p className="text-xs text-notion-orange-text font-medium mt-1">
                        Comienza mañana
                      </p>
                    )}
                    {absence.daysUntil > 1 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        En {absence.daysUntil} días
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
