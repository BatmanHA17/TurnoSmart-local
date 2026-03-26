import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserProfile } from "@/hooks/useUserProfile";
import { compensatoryTimeEvents } from "@/utils/compensatoryTimeEvents";

interface CompensatoryTimeOffBalance {
  id: string;
  colaborador_id: string;
  balance_hours: number;
}

interface CompensatoryTimeHistory {
  id: string;
  colaborador_id: string;
  action_description: string;
  hours_change: number;
  performed_by: string;
  created_at: string;
}

export const useCompensatoryTimeOff = (colaboradorId: string) => {
  const [balance, setBalance] = useState<number>(0);
  const [history, setHistory] = useState<CompensatoryTimeHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { displayName } = useUserProfile();

  const fetchBalance = async () => {
    try {
      const { data: balanceData, error: balanceError } = await supabase
        .from('compensatory_time_off')
        .select('*')
        .eq('colaborador_id', colaboradorId)
        .maybeSingle();

      if (balanceError) {
        if (import.meta.env.DEV) console.error('[useCompensatoryTimeOff] fetchBalance:', balanceError);
        return;
      }

      setBalance(balanceData?.balance_hours || 0);
    } catch (error) {
      if (import.meta.env.DEV) console.error('[useCompensatoryTimeOff] fetchBalance unexpected:', error);
    }
  };

  const fetchHistory = async () => {
    try {
      const { data: historyData, error: historyError } = await supabase
        .from('compensatory_time_history')
        .select('*')
        .eq('colaborador_id', colaboradorId)
        .order('created_at', { ascending: false });

      if (historyError) {
        if (import.meta.env.DEV) console.error('[useCompensatoryTimeOff] fetchHistory:', historyError);
        return;
      }

      setHistory(historyData || []);
    } catch (error) {
      if (import.meta.env.DEV) console.error('[useCompensatoryTimeOff] fetchHistory unexpected:', error);
    }
  };

  const updateBalance = async (hoursChange: number, description: string) => {
    try {
      const newBalance = balance + hoursChange;

      // Update or create balance record
      const { data: existingBalance } = await supabase
        .from('compensatory_time_off')
        .select('id')
        .eq('colaborador_id', colaboradorId)
        .maybeSingle();

      if (existingBalance) {
        const { error: updateError } = await supabase
          .from('compensatory_time_off')
          .update({ balance_hours: newBalance })
          .eq('colaborador_id', colaboradorId);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('compensatory_time_off')
          .insert({
            colaborador_id: colaboradorId,
            balance_hours: newBalance
          });

        if (insertError) throw insertError;
      }

      // Add history record
      const { error: historyError } = await supabase
        .from('compensatory_time_history')
        .insert({
          colaborador_id: colaboradorId,
          action_description: description,
          hours_change: hoursChange,
          performed_by: displayName || 'Usuario desconocido'
        });

      if (historyError) throw historyError;

      // Update local state
      setBalance(newBalance);
      
      // Refresh history
      await fetchHistory();

      // Emitir evento para sincronizar otros componentes
      compensatoryTimeEvents.emit(colaboradorId, newBalance);

      return true;
    } catch (error) {
      if (import.meta.env.DEV) console.error('[useCompensatoryTimeOff] updateBalance:', error);
      return false;
    }
  };

  useEffect(() => {
    let mounted = true;
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchBalance(), fetchHistory()]);
      if (mounted) setLoading(false);
    };

    if (colaboradorId) {
      loadData();
    }
    return () => { mounted = false; };
  }, [colaboradorId]);

  // Escuchar eventos de cambios de balance desde otros componentes
  useEffect(() => {
    const unsubscribe = compensatoryTimeEvents.subscribe((eventColaboradorId, newBalance) => {
      if (eventColaboradorId === colaboradorId) {
        setBalance(newBalance);
      }
    });

    return unsubscribe;
  }, [colaboradorId]);

  return {
    balance,
    history,
    loading,
    updateBalance,
    refreshData: async () => {
      await Promise.all([fetchBalance(), fetchHistory()]);
    }
  };
};