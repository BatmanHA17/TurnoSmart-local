import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentOrganization } from "./useCurrentOrganization";
import type { Organization, UserOrganization } from "@/types/organization";

// Hook unificado que combina la funcionalidad de useOrganizations y useCurrentOrganization
export const useOrganizationsUnified = () => {
  const { 
    organizations: userOrganizations, 
    currentOrg, 
    loading: currentOrgLoading, 
    switchOrganization,
    refresh: refreshCurrentOrg 
  } = useCurrentOrganization();

  // Query para obtener todas las organizaciones (datos completos)
  const { 
    data: allOrganizations = [], 
    isLoading: allOrgsLoading, 
    error,
    refetch: refetchAllOrgs 
  } = useQuery({
    queryKey: ['organizations-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching organizations:', error);
        throw error;
      }

      return data as Organization[];
    },
  });

  // Función para refrescar todos los datos
  const refresh = async () => {
    await Promise.all([
      refreshCurrentOrg(),
      refetchAllOrgs()
    ]);
  };

  // Obtener el nombre de la organización actual
  const currentOrganizationName = currentOrg?.org_name || allOrganizations[0]?.name || 'GOTHAM';
  
  // Obtener la organización actual completa
  const currentOrganization = allOrganizations.find(org => org.id === currentOrg?.org_id);

  // Función para obtener organizaciones del usuario con datos completos
  const getUserOrganizationsWithDetails = () => {
    return userOrganizations.map(userOrg => {
      const fullOrg = allOrganizations.find(org => org.id === userOrg.org_id);
      return {
        ...userOrg,
        organization: fullOrg
      };
    });
  };

  return {
    // Datos principales
    organizations: allOrganizations,
    userOrganizations,
    currentOrg,
    currentOrganization,
    currentOrganizationName,
    
    // Estado de carga
    loading: currentOrgLoading || allOrgsLoading,
    error,
    
    // Acciones
    switchOrganization,
    refresh,
    
    // Utilidades
    getUserOrganizationsWithDetails,
    
    // Legacy compatibility
    establishments: allOrganizations, // Alias para compatibilidad
  };
};

// Hook legacy para mantener compatibilidad
export const useOrganizations = () => {
  const unified = useOrganizationsUnified();
  
  return {
    organizations: unified.organizations,
    currentOrganizationName: unified.currentOrganizationName,
    isLoading: unified.loading,
    error: unified.error,
  };
};

// Hook legacy para establecimientos
export const useEstablishments = () => {
  const unified = useOrganizationsUnified();
  
  return {
    establishments: unified.organizations,
    currentEstablishmentName: unified.currentOrganizationName,
    isLoading: unified.loading,
    error: unified.error,
  };
};