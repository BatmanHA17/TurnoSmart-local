import { supabase } from "@/integrations/supabase/client";

export interface Holiday {
  id: string;
  org_id: string | null;
  date: string;
  name: string;
  type: 'national' | 'regional' | 'local';
  country: string;
  region?: string;
}

export async function getHolidaysForPeriod(orgId: string, startDate: string, endDate: string): Promise<Holiday[]> {
  const { data, error } = await supabase
    .from('holidays')
    .select('*')
    .or(`org_id.eq.${orgId},org_id.is.null`)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date');

  if (error) {
    console.warn('Error loading holidays:', error);
    return [];
  }
  return data || [];
}
