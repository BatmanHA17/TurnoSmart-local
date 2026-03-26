// State + business logic extracted from ColaboradorDetail.tsx (D3 refactor)

import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useOrganizationsUnified } from "@/hooks/useOrganizationsUnified";
import { useColaboradorById } from "@/hooks/useColaboradorFull";
import { useTeamAssignments } from "@/hooks/useTeamAssignments";
import { useJobDepartments } from "@/hooks/useJobDepartments";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { useCompensatoryTimeOff } from "@/hooks/useCompensatoryTimeOff";

// ─── Static permission defaults (never mutated after init) ───────────────────

export const DIRECTOR_PERMISSIONS_DEFAULT = {
  acceso_planificacion_publicada_equipos: true,
  acceso_planificacion_no_publicada: true,
  acceso_planificacion_otros_equipos: false,
  visualizacion_alertas: true,
  creacion_modificacion_planificacion: true,
  editar_planificaciones_publicadas: true,
  visualizacion_ratios: true,
  guardar_propias_horas: true,
  ingresar_horas_equipo: true,
  validar_propias_horas: true,
  ingresar_horas_todos_equipos: false,
  anular_validacion_horas: true,
  revalorizar_ausencias: true,
  acceso_propio_perfil: true,
  modificar_informacion_personal: true,
  consultar_propias_hojas: true,
  acceso_perfil_empleados_equipo: true,
  acceso_perfiles_managers: true,
  acceso_perfil_todos_empleados: false,
  eliminar_perfil_empleado: false,
  modificar_contadores_vacaciones: false,
};

export const DIRECTOR_SWITCH_PERMISSIONS = [
  "editar_planificaciones_publicadas",
  "anular_validacion_horas",
  "revalorizar_ausencias",
  "eliminar_perfil_empleado",
];

export const MANAGER_PERMISSIONS_DEFAULT = {
  acceso_planificacion_publicada_equipos: true,
  acceso_planificacion_no_publicada: true,
  acceso_planificacion_otros_equipos: false,
  visualizacion_alertas: true,
  creacion_modificacion_planificacion: true,
  editar_planificaciones_publicadas: true,
  visualizacion_ratios: true,
  guardar_propias_horas: true,
  ingresar_horas_equipo: true,
  validar_propias_horas: false,
  ingresar_horas_todos_equipos: false,
  anular_validacion_horas: true,
  revalorizar_ausencias: true,
  acceso_propio_perfil: true,
  modificar_informacion_personal: true,
  consultar_propias_hojas: true,
  acceso_perfil_empleados_equipo: false,
  acceso_perfiles_managers: false,
  acceso_perfil_todos_empleados: false,
  eliminar_perfil_empleado: false,
  modificar_contadores_vacaciones: false,
};

export const MANAGER_SWITCH_PERMISSIONS = [
  "editar_planificaciones_publicadas",
  "validar_propias_horas",
  "anular_validacion_horas",
  "revalorizar_ausencias",
  "acceso_perfil_empleados_equipo",
];

export const EMPLEADO_PERMISSIONS_DEFAULT = {
  acceso_planificacion_publicada_equipos: true,
  acceso_planificacion_no_publicada: false,
  acceso_planificacion_otros_equipos: false,
  visualizacion_alertas: false,
  creacion_modificacion_planificacion: false,
  editar_planificaciones_publicadas: false,
  visualizacion_ratios: false,
  guardar_propias_horas: true,
  ingresar_horas_equipo: false,
  validar_propias_horas: false,
  ingresar_horas_todos_equipos: false,
  anular_validacion_horas: false,
  revalorizar_ausencias: false,
  acceso_propio_perfil: true,
  modificar_informacion_personal: true,
  consultar_propias_hojas: false,
  acceso_perfil_empleados_equipo: false,
  acceso_perfiles_managers: false,
  acceso_perfil_todos_empleados: false,
  eliminar_perfil_empleado: false,
  modificar_contadores_vacaciones: false,
};

// ─── isPermissionActive — pure helper (no state) ────────────────────────────

export const isPermissionActive = (permission: string, role: string): boolean => {
  const rolePermissions: Record<string, string[]> = {
    empleado: [
      "acceso_planificacion_publicada_equipos",
      "guardar_propias_horas",
      "acceso_propio_perfil",
      "modificar_informacion_personal",
      "consultar_propias_hojas",
    ],
    manager: [
      "acceso_planificacion_publicada_equipos",
      "acceso_planificacion_no_publicada",
      "acceso_planificacion_otros_equipos",
      "visualizacion_alertas",
      "guardar_propias_horas",
      "ingresar_horas_equipo",
      "validar_propias_horas",
      "acceso_propio_perfil",
      "modificar_informacion_personal",
      "consultar_propias_hojas",
      "acceso_perfil_empleados_equipo",
    ],
    director: [
      "acceso_planificacion_publicada_equipos",
      "acceso_planificacion_no_publicada",
      "acceso_planificacion_otros_equipos",
      "visualizacion_alertas",
      "creacion_modificacion_planificacion",
      "editar_planificaciones_publicadas",
      "visualizacion_ratios",
      "guardar_propias_horas",
      "ingresar_horas_equipo",
      "validar_propias_horas",
      "ingresar_horas_todos_equipos",
      "anular_validacion_horas",
      "acceso_propio_perfil",
      "modificar_informacion_personal",
      "consultar_propias_hojas",
      "acceso_perfil_empleados_equipo",
      "acceso_perfiles_managers",
      "acceso_perfil_todos_empleados",
    ],
    administrador: [
      "acceso_planificacion_publicada_equipos",
      "acceso_planificacion_no_publicada",
      "acceso_planificacion_otros_equipos",
      "visualizacion_alertas",
      "creacion_modificacion_planificacion",
      "editar_planificaciones_publicadas",
      "visualizacion_ratios",
      "guardar_propias_horas",
      "ingresar_horas_equipo",
      "validar_propias_horas",
      "ingresar_horas_todos_equipos",
      "anular_validacion_horas",
      "revalorizar_ausencias",
      "acceso_propio_perfil",
      "modificar_informacion_personal",
      "consultar_propias_hojas",
      "acceso_perfil_empleados_equipo",
      "acceso_perfiles_managers",
      "acceso_perfil_todos_empleados",
      "eliminar_perfil_empleado",
      "modificar_contadores_vacaciones",
    ],
    propietario: [
      "acceso_planificacion_publicada_equipos",
      "acceso_planificacion_no_publicada",
      "acceso_planificacion_otros_equipos",
      "visualizacion_alertas",
      "creacion_modificacion_planificacion",
      "editar_planificaciones_publicadas",
      "visualizacion_ratios",
      "guardar_propias_horas",
      "ingresar_horas_equipo",
      "validar_propias_horas",
      "ingresar_horas_todos_equipos",
      "anular_validacion_horas",
      "revalorizar_ausencias",
      "acceso_propio_perfil",
      "modificar_informacion_personal",
      "consultar_propias_hojas",
      "acceso_perfil_empleados_equipo",
      "acceso_perfiles_managers",
      "acceso_perfil_todos_empleados",
      "eliminar_perfil_empleado",
      "modificar_contadores_vacaciones",
    ],
  };
  return rolePermissions[role]?.includes(permission) || false;
};

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useColaboradorDetail() {
  const { user } = useAuth();
  const { isAdmin, role } = useUserRole();
  const { currentOrganization, organizations } = useOrganizationsUnified();

  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const { colaborador, loading, refetch: refetchColaborador } = useColaboradorById(id);
  const {
    assignments: teamAssignments,
    loading: teamAssignmentsLoading,
    refetch: refetchTeamAssignments,
  } = useTeamAssignments(id || "");
  const { departments: allDepartments } = useJobDepartments();

  const [forceRefresh, setForceRefresh] = useState(0);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  useEffect(() => {
    // side-effect: tracks colaborador changes for debug purposes
  }, [colaborador?.updated_at, colaborador?.jobs?.title, colaborador?.jobs?.department, forceRefresh]);

  const displayColaborador = useMemo(() => {
    return colaborador ? { ...colaborador, _refreshKey: forceRefresh } : null;
  }, [colaborador, forceRefresh]);

  const isInactive = displayColaborador?.status === "inactivo";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [contractHistory, setContractHistory] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState(() => {
    const tabFromUrl = searchParams.get("tab");
    return tabFromUrl || "datos-personales";
  });
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isContractDetailsOpen, setIsContractDetailsOpen] = useState(false);
  const [isEditContractOpen, setIsEditContractOpen] = useState(false);
  const [isTerminateContractOpen, setIsTerminateContractOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>("empleado");
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [showAbsenceRequestForm, setShowAbsenceRequestForm] = useState(false);
  const [isRoleManagementOpen, setIsRoleManagementOpen] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [fileInputRef, setFileInputRef] = useState<HTMLInputElement | null>(null);
  const [isInviting, setIsInviting] = useState(false);

  const {
    permissions,
    loading: permissionsLoading,
    updatePermission,
    assignRole,
    hasPermission,
    getPermissionsByCategory,
    refetch: refetchPermissions,
  } = useUserPermissions(colaborador?.id);

  const [isAccessMenuExpanded, setIsAccessMenuExpanded] = useState(false);
  const [generalizedAccess, setGeneralizedAccess] = useState(false);
  const [isAccessDialogOpen, setIsAccessDialogOpen] = useState(false);
  const [savingGeneralizedAccess, setSavingGeneralizedAccess] = useState(false);

  useEffect(() => {
    if (colaborador?.has_generalized_access !== undefined) {
      setGeneralizedAccess(colaborador.has_generalized_access);
    }
  }, [colaborador?.has_generalized_access]);

  const [isPlanningMenuExpanded, setIsPlanningMenuExpanded] = useState(false);
  const [employeePlannable, setEmployeePlannable] = useState(true);
  const [isPlanningConfigOpen, setIsPlanningConfigOpen] = useState(false);
  const [isAccessManagementOpen, setIsAccessManagementOpen] = useState(false);
  const [isAvailabilityOpen, setIsAvailabilityOpen] = useState(false);
  const [showCompensatoryTimeOff, setShowCompensatoryTimeOff] = useState(false);
  const [teamNames, setTeamNames] = useState<string>("");
  const [userCreatedAt, setUserCreatedAt] = useState<string | null>(null);
  const [hasUserAccount, setHasUserAccount] = useState<boolean>(false);
  const [inviteStatus, setInviteStatus] = useState<"none" | "pending" | "accepted">("none");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [pendingInvite, setPendingInvite] = useState<any>(null);

  const [directorPermissions, setDirectorPermissions] = useState(DIRECTOR_PERMISSIONS_DEFAULT);
  const [managerPermissions, setManagerPermissions] = useState(MANAGER_PERMISSIONS_DEFAULT);
  const [empleadoPermissions] = useState(EMPLEADO_PERMISSIONS_DEFAULT);

  const { balance: compensatoryBalance, loading: compensatoryLoading } = useCompensatoryTimeOff(
    id || ""
  );

  // ─── Data sync ──────────────────────────────────────────────────────────────

  const fetchTeamNames = async () => {
    if (!id) return;
    try {
      const { data: colaboradorData, error: colaboradorError } = await supabase
        .from("colaboradores")
        .select(`
          job_id,
          jobs!colaboradores_job_id_fkey (
            department,
            job_departments:department_id (
              value
            )
          )
        `)
        .eq("id", id)
        .maybeSingle();

      if (colaboradorError) {
        console.error("Error fetching colaborador job:", colaboradorError);
        return;
      }

      let departmentName = "";
      if (colaboradorData?.jobs) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const job = Array.isArray(colaboradorData.jobs) ? colaboradorData.jobs[0] : (colaboradorData.jobs as any);
        if (job?.job_departments) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const dept = Array.isArray(job.job_departments) ? job.job_departments[0] : (job.job_departments as any);
          departmentName = dept?.value || "";
        } else {
          departmentName = job?.department || "";
        }
      }
      setTeamNames(departmentName);
    } catch (error) {
      console.error("Error fetching teams:", error);
    }
  };

  const handleDataSync = async () => {
    try {
      await Promise.all([
        refetchTeamAssignments(),
        refetchColaborador(),
        fetchTeamNames(),
      ]);
      setForceRefresh((prev) => prev + 1);
    } catch (error) {
      console.error("❌ Error en sincronización:", error);
    }
  };

  useEffect(() => {
    if (colaborador?.id) {
      fetchTeamNames();
    }
  }, [colaborador?.id, colaborador?.updated_at, forceRefresh]);

  // ─── Load on id change ──────────────────────────────────────────────────────

  useEffect(() => {
    if (id) {
      fetchContractHistory();
      fetchCurrentUserRole();
      fetchTeamNames();
    }
  }, [id]);

  // ─── User profile + invite status ───────────────────────────────────────────

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user?.id) return;
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("created_at")
          .eq("id", user.id)
          .single();
        if (!error && data) setUserCreatedAt(data.created_at);
      } catch (error) {
        console.error("Error fetching user profile:", error);
      }
    };

    const checkInviteStatus = async () => {
      if (!colaborador?.email || !currentOrganization?.id) return;
      try {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("id")
          .eq("email", colaborador.email.toLowerCase())
          .maybeSingle();

        if (profileData) {
          setInviteStatus("accepted");
          setHasUserAccount(true);
          return;
        }

        const { data: inviteData } = await supabase
          .from("invites")
          .select("*")
          .eq("email", colaborador.email.toLowerCase())
          .eq("org_id", currentOrganization.id)
          .is("used_at", null)
          .is("revoked_at", null)
          .gte("expires_at", new Date().toISOString())
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (inviteData) {
          setInviteStatus("pending");
          setPendingInvite(inviteData);
        } else {
          setInviteStatus("none");
        }
      } catch (error) {
        console.error("Error checking invite status:", error);
        setInviteStatus("none");
      }
    };

    fetchUserProfile();
    checkInviteStatus();
  }, [user?.id, colaborador?.email, currentOrganization?.id, colaborador?.id]);

  // ─── URL tab sync ───────────────────────────────────────────────────────────

  useEffect(() => {
    const tabFromUrl = searchParams.get("tab");
    if (tabFromUrl) setActiveTab(tabFromUrl);
  }, [searchParams]);

  // ─── Async handlers ─────────────────────────────────────────────────────────

  const fetchCurrentUserRole = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase.rpc("get_user_role", { _user_id: user.id });
      if (!error && data) {
        setCurrentUserRole(data);
        setSelectedRole(data);
      }
    } catch (error) {
      console.error("Error fetching user role:", error);
    }
  };

  const handleRoleChange = async (newRole: string) => {
    if (!colaborador?.id || !user?.id) return;
    try {
      await supabase
        .from("colaborador_roles")
        .update({ activo: false })
        .eq("colaborador_id", colaborador.id);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await supabase.from("colaborador_roles").insert({
        colaborador_id: colaborador.id,
        role: newRole,
        asignado_por: user.id,
        activo: true,
      } as any);

      if (error) {
        console.error("Error updating colaborador role:", error);
        toast({ title: "Error", description: "No se pudo actualizar el rol del colaborador", variant: "destructive" });
        return;
      }

      toast({ title: "Rol actualizado", description: `El rol del colaborador ha sido cambiado a ${newRole}` });
      await refetchPermissions();
    } catch (error) {
      console.error("Error in handleRoleChange:", error);
      toast({ title: "Error", description: "Ocurrió un error inesperado", variant: "destructive" });
    }
  };

  const fetchContractHistory = async () => {
    try {
      const { data, error } = await supabase
        .from("contract_history")
        .select("*")
        .eq("colaborador_id", id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) { console.error("Error fetching contract history:", error); return; }
      setContractHistory(data || []);
    } catch (error) {
      console.error("Error fetching contract history:", error);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !colaborador) return;

    setUploadingAvatar(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${colaborador.id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, { cacheControl: "3600", upsert: true });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from("colaboradores")
        .update({ avatar_url: publicUrl })
        .eq("id", colaborador.id);
      if (updateError) throw updateError;

      toast({ title: "Avatar actualizado", description: "La imagen de perfil se ha actualizado correctamente" });
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast({ title: "Error", description: "No se pudo actualizar el avatar", variant: "destructive" });
    } finally {
      setUploadingAvatar(false);
      if (event.target) event.target.value = "";
    }
  };

  const handleInviteColaborador = async () => {
    if (!colaborador?.email || !user) {
      toast({ title: "Error", description: "No se puede enviar la invitación sin email del colaborador", variant: "destructive" });
      return;
    }
    setIsInviting(true);
    try {
      const { data: membership } = await supabase
        .from("memberships")
        .select("org_id")
        .eq("user_id", user.id)
        .limit(1)
        .single();

      if (!membership?.org_id) throw new Error("No se encontró la organización del usuario");

      const { data, error } = await supabase.functions.invoke("create-invite", {
        body: { orgId: membership.org_id, email: colaborador.email.toLowerCase(), role: "EMPLOYEE" },
      });
      if (error) throw error;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((data as any)?.error) throw new Error((data as any).error);

      toast({ title: "Invitación enviada", description: `Se ha enviado una invitación a ${colaborador.email} para acceder a TurnoSmart` });
      setInviteStatus("pending");
    } catch (error: unknown) {
      console.error("Error sending invite:", error);
      toast({ title: "Error", description: error instanceof Error ? error.message : "Error al enviar la invitación", variant: "destructive" });
    } finally {
      setIsInviting(false);
    }
  };

  const handleResendInvite = async () => {
    if (!pendingInvite?.id) return;
    setIsInviting(true);
    try {
      const { error } = await supabase.functions.invoke("resend-invite", {
        body: { inviteId: pendingInvite.id },
      });
      if (error) throw error;
      toast({ title: "Invitación reenviada", description: `Se ha reenviado la invitación a ${colaborador?.email}` });
    } catch (error: unknown) {
      console.error("Error resending invite:", error);
      toast({ title: "Error", description: error instanceof Error ? error.message : "Error al reenviar la invitación", variant: "destructive" });
    } finally {
      setIsInviting(false);
    }
  };

  const triggerFileInput = () => { fileInputRef?.click(); };

  const handleDeleteColaborador = async () => {
    if (!id) return;
    setDeleting(true);
    try {
      const { error } = await supabase.from("colaboradores").delete().eq("id", id);
      if (error) {
        toast({ title: "Error", description: "No se pudo eliminar el colaborador", variant: "destructive" });
        return;
      }
      toast({ title: "Colaborador eliminado", description: "El colaborador ha sido eliminado exitosamente" });
      navigate("/colaboradores");
    } catch (error) {
      console.error("Error deleting colaborador:", error);
      toast({ title: "Error", description: "Ocurrió un error inesperado", variant: "destructive" });
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleGeneralizedAccessToggle = async (newValue: boolean) => {
    if (!id || !currentOrganization?.id) {
      toast({ title: "Error", description: "No se pudo identificar el colaborador u organización", variant: "destructive" });
      return;
    }
    setSavingGeneralizedAccess(true);
    try {
      const { error: updateError } = await supabase
        .from("colaboradores")
        .update({ has_generalized_access: newValue })
        .eq("id", id);
      if (updateError) throw updateError;

      if (newValue) {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        const assignmentsToCreate = allDepartments.map((dept) => ({
          colaborador_id: id,
          department_id: dept.id,
          org_id: currentOrganization.id,
          is_active: true,
          assigned_by: currentUser?.id,
        }));

        if (assignmentsToCreate.length > 0) {
          const { error: assignError } = await supabase
            .from("colaborador_departments")
            .upsert(assignmentsToCreate, { onConflict: "colaborador_id,department_id", ignoreDuplicates: false });
          if (assignError) throw assignError;
        }

        toast({ title: "Acceso generalizado activado", description: `${colaborador?.nombre} ahora tiene acceso a todos los equipos y rotas` });
      } else {
        toast({ title: "Acceso generalizado desactivado", description: "Las asignaciones individuales se mantienen activas" });
      }

      setGeneralizedAccess(newValue);
      refetchTeamAssignments();
      refetchColaborador();
    } catch (error) {
      console.error("Error updating generalized access:", error);
      toast({ title: "Error", description: "No se pudo actualizar el acceso generalizado", variant: "destructive" });
      setGeneralizedAccess(!newValue);
    } finally {
      setSavingGeneralizedAccess(false);
    }
  };

  // ─── Return ──────────────────────────────────────────────────────────────────

  return {
    // Auth + org
    user,
    isAdmin,
    role,
    currentOrganization,
    organizations,
    // Route
    id,
    navigate,
    // Colaborador data
    colaborador,
    displayColaborador,
    loading,
    refetchColaborador,
    isInactive,
    // Team data
    teamAssignments,
    teamAssignmentsLoading,
    refetchTeamAssignments,
    allDepartments,
    teamNames,
    // Permissions hook data
    permissions,
    permissionsLoading,
    updatePermission,
    assignRole,
    hasPermission,
    getPermissionsByCategory,
    refetchPermissions,
    // Compensatory
    compensatoryBalance,
    compensatoryLoading,
    // UI state — dialogs / sheets
    activeTab, setActiveTab,
    showDeleteDialog, setShowDeleteDialog,
    deleting,
    isEditDialogOpen, setIsEditDialogOpen,
    isContractDetailsOpen, setIsContractDetailsOpen,
    isEditContractOpen, setIsEditContractOpen,
    isTerminateContractOpen, setIsTerminateContractOpen,
    showAbsenceRequestForm, setShowAbsenceRequestForm,
    isRoleManagementOpen, setIsRoleManagementOpen,
    isAccessMenuExpanded, setIsAccessMenuExpanded,
    isAccessDialogOpen, setIsAccessDialogOpen,
    savingGeneralizedAccess,
    isPlanningMenuExpanded, setIsPlanningMenuExpanded,
    employeePlannable, setEmployeePlannable,
    isPlanningConfigOpen, setIsPlanningConfigOpen,
    isAccessManagementOpen, setIsAccessManagementOpen,
    isAvailabilityOpen, setIsAvailabilityOpen,
    showCompensatoryTimeOff, setShowCompensatoryTimeOff,
    // Upload
    uploadingAvatar,
    fileInputRef,
    setFileInputRef,
    isInviting,
    // Role management
    selectedRole, setSelectedRole,
    currentUserRole,
    // Invite
    inviteStatus,
    pendingInvite,
    hasUserAccount,
    userCreatedAt,
    // Generalized access
    generalizedAccess,
    // Contract
    contractHistory,
    // Permissions defaults (used in JSX for role tabs)
    directorPermissions,
    managerPermissions,
    empleadoPermissions,
    // Handlers
    handleDataSync,
    fetchTeamNames,
    fetchContractHistory,
    handleRoleChange,
    handleAvatarUpload,
    handleInviteColaborador,
    handleResendInvite,
    triggerFileInput,
    handleDeleteColaborador,
    handleGeneralizedAccessToggle,
  };
}
