import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Stethoscope, GraduationCap, Bell } from "lucide-react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Reminder } from "@/hooks/useEmployeeReminders";

interface RemindersCardProps {
  reminders: Reminder[];
  loading: boolean;
}

const getIconComponent = (iconName: string) => {
  const icons: Record<string, any> = {
    Stethoscope,
    GraduationCap,
    Bell
  };
  return icons[iconName] || Bell;
};

const getTypeConfig = (type: string) => {
  const configs: Record<string, { bgClass: string; colorClass: string }> = {
    medical: {
      bgClass: 'bg-notion-purple-bg',
      colorClass: 'text-notion-purple-text'
    },
    course: {
      bgClass: 'bg-notion-yellow-bg',
      colorClass: 'text-notion-yellow-text'
    },
    other: {
      bgClass: 'bg-notion-blue-bg',
      colorClass: 'text-notion-blue-text'
    }
  };

  return configs[type] || configs.other;
};

export const RemindersCard = ({ reminders, loading }: RemindersCardProps) => {
  if (loading) {
    return (
      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Información relevante</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 animate-pulse">
            {[1, 2].map(i => (
              <div key={i} className="h-20 bg-muted/50 rounded-2xl" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (reminders.length === 0) {
    return null;
  }

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Información relevante</CardTitle>
        <p className="text-sm text-muted-foreground">
          Recordatorios y fechas importantes
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {reminders.map(reminder => {
            const config = getTypeConfig(reminder.type);
            const Icon = getIconComponent(reminder.icon);
            const date = parseISO(reminder.date);
            
            return (
              <div
                key={reminder.id}
                className="p-4 rounded-2xl border border-border/50 bg-gradient-to-br from-card to-muted/20"
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-2xl ${config.bgClass} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-6 h-6 ${config.colorClass}`} strokeWidth={1.5} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground mb-1">
                      {reminder.title}
                    </h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      {reminder.description}
                    </p>
                    {reminder.daysUntil <= 30 && (
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-notion-orange-bg">
                        <Bell className="w-3 h-3 text-notion-orange-text" />
                        <span className="text-xs font-medium text-notion-orange-text">
                          {reminder.daysUntil === 0 && '¡Hoy!'}
                          {reminder.daysUntil === 1 && 'Mañana'}
                          {reminder.daysUntil > 1 && `En ${reminder.daysUntil} días`}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
