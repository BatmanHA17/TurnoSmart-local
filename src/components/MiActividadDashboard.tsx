import { useUserRoleCanonical } from "@/hooks/useUserRoleCanonical";
import { MiActividadEmployeeDashboard } from "@/components/MiActividadEmployeeDashboard";
import { AnalyticsDashboard } from "@/components/analytics/AnalyticsDashboard";
import { EquityAnalyticsDashboard } from "@/components/analytics/EquityAnalyticsDashboard";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export function MiActividadDashboard() {
  const { role } = useUserRoleCanonical();

  // EMPLOYEE role gets simplified dashboard
  if (role === "EMPLOYEE") {
    return <MiActividadEmployeeDashboard />;
  }

  // Manager/Admin/Director gets analytics dashboard with tabs
  return (
    <div className="p-6">
      <Tabs defaultValue="equity" className="space-y-4">
        <TabsList>
          <TabsTrigger value="equity" className="text-xs">
            Equidad HR
          </TabsTrigger>
          <TabsTrigger value="general" className="text-xs">
            Analitica General
          </TabsTrigger>
        </TabsList>
        <TabsContent value="equity">
          <EquityAnalyticsDashboard />
        </TabsContent>
        <TabsContent value="general">
          <AnalyticsDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}
