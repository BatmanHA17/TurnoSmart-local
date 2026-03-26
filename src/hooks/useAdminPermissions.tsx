import { useUserRoleCanonical } from "@/hooks/useUserRoleCanonical";
import { useAuth } from "@/hooks/useAuth";

export const useAdminPermissions = () => {
  const { user } = useAuth();
  const { role, isAdmin, isOwner, loading } = useUserRoleCanonical();

  const canEdit = isAdmin || isOwner;
  const canView = user !== null; // Cualquier usuario autenticado puede ver
  const canDelete = isOwner; // Solo owners pueden eliminar
  const canManageUsers = isAdmin || isOwner;
  const canAccessSettings = isAdmin || isOwner;

  return {
    user,
    role,
    isAdmin,
    isOwner,
    loading,
    permissions: {
      canEdit,
      canView,
      canDelete,
      canManageUsers,
      canAccessSettings
    }
  };
};