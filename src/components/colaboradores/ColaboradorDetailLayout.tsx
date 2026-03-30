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
      {/* Sticky header — back button + avatar + tabs always visible while scrolling */}
      <div className="sticky top-0 z-20 bg-background border-b border-border/40">
        <div className="max-w-6xl mx-auto px-6 pt-3 pb-0">
          {/* Back button */}
          <div className="mb-3">
            <Button
              variant="ghost"
              onClick={() => navigate('/colaboradores')}
              className="text-muted-foreground hover:text-foreground p-0 h-auto font-normal"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a la lista de colaboradores
            </Button>
          </div>

          {/* Compact identity row */}
          <div className="flex items-center gap-4 mb-3">
            <Avatar className="h-9 w-9 bg-gray-900 shrink-0">
              <AvatarImage src={displayColaborador.avatar_url} />
              <AvatarFallback className="text-xs bg-gray-900 text-white font-semibold">
                {getInitials(displayColaborador.nombre, displayColaborador.apellidos)}
              </AvatarFallback>
            </Avatar>
            <div className="flex items-center gap-3 min-w-0">
              <span className="font-semibold text-foreground truncate">
                {(displayColaborador.apellidos_uso || `${displayColaborador.nombre} ${displayColaborador.apellidos}`).toUpperCase()}
              </span>
              {displayColaborador.tipo_contrato && (
                <span className="text-xs text-muted-foreground shrink-0 hidden sm:inline">
                  {displayColaborador.tipo_contrato}
                </span>
              )}
              {isInactive && (
                <span className="text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded-full shrink-0">
                  Inactivo
                </span>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className={`flex gap-1 overflow-x-auto scrollbar-none -mx-1 px-1 ${isInactive ? 'opacity-50' : ''}`}>
            {[
              { to: 'profile', label: 'Datos personales' },
              { to: 'contract', label: 'Contratos' },
              { to: 'planning', label: 'Tiempo y planificación' },
              { to: 'absences', label: 'Vacaciones y Ausencias' },
              { to: 'permissions', label: 'Rol y Permisos' },
              { to: 'nominas', label: 'Nóminas' },
              ...(isAdmin ? [{ to: 'system', label: 'Sistema & Usuarios' }] : []),
            ].map(tab => (
              <NavLink
                key={tab.to}
                to={`/colaboradores/${id}/${tab.to}`}
                className={({ isActive }) =>
                  `shrink-0 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    isActive
                      ? 'border-foreground text-foreground'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  } ${isInactive ? 'pointer-events-none' : ''}`
                }
              >
                {tab.label}
              </NavLink>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Header with Avatar and Name - Black Notion Style — full detail card */}
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

        {/* Tab content via Outlet */}
        <div className={isInactive ? 'opacity-50 pointer-events-none' : ''}>
          <Outlet />
        </div>
      </div>
    </MainLayout>
  );
}
