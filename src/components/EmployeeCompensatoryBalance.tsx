import { useCompensatoryTimeOff } from "@/hooks/useCompensatoryTimeOff";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";

interface EmployeeCompensatoryBalanceProps {
  colaboradorId: string;
  className?: string;
}

/** T2-6: Load DG/DB balance from employee_equity table */
function useDgDbBalance(colaboradorId: string, orgId?: string) {
  const [dg, setDg] = useState(0);
  const [db, setDb] = useState(0);
  useEffect(() => {
    if (!colaboradorId || !orgId) return;
    supabase
      .from('employee_equity')
      .select('dg_balance, db_balance')
      .eq('employee_id', colaboradorId)
      .eq('organization_id', orgId)
      .order('period_end', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setDg(data.dg_balance ?? 0);
          setDb(data.db_balance ?? 0);
        }
      })
      .catch(() => { /* graceful — columns may not exist */ });
  }, [colaboradorId, orgId]);
  return { dg, db };
}

export function EmployeeCompensatoryBalance({ colaboradorId, className }: EmployeeCompensatoryBalanceProps) {
  const { balance, loading } = useCompensatoryTimeOff(colaboradorId);
  const { org } = useCurrentOrganization();
  const { dg, db } = useDgDbBalance(colaboradorId, org?.id);

  if (colaboradorId.startsWith('mock-')) {
    const testBalance = colaboradorId === 'mock-1' ? 12 : colaboradorId === 'mock-2' ? 8 : colaboradorId === 'mock-3' ? 5 : 0;
    return (
      <div className={`text-xs text-muted-foreground ${className}`}>
        Compensar {testBalance}h
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`text-xs text-muted-foreground ${className}`}>
        ...
      </div>
    );
  }

  const parts: string[] = [];
  if (balance > 0) parts.push(`${balance}h extra`);
  if (dg > 0) parts.push(`${dg} DG`);
  if (db > 0) parts.push(`${db} DB`);

  if (parts.length === 0) return null;

  return (
    <div className={`text-xs text-muted-foreground ${className}`} style={{ fontSize: '8px' }}>
      {parts.join(' · ')}
    </div>
  );
}