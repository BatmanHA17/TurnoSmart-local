import { useState, useEffect } from "react";
import { getInitials } from "@/utils/avatar";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Plus, Search, ChevronDown, Download, ArrowLeft, Check, X, Edit, Calendar } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AddColaboradorSheet } from "@/components/colaboradores/AddColaboradorSheet";
import { RoleManagementDialog } from "@/components/colaboradores/RoleManagementDialog";
import { validateAndCleanCalendarEmployees } from "@/utils/validateCalendarEmployees";
import { useOrganizationsUnified } from "@/hooks/useOrganizationsUnified";
import { OrganizationFilter } from "@/components/filters/OrganizationFilter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUserRoleCanonical } from "@/hooks/useUserRoleCanonical";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { InviteColaboradorDialog } from "@/components/InviteColaboradorDialog";

interface Colaborador {
  id: string;
  nombre: string;
  apellidos: string;
  apellidos_uso?: string;
  empleado_id?: string;
  email: string;
  telefono_movil?: string;
  pais_movil?: string;
  tipo_contrato?: string;
  status: string;
  created_at: string;
  role?: string;
  colaborador_roles?: { role: string }[];
  fecha_inicio_contrato?: string;
  fecha_fin_contrato?: string;
  tiempo_trabajo_semanal?: number;
  job_id?: string;
  jobs?: {
    id: string;
    title: string;
    department?: string;
  };
}

export const ColaboradoresView = () => {
  const { organizations } = useOrganizationsUnified();
  const { currentOrg, loading: orgLoading } = useCurrentOrganization();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { role: userRole } = useUserRoleCanonical();
  const { user } = useAuth();
  
  // Determinar si el usuario es employee
  const isEmployee = userRole === "EMPLOYEE";
  const canEdit = !isEmployee;
  // FASE 6: Migrado a ruta modal /equipo/new
  const [showAddColaborador, setShowAddColaborador] = useState(false); // TODO: Remove after FASE 6 verification
  const [searchTerm, setSearchTerm] = useState("");
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedColaboradores, setSelectedColaboradores] = useState<string[]>([]);
  const [selectedColaboradorForRole, setSelectedColaboradorForRole] = useState<Colaborador | null>(null);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  
  // Estados para filtros
  const [selectedEstablecimiento, setSelectedEstablecimiento] = useState("todos-establecimientos");
  const [selectedTipoContrato, setSelectedTipoContrato] = useState("todos-tipos");
  const [selectedEstadoUsuario, setSelectedEstadoUsuario] = useState("usuarios-activos");
  const [selectedOrden, setSelectedOrden] = useState("ordenar-apellido");
  
  // Verificar si estamos en modo selección (mantenemos por compatibilidad pero no lo usamos para mostrar checkboxes)
  const isSelectionMode = searchParams.get('mode') === 'selection';
  const returnUrl = searchParams.get('return');
  
  // Los checkboxes siempre están visibles ahora
  const showCheckboxes = true;

  // Cargar colaboradores usando la vista unificada
  const fetchColaboradores = async () => {
    if (!currentOrg?.org_id) {
      setColaboradores([]);
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      
      // Obtener colaboradores de la vista unificada FILTRADOS por org_id
      const { data: colaboradoresData, error: colaboradoresError } = await supabase
        .from('colaborador_full')
        .select('*')
        .eq('org_id', currentOrg.org_id)
        .order('updated_at', { ascending: false });

      if (colaboradoresError) {
        console.error('Error fetching colaboradores:', colaboradoresError);
        toast({
          title: "Error",
          description: "No se pudieron cargar los colaboradores",
          variant: "destructive"
        });
        return;
      }

      // Obtener roles activos para cada colaborador
      const colaboradorIds = (colaboradoresData || []).map(c => c.id);
      
      let rolesData: any[] = [];
      if (colaboradorIds.length > 0) {
        const { data: roles } = await supabase
          .from('colaborador_roles')
          .select('colaborador_id, role, departamento')
          .in('colaborador_id', colaboradorIds)
          .eq('activo', true)
          .order('asignado_en', { ascending: false }); // Tomar el más reciente primero
        
        rolesData = roles || [];
      }

      // Fetch job titles for colaboradores that have job_id
      const jobIds = [...new Set(
        (colaboradoresData || [])
          .map(c => c.job_id)
          .filter(Boolean)
      )];

      let jobsMap: Record<string, string> = {};
      if (jobIds.length > 0) {
        const { data: jobsData } = await supabase
          .from('jobs')
          .select('id, title')
          .in('id', jobIds);

        if (jobsData) {
          jobsMap = Object.fromEntries(jobsData.map(j => [j.id, j.title]));
        }
      }

      // Procesar colaboradores con sus roles reales y puestos
      const colaboradoresWithRoles = (colaboradoresData || []).map((colaborador) => {
        const roleRecord = rolesData.find(r => r.colaborador_id === colaborador.id);
        const jobTitle = colaborador.job_id ? jobsMap[colaborador.job_id] : null;
        return {
          ...colaborador,
          role: roleRecord?.role || 'empleado',
          jobs: jobTitle ? { title: jobTitle } : null
        };
      });

      setColaboradores(colaboradoresWithRoles);
      
      // Validar y limpiar colaboradores en el calendario
      validateAndCleanCalendarEmployees(colaboradoresWithRoles);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Error inesperado al cargar los datos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Efecto para cargar datos cuando cambia la organización
  useEffect(() => {
    if (currentOrg?.org_id) {
      fetchColaboradores();
    }
  }, [currentOrg?.org_id]);

  // Función para refrescar datos después de añadir colaborador
  const handleColaboradorAdded = () => {
    // Refrescar inmediatamente y después de un breve delay
    fetchColaboradores();
    setTimeout(() => {
      fetchColaboradores();
    }, 1000);
    setShowAddColaborador(false);
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'propietario': return 'default';
      case 'administrador': return 'destructive'; // Rojo para Admin Principal
      case 'director': return 'secondary';
      case 'manager': return 'outline';
      case 'jefe_departamento': return 'outline'; // Unificado con Manager
      default: return 'outline';
    }
  };

  const getRoleDisplayName = (role: string) => {
    const roleMap: Record<string, string> = {
      propietario: 'Propietario',
      administrador: 'Admin Princ.',
      director: 'Director',
      manager: 'Manager',
      jefe_departamento: 'Manager', // UNIFICADO: Jefe Departamento = Manager
      empleado: 'Empleado'
    };
    return roleMap[role] || 'Indefinido';
  };

  // Función para obtener el color personalizado del badge
  const getRoleStyle = (role: string) => {
    switch (role) {
      case 'administrador':
        return {
          backgroundColor: '#ef4444', // rojo
          color: 'white',
          border: 'none'
        };
      case 'admin': 
        return {
          backgroundColor: '#f59e0b', // amarillo/naranja
          color: 'white',
          border: 'none'
        };
      default:
        return {};
    }
  };

  const getRoleBadge = (role?: string) => {
    return getRoleDisplayName(role || 'empleado');
  };

  const getLocationText = (colaborador: Colaborador) => {
    // Crear texto de ubicación basado en los datos disponibles
    const parts = [];
    if (colaborador.pais_movil && colaborador.pais_movil !== 'ES') {
      const countryMap: { [key: string]: string } = {
        'GB': 'UK',
        'FR': 'Francia',
        'DE': 'Alemania',
        'IT': 'Italia'
      };
      parts.push(countryMap[colaborador.pais_movil] || colaborador.pais_movil);
    }
    parts.push('Turno General'); // Por defecto todos en Turno General
    return parts.join(' / ');
  };

  // Verificar si el contrato está próximo a finalizar (dentro de 30 días)
  const isContractEndingSoon = (colaborador: Colaborador) => {
    if (!colaborador.fecha_fin_contrato) return false;
    
    const endDate = new Date(colaborador.fecha_fin_contrato);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);
    
    const daysUntilEnd = differenceInDays(endDate, today);
    
    return daysUntilEnd >= 0 && daysUntilEnd <= 30; // Próximo mes
  };

  // Obtener días restantes del contrato
  const getDaysUntilContractEnd = (colaborador: Colaborador): number => {
    if (!colaborador.fecha_fin_contrato) return -1;
    
    const endDate = new Date(colaborador.fecha_fin_contrato);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);
    
    return differenceInDays(endDate, today);
  };

  // Filtrar colaboradores basado en todos los filtros
  const filteredColaboradores = colaboradores.filter(colaborador => {
    // Filtro de búsqueda
    const matchesSearch = colaborador.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      colaborador.apellidos.toLowerCase().includes(searchTerm.toLowerCase()) ||
      colaborador.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      colaborador.empleado_id?.toLowerCase().includes(searchTerm.toLowerCase());

    // Filtro de tipo de contrato
    const matchesTipoContrato = selectedTipoContrato === "todos-tipos" || 
      colaborador.tipo_contrato === selectedTipoContrato.replace('contrato-', '').replace('-', ' ') ||
      (selectedTipoContrato === "contrato-indefinido" && colaborador.tipo_contrato === "Contrato indefinido") ||
      (selectedTipoContrato === "contrato-temporal" && colaborador.tipo_contrato === "Contrato temporal") ||
      (selectedTipoContrato === "practica-profesional" && colaborador.tipo_contrato === "Práctica profesional") ||
      (selectedTipoContrato === "contrato-formacion" && colaborador.tipo_contrato === "Contrato de formación") ||
      (selectedTipoContrato === "fijo-discontinuo" && colaborador.tipo_contrato === "Contrato fijo discontinuo") ||
      (selectedTipoContrato === "ett" && colaborador.tipo_contrato === "Empleado trabajo temporal (ETT)");

    // Filtro de estado de usuario
    const matchesEstadoUsuario = selectedEstadoUsuario === "todos-usuarios" ||
      (selectedEstadoUsuario === "usuarios-activos" && colaborador.status === "activo") ||
      (selectedEstadoUsuario === "usuarios-inactivos" && colaborador.status === "inactivo") ||
      (selectedEstadoUsuario === "usuarios-pendientes" && colaborador.status === "pendiente");

    return matchesSearch && matchesTipoContrato && matchesEstadoUsuario;
  });

  // Aplicar ordenamiento
  const sortedColaboradores = [...filteredColaboradores].sort((a, b) => {
    switch (selectedOrden) {
      case "ordenar-nombre":
        return a.nombre.localeCompare(b.nombre);
      case "ordenar-apellido":
        return a.apellidos.localeCompare(b.apellidos);
      case "ordenar-fecha":
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case "ordenar-rol":
        const roleOrder = { propietario: 1, administrador: 2, director: 3, manager: 4, jefe_departamento: 4, empleado: 6 }; // jefe_departamento = manager (mismo orden)
        const aRole = a.role || 'empleado';
        const bRole = b.role || 'empleado';
        return (roleOrder[aRole] || 6) - (roleOrder[bRole] || 6);
      default:
        return a.apellidos.localeCompare(b.apellidos);
    }
  });

  // Funciones para el modo selección
  const handleSelectColaborador = (colaboradorId: string, checked: boolean) => {
    
    // Verificar si el colaborador está inactivo
    const colaborador = colaboradores.find(c => c.id === colaboradorId);
    
    if (colaborador?.status === 'inactivo') {
      toast({
        title: "Colaborador inactivo",
        description: "No se pueden añadir colaboradores inactivos al calendario de turnos.",
        variant: "destructive",
      });
      return;
    }

    // Validar campos obligatorios para añadir al calendario
    if (checked) {
      const missingFields = [];
      
      
      if (!colaborador.fecha_inicio_contrato) {
        missingFields.push("fecha de inicio de contrato");
      }
      
      if (!colaborador.tiempo_trabajo_semanal) {
        missingFields.push("tiempo de trabajo semanal");
      }
      
      if (!colaborador.tipo_contrato) {
        missingFields.push("tipo de contrato");
      }

      if (missingFields.length > 0) {
        toast({
          title: "Faltan datos obligatorios",
          description: `${colaborador.nombre} ${colaborador.apellidos} necesita: ${missingFields.join(", ")}. Complete estos datos en su perfil antes de añadirlo al calendario.`,
          variant: "destructive",
        });
        return;
      }

      // Verificar si el colaborador ya está en el calendario
      const existingEmployees = JSON.parse(localStorage.getItem('calendar-employees') || '[]');
      const isAlreadyInCalendar = existingEmployees.some(emp => emp.id === colaboradorId);
      
      if (isAlreadyInCalendar) {
        toast({
          title: "Colaborador ya en calendario",
          description: `${colaborador.nombre} ${colaborador.apellidos} ya está añadido al calendario.`,
          variant: "destructive",
        });
        return;
      }
      
      setSelectedColaboradores(prev => [...prev, colaboradorId]);
    } else {
      setSelectedColaboradores(prev => prev.filter(id => id !== colaboradorId));
    }
  };

  const handleSelectAll = () => {
    // Solo seleccionar colaboradores activos
    const activeColaboradores = sortedColaboradores.filter(c => c.status !== 'inactivo');
    const filteredIds = activeColaboradores.map(c => c.id);
    setSelectedColaboradores(filteredIds);
  };

  const handleDeselectAll = () => {
    setSelectedColaboradores([]);
  };

  const handleConfirmSelection = () => {
    // Verificar duplicados con el calendario actual
    const existingEmployees = JSON.parse(localStorage.getItem('calendar-employees') || '[]');
    const selectedEmployees = colaboradores.filter(c => selectedColaboradores.includes(c.id));
    
    // Filtrar empleados que ya están en el calendario
    const newEmployees = selectedEmployees.filter(newEmp => 
      !existingEmployees.some(existing => existing.id === newEmp.id)
    );
    
    const duplicateCount = selectedEmployees.length - newEmployees.length;
    
    if (duplicateCount > 0) {
      toast({
        title: "Colaboradores duplicados",
        description: `${duplicateCount} colaborador(es) ya están en el calendario y no se añadirán.`,
        variant: "destructive",
      });
    }
    
    if (newEmployees.length === 0) {
      toast({
        title: "Sin cambios",
        description: "Todos los colaboradores seleccionados ya están en el calendario.",
        variant: "destructive",
      });
      return;
    }
    
    // Guardar solo los empleados nuevos
    localStorage.setItem('selectedEmployeesForCalendar', JSON.stringify(newEmployees));
    
    // Redirigir al calendario (ruta correcta es /turnosmart)
    navigate('/turnosmart');
    
    toast({
      title: "Empleados añadidos",
      description: `${newEmployees.length} empleados nuevos añadidos al calendario`,
    });
  };

  const handleCancelSelection = () => {
    // Limpiar selección y volver
    setSelectedColaboradores([]);
    if (returnUrl === 'turnos-crear') {
      navigate('/turnosmart');
    } else {
      navigate('/turnosmart');
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        {isSelectionMode ? (
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancelSelection}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Seleccionar Empleados</h1>
              <p className="text-sm text-muted-foreground">
                Selecciona los empleados para añadir al calendario ({selectedColaboradores.length} seleccionados)
              </p>
            </div>
          </div>
        ) : (
          <h1 className="text-2xl font-bold text-foreground">Equipo</h1>
        )}
        <div className="flex items-center gap-3">
          {selectedColaboradores.length > 0 && canEdit && (
            <Button 
              onClick={handleConfirmSelection}
              className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Añadir al calendario ({selectedColaboradores.length})
            </Button>
          )}
          {canEdit && <InviteColaboradorDialog />}
          {canEdit && (
            <Button 
              onClick={() => navigate('/colaboradores/new')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Añadir un colaborador
            </Button>
          )}
        </div>
      </div>

      {/* Modern Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
        <Input
          placeholder="Buscar por nombre, apellidos, número de empleado o rol..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-11 pr-4 h-11 bg-background/60 border-border/30 rounded-full shadow-sm hover:shadow-md focus:shadow-lg transition-all duration-200 placeholder:text-muted-foreground/60"
        />
      </div>

      {/* Modern Filters */}
      <div className="flex flex-wrap items-center gap-3 py-4">
        <Select value={selectedEstablecimiento} onValueChange={setSelectedEstablecimiento}>
          <SelectTrigger className="h-9 w-auto min-w-[240px] bg-background/60 border-border/30 rounded-full text-sm font-medium shadow-sm hover:shadow-md transition-shadow">
            <SelectValue />
          </SelectTrigger>
          <SelectContent 
            className="shadow-lg rounded-xl"
            style={{ 
              backgroundColor: 'rgb(255, 255, 255)',
              color: 'rgb(0, 0, 0)',
              zIndex: 9999,
              opacity: 1
            }}
          >
            <SelectItem value="todos-establecimientos" className="rounded-lg">
              Todos los establecimientos ({organizations.length}) / Todos los equipos ({organizations.length})
            </SelectItem>
            {organizations.map(org => (
              <SelectItem key={org.id} value={org.id} className="rounded-lg">{org.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedTipoContrato} onValueChange={setSelectedTipoContrato}>
          <SelectTrigger className="h-9 w-auto min-w-[180px] bg-background/60 border-border/30 rounded-full text-sm font-medium shadow-sm hover:shadow-md transition-shadow">
            <SelectValue />
          </SelectTrigger>
          <SelectContent 
            className="shadow-lg rounded-xl"
            style={{ 
              backgroundColor: 'rgb(255, 255, 255)',
              color: 'rgb(0, 0, 0)',
              zIndex: 9999,
              opacity: 1
            }}
          >
            <SelectItem value="todos-tipos" className="rounded-lg">
              Todos los tipos de contrato
            </SelectItem>
            <SelectItem value="contrato-indefinido" className="rounded-lg">Contrato indefinido</SelectItem>
            <SelectItem value="contrato-temporal" className="rounded-lg">Contrato temporal</SelectItem>
            <SelectItem value="practica-profesional" className="rounded-lg">Práctica profesional</SelectItem>
            <SelectItem value="contrato-formacion" className="rounded-lg">Contrato de formación</SelectItem>
            <SelectItem value="fijo-discontinuo" className="rounded-lg">Contrato fijo discontinuo</SelectItem>
            <SelectItem value="ett" className="rounded-lg">Empleado trabajo temporal (ETT)</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedEstadoUsuario} onValueChange={setSelectedEstadoUsuario}>
          <SelectTrigger className="h-9 w-auto min-w-[140px] bg-background/60 border-border/30 rounded-full text-sm font-medium shadow-sm hover:shadow-md transition-shadow">
            <SelectValue />
          </SelectTrigger>
          <SelectContent
            className="shadow-lg rounded-xl"
            style={{
              backgroundColor: 'rgb(255, 255, 255)',
              color: 'rgb(0, 0, 0)',
              zIndex: 9999,
              opacity: 1
            }}
          >
            <SelectItem value="usuarios-activos" className="rounded-lg">Usuarios activos</SelectItem>
            <SelectItem value="todos-usuarios" className="rounded-lg">Todos los usuarios</SelectItem>
            <SelectItem value="usuarios-pendientes" className="rounded-lg">Usuarios pendientes</SelectItem>
            <SelectItem value="usuarios-inactivos" className="rounded-lg">Usuarios inactivos</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedOrden} onValueChange={setSelectedOrden}>
          <SelectTrigger className="h-9 w-auto min-w-[160px] bg-background/60 border-border/30 rounded-full text-sm font-medium shadow-sm hover:shadow-md transition-shadow">
            <SelectValue />
          </SelectTrigger>
          <SelectContent 
            className="shadow-lg rounded-xl"
            style={{ 
              backgroundColor: 'rgb(255, 255, 255)',
              color: 'rgb(0, 0, 0)',
              zIndex: 9999,
              opacity: 1
            }}
          >
            <SelectItem value="ordenar-apellido" className="rounded-lg">Ordenar por apellido</SelectItem>
            <SelectItem value="ordenar-nombre" className="rounded-lg">Ordenar por nombre</SelectItem>
            <SelectItem value="ordenar-fecha" className="rounded-lg">Ordenar por fecha de alta</SelectItem>
            <SelectItem value="ordenar-rol" className="rounded-lg">Ordenar por rol</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-background border border-border/40 rounded-lg">
        {loading ? (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">Cargando colaboradores...</p>
          </div>
        ) : (
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border">
               <TableHead className="w-12">
                  <Checkbox
                    checked={
                      sortedColaboradores.filter(c => c.status !== 'inactivo').length > 0 && 
                      selectedColaboradores.length === sortedColaboradores.filter(c => c.status !== 'inactivo').length
                    }
                   onCheckedChange={(checked) => {
                     if (checked) {
                       handleSelectAll();
                     } else {
                       handleDeselectAll();
                     }
                   }}
                 />
               </TableHead>
                <TableHead className="font-semibold text-foreground">Colaborador</TableHead>
                <TableHead className="font-semibold text-foreground">Rol</TableHead>
                <TableHead className="font-semibold text-foreground">Puesto de trabajo</TableHead>
                <TableHead className="font-semibold text-foreground">Correo electrónico</TableHead>
                <TableHead className="font-semibold text-foreground">Teléfono</TableHead>
                <TableHead className="font-semibold text-foreground">Ubicación</TableHead>
                <TableHead className="font-semibold text-foreground">Calendario</TableHead>
                <TableHead className="font-semibold text-foreground">Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedColaboradores.length === 0 ? (
               <TableRow>
                 <TableCell colSpan={9} className="text-center py-8">
                  <p className="text-muted-foreground">No hay colaboradores que coincidan con los filtros</p>
                  <Button 
                    onClick={() => {
                      setSearchTerm("");
                      setSelectedEstablecimiento("all");
                      setSelectedTipoContrato("todos-tipos");
                      setSelectedEstadoUsuario("usuarios-activos");
                      setSelectedOrden("ordenar-apellido");
                    }}
                    variant="outline"
                    className="mt-4"
                  >
                    Limpiar filtros
                  </Button>
                </TableCell>
              </TableRow>
            ) : (
              sortedColaboradores.map((colaborador) => (
                  <TableRow 
                    key={colaborador.id} 
                    className={cn(
                      "border-b border-border/40 hover:bg-muted/50 group",
                      colaborador.status === 'inactivo' && "opacity-50 bg-muted/30"
                    )}
                  >
                   <TableCell>
                     <Checkbox
                       checked={selectedColaboradores.includes(colaborador.id)}
                       onCheckedChange={(checked) => handleSelectColaborador(colaborador.id, checked as boolean)}
                       disabled={colaborador.status === 'inactivo'}
                       className={colaborador.status === 'inactivo' ? 'opacity-50 cursor-not-allowed' : ''}
                     />
                   </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={undefined} />
                        <AvatarFallback className="bg-slate-100 text-slate-700 text-sm font-medium">
                          {getInitials(colaborador.nombre, colaborador.apellidos)}
                        </AvatarFallback>
                      </Avatar>
                      <span 
                        className={cn(
                          "font-medium text-foreground",
                          canEdit || colaborador.email === user?.email 
                            ? "underline cursor-pointer hover:text-primary transition-colors"
                            : "cursor-not-allowed opacity-70"
                        )}
                        onClick={() => {
                          // Si es employee, solo puede navegar a su propio perfil
                          if (isEmployee) {
                            if (colaborador.email !== user?.email) {
                              toast({
                                title: "Acceso restringido",
                                description: "Solo puedes acceder a tu propio perfil",
                                variant: "destructive"
                              });
                              return;
                            }
                          }
                          navigate(`/colaboradores/${colaborador.id}`);
                        }}
                      >
                        {colaborador.nombre} {colaborador.apellidos}
                      </span>
                    </div>
                  </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={getRoleBadgeVariant(colaborador.role || 'empleado')}
                          style={getRoleStyle(colaborador.role || 'empleado')}
                          className="text-xs"
                        >
                          {getRoleBadge(colaborador.role)}
                        </Badge>
                        {canEdit && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedColaboradorForRole(colaborador);
                              setIsRoleDialogOpen(true);
                            }}
                            className="h-6 w-6 p-0 hover:bg-muted"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-foreground">
                      {colaborador.jobs?.title || 'Sin puesto asignado'}
                    </TableCell>
                  <TableCell className="text-foreground">
                    {colaborador.email && !colaborador.email.includes('setup.turnosmart.app')
                      ? colaborador.email
                      : <span className="text-muted-foreground italic">No especificado</span>
                    }
                  </TableCell>
                  <TableCell className="text-foreground">
                    {colaborador.telefono_movil || 'No especificado'}
                  </TableCell>
                   <TableCell className="text-foreground">
                     {getLocationText(colaborador)}
                   </TableCell>
                   <TableCell>
                     {(() => {
                       const missingFields: string[] = [];
                       if (!colaborador.fecha_inicio_contrato) missingFields.push("fecha inicio");
                       if (!colaborador.tiempo_trabajo_semanal) missingFields.push("horas semanales");
                       if (!colaborador.tipo_contrato) missingFields.push("tipo contrato");
                       if (colaborador.status !== 'activo') missingFields.push("estado activo");

                       const hasRequiredData = missingFields.length === 0;
                       const tooltipText = hasRequiredData
                         ? 'Datos completos'
                         : `Falta: ${missingFields.join(', ')}`;

                       return (
                         <Badge
                           className={hasRequiredData
                             ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100"
                             : "bg-amber-100 text-amber-800 hover:bg-amber-100"
                           }
                           title={tooltipText}
                         >
                           {hasRequiredData ? 'Listo' : 'Incompleto'}
                         </Badge>
                       );
                     })()}
                    </TableCell>
                     <TableCell>
                       <div className="flex flex-col gap-1">
                         {(() => {
                           const isPendiente = colaborador.nombre.includes('(pendiente)') || colaborador.apellidos.includes('(pendiente)');
                           const status = isPendiente ? 'pendiente' : colaborador.status;

                           return (
                             <Badge
                               className={
                                 status === 'inactivo'
                                   ? "bg-gray-100 text-gray-600 hover:bg-gray-100"
                                   : status === 'pendiente'
                                   ? "bg-amber-100 text-amber-700 hover:bg-amber-100"
                                   : "bg-emerald-100 text-emerald-800 hover:bg-emerald-100"
                               }
                               title={
                                 status === 'inactivo'
                                   ? "Usuario desactivado o no activo"
                                   : status === 'pendiente'
                                   ? "Pendiente de confirmación de email o validación. Requiere completar datos de perfil."
                                   : "Perfil confirmado y activo"
                               }
                             >
                               {status === 'inactivo' ? 'Inactivo' : status === 'pendiente' ? 'Pendiente' : 'Aceptada'}
                             </Badge>
                           );
                         })()}
                         {colaborador.status === 'activo' && isContractEndingSoon(colaborador) && (
                           <Badge 
                             variant="outline" 
                             className="bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-50 text-xs flex items-center gap-1"
                           >
                             <Calendar className="h-3 w-3" />
                             Finaliza: {format(new Date(colaborador.fecha_fin_contrato!), 'dd/MM/yyyy', { locale: es })}
                             <span className="font-semibold">
                               ({getDaysUntilContractEnd(colaborador)} días)
                             </span>
                           </Badge>
                         )}
                       </div>
                     </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        )}
      </div>

      {/* Add Colaborador Sheet */}
      <AddColaboradorSheet
        open={showAddColaborador}
        onOpenChange={setShowAddColaborador}
        onColaboradorAdded={handleColaboradorAdded}
        showOnlyPersonalInfo={true}
      />

      {/* Role Management Dialog */}
      {selectedColaboradorForRole && (
        <RoleManagementDialog
          isOpen={isRoleDialogOpen}
          onClose={() => {
            setIsRoleDialogOpen(false);
            setSelectedColaboradorForRole(null);
          }}
          colaborador={{
            id: selectedColaboradorForRole.id,
            nombre: selectedColaboradorForRole.nombre,
            apellidos: selectedColaboradorForRole.apellidos
          }}
          currentRole={selectedColaboradorForRole.role || 'empleado'}
          onRoleUpdated={() => {
            fetchColaboradores();
            setIsRoleDialogOpen(false);
            setSelectedColaboradorForRole(null);
          }}
        />
      )}
    </div>
  );
};