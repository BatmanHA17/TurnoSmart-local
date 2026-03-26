import { useUserRoleCanonical } from "@/hooks/useUserRoleCanonical";
import { MiActividadEmployeeDashboard } from "@/components/MiActividadEmployeeDashboard";
import { AnalyticsDashboard } from "@/components/analytics/AnalyticsDashboard";

export function MiActividadDashboard() {
  const { role } = useUserRoleCanonical();

  // EMPLOYEE role gets simplified dashboard
  if (role === "EMPLOYEE") {
    return <MiActividadEmployeeDashboard />;
  }

  // Manager/Admin/Director gets analytics dashboard
  return (
    <div className="p-6">
      <AnalyticsDashboard />
    </div>
  );
}
