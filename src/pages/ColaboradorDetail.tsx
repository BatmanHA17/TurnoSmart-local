import { useState, useEffect, useMemo } from "react";
import { getInitials } from "@/utils/avatar";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useOrganizationsUnified } from "@/hooks/useOrganizationsUnified";
import { Camera, Edit, User, FileText, Clock, Calendar, Settings, Shield, ChevronRight, ChevronDown, ChevronUp, ArrowLeft, Info, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { MainLayout } from "@/components/MainLayout";
import { NotionCard } from "@/components/ui/notion-components";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { AddColaboradorSheet } from "@/components/colaboradores/AddColaboradorSheet";
import { ContractDetailsSheet } from "@/components/colaboradores/ContractDetailsSheet";
import { RoleManagementDialog } from "@/components/colaboradores/RoleManagementDialog";
import { EditContractSheet } from "@/components/colaboradores/EditContractSheet";
import { TerminateContractDialog } from "@/components/colaboradores/TerminateContractDialog";
import { GeneralizedAccessDialog } from "@/components/GeneralizedAccessDialog";
import { EmployeePlanningConfig } from "@/components/EmployeePlanningConfig";
import { AccessManagementDialog } from "@/components/AccessManagementDialog";
import { AvailabilitySheet } from "@/components/AvailabilitySheet";
import { CompensatoryTimeOffView } from "@/components/CompensatoryTimeOffView";
import { useCompensatoryTimeOff } from "@/hooks/useCompensatoryTimeOff";
import { EmployeeAbsenceRequests } from "@/components/EmployeeAbsenceRequests";
import { LeaveRequestFormContent } from "@/components/LeaveRequestFormContent";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { UserSystemManagement } from "@/components/colaboradores/UserSystemManagement";
import { useColaboradorById } from "@/hooks/useColaboradorFull";
import { useTeamAssignments } from "@/hooks/useTeamAssignments";
import { useJobDepartments } from "@/hooks/useJobDepartments";
import { TeamAssignmentCard } from "@/components/colaboradores/TeamAssignmentCard";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Colaborador {
  id: string;
  nombre: string;
  apellidos: string;
  apellidos_uso?: string;
  email: string;
  telefono_movil?: string;
  telefono_fijo?: string;
  pais_movil?: string;
  pais_fijo?: string;
  fecha_nacimiento?: string;
  empleado_id?: string;
  tipo_contrato?: string;
  fecha_inicio_contrato?: string;
  fecha_fin_contrato?: string;
  tiempo_trabajo_semanal?: number;
  hora_inicio_contrato?: string;
  disponibilidad_semanal?: string | string[];
  // establecimiento_por_defecto?: string; // ELIMINADO en Fase 5C
  responsable_directo?: string;
  avatar_url?: string;
  status?: string;
  es_extranjero?: boolean;
  pais_nacimiento?: string;
  direccion?: string;
  ciudad?: string;
  codigo_postal?: string;
  provincia?: string;
  pais_residencia?: string;
  numero_seguridad_social?: string;
  minusvalia?: boolean;
  ultima_revision_medica?: string;
  reconocimiento_medico_reforzado?: boolean;
  exonerado_seguro_medico?: boolean;
  contacto_emergencia_nombre?: string;
  contacto_emergencia_apellidos?: string;
  contacto_emergencia_relacion?: string;
  contacto_emergencia_movil?: string;
  contacto_emergencia_fijo?: string;
  codigo_pais_movil_emergencia?: string;
  codigo_pais_fijo_emergencia?: string;
  genero?: string;
  apellidos_nacimiento?: string;
  nacionalidad?: string;
  ciudad_nacimiento?: string;
  estado_civil?: string;
  numero_personas_dependientes?: number;
  fecha_antiguedad?: string;
  trabajador_extranjero_permiso?: boolean;
  created_at?: string;
  updated_at?: string;
}

export default function ColaboradorDetail() {
  const { user } = useAuth();
  const { isAdmin, role } = useUserRole();
  const { currentOrganization, organizations } = useOrganizationsUnified();
  
  // Mapeo de códigos de país a códigos telefónicos
  const countryToPhoneCode = {
    'ES': '+34',
    'FR': '+33', 
    'DE': '+49',
    'IT': '+39',
    'GB': '+44'
  };

  // Función para obtener el código telefónico
  const getPhoneCode = (countryCode: string) => {
    return countryToPhoneCode[countryCode as keyof typeof countryToPhoneCode] || '+34';
  };
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Use new hook for colaborador data from unified view
  const { colaborador, loading, refetch: refetchColaborador } = useColaboradorById(id);
  
  // Hook for team assignments - departamentos asignados
  const { assignments: teamAssignments, loading: teamAssignmentsLoading, refetch: refetchTeamAssignments } = useTeamAssignments(id || '');
  
  // Hook for all departments in organization
  const { departments: allDepartments } = useJobDepartments();
  
  // Force refresh state to trigger UI updates
  const [forceRefresh, setForceRefresh] = useState(0);
  
  // Log when colaborador data changes to debug update issues
  useEffect(() => {
    if (colaborador) {
    }
  }, [colaborador?.updated_at, colaborador?.jobs?.title, colaborador?.jobs?.department, forceRefresh]);
  
  // Use memo with force refresh to ensure reactive updates
  const displayColaborador = useMemo(() => {
    return colaborador ? {
      ...colaborador,
      _refreshKey: forceRefresh // Force dependency update
    } : null;
  }, [colaborador, forceRefresh]);
  
  const isInactive = displayColaborador?.status === 'inactivo';
  const [contractHistory, setContractHistory] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState(() => {
    // Si hay un parámetro 'tab' en la URL, usarlo como tab inicial
    const tabFromUrl = searchParams.get('tab');
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
  
  // Hook para gestionar permisos reales
  const { 
    permissions, 
    loading: permissionsLoading, 
    updatePermission, 
    assignRole,
    hasPermission,
    getPermissionsByCategory,
    refetch: refetchPermissions
  } = useUserPermissions(colaborador?.id);
  
  // Estados para acceso generalizado
  const [isAccessMenuExpanded, setIsAccessMenuExpanded] = useState(false);
  const [generalizedAccess, setGeneralizedAccess] = useState(false);
  const [isAccessDialogOpen, setIsAccessDialogOpen] = useState(false);
  const [savingGeneralizedAccess, setSavingGeneralizedAccess] = useState(false);
  
  // Cargar estado de acceso generalizado desde la DB
  useEffect(() => {
    if (colaborador?.has_generalized_access !== undefined) {
      setGeneralizedAccess(colaborador.has_generalized_access);
    }
  }, [colaborador?.has_generalized_access]);
  
  // Estados para turnos en el planning
  const [isPlanningMenuExpanded, setIsPlanningMenuExpanded] = useState(false);
  const [employeePlannable, setEmployeePlannable] = useState(true);
  const [isPlanningConfigOpen, setIsPlanningConfigOpen] = useState(false);
  
  // Estados para gestión de accesos
  const [isAccessManagementOpen, setIsAccessManagementOpen] = useState(false);
  
  // Estados para disponibilidad
  const [isAvailabilityOpen, setIsAvailabilityOpen] = useState(false);
  const [showCompensatoryTimeOff, setShowCompensatoryTimeOff] = useState(false);
  const [teamNames, setTeamNames] = useState<string>('');
  const [userCreatedAt, setUserCreatedAt] = useState<string | null>(null);
  const [hasUserAccount, setHasUserAccount] = useState<boolean>(false);
  const [inviteStatus, setInviteStatus] = useState<'none' | 'pending' | 'accepted'>('none');
  const [pendingInvite, setPendingInvite] = useState<any>(null);
  
  // Hook para obtener el balance de compensación de horas extras
  const { balance: compensatoryBalance, loading: compensatoryLoading } = useCompensatoryTimeOff(id || '');

  // Función unificada de sincronización de datos
  const handleDataSync = async () => {
    try {
      // Refrescar en paralelo
      await Promise.all([
        refetchTeamAssignments(),
        refetchColaborador(),
        fetchTeamNames()
      ]);
      
      // Forzar actualización de UI
      setForceRefresh(prev => prev + 1);
      
    } catch (error) {
      console.error('❌ Error en sincronización:', error);
    }
  };

  // Effect para refrescar equipos cuando el colaborador cambie
  useEffect(() => {
    if (colaborador?.id) {
      fetchTeamNames();
    }
  }, [colaborador?.id, colaborador?.updated_at, forceRefresh]);
  const [directorPermissions, setDirectorPermissions] = useState({
    // Planificación - según imagen
    acceso_planificacion_publicada_equipos: true, // ✓ verde
    acceso_planificacion_no_publicada: true, // ✓ verde
    acceso_planificacion_otros_equipos: false, // ○ rojo
    visualizacion_alertas: true, // ✓ verde
    creacion_modificacion_planificacion: true, // ✓ verde
    editar_planificaciones_publicadas: true, // SWITCH activado
    visualizacion_ratios: true, // ✓ verde
    // Gestión de Horas - según imagen
    guardar_propias_horas: true, // ✓ verde
    ingresar_horas_equipo: true, // ✓ verde
    validar_propias_horas: true, // ✓ verde
    ingresar_horas_todos_equipos: false, // ○ rojo
    anular_validacion_horas: true, // SWITCH activado
    revalorizar_ausencias: true, // SWITCH activado
    // Perfil de Usuario - según imagen
    acceso_propio_perfil: true, // ✓ verde
    modificar_informacion_personal: true, // ✓ verde
    consultar_propias_hojas: true, // ✓ verde
    acceso_perfil_empleados_equipo: true, // ✓ verde
    acceso_perfiles_managers: true, // ✓ verde
    acceso_perfil_todos_empleados: false, // ○ rojo
    eliminar_perfil_empleado: false, // SWITCH desactivado
    // Gestión de Ausencias - según imagen
    modificar_contadores_vacaciones: false // ○ rojo
  });

  // Define qué permisos del Director tienen switches
  const directorSwitchPermissions = [
    'editar_planificaciones_publicadas',
    'anular_validacion_horas', 
    'revalorizar_ausencias',
    'eliminar_perfil_empleado'
  ];

  // Estado para permisos de Manager - según imagen
  const [managerPermissions, setManagerPermissions] = useState({
    // Planificación - según imagen
    acceso_planificacion_publicada_equipos: true, // ✓ verde
    acceso_planificacion_no_publicada: true, // ✓ verde
    acceso_planificacion_otros_equipos: false, // ○ rojo
    visualizacion_alertas: true, // ✓ verde
    creacion_modificacion_planificacion: true, // ✓ verde
    editar_planificaciones_publicadas: true, // SWITCH activado
    visualizacion_ratios: true, // ✓ verde
    // Gestión de Horas - según imagen
    guardar_propias_horas: true, // ✓ verde
    ingresar_horas_equipo: true, // ✓ verde
    validar_propias_horas: false, // SWITCH desactivado
    ingresar_horas_todos_equipos: false, // ○ rojo
    anular_validacion_horas: true, // SWITCH activado
    revalorizar_ausencias: true, // SWITCH activado
    // Perfil de Usuario - según imagen
    acceso_propio_perfil: true, // ✓ verde
    modificar_informacion_personal: true, // ✓ verde
    consultar_propias_hojas: true, // ✓ verde
    acceso_perfil_empleados_equipo: false, // SWITCH desactivado
    acceso_perfiles_managers: false, // ○ rojo
    acceso_perfil_todos_empleados: false, // ○ rojo
    eliminar_perfil_empleado: false, // ○ rojo
    // Gestión de Ausencias - según imagen
    modificar_contadores_vacaciones: false // ○ rojo
  });

  // Define qué permisos del Manager tienen switches
  const managerSwitchPermissions = [
    'editar_planificaciones_publicadas',
    'validar_propias_horas',
    'anular_validacion_horas', 
    'revalorizar_ausencias',
    'acceso_perfil_empleados_equipo'
  ];

  // Estado para permisos de Empleado - según imagen
  const [empleadoPermissions] = useState({
    // Planificación - según imagen
    acceso_planificacion_publicada_equipos: true, // ✓ verde
    acceso_planificacion_no_publicada: false, // ○ rojo
    acceso_planificacion_otros_equipos: false, // ○ rojo
    visualizacion_alertas: false, // ○ rojo
    creacion_modificacion_planificacion: false, // ○ rojo
    editar_planificaciones_publicadas: false, // ○ rojo
    visualizacion_ratios: false, // ○ rojo
    // Gestión de Horas - según imagen
    guardar_propias_horas: true, // ✓ verde
    ingresar_horas_equipo: false, // ○ rojo
    validar_propias_horas: false, // ○ rojo
    ingresar_horas_todos_equipos: false, // ○ rojo
    anular_validacion_horas: false, // ○ rojo
    revalorizar_ausencias: false, // ○ rojo
    // Perfil de Usuario - según imagen
    acceso_propio_perfil: true, // ✓ verde
    modificar_informacion_personal: true, // ✓ verde
    consultar_propias_hojas: false, // ○ rojo
    acceso_perfil_empleados_equipo: false, // ○ rojo
    acceso_perfiles_managers: false, // ○ rojo
    acceso_perfil_todos_empleados: false, // ○ rojo
    eliminar_perfil_empleado: false, // ○ rojo
    // Gestión de Ausencias - según imagen
    modificar_contadores_vacaciones: false // ○ rojo
  });

  useEffect(() => {
    if (id) {
      fetchContractHistory();
      fetchCurrentUserRole();
      fetchTeamNames();
    }
  }, [id]);

  // Obtener fecha de creación del perfil del usuario y verificar si el colaborador tiene cuenta
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user?.id) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('created_at')
          .eq('id', user.id)
          .single();
        
        if (!error && data) {
          setUserCreatedAt(data.created_at);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };
    
    const checkInviteStatus = async () => {
      if (!colaborador?.email || !currentOrganization?.id) return;
      
      try {
        // 1. Verificar si tiene cuenta activa
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', colaborador.email.toLowerCase())
          .maybeSingle();
        
        if (profileData) {
          setInviteStatus('accepted');
          setHasUserAccount(true);
          return;
        }
        
        // 2. Verificar si tiene invitación pendiente
        const { data: inviteData } = await supabase
          .from('invites')
          .select('*')
          .eq('email', colaborador.email.toLowerCase())
          .eq('org_id', currentOrganization.id)
          .is('used_at', null)
          .is('revoked_at', null)
          .gte('expires_at', new Date().toISOString())
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (inviteData) {
          setInviteStatus('pending');
          setPendingInvite(inviteData);
        } else {
          setInviteStatus('none');
        }
      } catch (error) {
        console.error('Error checking invite status:', error);
        setInviteStatus('none');
      }
    };
    
    fetchUserProfile();
    checkInviteStatus();
  }, [user?.id, colaborador?.email, currentOrganization?.id, colaborador?.id]);

  // Efecto para cambiar la tab cuando cambie el parámetro URL
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl) {
      setActiveTab(tabFromUrl);
      
      // Si cambiamos a la tab de rol y permisos, forzar refresh de permisos
      if (tabFromUrl === 'rol-permisos') {
        // El hook useUserPermissions se actualiza automáticamente cuando cambia colaborador?.id
      }
    }
  }, [searchParams]);

  const fetchCurrentUserRole = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase.rpc('get_user_role', { _user_id: user.id });
      if (!error && data) {
        setCurrentUserRole(data);
        setSelectedRole(data);
      }
    } catch (error) {
      console.error('Error fetching user role:', error);
    }
  };

  const handleRoleChange = async (newRole: string) => {
    if (!colaborador?.id || !user?.id) return;

    try {
      // Desactivar roles existentes del colaborador
      await supabase
        .from('colaborador_roles')
        .update({ activo: false })
        .eq('colaborador_id', colaborador.id);

      // Insertar el nuevo rol
      const { error } = await supabase
        .from('colaborador_roles')
        .insert({
          colaborador_id: colaborador.id,
          role: newRole,
          asignado_por: user.id,
          activo: true
        } as any);

      if (error) {
        console.error('Error updating colaborador role:', error);
        toast({
          title: "Error",
          description: "No se pudo actualizar el rol del colaborador",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Rol actualizado",
        description: `El rol del colaborador ha sido cambiado a ${newRole}`,
      });

      // Refrescar permisos sin recargar la página
      await refetchPermissions();
    } catch (error) {
      console.error('Error in handleRoleChange:', error);
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado",
        variant: "destructive"
      });
    }
  };

  // Contract history is still fetched separately
  const fetchContractHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('contract_history')
        .select('*')
        .eq('colaborador_id', id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching contract history:', error);
        return;
      }

      setContractHistory(data || []);
    } catch (error) {
      console.error('Error fetching contract history:', error);
    }
  };

  const fetchTeamNames = async () => {
    if (!id) return;
    
    try {
      // Obtener el departamento del job asignado al colaborador usando la relación específica
      const { data: colaboradorData, error: colaboradorError } = await supabase
        .from('colaboradores')
        .select(`
          job_id,
          jobs!colaboradores_job_id_fkey (
            department,
            job_departments:department_id (
              value
            )
          )
        `)
        .eq('id', id)
        .maybeSingle();

      if (colaboradorError) {
        console.error('Error fetching colaborador job:', colaboradorError);
        return;
      }

      // Usar el departamento del job como equipo principal
      let departmentName = '';
      
      if (colaboradorData?.jobs) {
        // Los datos vienen como un array, tomar el primer elemento
        const job = Array.isArray(colaboradorData.jobs) ? colaboradorData.jobs[0] : colaboradorData.jobs;
        
        if (job?.job_departments) {
          const dept = Array.isArray(job.job_departments) ? job.job_departments[0] : job.job_departments;
          departmentName = dept?.value || '';
        } else {
          departmentName = job?.department || '';
        }
      }
      
      setTeamNames(departmentName);
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !colaborador) return;

    setUploadingAvatar(true);
    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${colaborador.id}-${Date.now()}.${fileExt}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Update colaborador with new avatar URL
      const { error: updateError } = await supabase
        .from('colaboradores')
        .update({ avatar_url: publicUrl })
        .eq('id', colaborador.id);

      if (updateError) {
        throw updateError;
      }

      // Avatar is now handled through the service, no local state update needed
      toast({
        title: "Avatar actualizado",
        description: "La imagen de perfil se ha actualizado correctamente"
      });

    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el avatar",
        variant: "destructive"
      });
    } finally {
      setUploadingAvatar(false);
      // Reset file input
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const handleInviteColaborador = async () => {
    if (!colaborador?.email || !user) {
      toast({
        title: "Error",
        description: "No se puede enviar la invitación sin email del colaborador",
        variant: "destructive"
      });
      return;
    }

    setIsInviting(true);

    try {
      // Obtener la organización del usuario
      const { data: membership } = await supabase
        .from('memberships')
        .select('org_id')
        .eq('user_id', user.id)
        .limit(1)
        .single();

      if (!membership?.org_id) {
        throw new Error('No se encontró la organización del usuario');
      }

      const { data, error } = await supabase.functions.invoke('create-invite', {
        body: {
          orgId: membership.org_id,
          email: colaborador.email.toLowerCase(),
          role: 'EMPLOYEE' // Rol por defecto para colaboradores
        }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({
        title: "Invitación enviada",
        description: `Se ha enviado una invitación a ${colaborador.email} para acceder a TurnoSmart`
      });

      // Actualizar estado a pendiente
      setInviteStatus('pending');

    } catch (error: any) {
      console.error('Error sending invite:', error);
      toast({
        title: "Error",
        description: error.message || 'Error al enviar la invitación',
        variant: "destructive"
      });
    } finally {
      setIsInviting(false);
    }
  };

  const handleResendInvite = async () => {
    if (!pendingInvite?.id) return;

    setIsInviting(true);
    try {
      const { error } = await supabase.functions.invoke('resend-invite', {
        body: { inviteId: pendingInvite.id }
      });

      if (error) throw error;

      toast({
        title: "Invitación reenviada",
        description: `Se ha reenviado la invitación a ${colaborador?.email}`
      });
    } catch (error: any) {
      console.error('Error resending invite:', error);
      toast({
        title: "Error",
        description: error.message || 'Error al reenviar la invitación',
        variant: "destructive"
      });
    } finally {
      setIsInviting(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef?.click();
  };

  const handleDeleteColaborador = async () => {
    if (!id) return;
    
    setDeleting(true);
    try {
      const { error } = await supabase
        .from('colaboradores')
        .delete()
        .eq('id', id);

      if (error) {
        toast({
          title: "Error",
          description: "No se pudo eliminar el colaborador",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Colaborador eliminado",
        description: "El colaborador ha sido eliminado exitosamente"
      });
      
      // Redireccionar a la lista de colaboradores
      navigate('/colaboradores');
    } catch (error) {
      console.error('Error deleting colaborador:', error);
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado",
        variant: "destructive"
      });
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  // Función para manejar el toggle de acceso generalizado
  const handleGeneralizedAccessToggle = async (newValue: boolean) => {
    if (!id || !currentOrganization?.id) {
      toast({
        title: "Error",
        description: "No se pudo identificar el colaborador u organización",
        variant: "destructive",
      });
      return;
    }

    setSavingGeneralizedAccess(true);
    try {
      // Actualizar el flag en la tabla colaboradores
      const { error: updateError } = await supabase
        .from('colaboradores')
        .update({ has_generalized_access: newValue })
        .eq('id', id);

      if (updateError) throw updateError;

      if (newValue) {
        // Obtener usuario actual
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        
        // Si se activa, asignar a TODOS los departamentos disponibles
        const assignmentsToCreate = allDepartments.map(dept => ({
          colaborador_id: id,
          department_id: dept.id,
          org_id: currentOrganization.id,
          is_active: true,
          assigned_by: currentUser?.id
        }));

        // Usar upsert para crear o actualizar asignaciones
        if (assignmentsToCreate.length > 0) {
          const { error: assignError } = await supabase
            .from('colaborador_departments')
            .upsert(assignmentsToCreate, {
              onConflict: 'colaborador_id,department_id',
              ignoreDuplicates: false
            });

          if (assignError) throw assignError;
        }

        toast({
          title: "Acceso generalizado activado",
          description: `${colaborador?.nombre} ahora tiene acceso a todos los equipos y rotas`,
        });
      } else {
        // Si se desactiva, solo actualizar el flag (mantener asignaciones existentes)
        toast({
          title: "Acceso generalizado desactivado",
          description: "Las asignaciones individuales se mantienen activas",
        });
      }

      // Actualizar estados locales
      setGeneralizedAccess(newValue);
      
      // Refrescar datos
      refetchTeamAssignments();
      refetchColaborador();

    } catch (error) {
      console.error('Error updating generalized access:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el acceso generalizado",
        variant: "destructive",
      });
      // Revertir el cambio en caso de error
      setGeneralizedAccess(!newValue);
    } finally {
      setSavingGeneralizedAccess(false);
    }
  };

  const isPermissionActive = (permission: string, role: string): boolean => {
    const rolePermissions = {
      empleado: [
        // Planificación
        "acceso_planificacion_publicada_equipos",
        // Gestión de Horas  
        "guardar_propias_horas",
        // Perfil de Usuario
        "acceso_propio_perfil",
        "modificar_informacion_personal",
        "consultar_propias_hojas"
      ],
      manager: [
        // Planificación
        "acceso_planificacion_publicada_equipos",
        "acceso_planificacion_no_publicada",
        "acceso_planificacion_otros_equipos",
        "visualizacion_alertas",
        // Gestión de Horas
        "guardar_propias_horas",
        "ingresar_horas_equipo",
        "validar_propias_horas",
        // Perfil de Usuario
        "acceso_propio_perfil",
        "modificar_informacion_personal",
        "consultar_propias_hojas",
        "acceso_perfil_empleados_equipo"
      ],
      director: [
        // Planificación
        "acceso_planificacion_publicada_equipos",
        "acceso_planificacion_no_publicada",
        "acceso_planificacion_otros_equipos",
        "visualizacion_alertas",
        "creacion_modificacion_planificacion",
        "editar_planificaciones_publicadas",
        "visualizacion_ratios",
        // Gestión de Horas
        "guardar_propias_horas",
        "ingresar_horas_equipo",
        "validar_propias_horas",
        "ingresar_horas_todos_equipos",
        "anular_validacion_horas",
        // Perfil de Usuario
        "acceso_propio_perfil",
        "modificar_informacion_personal",
        "consultar_propias_hojas",
        "acceso_perfil_empleados_equipo",
        "acceso_perfiles_managers",
        "acceso_perfil_todos_empleados"
      ],
      administrador: [
        // Todas las funciones activadas
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
        "modificar_contadores_vacaciones"
      ],
      propietario: [
        // Todas las funciones activadas
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
        "modificar_contadores_vacaciones"
      ]
    };

    return rolePermissions[role as keyof typeof rolePermissions]?.includes(permission) || false;
  };

  const getCheckmarkComponent = (permission: string) => {
    // Validar que permissions existe y es un array
    if (!permissions || !Array.isArray(permissions)) {
      return (
        <Switch 
          checked={false}
          disabled={true}
        />
      );
    }
    
    const currentPermission = permissions.find(p => p.permission_name === permission);
    const isActive = currentPermission?.is_enabled || false;
    const isConfigurable = currentPermission?.is_configurable || false;
    
    // Solo usuarios con rol "administrador" pueden modificar permisos
    const canModifyPermissions = isAdmin && user && colaborador?.id;
    
    // TODOS los permisos se muestran como toggles
    return (
      <Switch 
        checked={isActive}
        disabled={!canModifyPermissions} // Deshabilitar si no es administrador
        onCheckedChange={async (checked) => {
          if (!canModifyPermissions) return;
          
          // Crear sobrescritura de permiso específica para este colaborador
          const { data, error } = await supabase
            .from('user_permissions')
            .upsert({
              user_id: user.id,
              colaborador_id: colaborador.id,
              permission_name: permission,
              is_enabled: checked,
              granted_by: user.id
            });

          if (!error) {
            // Refrescar permisos para mostrar el cambio
            await refetchPermissions();
            toast({
              title: "Permiso actualizado",
              description: `El permiso ${permission} ha sido ${checked ? 'habilitado' : 'deshabilitado'}.`,
            });
          } else {
            console.error('Error updating permission:', error);
            toast({
              title: "Error",
              description: "No se pudo actualizar el permiso.",
              variant: "destructive",
            });
          }
        }}
      />
    );
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Cargando...</div>
        </div>
      </MainLayout>
    );
  }

  if (!displayColaborador) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Colaborador no encontrado</div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Back to list navigation */}
        <div className="mb-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/colaboradores')}
            className="text-muted-foreground hover:text-foreground p-0 h-auto font-normal"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a la lista de colaboradores
          </Button>
        </div>
        {/* Header with Avatar and Name - Black Notion Style */}
        <div className="bg-gray-900 rounded-xl p-6 text-white relative overflow-hidden">
          {/* Top section with avatar and name */}
          <div className="flex items-center gap-6 mb-6">
            <div className="relative group">
               <Avatar className="h-20 w-20 bg-white">
                 <AvatarImage src={displayColaborador.avatar_url} />
                 <AvatarFallback className="text-lg bg-white text-gray-900 font-semibold">
                   {getInitials(displayColaborador.nombre, displayColaborador.apellidos)}
                 </AvatarFallback>
               </Avatar>
              <div 
                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-full flex items-center justify-center cursor-pointer"
                onClick={triggerFileInput}
              >
                {uploadingAvatar ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Edit className="h-5 w-5 text-white" />
                )}
              </div>
              <input
                ref={setFileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>
             <div>
               <h1 className="text-2xl font-bold text-white">
                 {(displayColaborador.apellidos_uso || `${displayColaborador.nombre} ${displayColaborador.apellidos}`).toUpperCase()}
               </h1>
             </div>
          </div>

          {/* Divider line */}
          <div className="w-full h-px bg-white/20 mb-6"></div>

          {/* Contract information grid - Smaller text */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <p className="text-gray-400 font-bold mb-1" style={{ fontSize: '10px' }}>Inicio del contrato</p>
              <p className="text-gray-200 font-normal" style={{ fontSize: '10px' }}>
                {colaborador.fecha_inicio_contrato ? 
                  new Date(colaborador.fecha_inicio_contrato).toLocaleDateString('es-ES', { 
                    weekday: 'long', 
                    day: 'numeric', 
                    month: 'short', 
                    year: 'numeric' 
                  }) : 
                  '-'
                }
              </p>
            </div>
            
            <div>
              <p className="text-gray-400 font-bold mb-1" style={{ fontSize: '10px' }}>Tipo de contrato</p>
              <p className="text-gray-200 font-normal" style={{ fontSize: '10px' }}>{colaborador.tipo_contrato || '-'}</p>
            </div>
            
            <div>
              <p className="text-gray-400 font-bold mb-1" style={{ fontSize: '10px' }}>Ubicación</p>
              <p className="text-gray-200 font-normal" style={{ fontSize: '10px' }}>
                {organizations.find(org => org.id === colaborador.org_id)?.name || 'No especificada'}
              </p>
            </div>
            
            <div>
              <p className="text-gray-400 font-bold mb-1" style={{ fontSize: '10px' }}>Equipo</p>
              <p className="text-gray-200 font-normal" style={{ fontSize: '10px' }}>
                {teamAssignments.length > 0 
                  ? teamAssignments.map(assignment => assignment.department_name).join(', ')
                  : displayColaborador?.jobs?.department || 'Sin asignar'
                }
              </p>
            </div>
            
            <div>
              <p className="text-gray-400 font-bold mb-1" style={{ fontSize: '10px' }}>Responsable directo</p>
              <p className="text-gray-200 font-normal" style={{ fontSize: '10px' }}>
                {colaborador.responsable_directo || 'No asignado'}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className={`inline-flex h-auto gap-2 p-1 bg-muted/30 rounded-full ${isInactive ? 'opacity-50' : ''}`}>
            <TabsTrigger 
              value="datos-personales" 
              className="rounded-full px-6 py-2.5 text-sm font-medium transition-all data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:shadow-sm hover:bg-muted/50"
              disabled={isInactive}
            >
              Datos personales
            </TabsTrigger>
            <TabsTrigger 
              value="contratos" 
              className="rounded-full px-6 py-2.5 text-sm font-medium transition-all data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:shadow-sm hover:bg-muted/50"
              disabled={isInactive}
            >
              Contratos
            </TabsTrigger>
            <TabsTrigger 
              value="tiempo-planificacion" 
              className="rounded-full px-6 py-2.5 text-sm font-medium transition-all data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:shadow-sm hover:bg-muted/50"
              disabled={isInactive}
            >
              Tiempo y planificación
            </TabsTrigger>
            <TabsTrigger 
              value="vacaciones-ausencias" 
              className="rounded-full px-6 py-2.5 text-sm font-medium transition-all data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:shadow-sm hover:bg-muted/50"
              disabled={isInactive}
            >
              Vacaciones y Ausencias
            </TabsTrigger>
            <TabsTrigger 
              value="documentos" 
              className="rounded-full px-6 py-2.5 text-sm font-medium transition-all data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:shadow-sm hover:bg-muted/50"
              disabled={isInactive}
            >
              Documentos
            </TabsTrigger>
            <TabsTrigger 
              value="rol-permisos" 
              className="rounded-full px-6 py-2.5 text-sm font-medium transition-all data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:shadow-sm hover:bg-muted/50"
              disabled={isInactive}
            >
              Rol y Permisos
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger 
                value="sistema-usuarios" 
                className="rounded-full px-6 py-2.5 text-sm font-medium transition-all data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:shadow-sm hover:bg-muted/50"
                disabled={isInactive}
              >
                Sistema & Usuarios
              </TabsTrigger>
            )}
          </TabsList>

          {/* Datos Personales Tab */}
          <TabsContent value="datos-personales" className={`space-y-6 ${isInactive ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                  <span className="text-orange-600 text-sm">📄</span>
                </div>
                <h2 className="text-xl font-semibold text-foreground">Información Personal</h2>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-primary hover:text-primary/80"
                onClick={() => setIsEditDialogOpen(true)}
                disabled={isInactive}
              >
                Editar Información
              </Button>
            </div>

            {/* Mensajes de invitación condicionales */}
            {!colaborador.email && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-blue-700">
                  Para invitar a {colaborador.nombre} a unirse a tu equipo, introduce su dirección de correo electrónico
                </p>
              </div>
            )}

            {colaborador.email && inviteStatus === 'none' && (isAdmin || role === 'super_admin') && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-blue-700">
                    {colaborador.nombre} no ha sido invitado a TurnoSmart.app y no tiene acceso a su cuenta
                  </p>
                </div>
                <Button 
                  variant="secondary" 
                  size="sm"
                  className="ml-4 flex-shrink-0"
                  onClick={handleInviteColaborador}
                  disabled={isInviting}
                >
                  {isInviting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    `Invitar a ${colaborador.nombre}`
                  )}
                </Button>
              </div>
            )}

            {colaborador.email && inviteStatus === 'pending' && (isAdmin || role === 'super_admin') && pendingInvite && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-amber-700 font-medium">
                      Invitación enviada a {colaborador.email}
                    </p>
                    <p className="text-xs text-amber-600 mt-1">
                      Enviada el {new Date(pendingInvite.created_at).toLocaleDateString('es-ES', { 
                        day: 'numeric', 
                        month: 'long', 
                        year: 'numeric' 
                      })}. Esperando que {colaborador.nombre} acepte la invitación.
                    </p>
                  </div>
                </div>
                <Button 
                  variant="secondary" 
                  size="sm"
                  className="ml-4 flex-shrink-0"
                  onClick={handleResendInvite}
                  disabled={isInviting}
                >
                  {isInviting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Reenviando...
                    </>
                  ) : (
                    'Reenviar invitación'
                  )}
                </Button>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Estado Civil */}
              <NotionCard className="p-6">
                <h3 className="text-base font-semibold text-foreground mb-4">Estado Civil</h3>
                <div className="space-y-4">
                  {colaborador.fecha_nacimiento && (
                    <div className="flex justify-between items-center">
                      <Label className="text-sm text-muted-foreground">Fecha de Nacimiento</Label>
                      <span className="text-sm text-foreground">
                        {new Date(colaborador.fecha_nacimiento).toLocaleDateString('es-ES')}
                      </span>
                    </div>
                  )}
                  {(colaborador.pais_nacimiento || colaborador.ciudad_nacimiento) && (
                    <div className="flex justify-between items-center">
                      <Label className="text-sm text-muted-foreground">Lugar de nacimiento</Label>
                      <span className="text-sm text-foreground">
                        {[colaborador.ciudad_nacimiento, colaborador.pais_nacimiento].filter(Boolean).join(', ')}
                      </span>
                    </div>
                  )}
                  {(colaborador.nacionalidad || colaborador.es_extranjero !== undefined) && (
                    <div className="flex justify-between items-center">
                      <Label className="text-sm text-muted-foreground">Nacionalidad</Label>
                      <span className="text-sm text-foreground">
                        {colaborador.nacionalidad || (colaborador.es_extranjero ? 'Extranjero' : 'Español')}
                      </span>
                    </div>
                  )}
                  {colaborador.numero_seguridad_social && (
                    <div className="flex justify-between items-center">
                      <Label className="text-sm text-muted-foreground">Número de Seguro Social</Label>
                      <span className="text-sm text-foreground">
                        {colaborador.numero_seguridad_social}
                      </span>
                    </div>
                  )}
                  {colaborador.minusvalia !== undefined && (
                    <div className="flex justify-between items-center">
                      <Label className="text-sm text-muted-foreground">Minusvalía</Label>
                      <span className="text-sm text-foreground">
                        {colaborador.minusvalia ? 'Sí' : 'No'}
                      </span>
                    </div>
                  )}
                  {colaborador.genero && (
                    <div className="flex justify-between items-center">
                      <Label className="text-sm text-muted-foreground">Género</Label>
                      <span className="text-sm text-foreground">
                        {colaborador.genero}
                      </span>
                    </div>
                  )}
                  {colaborador.apellidos_nacimiento && (
                    <div className="flex justify-between items-center">
                      <Label className="text-sm text-muted-foreground">Apellidos de Nacimiento</Label>
                      <span className="text-sm text-foreground">
                        {colaborador.apellidos_nacimiento}
                      </span>
                    </div>
                  )}
                  {colaborador.estado_civil && (
                    <div className="flex justify-between items-center">
                      <Label className="text-sm text-muted-foreground">Estado Civil</Label>
                      <span className="text-sm text-foreground">
                        {colaborador.estado_civil}
                      </span>
                    </div>
                  )}
                  {colaborador.numero_personas_dependientes && (
                    <div className="flex justify-between items-center">
                      <Label className="text-sm text-muted-foreground">Personas Dependientes</Label>
                      <span className="text-sm text-foreground">
                        {colaborador.numero_personas_dependientes}
                      </span>
                    </div>
                  )}
                  {colaborador.fecha_antiguedad && (
                    <div className="flex justify-between items-center">
                      <Label className="text-sm text-muted-foreground">Fecha de Antigüedad</Label>
                      <span className="text-sm text-foreground">
                        {new Date(colaborador.fecha_antiguedad).toLocaleDateString('es-ES')}
                      </span>
                    </div>
                  )}
                  {colaborador.es_extranjero && colaborador.trabajador_extranjero_permiso !== undefined && (
                    <div className="flex justify-between items-center">
                      <Label className="text-sm text-muted-foreground">Trabajador Extranjero con Permiso</Label>
                      <span className="text-sm text-foreground">
                        {colaborador.trabajador_extranjero_permiso ? 'Sí' : 'No'}
                      </span>
                    </div>
                  )}
                </div>
              </NotionCard>

              {/* Información de Contacto */}
              <NotionCard className="p-6">
                <h3 className="text-base font-semibold text-foreground mb-4">Información de Contacto</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label className="text-sm text-muted-foreground">Correo Electrónico</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-foreground">{colaborador.email}</span>
                      {inviteStatus === 'accepted' && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">
                                Cuenta activa
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                      {inviteStatus === 'pending' && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center">
                                <Info className="h-4 w-4 text-amber-500" />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">
                                Invitación pendiente
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                      {inviteStatus === 'none' && (isAdmin || role === 'super_admin' || role === 'admin') && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-6 px-2 text-xs"
                          onClick={handleInviteColaborador}
                          disabled={isInviting}
                        >
                          {isInviting ? 'Enviando...' : 'Invitar'}
                        </Button>
                      )}
                    </div>
                  </div>
                  {colaborador.telefono_fijo && (
                    <div className="flex justify-between items-center">
                      <Label className="text-sm text-muted-foreground">Teléfono Fijo</Label>
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-muted px-2 py-1 rounded">
                          {getPhoneCode(colaborador.pais_fijo || 'ES')}
                        </span>
                        <span className="text-sm text-foreground">
                          {colaborador.telefono_fijo}
                        </span>
                      </div>
                    </div>
                  )}
                  {colaborador.telefono_movil && (
                    <div className="flex justify-between items-center">
                      <Label className="text-sm text-muted-foreground">Teléfono Móvil</Label>
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-muted px-2 py-1 rounded">
                          {getPhoneCode(colaborador.pais_movil || 'ES')}
                        </span>
                        <span className="text-sm text-foreground">
                          {colaborador.telefono_movil}
                        </span>
                      </div>
                    </div>
                  )}
                  {colaborador.direccion && (
                    <div className="flex justify-between items-center">
                      <Label className="text-sm text-muted-foreground">Dirección</Label>
                      <span className="text-sm text-foreground">
                        {colaborador.direccion}
                      </span>
                    </div>
                  )}
                  {colaborador.ciudad && (
                    <div className="flex justify-between items-center">
                      <Label className="text-sm text-muted-foreground">Ciudad</Label>
                      <span className="text-sm text-foreground">
                        {colaborador.ciudad}
                      </span>
                    </div>
                  )}
                  {colaborador.codigo_postal && (
                    <div className="flex justify-between items-center">
                      <Label className="text-sm text-muted-foreground">Código Postal</Label>
                      <span className="text-sm text-foreground">
                        {colaborador.codigo_postal}
                      </span>
                    </div>
                  )}
                  {colaborador.provincia && (
                    <div className="flex justify-between items-center">
                      <Label className="text-sm text-muted-foreground">Provincia</Label>
                      <span className="text-sm text-foreground">
                        {colaborador.provincia}
                      </span>
                    </div>
                  )}
                  {colaborador.pais_residencia && (
                    <div className="flex justify-between items-center">
                      <Label className="text-sm text-muted-foreground">País de Residencia</Label>
                      <span className="text-sm text-foreground">
                        {colaborador.pais_residencia}
                      </span>
                    </div>
                  )}
                </div>
              </NotionCard>
            </div>

            {/* Información de Salud */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <NotionCard className="p-6">
                <h3 className="text-base font-semibold text-foreground mb-4">Información de Salud</h3>
                <div className="space-y-4">
                  {colaborador.ultima_revision_medica && (
                    <div className="flex justify-between items-center">
                      <Label className="text-sm text-muted-foreground">Última Revisión Médica</Label>
                      <span className="text-sm text-foreground">
                        {new Date(colaborador.ultima_revision_medica).toLocaleDateString('es-ES')}
                      </span>
                    </div>
                  )}
                  {colaborador.reconocimiento_medico_reforzado !== undefined && (
                    <div className="flex justify-between items-center">
                      <Label className="text-sm text-muted-foreground">Reconocimiento Médico Reforzado</Label>
                      <span className="text-sm text-foreground">
                        {colaborador.reconocimiento_medico_reforzado ? 'Sí' : 'No'}
                      </span>
                    </div>
                  )}
                  {colaborador.ultima_revision_medica && (
                    <div className="flex justify-between items-center">
                      <Label className="text-sm text-muted-foreground">Próxima Cita Médica</Label>
                      <span className="text-sm text-blue-600 underline cursor-pointer">
                        {(() => {
                          const lastReview = new Date(colaborador.ultima_revision_medica);
                          const yearsToAdd = colaborador.reconocimiento_medico_reforzado ? 3 : 5;
                          const nextAppointment = new Date(lastReview);
                          nextAppointment.setFullYear(lastReview.getFullYear() + yearsToAdd);
                          return `Antes del ${nextAppointment.toLocaleDateString('es-ES')}`;
                        })()}
                      </span>
                    </div>
                  )}
                  {colaborador.exonerado_seguro_medico !== undefined && (
                    <div className="flex justify-between items-center">
                      <Label className="text-sm text-muted-foreground">Exonerado Seguro Médico</Label>
                      <span className="text-sm text-foreground">
                        {colaborador.exonerado_seguro_medico ? 'Sí' : 'No'}
                      </span>
                    </div>
                  )}
                </div>
              </NotionCard>

              {(colaborador.contacto_emergencia_nombre || colaborador.contacto_emergencia_apellidos || 
                colaborador.contacto_emergencia_relacion || colaborador.contacto_emergencia_movil || 
                colaborador.contacto_emergencia_fijo) && (
                <NotionCard className="p-6">
                  <h3 className="text-base font-semibold text-foreground mb-4">Contacto de Emergencia</h3>
                  <div className="space-y-4">
                    {colaborador.contacto_emergencia_nombre && (
                      <div className="flex justify-between items-center">
                        <Label className="text-sm text-muted-foreground">Nombre</Label>
                        <span className="text-sm text-foreground">
                          {colaborador.contacto_emergencia_nombre}
                        </span>
                      </div>
                    )}
                    {colaborador.contacto_emergencia_apellidos && (
                      <div className="flex justify-between items-center">
                        <Label className="text-sm text-muted-foreground">Apellidos</Label>
                        <span className="text-sm text-foreground">
                          {colaborador.contacto_emergencia_apellidos}
                        </span>
                      </div>
                    )}
                    {colaborador.contacto_emergencia_relacion && (
                      <div className="flex justify-between items-center">
                        <Label className="text-sm text-muted-foreground">Relación</Label>
                        <span className="text-sm text-foreground">
                          {colaborador.contacto_emergencia_relacion}
                        </span>
                      </div>
                    )}
                    {colaborador.contacto_emergencia_movil && (
                      <div className="flex justify-between items-center">
                        <Label className="text-sm text-muted-foreground">Teléfono Móvil</Label>
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-muted px-2 py-1 rounded">
                            {colaborador.codigo_pais_movil_emergencia || '+34'}
                          </span>
                          <span className="text-sm text-foreground">
                            {colaborador.contacto_emergencia_movil}
                          </span>
                        </div>
                      </div>
                    )}
                    {colaborador.contacto_emergencia_fijo && (
                      <div className="flex justify-between items-center">
                        <Label className="text-sm text-muted-foreground">Teléfono Fijo</Label>
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-muted px-2 py-1 rounded">
                            {colaborador.codigo_pais_fijo_emergencia || '+34'}
                          </span>
                          <span className="text-sm text-foreground">
                            {colaborador.contacto_emergencia_fijo}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </NotionCard>
              )}
            </div>

          </TabsContent>

          {/* Contratos Tab */}
          <TabsContent value="contratos" className={isInactive ? 'opacity-50 pointer-events-none' : ''}>
            <div className="space-y-6">
              <h3 className="text-lg font-medium mb-6">Contratos</h3>
              
              {/* Verificar si tiene información de contrato */}
              {colaborador?.tipo_contrato ? (
                <>
                  {/* Layout cuando SÍ tiene tipo de contrato */}
                  <div className="space-y-6">
                    <NotionCard className="p-6">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                          <h4 className="text-base font-medium">Contrato actual</h4>
                        </div>
                        {isAdmin && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm" className="text-blue-600 border-blue-600">
                                ⚙️ Acciones ▼
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem 
                                className="text-blue-600"
                                onClick={() => setIsContractDetailsOpen(true)}
                              >
                                👁️ Ver detalles
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-blue-600"
                                onClick={() => setIsEditContractOpen(true)}
                              >
                                ✏️ Declarar un cambio
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-red-600"
                                onClick={() => setIsTerminateContractOpen(true)}
                              >
                                🗑️ Terminar el contrato
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                      
                      <div className="space-y-4">
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <Label className="text-sm font-medium text-gray-700">Tipo</Label>
                          <span className="text-sm text-gray-900">
                            {colaborador.tipo_contrato || 'Sin especificar'}
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <Label className="text-sm font-medium text-gray-700">Inicio del contrato</Label>
                          <span className="text-sm text-gray-900">
                            {colaborador.fecha_inicio_contrato ? 
                              new Date(colaborador.fecha_inicio_contrato).toLocaleDateString('es-ES', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              }) : 
                              'No especificado'
                            }
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <Label className="text-sm font-medium text-gray-700">Remuneración</Label>
                          <span className="text-sm text-gray-500">
                            No especificado
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <Label className="text-sm font-medium text-gray-700">Horas de trabajo semanales</Label>
                          <span className="text-sm text-gray-900">
                            {colaborador.tiempo_trabajo_semanal || 40} horas
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <Label className="text-sm font-medium text-gray-700">Número de días laborables por semana</Label>
                          <span className="text-sm text-gray-900">
                            {colaborador.tiempo_trabajo_semanal ? 
                              Math.ceil((colaborador.tiempo_trabajo_semanal / 8)) : 
                              5
                            } días
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center py-2">
                          <Label className="text-sm font-medium text-gray-700">Disponibilidad</Label>
                          <span className="text-sm text-gray-900">
                            {(() => {
                              if (!colaborador.disponibilidad_semanal) return "No especificado";
                              try {
                                const disponibilidad = typeof colaborador.disponibilidad_semanal === 'string' 
                                  ? JSON.parse(colaborador.disponibilidad_semanal)
                                  : colaborador.disponibilidad_semanal;
                                
                                if (!Array.isArray(disponibilidad) || disponibilidad.length === 0) {
                                  return "No especificado";
                                }
                                
                                // Ordenar los días de lunes a domingo
                                const ordenDias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
                                const diasOrdenados = disponibilidad
                                  .filter(dia => ordenDias.includes(dia))
                                  .sort((a, b) => ordenDias.indexOf(a) - ordenDias.indexOf(b));
                                
                                return diasOrdenados.join(', ');
                              } catch {
                                return "No especificado";
                              }
                            })()}
                          </span>
                        </div>
                      </div>
                    </NotionCard>

                    {/* Información Laboral */}
                    <NotionCard className="p-6">
                      <div className="flex items-center gap-2 mb-6">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <h4 className="text-base font-medium">Información Laboral</h4>
                      </div>
                      
                      <div className="space-y-4">
                         <div className="flex justify-between items-center py-2 border-b border-gray-100">
                           <Label className="text-sm font-medium text-gray-700">Puesto de Trabajo</Label>
                           <span className="text-sm text-gray-900">
                             {displayColaborador?.jobs?.title || 'Sin puesto asignado'}
                           </span>
                         </div>
                         
                         <div className="flex justify-between items-center py-2 border-b border-gray-100">
                           <Label className="text-sm font-medium text-gray-700">Departamentos Asignados</Label>
                           <span className="text-sm text-gray-900">
                             {teamAssignments.length > 0 
                               ? teamAssignments.map(assignment => assignment.department_name).join(', ')
                               : displayColaborador?.jobs?.department || 'Sin especificar'
                             }
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center py-2">
                          <Label className="text-sm font-medium text-gray-700">ID Empleado</Label>
                          <span className="text-sm text-gray-900">
                            {colaborador.empleado_id || 'Sin asignar'}
                          </span>
                        </div>
                      </div>
                    </NotionCard>

                  </div>
                </>
              ) : (
                <>
                  {/* Layout cuando NO tiene tipo de contrato */}
                  <div className="space-y-6">
                    {/* Notificación azul */}
                    <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs">ℹ</span>
                      </div>
                      <span className="text-blue-700 text-sm">
                        1 nuevos contratos están por venir.
                      </span>
                    </div>

                    {/* Card de contrato actual */}
                    <NotionCard className="p-6">
                      <div className="flex items-center gap-2 mb-6">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        <h4 className="text-base font-medium">Contrato actual</h4>
                      </div>
                      
                      <div className="text-center py-16">
                        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <p className="text-gray-600 text-sm mb-6">No hay contrato en curso...</p>
                        <Button className="bg-black text-white hover:bg-gray-800 px-6">
                          Crear un contrato
                        </Button>
                      </div>
                    </NotionCard>
                  </div>
                </>
              )}
            </div>
          </TabsContent>

          {/* Tiempo y Planificación Tab */}
          <TabsContent value="tiempo-planificacion" className={`space-y-6 ${isInactive ? 'opacity-50 pointer-events-none' : ''}`}>
            {/* Acceso y planificación */}
            <NotionCard className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                  <span className="text-orange-600 text-sm">📅</span>
                </div>
                <h2 className="text-xl font-semibold text-foreground">Acceso y planificación</h2>
              </div>

              <div className="space-y-4">
                {/* Acceso a los equipos */}
                <div className="border border-border/30 rounded-lg">
                  <div 
                    className="flex items-center justify-between p-4 hover:bg-muted/10 transition-colors cursor-pointer"
                    onClick={() => setIsAccessMenuExpanded(!isAccessMenuExpanded)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-muted/30 flex items-center justify-center">
                        <span className="text-muted-foreground text-sm">👁️</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground">Acceso a los equipos</h4>
                        <p className="text-sm text-muted-foreground">Da al empleado visibilidad sobre más equipos. Necesario para la planificación.</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      {isAccessMenuExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </Button>
                  </div>

                  {/* Menú expandible de acceso generalizado */}
                  {isAccessMenuExpanded && (
                    <div className="border-t border-border/30 p-6 bg-muted/5">
                      {/* Acceso Generalizado con toggle */}
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h5 className="font-medium text-foreground mb-1">Acceso Generalizado</h5>
                          <p className="text-xs text-muted-foreground">
                            Habilite el acceso generalizado para que este usuario pueda ver los horarios de todas las ubicaciones y equipos.
                          </p>
                        </div>
                        <Switch
                          checked={generalizedAccess}
                          disabled={savingGeneralizedAccess}
                          onCheckedChange={handleGeneralizedAccessToggle}
                          className="ml-4"
                        />
                      </div>
                      
                      {/* Botón Editar Acceso */}
                      <div className="flex justify-end mt-4 mb-6">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          disabled={generalizedAccess}
                          onClick={() => setIsAccessManagementOpen(true)}
                          className="text-sm h-8 px-3"
                        >
                          Editar Acceso
                        </Button>
                      </div>

                      {/* Tabla de Establecimiento y Equipos */}
                      <div className="grid grid-cols-2 gap-8">
                        <div>
                          <h6 className="text-sm font-semibold text-foreground mb-3">Establecimiento</h6>
                          <p className="text-sm text-foreground">
                            {organizations.find(org => org.id === colaborador.org_id)?.name || 'Sin asignar'}
                          </p>
                        </div>
                        <div>
                          <h6 className="text-sm font-semibold text-foreground mb-3">Equipos</h6>
                          <p className="text-sm text-foreground">
                            {teamAssignments.length > 0 
                              ? teamAssignments
                                  .filter(assignment => assignment.has_job || teamAssignments.length === 1)
                                  .map(assignment => assignment.department_name)
                                  .join(', ')
                              : 'Sin asignar'
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Turnos en el planning */}
                <div className="border border-border/30 rounded-lg">
                  <div 
                    className="flex items-center justify-between p-4 hover:bg-muted/10 transition-colors cursor-pointer"
                    onClick={() => setIsPlanningMenuExpanded(!isPlanningMenuExpanded)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-muted/30 flex items-center justify-center">
                        <span className="text-muted-foreground text-sm">📋</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground">Turnos en el planning</h4>
                        <p className="text-sm text-muted-foreground">Permite que el empleado sea programado en varios equipos. Requiere acceso a los equipos mencionados.</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      {isPlanningMenuExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </Button>
                  </div>

                  {/* Menú expandible de empleado planificable */}
                  {isPlanningMenuExpanded && (
                    <div className="border-t border-border/30 p-6 bg-muted/5">
                      {/* Empleado Planificable con toggle */}
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h5 className="font-medium text-foreground mb-1">Empleado planificable</h5>
                          <p className="text-xs text-muted-foreground">
                            Permite que el empleado aparezca en el planning en las fechas de su contrato. Si desactiva esta opción, se ocultará todo el historial de horarios. Para bloquear el acceso al empleado, puede{" "}
                            <button className="text-foreground underline hover:no-underline">
                              suspender su acceso
                            </button>
                          </p>
                        </div>
                        <Switch
                          checked={employeePlannable}
                          onCheckedChange={setEmployeePlannable}
                          className="ml-4"
                        />
                      </div>
                      
                      {/* Botón Editar */}
                      <div className="flex justify-end mt-4 mb-6">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          disabled={!employeePlannable}
                          onClick={() => setIsPlanningConfigOpen(true)}
                          className="text-sm h-8 px-3"
                        >
                          <Edit className="w-3 h-3 mr-1.5" />
                          Editar
                        </Button>
                      </div>

                      {/* Tabla de Establecimiento y Equipos */}
                      <div className="grid grid-cols-2 gap-8">
                        <div>
                          <h6 className="text-sm font-semibold text-foreground mb-3">Establecimiento</h6>
                          <p className="text-sm text-foreground">
                            {organizations.find(org => org.id === colaborador.org_id)?.name || 'Sin asignar'}
                          </p>
                        </div>
                        <div>
                          <h6 className="text-sm font-semibold text-foreground mb-3">Equipos</h6>
                          <p className="text-sm text-foreground">
                            {teamAssignments.length > 0 
                              ? teamAssignments
                                  .filter(assignment => assignment.has_job || teamAssignments.length === 1)
                                  .map(assignment => assignment.department_name)
                                  .join(', ')
                              : 'Sin asignar'
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </NotionCard>

            {/* Horas Trabajadas y Disponibilidad */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Horas Trabajadas */}
              <NotionCard className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-orange-100 flex items-center justify-center">
                      <span className="text-orange-600 text-xs">📊</span>
                    </div>
                    <h3 className="text-base font-semibold text-foreground">Horas Trabajadas</h3>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-primary hover:text-primary/80"
                    onClick={() => navigate(`/colaboradores/${colaborador.id}/tiempo-trabajo`)}
                  >
                    <FileText className="w-4 h-4 mr-1" />
                    Ver Historial
                  </Button>
                </div>

                <div className="space-y-3">
                  {/* Header con fondo gris sutil */}
                  <div className="grid grid-cols-2 bg-muted/30 p-3 rounded-lg">
                    <span className="text-sm font-medium text-foreground">Periodo</span>
                    <span className="text-sm font-medium text-foreground">Horas Trabajadas</span>
                  </div>
                  
                  <div className="text-center py-8">
                    <div className="w-12 h-12 rounded-full bg-muted/30 flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">🔍</span>
                    </div>
                    <p className="text-center text-muted-foreground text-sm">
                      Puede ver las últimas hojas de asistencia de<br />
                      {colaborador.nombre} {colaborador.apellidos} aquí
                    </p>
                  </div>
                </div>
              </NotionCard>

              {/* Disponibilidad */}
              <NotionCard className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-orange-100 flex items-center justify-center">
                      <span className="text-orange-600 text-xs">⏰</span>
                    </div>
                    <h3 className="text-base font-semibold text-foreground">Disponibilidad</h3>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-primary hover:text-primary/80"
                    onClick={() => setIsAvailabilityOpen(true)}
                  >
                    <Settings className="w-4 h-4 mr-1" />
                    Editar
                  </Button>
                </div>

                {(() => {
                  try {
                    const disponibilidad = colaborador.disponibilidad_semanal 
                      ? (typeof colaborador.disponibilidad_semanal === 'string' 
                          ? JSON.parse(colaborador.disponibilidad_semanal)
                          : colaborador.disponibilidad_semanal)
                      : [];
                    
                    const hasAvailability = Array.isArray(disponibilidad) && disponibilidad.length > 0;
                    
                    if (hasAvailability) {
                      const daysOfWeek = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
                      
                      return (
                        <div className="space-y-3">
                          {daysOfWeek.map(day => {
                            const dayData = disponibilidad.find((d: any) => d.day === day);
                            const status = dayData?.status || 'disponible';
                            
                            return (
                              <div key={day} className="flex items-center justify-between py-2 border-b border-border/20 last:border-b-0">
                                <span className="text-sm text-foreground">{day}</span>
                                <div className="flex items-center gap-2">
                                  {status === 'disponible' && (
                                    <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium flex items-center gap-1">
                                      <span>✓</span> Disponible
                                    </span>
                                  )}
                                  {status === 'disponible_parte' && (
                                    <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">
                                      Disponible en parte
                                      {dayData?.timeRange && ` (${dayData.timeRange})`}
                                    </span>
                                  )}
                                  {status === 'no_disponible' && (
                                    <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-medium">
                                      No disponible
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    } else {
                      return (
                        <div className="text-center py-8">
                          <div className="w-12 h-12 rounded-full bg-muted/30 flex items-center justify-center mx-auto mb-4">
                            <span className="text-2xl">🔍</span>
                          </div>
                          <p className="text-center text-muted-foreground text-sm">
                            Ninguna disponibilidad configurada para<br />
                            {colaborador.nombre} {colaborador.apellidos}
                          </p>
                        </div>
                      );
                    }
                  } catch (error) {
                    console.error('Error rendering availability:', error);
                    return (
                      <div className="text-center py-8">
                        <p className="text-center text-muted-foreground text-sm">
                          Error al cargar la disponibilidad
                        </p>
                      </div>
                    );
                  }
                })()}
              </NotionCard>
            </div>

          </TabsContent>

          {/* Vacaciones y Ausencias Tab */}
          <TabsContent value="vacaciones-ausencias" className={`space-y-6 ${isInactive ? 'opacity-50 pointer-events-none' : ''}`}>
            {/* Tarjetas superiores - deshabilitadas para Employee */}
            <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 ${role === 'user' ? 'opacity-50 pointer-events-none' : ''}`}>
              {/* Compensación de horas extras */}
              <NotionCard className="p-6 cursor-pointer hover:bg-muted/20 transition-colors" onClick={() => setShowCompensatoryTimeOff(true)}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Compensación de horas extras</p>
                    <p className="text-2xl font-bold">
                      {compensatoryLoading ? "..." : `${compensatoryBalance}h`}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm">
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </NotionCard>

              {/* Recuperación de Días Festivos */}
              <NotionCard className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Recuperación de Días Festivos</p>
                    <p className="text-2xl font-bold">0h</p>
                  </div>
                  <Button variant="ghost" size="sm">
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </NotionCard>
            </div>

            {/* Solicitudes de Ausencia */}
            <NotionCard className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                    <span className="text-orange-600 text-sm">☀️</span>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">Solicitudes de Ausencia</h3>
                </div>
                <Button 
                  variant="outline" 
                  className="text-primary border-primary hover:bg-primary/10"
                  onClick={() => {
                    const colaboradorFullName = colaborador ? `${colaborador.nombre} ${colaborador.apellidos}` : '';
                    navigate(`/ausencias/request/new?colaborador=${encodeURIComponent(colaboradorFullName)}`);
                  }}
                >
                  + Nueva Solicitud de Ausencia
                </Button>
              </div>

              {/* Tabla header */}
              <div className="grid grid-cols-4 bg-muted/30 p-3 rounded-lg mb-4">
                <span className="text-sm font-medium text-foreground">Fecha(s) de Ausencia</span>
                <span className="text-sm font-medium text-foreground">Número de Días</span>
                <span className="text-sm font-medium text-foreground">Tipo</span>
                <span className="text-sm font-medium text-foreground">Estado</span>
              </div>

              {/* Solicitudes del colaborador */}
              <EmployeeAbsenceRequests 
                colaboradorName={colaborador ? `${colaborador.nombre} ${colaborador.apellidos}` : ''}
                colaboradorId={colaborador?.id || ''}
              />
            </NotionCard>
          </TabsContent>

          {/* Documentos Tab */}
          <TabsContent value="documentos" className={isInactive ? 'opacity-50 pointer-events-none' : ''}>
            <NotionCard className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                    <span className="text-orange-600 text-sm">📄</span>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">Documentos</h3>
                </div>
                <Button variant="outline" className="text-primary border-primary hover:bg-primary/10">
                  Importar un documento
                </Button>
              </div>

              {/* Tabla header */}
              <div className="grid grid-cols-3 bg-muted/30 p-3 rounded-lg mb-4">
                <span className="text-sm font-medium text-foreground">Documento</span>
                <span className="text-sm font-medium text-foreground">Fecha</span>
                <span className="text-sm font-medium text-foreground">Añadido por</span>
              </div>

              {/* Empty state */}
              <div className="text-center py-12">
                <div className="w-12 h-12 rounded-full bg-muted/30 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🔍</span>
                </div>
                <p className="text-center text-foreground font-medium text-sm mb-1">
                  No hay documentos por aquí
                </p>
                <p className="text-center text-muted-foreground text-sm">
                  Añade tu primer documento y haz que se firme fácilmente
                </p>
              </div>
            </NotionCard>
          </TabsContent>

          {/* Rol y Permisos Tab */}
          <TabsContent value="rol-permisos" className={`${isInactive || role === 'user' ? 'opacity-50 pointer-events-none' : ''}`}>
            <Card>
              <CardContent className="p-6 space-y-8">
                {/* Sección Cuenta */}
                <div className="bg-muted/20 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-6">Cuenta</h3>
                  
                  <div className="flex items-center justify-between p-4 border border-border/30 rounded-lg bg-background">
                    <div>
                      <h4 className="font-medium text-foreground">Acceso a la cuenta</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        La desactivación del empleado le impide conectarse a su cuenta. Si su contrato sigue activo, seguirá recibiendo sus horarios por correo electrónico.
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-6">Rol y permisos</h3>
                  
                </div>

                {/* Roles y permisos */}
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                        <span className="text-orange-600 text-sm">🔒</span>
                      </div>
                      <h3 className="text-lg font-semibold text-foreground">Rol y Permisos</h3>
                    </div>
                    <div className="flex items-center gap-3">
                      {isAdmin && (
                        <Button
                          onClick={() => setIsRoleManagementOpen(true)}
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2"
                        >
                          <Edit className="h-4 w-4" />
                          Cambiar Rol
                        </Button>
                      )}
                      {!isAdmin && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 flex items-center gap-2">
                          <span className="text-amber-600 text-sm">🔒</span>
                          <span className="text-sm text-amber-800">Solo administradores pueden modificar permisos</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                    {/* Empleado */}
                    <div className={`rounded-lg p-4 hover:bg-muted/10 transition-colors ${
                      selectedRole === "empleado" 
                        ? "border-2 border-primary bg-primary/5" 
                        : "border border-border/20"
                    }`}>
                      <div className="flex items-start gap-3">
                        <input 
                          type="radio" 
                          name="rol" 
                          id="empleado" 
                          className="mt-1" 
                           checked={selectedRole === "empleado"}
                          onChange={async () => {
                            setSelectedRole("empleado");
                            await handleRoleChange("empleado");
                          }}
                        />
                        <div>
                          <label htmlFor="empleado" className="font-medium text-foreground cursor-pointer">Empleado</label>
                          <p className="text-sm text-muted-foreground mt-1">
                            Rol predeterminado que permite acceder a la plataforma como empleado.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Manager */}
                    <div className={`rounded-lg p-4 hover:bg-muted/10 transition-colors ${
                      selectedRole === "manager" 
                        ? "border-2 border-primary bg-primary/5" 
                        : "border border-border/20"
                    }`}>
                      <div className="flex items-start gap-3">
                        <input 
                          type="radio" 
                          name="rol" 
                          id="manager" 
                          className="mt-1" 
                          checked={selectedRole === "manager"}
                          onChange={async () => {
                            setSelectedRole("manager");
                            await handleRoleChange("manager");
                          }}
                        />
                        <div>
                          <label htmlFor="manager" className="font-medium text-foreground cursor-pointer">Manager</label>
                          <p className="text-sm text-muted-foreground mt-1">
                            Supervisa un equipo creando horarios o gestionando ausencias.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Director */}
                    <div className={`rounded-lg p-4 hover:bg-muted/10 transition-colors ${
                      selectedRole === "director" 
                        ? "border-2 border-primary bg-primary/5" 
                        : "border border-border/20"
                    }`}>
                      <div className="flex items-start gap-3">
                        <input 
                          type="radio" 
                          name="rol" 
                          id="director" 
                          className="mt-1" 
                          checked={selectedRole === "director"}
                          onChange={async () => {
                            setSelectedRole("director");
                            await handleRoleChange("director");
                          }}
                        />
                        <div>
                          <label htmlFor="director" className="font-medium text-foreground cursor-pointer">Director</label>
                          <p className="text-sm text-muted-foreground mt-1">
                            Administra un establecimiento desde la configuración hasta la pre-nómina.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Administrador */}
                    <div className={`rounded-lg p-4 hover:bg-muted/10 transition-colors ${
                      selectedRole === "administrador" 
                        ? "border-2 border-primary bg-primary/5" 
                        : "border border-border/20"
                    }`}>
                      <div className="flex items-start gap-3">
                        <input 
                          type="radio" 
                          name="rol" 
                          id="administrador" 
                          className="mt-1" 
                          checked={selectedRole === "administrador"}
                          onChange={async () => {
                            setSelectedRole("administrador");
                            await handleRoleChange("administrador");
                          }}
                        />
                        <div>
                          <label htmlFor="administrador" className="font-medium text-foreground cursor-pointer">Administrador</label>
                          <p className="text-sm text-muted-foreground mt-1">
                            Puede acceder a toda la aplicación.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Propietario */}
                    <div className={`rounded-lg p-4 ${
                      selectedRole === "propietario" 
                        ? "border-2 border-primary bg-primary/5" 
                        : "border border-border/20"
                    }`}>
                      <div className="flex items-start gap-3">
                        <input 
                          type="radio" 
                          name="rol" 
                          id="propietario" 
                          className="mt-1" 
                          checked={selectedRole === "propietario"}
                          onChange={async () => {
                            setSelectedRole("propietario");
                            await handleRoleChange("propietario");
                          }}
                        />
                        <div>
                          <label htmlFor="propietario" className="font-medium text-foreground cursor-pointer">Propietario</label>
                          <p className="text-sm text-muted-foreground mt-1">
                            El titular de la cuenta puede modificar los derechos de un admin.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Planificación */}
                <div className="bg-muted/20 rounded-lg p-6">
                  <h4 className="font-medium mb-6 text-foreground">Planificación</h4>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm text-foreground">Acceso a la planificación publicada de sus equipos/ubicaciones</span>
                      {getCheckmarkComponent("acceso_planificacion_publicada_equipos")}
                    </div>
                    
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm text-foreground">Acceso a la planificación no publicada (borrador)</span>
                      {getCheckmarkComponent("acceso_planificacion_no_publicada")}
                    </div>
                    
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm text-foreground">Acceso a la planificación publicada de otros equipos/ubicaciones</span>
                      {getCheckmarkComponent("acceso_planificacion_otros_equipos")}
                    </div>
                    
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm text-foreground">Visualización de alertas y contadores</span>
                      {getCheckmarkComponent("visualizacion_alertas")}
                    </div>
                    
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm text-foreground">Creación, modificación y publicación de planificación</span>
                      {getCheckmarkComponent("creacion_modificacion_planificacion")}
                    </div>
                    
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm text-foreground">Puede editar las planificaciones publicadas y validar los turnos de su ubicación</span>
                      {getCheckmarkComponent("editar_planificaciones_publicadas")}
                    </div>
                    
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm text-foreground">Visualización de ratios de análisis</span>
                      {getCheckmarkComponent("visualizacion_ratios")}
                    </div>
                  </div>
                </div>

                {/* Gestión de Horas */}
                <div className="bg-muted/20 rounded-lg p-6">
                  <h4 className="font-medium mb-6 text-foreground">Gestión de Horas</h4>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-2 border-b border-border/20">
                      <span className="text-sm text-foreground">Guardar sus propias horas de trabajo</span>
                      {getCheckmarkComponent("guardar_propias_horas")}
                    </div>
                    
                    <div className="flex items-center justify-between py-2 border-b border-border/20">
                      <span className="text-sm text-foreground">Ingresar las horas reales de su equipo/ubicación</span>
                      {getCheckmarkComponent("ingresar_horas_equipo")}
                    </div>
                    
                    <div className="flex items-center justify-between py-2 border-b border-border/20">
                      <span className="text-sm text-foreground">Puede validar sus propias horas reales</span>
                      {getCheckmarkComponent("validar_propias_horas")}
                    </div>
                    
                    <div className="flex items-center justify-between py-2 border-b border-border/20">
                      <span className="text-sm text-foreground">Ingresar las horas reales de todos los equipos/ubicaciones</span>
                      {getCheckmarkComponent("ingresar_horas_todos_equipos")}
                    </div>
                    
                    <div className="flex items-center justify-between py-2 border-b border-border/20">
                      <span className="text-sm text-foreground">Puede anular la validación de horas reales</span>
                      {getCheckmarkComponent("anular_validacion_horas")}
                    </div>
                    
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm text-foreground">Puede revalorizar ausencias</span>
                      {getCheckmarkComponent("revalorizar_ausencias")}
                    </div>
                  </div>
                </div>

                {/* Perfil de Usuario */}
                <div className="bg-muted/20 rounded-lg p-6">
                  <h4 className="font-medium mb-6 text-foreground">Perfil de Usuario</h4>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-2 border-b border-border/20">
                      <span className="text-sm text-foreground">Puede acceder a su propio perfil de usuario</span>
                      {getCheckmarkComponent("acceso_propio_perfil")}
                    </div>
                    
                    <div className="flex items-center justify-between py-2 border-b border-border/20">
                      <span className="text-sm text-foreground">Puede modificar su información personal y detalles de contacto</span>
                      {getCheckmarkComponent("modificar_informacion_personal")}
                    </div>
                    
                    <div className="flex items-center justify-between py-2 border-b border-border/20">
                      <span className="text-sm text-foreground">Puede consultar sus propias hojas de asistencia</span>
                      {getCheckmarkComponent("consultar_propias_hojas")}
                    </div>
                    
                    <div className="flex items-center justify-between py-2 border-b border-border/20">
                      <span className="text-sm text-foreground">Acceso al perfil de empleados de mi equipo o ubicación</span>
                      {getCheckmarkComponent("acceso_perfil_empleados_equipo")}
                    </div>
                    
                    <div className="flex items-center justify-between py-2 border-b border-border/20">
                      <span className="text-sm text-foreground">Acceso a los perfiles de los managers de mi equipo o establecimiento</span>
                      {getCheckmarkComponent("acceso_perfiles_managers")}
                    </div>
                    
                    <div className="flex items-center justify-between py-2 border-b border-border/20">
                      <span className="text-sm text-foreground">Acceso al perfil de todos los empleados de todas las ubicaciones</span>
                      {getCheckmarkComponent("acceso_perfil_todos_empleados")}
                    </div>
                    
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm text-foreground">Puede eliminar el perfil de un empleado o manager</span>
                      {getCheckmarkComponent("eliminar_perfil_empleado")}
                    </div>
                  </div>
                </div>

                {/* Gestión de Ausencias */}
                <div className="bg-muted/20 rounded-lg p-6">
                  <h4 className="font-medium mb-6 text-foreground">Gestión de Ausencias</h4>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm text-foreground">Puede modificar manualmente los contadores de días de vacaciones pagados</span>
                      {getCheckmarkComponent("modificar_contadores_vacaciones")}
                    </div>
                  </div>
                </div>

                {/* Eliminar cuenta del empleado */}
                <div className="border border-border/30 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-foreground mb-2">Eliminar cuenta del empleado</h4>
                      <p className="text-sm text-muted-foreground mb-1">
                        Borrar permanentemente al empleado de su establecimiento.
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Advertencia, esta operación eliminará permanentemente los datos del empleado.
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      className="bg-muted hover:bg-muted/80 text-muted-foreground"
                      onClick={() => setShowDeleteDialog(true)}
                    >
                      Eliminar Cuenta
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sistema & Usuarios Tab - Solo visible para admins */}
          {isAdmin && (
            <TabsContent value="sistema-usuarios" className={`space-y-6 ${isInactive ? 'opacity-50 pointer-events-none' : ''}`}>
              <UserSystemManagement 
                colaboradorId={colaborador?.id || ''} 
                colaboradorEmail={colaborador?.email || ''} 
              />
            </TabsContent>
          )}
        </Tabs>

        {/* Dialog de confirmación para eliminar */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar colaborador?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción eliminará permanentemente a <strong>{colaborador?.nombre} {colaborador?.apellidos}</strong> de su establecimiento.
                <br /><br />
                <strong>Advertencia:</strong> Esta operación eliminará permanentemente todos los datos del empleado y no se puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>No eliminar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDeleteColaborador}
                disabled={deleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleting ? "Eliminando..." : "Sí, eliminar"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Edit Dialog */}
        <AddColaboradorSheet
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          colaboradorData={colaborador}
          isEditMode={true}
          onColaboradorUpdated={async () => {
            // Force UI update and refresh all data
            setForceRefresh(prev => prev + 1);
            await refetchColaborador();
            
            // Pequeño delay para asegurar que la base de datos se haya actualizado completamente
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Refrescar equipos asignados después del delay
            await refetchTeamAssignments();
            fetchTeamNames();
            fetchContractHistory();
          }}
        />

        {/* Contract Details Sheet */}
        <ContractDetailsSheet
          open={isContractDetailsOpen}
          onOpenChange={setIsContractDetailsOpen}
          colaborador={colaborador}
        />

        {/* Edit Contract Sheet */}
        <EditContractSheet
          open={isEditContractOpen}
          onOpenChange={setIsEditContractOpen}
          colaborador={colaborador}
          onUpdateSuccess={() => {
            refetchColaborador();
          }}
        />

        {/* Terminate Contract Dialog */}
        <TerminateContractDialog
          open={isTerminateContractOpen}
          onOpenChange={setIsTerminateContractOpen}
          colaborador={colaborador}
          onTerminateSuccess={() => {
            window.location.reload();
          }}
        />

        {/* Generalized Access Dialog */}
        <GeneralizedAccessDialog
          open={isAccessDialogOpen}
          onOpenChange={setIsAccessDialogOpen}
          colaboradorId={id || ''}
          colaboradorName={colaborador ? `${colaborador.nombre} ${colaborador.apellidos}` : undefined}
        />

        {/* Employee Planning Config */}
        <EmployeePlanningConfig
          isOpen={isPlanningConfigOpen}
          onClose={() => setIsPlanningConfigOpen(false)}
          onSave={handleDataSync}
          employeeName={colaborador ? `${colaborador.nombre} ${colaborador.apellidos}` : undefined}
          colaboradorId={id}
          onOpenAccessManagement={() => setIsAccessManagementOpen(true)}
          onOpenEditContract={() => setIsEditContractOpen(true)}
        />

        {/* Access Management Dialog */}
        <AccessManagementDialog
          isOpen={isAccessManagementOpen}
          onClose={() => setIsAccessManagementOpen(false)}
          onSave={handleDataSync}
          colaboradorId={id}
          employeeName={colaborador ? `${colaborador.nombre} ${colaborador.apellidos}` : undefined}
          onOpenEditContract={() => setIsEditContractOpen(true)}
        />

        {/* Availability Sheet */}
        <AvailabilitySheet
          open={isAvailabilityOpen}
          onOpenChange={setIsAvailabilityOpen}
          employeeName={colaborador ? `${colaborador.nombre} ${colaborador.apellidos}` : undefined}
          colaboradorId={colaborador?.id}
          currentAvailability={colaborador?.disponibilidad_semanal}
          onSaveSuccess={() => {
            refetchColaborador();
          }}
        />

      </div>

      {/* Show Compensatory Time Off View */}
      {showCompensatoryTimeOff && (
        <div className="fixed inset-0 bg-background z-50 overflow-auto">
          <div className="container mx-auto p-6">
            <CompensatoryTimeOffView 
              onBack={() => setShowCompensatoryTimeOff(false)}
              colaboradorName={colaborador ? `${colaborador.nombre} ${colaborador.apellidos}` : ''}
              colaboradorId={colaborador?.id || ''}
            />
          </div>
        </div>
      )}

      {/* Leave Request Form Sheet */}
      <Sheet open={showAbsenceRequestForm} onOpenChange={setShowAbsenceRequestForm}>
        <SheetContent className="w-[600px] sm:w-[700px] bg-white z-50 overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Solicitud de ausencia</SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            <LeaveRequestFormContent 
              onClose={() => setShowAbsenceRequestForm(false)}
              colaboradorName={colaborador ? `${colaborador.nombre} ${colaborador.apellidos}` : ""}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Role Management Dialog */}
      {displayColaborador && (
        <RoleManagementDialog
          isOpen={isRoleManagementOpen}
          onClose={() => setIsRoleManagementOpen(false)}
          colaborador={{
            id: displayColaborador.id,
            nombre: displayColaborador.nombre,
            apellidos: displayColaborador.apellidos
          }}
          currentRole={selectedRole}
          onRoleUpdated={async () => {
            await fetchCurrentUserRole();
            await refetchColaborador();
            setIsRoleManagementOpen(false);
            toast({
              title: "Rol actualizado",
              description: "El rol ha sido actualizado correctamente"
            });
          }}
        />
      )}
    </MainLayout>
  );
}