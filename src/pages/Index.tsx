import { MainLayout } from "@/components/MainLayout";
import { DashboardView } from "@/components/DashboardView";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Cargando...</div>;
  }

  if (!user) {
    return null; // ProtectedRoute ya maneja la redirección
  }

  return (
    <MainLayout>
      <DashboardView />
    </MainLayout>
  );
};

export default Index;