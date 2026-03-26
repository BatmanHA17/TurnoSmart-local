import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();

  console.log('=== PROTECTED ROUTE CHECK ===');
  console.log('User exists:', user ? 'YES' : 'NO');
  console.log('Loading:', loading);
  console.log('Current pathname:', window.location.pathname);

  if (loading) {
    console.log('Still loading, showing spinner...');
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    console.log('No user found, redirecting to /auth');
    return <Navigate to="/auth" replace />;
  }

  console.log('User authenticated, rendering children');
  return <>{children}</>;
};

export default ProtectedRoute;