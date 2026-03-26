import { useOrganizationsUnified } from "./useOrganizationsUnified";
import type { Organization } from "@/types/organization";

// Legacy hook that now uses the unified system
export const useOrganizations = () => {
  const unified = useOrganizationsUnified();
  
  return {
    organizations: unified.organizations,
    currentOrganizationName: unified.currentOrganizationName,
    isLoading: unified.loading,
    error: unified.error,
  };
};

// Re-export the interface for backward compatibility
export type { Organization };