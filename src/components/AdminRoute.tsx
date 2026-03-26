import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserRoleCanonical } from "@/hooks/useUserRoleCanonical";
import { Loader2 } from "lucide-react";

export default function AdminRoute({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { isOwner, loading } = useUserRoleCanonical();

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  if (!isOwner) return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
}
