import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TurnoSmartLogo } from '@/components/TurnoSmartLogo';
import { Loader2, Building2, User, Lock, Link as LinkIcon } from 'lucide-react';

interface InviteData {
  email: string;
  organizationName: string;
  organizationId: string;
  role: string;
  token: string;
  colaboradorName: string;
  colaboradorId: string;
}

export default function LinkAccount() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [inviteData, setInviteData] = useState<InviteData | null>(null);
  
  // Form fields
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    // Obtener datos de la invitación de sessionStorage
    const storedData = sessionStorage.getItem('invite_data');
    if (storedData) {
      try {
        const data = JSON.parse(storedData);
        setInviteData(data);
      } catch (e) {
        console.error('Error parsing invite data:', e);
        toast.error('Datos de invitación inválidos');
        navigate('/auth');
      }
    } else {
      toast.error('No hay datos de invitación');
      navigate('/auth');
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inviteData) {
      setError('Datos de invitación no disponibles');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    setError('');

    try {
      
      // Procesar invitación con contraseña para vincular cuenta
      const { data: acceptData, error: acceptError } = await supabase.functions.invoke(
        'accept-invite',
        {
          body: {
            token: inviteData.token,
            password: password
          }
        }
      );

      if (acceptError) {
        console.error('Error accepting invite:', acceptError);
        throw new Error('Error vinculando cuenta');
      }

      if (!acceptData.success) {
        throw new Error(acceptData.error || 'Error vinculando cuenta');
      }

      // Limpiar datos almacenados
      sessionStorage.removeItem('invite_data');

      // Si hay magic link, usarlo
      if (acceptData.magicLink) {
        toast.success('¡Cuenta vinculada exitosamente!');
        window.location.href = acceptData.magicLink;
      } else {
        toast.success('¡Cuenta vinculada exitosamente!');
        navigate('/auth');
      }

    } catch (error: any) {
      console.error('Account linking error:', error);
      setError(error.message || 'Error vinculando la cuenta. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  if (!inviteData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">Cargando información...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header con logo */}
      <div className="absolute top-6 left-6 z-10">
        <div className="inline-flex items-center gap-2 text-foreground">
          <TurnoSmartLogo size="sm" />
          <span className="font-medium text-lg">TurnoSmart</span>
        </div>
      </div>

      <div className="container mx-auto flex items-center justify-center min-h-screen px-4 py-8">
        <div className="w-full max-w-md space-y-8">
          
          {/* Información de vinculación */}
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
              <LinkIcon className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">
              Vincula tu cuenta
            </h1>
            <div className="bg-muted p-4 rounded-lg space-y-3">
              <div className="flex items-center justify-center gap-2 text-primary">
                <User className="w-5 h-5" />
                <p className="font-semibold text-lg">{inviteData.colaboradorName}</p>
              </div>
              <p className="text-sm text-muted-foreground">
                Ya eres parte de <strong className="text-foreground">{inviteData.organizationName}</strong>
              </p>
              <p className="text-xs text-muted-foreground">
                Crea una contraseña para acceder con tu nuevo email: <strong className="text-foreground">{inviteData.email}</strong>
              </p>
            </div>
          </div>

          {/* Formulario de vinculación */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground font-medium">
                  Nueva contraseña
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 h-12"
                    placeholder="Mínimo 6 caracteres"
                    required
                    disabled={loading}
                    minLength={6}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-foreground font-medium">
                  Confirmar contraseña
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 h-12"
                    placeholder="Repite tu contraseña"
                    required
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Vinculando cuenta...
                </>
              ) : (
                <>
                  <LinkIcon className="w-5 h-5 mr-2" />
                  Vincular cuenta y acceder
                </>
              )}
            </Button>
          </form>

          <div className="text-center text-sm text-muted-foreground space-y-2">
            <p>
              Al vincular tu cuenta mantienes todos tus datos, turnos y asignaciones en <strong>{inviteData.organizationName}</strong>
            </p>
            <p className="text-xs">
              Solo cambia tu método de acceso al nuevo email
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}