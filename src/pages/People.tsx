import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { 
  UserPlus, 
  Users, 
  Mail, 
  Clock, 
  CheckCircle, 
  XCircle, 
  MoreHorizontal, 
  Send,
  Trash2,
  Loader2,
  AlertTriangle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useUserRoleCanonical } from "@/hooks/useUserRoleCanonical";

interface Invite {
  id: string;
  email: string;
  role: string;
  created_at: string;
  expires_at: string;
  used_at?: string;
  revoked_at?: string;
  invited_by: string;
  organizations: {
    name: string;
  } | null;
}

interface Member {
  id: string;
  role: string;
  created_at: string;
  user_id: string;
  profiles?: {
    display_name?: string;
    email?: string;
    first_name?: string;
    last_name?: string;
  } | null;
}

const roleLabels = {
  OWNER: 'Propietario',
  ADMIN: 'Administrador',
  MANAGER: 'Manager',
  DIRECTOR: 'Director',
  EMPLOYEE: 'Empleado'
};

const roleColors = {
  OWNER: 'destructive',
  ADMIN: 'secondary',
  MANAGER: 'default',
  DIRECTOR: 'outline',
  EMPLOYEE: 'default'
} as const;

export default function People() {
  const { role: userRole, isAdmin } = useUserRoleCanonical();
  
  const [invites, setInvites] = useState<Invite[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  
  // Form state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<string>('');
  const [inviting, setInviting] = useState(false);

  // Current organization (simplificado por ahora)
  const [currentOrgId, setCurrentOrgId] = useState<string | null>(null);

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Obtener organización principal del usuario
      const { data: memberships, error: membershipError } = await supabase
        .from('memberships')
        .select('org_id, organizations(id, name)')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .eq('primary', true)
        .limit(1);

      if (membershipError) throw membershipError;
      
      if (!memberships || memberships.length === 0) {
        console.log('No organization found for user');
        return;
      }

      const orgId = memberships[0].org_id;
      setCurrentOrgId(orgId);

      // Fetch invites y members en paralelo
      const [invitesResponse, membersResponse] = await Promise.all([
        supabase
          .from('invites')
          .select(`
            id,
            email,
            role,
            created_at,
            expires_at,
            used_at,
            revoked_at,
            invited_by,
            organizations!inner(name)
          `)
          .eq('org_id', orgId)
          .order('created_at', { ascending: false }),
        
        supabase
          .from('memberships')
          .select(`
            id,
            role,
            created_at,
            user_id,
            profiles!inner(
              display_name,
              email,
              first_name,
              last_name
            )
          `)
          .eq('org_id', orgId)
          .order('created_at', { ascending: false })
      ]);

      if (invitesResponse.error) throw invitesResponse.error;
      if (membersResponse.error) throw membersResponse.error;

      setInvites((invitesResponse.data as any) || []);
      setMembers((membersResponse.data as any) || []);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Error al cargar la información');
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inviteEmail || !inviteRole || !currentOrgId) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    setInviting(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-invite', {
        body: {
          orgId: currentOrgId,
          email: inviteEmail.toLowerCase(),
          role: inviteRole
        }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      toast.success('Invitación enviada exitosamente');
      setShowInviteDialog(false);
      setInviteEmail('');
      setInviteRole('');
      
      // Refrescar datos
      fetchData();

    } catch (error: any) {
      console.error('Error sending invite:', error);
      toast.error(error.message || 'Error al enviar la invitación');
    } finally {
      setInviting(false);
    }
  };

  const handleResendInvite = async (inviteId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('resend-invite', {
        body: { inviteId }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      toast.success('Invitación reenviada');
      fetchData();
    } catch (error: any) {
      console.error('Error resending invite:', error);
      toast.error(error.message || 'Error al reenviar la invitación');
    }
  };

  const handleRevokeInvite = async (inviteId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('revoke-invite', {
        body: { inviteId }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      toast.success('Invitación revocada');
      fetchData();
    } catch (error: any) {
      console.error('Error revoking invite:', error);
      toast.error(error.message || 'Error al revocar la invitación');
    }
  };

  const getInviteStatus = (invite: Invite) => {
    if (invite.used_at) return { status: 'used', label: 'Aceptada', color: 'default' };
    if (invite.revoked_at) return { status: 'revoked', label: 'Revocada', color: 'secondary' };
    if (new Date(invite.expires_at) < new Date()) return { status: 'expired', label: 'Expirada', color: 'destructive' };
    return { status: 'pending', label: 'Pendiente', color: 'default' };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isAdmin) {
    return (
      <div className="container mx-auto py-8">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            No tienes permisos para ver esta página.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Personas</h1>
          <p className="text-muted-foreground">
            Administra el equipo de tu organización
          </p>
        </div>
        
        <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Invitar colaborador
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invitar nuevo colaborador</DialogTitle>
              <DialogDescription>
                Envía una invitación por email para que se una a tu organización.
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleInvite} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colaborador@empresa.com"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="role">Rol</Label>
                <Select value={inviteRole} onValueChange={setInviteRole} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un rol" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EMPLOYEE">Empleado</SelectItem>
                    <SelectItem value="MANAGER">Manager</SelectItem>
                    <SelectItem value="DIRECTOR">Director</SelectItem>
                    {userRole === 'OWNER' && (
                      <SelectItem value="ADMIN">Administrador</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowInviteDialog(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={inviting}>
                  {inviting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Enviar invitación
                    </>
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Miembros actuales */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="mr-2 h-5 w-5" />
            Miembros del equipo ({members.length})
          </CardTitle>
          <CardDescription>
            Personas que ya forman parte de la organización
          </CardDescription>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay miembros registrados
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Unido</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">
                      {member.profiles?.display_name || 
                       `${member.profiles?.first_name || ''} ${member.profiles?.last_name || ''}`.trim() ||
                       'Sin nombre'}
                    </TableCell>
                    <TableCell>{member.profiles?.email || 'Sin email'}</TableCell>
                    <TableCell>
                      <Badge variant={roleColors[member.role as keyof typeof roleColors]}>
                        {roleLabels[member.role as keyof typeof roleLabels]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(member.created_at)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Ver perfil</DropdownMenuItem>
                          <DropdownMenuItem>Cambiar rol</DropdownMenuItem>
                          {userRole === 'OWNER' && member.role !== 'OWNER' && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive">
                                Remover del equipo
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Invitaciones pendientes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Mail className="mr-2 h-5 w-5" />
            Invitaciones ({invites.length})
          </CardTitle>
          <CardDescription>
            Invitaciones enviadas que están pendientes de aceptar
          </CardDescription>
        </CardHeader>
        <CardContent>
          {invites.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay invitaciones enviadas
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Enviada</TableHead>
                  <TableHead>Expira</TableHead>
                  <TableHead className="w-[100px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invites.map((invite) => {
                  const status = getInviteStatus(invite);
                  return (
                    <TableRow key={invite.id}>
                      <TableCell className="font-medium">{invite.email}</TableCell>
                      <TableCell>
                        <Badge variant={roleColors[invite.role as keyof typeof roleColors]}>
                          {roleLabels[invite.role as keyof typeof roleLabels]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.color as any}>
                          {status.status === 'used' && <CheckCircle className="mr-1 h-3 w-3" />}
                          {status.status === 'revoked' && <XCircle className="mr-1 h-3 w-3" />}
                          {status.status === 'expired' && <Clock className="mr-1 h-3 w-3" />}
                          {status.status === 'pending' && <Clock className="mr-1 h-3 w-3" />}
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(invite.created_at)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(invite.expires_at)}
                      </TableCell>
                      <TableCell>
                        {status.status === 'pending' && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem 
                                onClick={() => handleResendInvite(invite.id)}
                              >
                                <Send className="mr-2 h-4 w-4" />
                                Reenviar
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleRevokeInvite(invite.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Revocar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}