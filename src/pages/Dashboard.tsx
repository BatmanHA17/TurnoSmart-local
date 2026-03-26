import { MainLayout } from "@/components/MainLayout";
import { WelcomeDashboard } from "@/components/WelcomeDashboard";
import { useEffect } from "react";

export default function Dashboard() {
  useEffect(() => {
    document.title = "Dashboard – TurnoSmart";
  }, []);

  return (
    <MainLayout>
      <WelcomeDashboard />
    </MainLayout>
  );
}