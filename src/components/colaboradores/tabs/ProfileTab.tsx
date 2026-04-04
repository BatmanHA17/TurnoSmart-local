import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Info, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { NotionCard } from "@/components/ui/notion-components";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { AddColaboradorSheet } from "@/components/colaboradores/AddColaboradorSheet";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useColaboradorById } from "@/hooks/useColaboradorFull";
import { useOrganizationsUnified } from "@/hooks/useOrganizationsUnified";

export default function ProfileTab() {
  const { user } = useAuth();
  const { isAdmin, role } = useUserRole();
  const { currentOrg } = useOrganizationsUnified();
  const { id } = useParams<{ id: string }>();
  
  const { colaborador, loading } = useColaboradorById(id);
  
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [hasUserAccount, setHasUserAccount] = useState<boolean>(false);
  const [inviteStatus, setInviteStatus] = useState<'none' | 'pending' | 'accepted'>('none');
  const [pendingInvite, setPendingInvite] = useState<any>(null);
  
  // Mapeo de códigos de país a códigos telefónicos
  const countryToPhoneCode: Record<string, string> = {
    'ES': '+34',
    'FR': '+33', 
    'DE': '+49',
    'IT': '+39',
    'GB': '+44'
  };

  const getPhoneCode = (countryCode: string) => {
    return countryToPhoneCode[countryCode] || '+34';
  };

  useEffect(() => {
    const checkInviteStatus = async () => {
      if (!colaborador?.email || !currentOrg?.org_id) return;
      
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
          .eq('org_id', currentOrg.org_id)
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
    
    checkInviteStatus();
  }, [colaborador?.email, currentOrg?.org_id, colaborador?.id]);

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
          role: 'EMPLOYEE'
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

  if (loading || !colaborador) {
    return <div className="text-muted-foreground">Cargando...</div>;
  }

  return (
    <div className="space-y-6">
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
                <span className="text-sm text-foreground">
                  {colaborador.pais_fijo ? getPhoneCode(colaborador.pais_fijo) : ''} {colaborador.telefono_fijo}
                </span>
              </div>
            )}
            {colaborador.telefono_movil && (
              <div className="flex justify-between items-center">
                <Label className="text-sm text-muted-foreground">Teléfono Móvil</Label>
                <span className="text-sm text-foreground">
                  {colaborador.pais_movil ? getPhoneCode(colaborador.pais_movil) : ''} {colaborador.telefono_movil}
                </span>
              </div>
            )}
            {colaborador.direccion && (
              <div className="flex justify-between items-center">
                <Label className="text-sm text-muted-foreground">Dirección</Label>
                <span className="text-sm text-foreground">{colaborador.direccion}</span>
              </div>
            )}
            {colaborador.ciudad && (
              <div className="flex justify-between items-center">
                <Label className="text-sm text-muted-foreground">Ciudad</Label>
                <span className="text-sm text-foreground">{colaborador.ciudad}</span>
              </div>
            )}
            {colaborador.codigo_postal && (
              <div className="flex justify-between items-center">
                <Label className="text-sm text-muted-foreground">Código Postal</Label>
                <span className="text-sm text-foreground">{colaborador.codigo_postal}</span>
              </div>
            )}
            {colaborador.provincia && (
              <div className="flex justify-between items-center">
                <Label className="text-sm text-muted-foreground">Provincia</Label>
                <span className="text-sm text-foreground">{colaborador.provincia}</span>
              </div>
            )}
            {colaborador.pais_residencia && (
              <div className="flex justify-between items-center">
                <Label className="text-sm text-muted-foreground">País de Residencia</Label>
                <span className="text-sm text-foreground">{colaborador.pais_residencia}</span>
              </div>
            )}
          </div>
        </NotionCard>

        {/* Contacto de Emergencia */}
        {(colaborador.contacto_emergencia_nombre || colaborador.contacto_emergencia_apellidos) && (
          <NotionCard className="p-6">
            <h3 className="text-base font-semibold text-foreground mb-4">Contacto de Emergencia</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label className="text-sm text-muted-foreground">Nombre</Label>
                <span className="text-sm text-foreground">
                  {colaborador.contacto_emergencia_nombre} {colaborador.contacto_emergencia_apellidos}
                </span>
              </div>
              {colaborador.contacto_emergencia_relacion && (
                <div className="flex justify-between items-center">
                  <Label className="text-sm text-muted-foreground">Relación</Label>
                  <span className="text-sm text-foreground">{colaborador.contacto_emergencia_relacion}</span>
                </div>
              )}
              {colaborador.contacto_emergencia_movil && (
                <div className="flex justify-between items-center">
                  <Label className="text-sm text-muted-foreground">Teléfono Móvil</Label>
                  <span className="text-sm text-foreground">
                    {colaborador.codigo_pais_movil_emergencia ? getPhoneCode(colaborador.codigo_pais_movil_emergencia) : ''} {colaborador.contacto_emergencia_movil}
                  </span>
                </div>
              )}
              {colaborador.contacto_emergencia_fijo && (
                <div className="flex justify-between items-center">
                  <Label className="text-sm text-muted-foreground">Teléfono Fijo</Label>
                  <span className="text-sm text-foreground">
                    {colaborador.codigo_pais_fijo_emergencia ? getPhoneCode(colaborador.codigo_pais_fijo_emergencia) : ''} {colaborador.contacto_emergencia_fijo}
                  </span>
                </div>
              )}
            </div>
          </NotionCard>
        )}

        {/* Rol en el Motor SMART */}
        <NotionCard className="p-6">
          <h3 className="text-base font-semibold text-foreground mb-4">Rol en el Motor SMART</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label className="text-sm text-muted-foreground">Tipo de rotación</Label>
              <span className="text-sm text-foreground font-medium">
                {(() => {
                  const roleLabels: Record<string, string> = {
                    'ROTA_COMPLETO': 'Rotación completa (M/T/N)',
                    'ROTA_PARCIAL': 'Rotación parcial',
                    'FIJO_NO_ROTA': 'Turno fijo (no rota)',
                    'COBERTURA': 'Cobertura',
                    'FOM': 'FOM (Front Office Manager)',
                    'AFOM': 'AFOM (Asistente FOM)',
                    'NIGHT_SHIFT_AGENT': 'Agente nocturno fijo',
                    'GEX': 'GEX (Guest Experience)',
                    'FRONT_DESK_AGENT': 'Agente de recepción',
                    'CUSTOM': 'Personalizado',
                  };
                  return roleLabels[colaborador.engine_role || 'ROTA_COMPLETO'] || colaborador.engine_role || 'ROTA_COMPLETO';
                })()}
              </span>
            </div>
            <div className="flex justify-between items-start">
              <Label className="text-sm text-muted-foreground">Descripción</Label>
              <span className="text-xs text-muted-foreground text-right max-w-[60%]">
                {(() => {
                  const roleDescriptions: Record<string, string> = {
                    'ROTA_COMPLETO': 'Rota entre todos los turnos (M/T/N) ~5 días/semana',
                    'ROTA_PARCIAL': 'Solo rota en turnos específicos (ej: 9x17, 12x20)',
                    'FIJO_NO_ROTA': 'Siempre trabaja el mismo turno, no entra en rotación',
                    'COBERTURA': 'Cubre ausencias y huecos de otros colaboradores',
                    'FOM': 'Turno fijo M (L-V), guardias S/D, no rota',
                    'AFOM': 'Espejo del FOM: cubre cuando FOM libra',
                    'NIGHT_SHIFT_AGENT': 'Noche fija permanente, sus libres los cubren otros',
                    'GEX': 'Solo turnos GEX (9x17/12x20) según ocupación',
                    'FRONT_DESK_AGENT': 'Rotación completa M/T/N, cubre noches del nocturno',
                    'CUSTOM': 'Configuración personalizada de turnos',
                  };
                  return roleDescriptions[colaborador.engine_role || 'ROTA_COMPLETO'] || '';
                })()}
              </span>
            </div>
          </div>
        </NotionCard>

        {/* Información Médica */}
        <NotionCard className="p-6">
          <h3 className="text-base font-semibold text-foreground mb-4">Información Médica</h3>
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
            {colaborador.exonerado_seguro_medico !== undefined && (
              <div className="flex justify-between items-center">
                <Label className="text-sm text-muted-foreground">Exonerado de Seguro Médico</Label>
                <span className="text-sm text-foreground">
                  {colaborador.exonerado_seguro_medico ? 'Sí' : 'No'}
                </span>
              </div>
            )}
          </div>
        </NotionCard>
      </div>

      {/* Edit Dialog */}
      <AddColaboradorSheet 
        open={isEditDialogOpen} 
        onOpenChange={setIsEditDialogOpen} 
        colaboradorData={colaborador}
        isEditMode={true}
        onColaboradorUpdated={() => {
          // Refetch colaborador data after update
          window.location.reload();
        }}
      />
    </div>
  );
}
