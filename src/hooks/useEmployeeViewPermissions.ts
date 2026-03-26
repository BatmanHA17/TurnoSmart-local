import { useUserRoleCanonical } from "@/hooks/useUserRoleCanonical";

/**
 * Hook para gestionar permisos específicos de vista según el rol del usuario
 * 🔒 FASE 1: Lockdown total para EMPLOYEE
 * 
 * @returns Objeto con permisos booleanos según el rol
 */
export const useEmployeeViewPermissions = () => {
  const { role } = useUserRoleCanonical();
  const isEmployee = role === "EMPLOYEE";
  
  return {
    // 🔴 PERMISOS DE EDICIÓN DE TURNOS - Bloqueados para EMPLOYEE
    canEditShifts: !isEmployee,        // EMPLOYEE = false
    canDeleteShifts: !isEmployee,      // EMPLOYEE = false
    canCreateShifts: !isEmployee,      // EMPLOYEE = false
    canDragShifts: !isEmployee,        // EMPLOYEE = false
    
    // 👁️ PERMISOS DE VISUALIZACIÓN
    canViewOtherShifts: true,   // EMPLOYEE SÍ ve todos los turnos cuando está publicado
    canViewActivityGeneral: true,      // Todos pueden ver Mi Actividad
    canViewCalendarDay: true,          // Todos pueden acceder (pero con restricciones)
    canViewCalendarWeek: true,         // Todos pueden acceder (pero con restricciones)
    
    // 📝 PERMISOS DE PERFIL
    canEditProfile: false,             // Bloqueado para todos inicialmente
    canEditAvatar: isEmployee,         // EMPLOYEE SÍ puede cambiar avatar (futuro)
    
    // 📅 PERMISOS DE AUSENCIAS
    canRequestAbsences: true,          // Todos pueden solicitar ausencias
    canViewAbsences: true,             // Todos pueden ver sus ausencias
    canApproveAbsences: !isEmployee,   // Solo managers+ pueden aprobar
    
    // 🏢 PERMISOS DE GESTIÓN
    canManageTeam: !isEmployee,        // Solo managers+ pueden gestionar equipo
    canViewReports: !isEmployee,       // Solo managers+ pueden ver reportes
    canManageOrganization: !isEmployee, // Solo managers+ pueden gestionar org
    
    // 🔧 METADATA
    role,
    isEmployee,
    isManager: role === "MANAGER" || role === "DIRECTOR" || role === "ADMIN" || role === "OWNER",
    isAdmin: role === "ADMIN" || role === "OWNER",
    isOwner: role === "OWNER"
  };
};
