import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { UserPlus, Mail, Loader2 } from "lucide-react";

export const InviteColaboradorDialog = () => {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [orgId, setOrgId] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  // Obtener la primera organización del usuario
  React.useEffect(() => {
    const fetchOrgId = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('memberships')
          .select('org_id')
          .eq('user_id', user.id)
          .limit(1)
          .single();
        if (error) console.error('[InviteColaboradorDialog] Error fetching org ID:', error);
        else if (data) setOrgId(data.org_id);
      } catch (error) {
        console.error('Error fetching org ID:', error);
      }
    };

    fetchOrgId();
  }, [user]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !orgId) {
      toast({
        title: "Error",
        description: "Por favor ingresa un email válido",
        variant: "destructive"
      });
      return;
    }

    setIsInviting(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-invite', {
        body: {
          orgId: orgId,
          email: email.toLowerCase(),
          role: 'EMPLOYEE'
        }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({
        title: "Invitación enviada",
        description: `Se ha enviado una invitación a ${email} como empleado`
      });
      
      setOpen(false);
      setEmail('');

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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <UserPlus className="w-4 h-4" />
          Invitar Colaborador
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Invitar Nuevo Colaborador
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleInvite} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email del colaborador</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colaborador@empresa.com"
              required
            />
          </div>
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              El colaborador recibirá un email de invitación y será añadido como <strong>empleado</strong> 
              con acceso básico al sistema.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isInviting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isInviting}>
              {isInviting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Enviar Invitación
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};