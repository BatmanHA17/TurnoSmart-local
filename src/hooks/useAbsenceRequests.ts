import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface AbsenceRequest {
  id: string;
  colaborador_id: string;
  employee_name: string;
  start_date: string;
  end_date: string;
  leave_type: string;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected';
  manager_comment?: string;
  submitted_date: string;
  processed_date?: string;
  processed_by?: string;
  colaborador?: {
    // establecimiento_por_defecto?: string; // ELIMINADO en Fase 5C
  };
}

export const useAbsenceRequests = () => {
  const [absenceRequests, setAbsenceRequests] = useState<AbsenceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchAbsenceRequests = async () => {
    try {
      setLoading(true);
      setError(null);

      // First try to get data from localStorage (legacy system)
      const legacyRequests = JSON.parse(localStorage.getItem('leaveRequests') || '[]');
      const newFormatRequests = JSON.parse(localStorage.getItem('absenceRequests') || '[]');
      

      // Convert localStorage data to our format
      const convertedRequests: AbsenceRequest[] = [];
      
      // Convert legacy format
      legacyRequests.forEach((request: any) => {
        convertedRequests.push({
          id: request.id,
          colaborador_id: request.id, // Using ID as colaborador_id for now
          employee_name: request.employee,
          start_date: request.requestDetails?.startDate || request.dateRange.split(' - ')[0] || request.presentedDate,
          end_date: request.requestDetails?.endDate || request.dateRange.split(' - ')[1] || request.requestDetails?.startDate || request.presentedDate,
          leave_type: request.leaveType,
          reason: request.requestDetails?.reason || '',
          status: request.status,
          manager_comment: request.managerComment || '',
          submitted_date: request.submittedDate || request.presentedDate,
          processed_date: request.processedDate,
          processed_by: request.processedBy,
          colaborador: {
            // establecimiento_por_defecto: 'Planning' // ELIMINADO en Fase 5C
          }
        });
      });

      // Also add new format requests
      newFormatRequests.forEach((request: any) => {
        convertedRequests.push({
          id: request.id,
          colaborador_id: request.colaborador_id || request.id,
          employee_name: request.employee_name || request.colaboradorName,
          start_date: request.start_date,
          end_date: request.end_date,
          leave_type: request.leave_type || request.leaveType,
          reason: request.reason || '',
          status: request.status,
          manager_comment: request.manager_comment || '',
          submitted_date: request.submitted_date || request.presentedDate,
          processed_date: request.processed_date,
          processed_by: request.processed_by,
          colaborador: {
            // establecimiento_por_defecto: request.establishment || 'Planning' // ELIMINADO
          }
        });
      });

      // If localStorage has data, use it
      if (convertedRequests.length > 0) {
        setAbsenceRequests(convertedRequests);
        setLoading(false);
        return;
      }

      // Fallback to database if no localStorage data
      const { data, error } = await supabase
        .from('absence_requests')
        .select(`
          *,
          colaborador:colaboradores(nombre, apellidos)
        `)
        .order('submitted_date', { ascending: false });

      if (error) {
        console.error('Error fetching absence requests from database:', error);
        setError(error.message);
        toast({
          title: "Error",
          description: "No se pudieron cargar las solicitudes de ausencia",
          variant: "destructive"
        });
        return;
      }

      setAbsenceRequests((data || []) as any);
    } catch (err) {
      console.error('Error in fetchAbsenceRequests:', err);
      setError('Error inesperado al cargar los datos');
      toast({
        title: "Error",
        description: "Error inesperado al cargar las solicitudes de ausencia",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAbsenceRequests();
  }, []);

  const refreshData = () => {
    fetchAbsenceRequests();
  };

  return {
    absenceRequests,
    loading,
    error,
    refreshData
  };
};