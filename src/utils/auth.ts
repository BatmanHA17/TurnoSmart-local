import type { CanonicalRole } from "@/hooks/useUserRoleCanonical";

/**
 * Helper para detectar si el usuario tiene rol EMPLOYEE
 * Usado exclusivamente para lógica específica de empleados
 */
export const isEmployee = (role: CanonicalRole | null): boolean => {
  return role === "EMPLOYEE";
};
