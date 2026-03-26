import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { addMonths, format, parseISO, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";

export interface Reminder {
  id: string;
  type: 'medical' | 'course' | 'other';
  title: string;
  description: string;
  date: string;
  daysUntil: number;
  icon: string;
}

export const useEmployeeReminders = () => {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const fetchReminders = async () => {
      if (!user) {
        if (mounted) setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Get colaborador from user
        const { data: profile } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', user.id)
          .single();

        if (!profile?.email) {
          throw new Error('Perfil no encontrado');
        }

        const { data: colaborador } = await supabase
          .from('colaboradores')
          .select('id')
          .eq('email', profile.email)
          .single();

        if (!colaborador) {
          throw new Error('Colaborador no encontrado');
        }

        // Fetch health data for medical review reminder
        const { data: healthData } = await supabase
          .from('employee_health')
          .select('ultima_revision_medica')
          .eq('colaborador_id', colaborador.id)
          .maybeSingle();

        const remindersList: Reminder[] = [];
        const today = new Date();

        // Medical review reminder (12 months after last review)
        if (healthData?.ultima_revision_medica) {
          const lastReview = parseISO(healthData.ultima_revision_medica);
          const nextReview = addMonths(lastReview, 12);
          const daysUntil = differenceInDays(nextReview, today);

          if (daysUntil >= 0 && daysUntil <= 90) {
            remindersList.push({
              id: 'medical-review',
              type: 'medical',
              title: 'Revisión médica anual',
              description: `Próxima revisión: ${format(nextReview, "d 'de' MMMM", { locale: es })}`,
              date: format(nextReview, 'yyyy-MM-dd'),
              daysUntil,
              icon: 'Stethoscope'
            });
          }
        }

        // TODO: Future implementation for courses from database
        // For now, we can add placeholder logic if needed

        if (mounted) setReminders(remindersList);
      } catch (err: any) {
        if (import.meta.env.DEV) console.error('[useEmployeeReminders]', err);
        if (mounted) setError(err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchReminders();
    return () => { mounted = false; };
  }, [user?.id]);

  return { reminders, loading, error };
};
