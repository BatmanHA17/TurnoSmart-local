/**
 * T3-7: Analítica de peticiones — satisfacción por tipo y empleado
 * Queries schedule_petitions table and shows approval rates.
 */
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Send, CheckCircle, XCircle, Clock, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";

interface PetitionStats {
  total: number;
  approved: number;
  rejected: number;
  pending: number;
  byType: Record<string, { total: number; approved: number }>;
}

const TYPE_LABELS: Record<string, string> = {
  A: "Dura",
  B: "Blanda",
  C: "Intercambio",
  D: "Recurrente",
};

export function PetitionAnalyticsCard() {
  const { org } = useCurrentOrganization();
  const [stats, setStats] = useState<PetitionStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!org?.id) return;
    const fetchStats = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("schedule_petitions" as any)
          .select("type, status")
          .eq("organization_id", org.id);

        if (error || !data) {
          setStats(null);
          return;
        }

        const rows = data as Array<{ type: string; status: string }>;
        const result: PetitionStats = {
          total: rows.length,
          approved: rows.filter(r => r.status === "approved").length,
          rejected: rows.filter(r => r.status === "rejected").length,
          pending: rows.filter(r => r.status === "pending").length,
          byType: {},
        };

        for (const row of rows) {
          if (!result.byType[row.type]) result.byType[row.type] = { total: 0, approved: 0 };
          result.byType[row.type].total++;
          if (row.status === "approved") result.byType[row.type].approved++;
        }

        setStats(result);
      } catch {
        setStats(null);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [org?.id]);

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="h-5 w-48 bg-muted animate-pulse rounded" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-8 bg-muted animate-pulse rounded" />)}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats || stats.total === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Send className="h-4 w-4 text-muted-foreground" />
            Peticiones de turno
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
            Sin peticiones registradas
          </div>
        </CardContent>
      </Card>
    );
  }

  const satisfactionRate = stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <Send className="h-4 w-4 text-muted-foreground" />
          Peticiones de turno
        </CardTitle>
        <CardDescription className="text-sm">{stats.total} peticiones totales</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Satisfaction rate */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1 text-muted-foreground">
              <TrendingUp className="h-3 w-3" /> Tasa de satisfacción
            </span>
            <span className="font-bold text-sm">{satisfactionRate}%</span>
          </div>
          <Progress value={satisfactionRate} className="h-2" />
        </div>

        {/* Status breakdown */}
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1 text-green-600">
            <CheckCircle className="h-3 w-3" /> {stats.approved}
          </span>
          <span className="flex items-center gap-1 text-amber-600">
            <Clock className="h-3 w-3" /> {stats.pending}
          </span>
          <span className="flex items-center gap-1 text-destructive">
            <XCircle className="h-3 w-3" /> {stats.rejected}
          </span>
        </div>

        {/* By type */}
        <div className="space-y-1.5 pt-1">
          {Object.entries(stats.byType).map(([type, s]) => {
            const rate = s.total > 0 ? Math.round((s.approved / s.total) * 100) : 0;
            return (
              <div key={type} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[9px] py-0 px-1.5">
                    {type}
                  </Badge>
                  <span className="text-muted-foreground">{TYPE_LABELS[type] || type}</span>
                </div>
                <span className="font-medium">{rate}% ({s.approved}/{s.total})</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
