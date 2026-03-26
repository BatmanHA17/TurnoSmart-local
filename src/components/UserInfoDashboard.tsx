import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useUserRoleCanonical } from "@/hooks/useUserRoleCanonical";
import { supabase } from "@/integrations/supabase/client";
import { LogOut, Key, User, Building, Users, Mail, Shield, Clock, UserCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { InviteColaboradorDialog } from "./InviteColaboradorDialog";

export const UserInfoDashboard = () => {
  const { user, signOut } = useAuth();
  const { profile } = useUserProfile();
  const { role } = useUserRoleCanonical();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [organizationInfo, setOrganizationInfo] = useState<any>(null);
  const [colaboradorInfo, setColaboradorInfo] = useState<any>(null);
  const [colaboradoresCount, setColaboradoresCount] = useState(0);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;

      try {
        // Fetch organization info
        const { data: orgData } = await supabase
          .from('organizations')
          .select('*')
          .limit(1)
          .single();
        
        setOrganizationInfo(orgData);

        // Fetch colaborador info by email
        if (profile?.email) {
          const { data: colaboradorData } = await supabase
            .from('colaborador_full')
            .select('*')
            .eq('email', profile.email)
            .single();
          
          setColaboradorInfo(colaboradorData);
        }

        // Count total colaboradores
        const { count } = await supabase
          .from('colaborador_full')
          .select('*', { count: 'exact', head: true });
        
        setColaboradoresCount(count || 0);
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, [user, profile]);

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "Las contraseñas no coinciden",
        variant: "destructive"
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Error", 
        description: "La contraseña debe tener al menos 6 caracteres",
        variant: "destructive"
      });
      return;
    }

    setIsChangingPassword(true);
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Contraseña actualizada correctamente"
      });
      
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Información del Usuario
            </h1>
            <p className="text-muted-foreground">
              Detalles completos del perfil y configuración
            </p>
          </div>
          <div className="flex items-center gap-3">
            {role === 'OWNER' && <InviteColaboradorDialog />}
            <Button 
              onClick={signOut}
              variant="outline"
              className="flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Cerrar Sesión
            </Button>
          </div>
        </div>

        {/* User Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Información Personal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Email</Label>
                <p className="flex items-center gap-2 p-2 bg-muted rounded">
                  <Mail className="w-4 h-4" />
                  {profile?.email || 'No disponible'}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Nombre Completo</Label>
                <p className="p-2 bg-muted rounded">
                  {profile?.display_name || `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || 'No disponible'}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">ID de Usuario</Label>
                <p className="p-2 bg-muted rounded font-mono text-xs">
                  {user?.id || 'No disponible'}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Fecha de Registro</Label>
                <p className="flex items-center gap-2 p-2 bg-muted rounded">
                  <Clock className="w-4 h-4" />
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString('es-ES') : 'No disponible'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Role Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Rol y Permisos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-primary/10 rounded-lg">
              <p className="text-lg font-semibold">
                Rol: <span className="text-primary">{role || 'No asignado'}</span>
              </p>
            </div>
            {(role === 'OWNER' || role === 'ADMIN') && (
              <div className="pt-2">
                <Button
                  onClick={() => navigate('/colaboradores')}
                  variant="outline"
                  className="flex items-center gap-2 w-full"
                >
                  <UserCheck className="w-4 h-4" />
                  Ver Equipo
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Organization Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="w-5 h-5" />
              Información de la Organización
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Nombre de la Organización</Label>
                <p className="p-2 bg-muted rounded">
                  {organizationInfo?.name || 'No disponible'}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">País</Label>
                <p className="p-2 bg-muted rounded">
                  {organizationInfo?.country || 'No especificado'}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Estado de Suscripción</Label>
                <p className="p-2 bg-muted rounded">
                  {organizationInfo?.subscription_status || 'No disponible'}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Número de Colaboradores</Label>
                <p className="flex items-center gap-2 p-2 bg-muted rounded">
                  <Users className="w-4 h-4" />
                  {colaboradoresCount}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Colaborador Details */}
        {colaboradorInfo && (
          <Card>
            <CardHeader>
              <CardTitle>Detalles del Colaborador</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Nombre</Label>
                  <p className="p-2 bg-muted rounded">
                    {colaboradorInfo.nombre || 'No disponible'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Apellidos</Label>
                  <p className="p-2 bg-muted rounded">
                    {colaboradorInfo.apellidos || 'No disponible'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Teléfono</Label>
                  <p className="p-2 bg-muted rounded">
                    {colaboradorInfo.telefono_movil || 'No disponible'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Estado</Label>
                  <p className="p-2 bg-muted rounded">
                    {colaboradorInfo.status || 'No disponible'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Tipo de Contrato</Label>
                  <p className="p-2 bg-muted rounded">
                    {colaboradorInfo.tipo_contrato || 'No disponible'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Establecimiento</Label>
                  <p className="p-2 bg-muted rounded">
                    {'GOTHAM'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Password Change */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="w-5 h-5" />
              Cambiar Contraseña
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="newPassword">Nueva Contraseña</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Ingresa nueva contraseña"
                />
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirma la contraseña"
                />
              </div>
            </div>
            <Button 
              onClick={handlePasswordChange}
              disabled={!newPassword || !confirmPassword || isChangingPassword}
              className="w-full"
            >
              {isChangingPassword ? 'Cambiando...' : 'Cambiar Contraseña'}
            </Button>
          </CardContent>
        </Card>

        {/* Raw User Data */}
        <Card>
          <CardHeader>
            <CardTitle>Datos Raw del Usuario (Debug)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">User Object</Label>
                <pre className="p-4 bg-muted rounded text-xs overflow-auto">
                  {JSON.stringify(user, null, 2)}
                </pre>
              </div>
              <div>
                <Label className="text-sm font-medium">Profile Object</Label>
                <pre className="p-4 bg-muted rounded text-xs overflow-auto">
                  {JSON.stringify(profile, null, 2)}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};