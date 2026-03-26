import { useState, useEffect, useMemo } from "react";
import { getInitials } from "@/utils/avatar";
import { useParams, useNavigate, NavLink, Outlet } from "react-router-dom";
import { useOrganizationsUnified } from "@/hooks/useOrganizationsUnified";
import { Camera, Edit, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MainLayout } from "@/components/MainLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useColaboradorById } from "@/hooks/useColaboradorFull";
import { useTeamAssignments } from "@/hooks/useTeamAssignments";

export default function ColaboradorDetailLayout() {
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const { organizations } = useOrganizationsUnified();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // Use new hook for colaborador data from unified view
  const { colaborador, loading, refetch: refetchColaborador } = useColaboradorById(id);
  
  // Hook for team assignments - departamentos asignados
  const { assignments: teamAssignments } = useTeamAssignments(id || '');
  
  // Force refresh state to trigger UI updates
  const [forceRefresh, setForceRefresh] = useState(0);
  
  // Use memo with force refresh to ensure reactive updates
  const displayColaborador = useMemo(() => {
    return colaborador ? {
      ...colaborador,
      _refreshKey: forceRefresh
    } : null;
  }, [colaborador, forceRefresh]);
  
  const isInactive = displayColaborador?.status === 'inactivo';
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [fileInputRef, setFileInputRef] = useState<HTMLInputElement | null>(null);

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !colaborador) return;

    setUploadingAvatar(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${colaborador.id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('colaboradores')
        .update({ avatar_url: publicUrl })
        .eq('id', colaborador.id);

      if (updateError) throw updateError;

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
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const triggerFileInput = () => {
    fileInputRef?.click();
  };

  if (loading || !displayColaborador) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-muted-foreground">Cargando...</div>
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

        {/* Tabs Navigation with NavLink */}
        <div className={`inline-flex h-auto gap-2 p-1 bg-muted/30 rounded-full ${isInactive ? 'opacity-50' : ''}`}>
          <NavLink
            to={`/colaboradores/${id}/profile`}
            className={({ isActive }) =>
              `rounded-full px-6 py-2.5 text-sm font-medium transition-all hover:bg-muted/50 ${
                isActive ? 'bg-black text-white shadow-sm' : ''
              } ${isInactive ? 'pointer-events-none' : ''}`
            }
          >
            Datos personales
          </NavLink>
          
          <NavLink
            to={`/colaboradores/${id}/contract`}
            className={({ isActive }) =>
              `rounded-full px-6 py-2.5 text-sm font-medium transition-all hover:bg-muted/50 ${
                isActive ? 'bg-black text-white shadow-sm' : ''
              } ${isInactive ? 'pointer-events-none' : ''}`
            }
          >
            Contratos
          </NavLink>
          
          <NavLink
            to={`/colaboradores/${id}/planning`}
            className={({ isActive }) =>
              `rounded-full px-6 py-2.5 text-sm font-medium transition-all hover:bg-muted/50 ${
                isActive ? 'bg-black text-white shadow-sm' : ''
              } ${isInactive ? 'pointer-events-none' : ''}`
            }
          >
            Tiempo y planificación
          </NavLink>
          
          <NavLink
            to={`/colaboradores/${id}/absences`}
            className={({ isActive }) =>
              `rounded-full px-6 py-2.5 text-sm font-medium transition-all hover:bg-muted/50 ${
                isActive ? 'bg-black text-white shadow-sm' : ''
              } ${isInactive ? 'pointer-events-none' : ''}`
            }
          >
            Vacaciones y Ausencias
          </NavLink>
          
          <NavLink
            to={`/colaboradores/${id}/permissions`}
            className={({ isActive }) =>
              `rounded-full px-6 py-2.5 text-sm font-medium transition-all hover:bg-muted/50 ${
                isActive ? 'bg-black text-white shadow-sm' : ''
              } ${isInactive ? 'pointer-events-none' : ''}`
            }
          >
            Rol y Permisos
          </NavLink>

          {isAdmin && (
            <NavLink
              to={`/colaboradores/${id}/system`}
              className={({ isActive }) =>
                `rounded-full px-6 py-2.5 text-sm font-medium transition-all hover:bg-muted/50 ${
                  isActive ? 'bg-black text-white shadow-sm' : ''
                } ${isInactive ? 'pointer-events-none' : ''}`
              }
            >
              Sistema & Usuarios
            </NavLink>
          )}
        </div>

        {/* Tab content via Outlet */}
        <div className={isInactive ? 'opacity-50 pointer-events-none' : ''}>
          <Outlet />
        </div>
      </div>
    </MainLayout>
  );
}
