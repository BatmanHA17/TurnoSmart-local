import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

export interface Nomina {
  id: string;
  org_id: string;
  colaborador_id: string;
  periodo: string;
  year: number;
  month: number;
  salario_bruto: number | null;
  salario_neto: number | null;
  deducciones: number | null;
  conceptos: NominaConcepto[];
  document_url: string | null;
  status: 'draft' | 'sent' | 'acknowledged';
  sent_at: string | null;
  acknowledged_at: string | null;
  created_by: string | null;
  created_at: string;
  // Joined
  colaborador_nombre?: string;
  colaborador_apellidos?: string;
}

export interface NominaConcepto {
  name: string;
  amount: number;
  type: 'ingreso' | 'deduccion';
}

export interface NewNomina {
  org_id: string;
  colaborador_id: string;
  year: number;
  month: number;
  salario_bruto?: number;
  salario_neto?: number;
  deducciones?: number;
  conceptos?: NominaConcepto[];
  document_url?: string;
}

interface UseNominasFilters {
  colaboradorId?: string;
  year?: number;
  month?: number;
}

export function useNominas(orgId: string | null, filters?: UseNominasFilters) {
  const { user } = useAuth();
  const [nominas, setNominas] = useState<Nomina[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNominas = useCallback(async () => {
    if (!orgId) {
      setNominas([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      let query = supabase
        .from('nominas')
        .select(`
          *,
          colaboradores(nombre, apellidos)
        `)
        .eq('org_id', orgId)
        .order('year', { ascending: false })
        .order('month', { ascending: false });

      if (filters?.colaboradorId) {
        query = query.eq('colaborador_id', filters.colaboradorId);
      }
      if (filters?.year) {
        query = query.eq('year', filters.year);
      }
      if (filters?.month) {
        query = query.eq('month', filters.month);
      }

      const { data, error } = await query;

      if (error) throw error;

      const mapped: Nomina[] = (data || []).map((row: any) => ({
        id: row.id,
        org_id: row.org_id,
        colaborador_id: row.colaborador_id,
        periodo: row.periodo,
        year: row.year,
        month: row.month,
        salario_bruto: row.salario_bruto,
        salario_neto: row.salario_neto,
        deducciones: row.deducciones,
        conceptos: Array.isArray(row.conceptos) ? row.conceptos : [],
        document_url: row.document_url,
        status: row.status,
        sent_at: row.sent_at,
        acknowledged_at: row.acknowledged_at,
        created_by: row.created_by,
        created_at: row.created_at,
        colaborador_nombre: row.colaboradores?.nombre,
        colaborador_apellidos: row.colaboradores?.apellidos,
      }));

      setNominas(mapped);
    } catch (err) {
      if (import.meta.env.DEV) console.error('[useNominas] fetchNominas:', err);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las nóminas',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [orgId, filters?.colaboradorId, filters?.year, filters?.month]);

  useEffect(() => {
    fetchNominas();
  }, [fetchNominas]);

  const createNomina = async (data: NewNomina): Promise<void> => {
    const periodo = `${data.year}-${String(data.month).padStart(2, '0')}`;
    const { error } = await supabase.from('nominas').insert({
      org_id: data.org_id,
      colaborador_id: data.colaborador_id,
      periodo,
      year: data.year,
      month: data.month,
      salario_bruto: data.salario_bruto ?? null,
      salario_neto: data.salario_neto ?? null,
      deducciones: data.deducciones ?? null,
      conceptos: data.conceptos ?? [],
      document_url: data.document_url ?? null,
      status: 'draft',
      created_by: user?.id ?? null,
    });

    if (error) {
      toast({
        title: 'Error',
        description: 'No se pudo crear la nómina',
        variant: 'destructive',
      });
      throw error;
    }

    toast({ title: 'Nómina creada', description: `Nómina ${periodo} creada como borrador` });
    await fetchNominas();
  };

  const sendNomina = async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('nominas')
      .update({ status: 'sent', sent_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      toast({
        title: 'Error',
        description: 'No se pudo enviar la nómina',
        variant: 'destructive',
      });
      throw error;
    }

    toast({ title: 'Nómina enviada', description: 'La nómina ha sido enviada al empleado' });
    await fetchNominas();
  };

  const acknowledgeNomina = async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('nominas')
      .update({ status: 'acknowledged', acknowledged_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      toast({
        title: 'Error',
        description: 'No se pudo confirmar el acuse de recibo',
        variant: 'destructive',
      });
      throw error;
    }

    toast({ title: 'Acuse confirmado', description: 'Has confirmado la recepción de la nómina' });
    await fetchNominas();
  };

  const deleteNomina = async (id: string): Promise<void> => {
    const { error } = await supabase.from('nominas').delete().eq('id', id);

    if (error) {
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la nómina',
        variant: 'destructive',
      });
      throw error;
    }

    toast({ title: 'Nómina eliminada' });
    await fetchNominas();
  };

  return {
    nominas,
    loading,
    createNomina,
    sendNomina,
    acknowledgeNomina,
    deleteNomina,
    refresh: fetchNominas,
  };
}
