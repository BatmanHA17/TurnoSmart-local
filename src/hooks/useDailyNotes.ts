import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface DateRange {
  start: string;
  end: string;
}

interface UseDailyNotesResult {
  notes: Record<string, string>;
  updateNote: (date: string, note: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}

export const useDailyNotes = (
  orgId: string,
  dateRange: DateRange
): UseDailyNotesResult => {
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orgId || !dateRange.start || !dateRange.end) return;

    let mounted = true;

    const fetchNotes = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await supabase
          .from("calendar_daily_notes")
          .select("date, note")
          .eq("org_id", orgId)
          .gte("date", dateRange.start)
          .lte("date", dateRange.end);

        if (fetchError) throw fetchError;

        if (mounted && data) {
          const map: Record<string, string> = {};
          for (const row of data) {
            map[row.date as string] = row.note as string;
          }
          setNotes(map);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Error loading notes");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchNotes();

    return () => {
      mounted = false;
    };
  }, [orgId, dateRange.start, dateRange.end]);

  const updateNote = useCallback(
    async (date: string, note: string): Promise<void> => {
      if (!orgId) return;

      // Optimistic update
      setNotes((prev) => ({ ...prev, [date]: note }));

      const { error: upsertError } = await supabase
        .from("calendar_daily_notes")
        .upsert(
          { org_id: orgId, date, note, updated_at: new Date().toISOString() },
          { onConflict: "org_id,date" }
        );

      if (upsertError) {
        setError(upsertError.message);
        throw upsertError;
      }
    },
    [orgId]
  );

  return { notes, updateNote, loading, error };
};
