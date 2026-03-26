import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { addDays, format, parseISO, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";

export interface UpcomingAbsence {
  id: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  status: 'pending' | 'approved' | 'rejected';
  duration: number;
  daysUntil: number;
}

export const useEmployeeUpcomingAbsences = (daysAhead: number = 60) => {
  const { user } = useAuth();
  const [absences, setAbsences] = useState<UpcomingAbsence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const fetchAbsences = async () => {
      if (!user) {
        if (mounted) setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Get colaborador from user
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', user.id)
          .single();

        if (profileError || !profile?.email) {
          throw new Error('Perfil no encontrado');
        }

        const { data: colaborador, error: colaboradorError } = await supabase
          .from('colaboradores')
          .select('id')
          .eq('email', profile.email)
          .single();

        if (colaboradorError || !colaborador) {
          throw new Error('Colaborador no encontrado');
        }

        const today = new Date();
        const futureDate = addDays(today, daysAhead);

        // Fetch upcoming absence requests
        const { data: requests, error: requestsError } = await supabase
          .from('absence_requests')
          .select('id, leave_type, start_date, end_date, status')
          .eq('colaborador_id', colaborador.id)
          .gte('start_date', format(today, 'yyyy-MM-dd'))
          .lte('start_date', format(futureDate, 'yyyy-MM-dd'))
          .in('status', ['pending', 'approved'])
          .order('start_date', { ascending: true });

        if (requestsError) throw requestsError;

        const processedAbsences: UpcomingAbsence[] = (requests || []).map(req => {
          const start = parseISO(req.start_date);
          const end = parseISO(req.end_date);
          const duration = differenceInDays(end, start) + 1;
          const daysUntil = differenceInDays(start, today);

          return {
            id: req.id,
            leaveType: req.leave_type,
            startDate: req.start_date,
            endDate: req.end_date,
            status: req.status as 'pending' | 'approved' | 'rejected',
            duration,
            daysUntil
          };
        });

        if (mounted) setAbsences(processedAbsences);
      } catch (err: any) {
        if (import.meta.env.DEV) console.error('[useEmployeeUpcomingAbsences]', err);
        if (mounted) setError(err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchAbsences();
    return () => { mounted = false; };
  }, [user?.id, daysAhead]);

  return { absences, loading, error };
};
