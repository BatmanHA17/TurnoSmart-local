import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users } from 'lucide-react';
import { useRota, useColaboradorRotas } from '@/hooks/useRota';
import { useAuth } from '@/hooks/useAuth';
import { useColaboradorFull } from '@/hooks/useColaboradorFull';

interface RotaFilterProps {
  selectedRotaId: string | null;
  onRotaChange: (rotaId: string | null) => void;
  currentUserRole?: string;
}

export const RotaFilter = ({ selectedRotaId, onRotaChange, currentUserRole }: RotaFilterProps) => {
  const { user } = useAuth();
  const { rotas, loading: rotasLoading } = useRota();
  const { colaboradores } = useColaboradorFull();
  const [userColaboradorId, setUserColaboradorId] = useState<string | null>(null);
  const { colaboradorRotas } = useColaboradorRotas(userColaboradorId || '');

  // Encontrar el colaborador correspondiente al usuario actual
  useEffect(() => {
    if (user?.email && colaboradores.length > 0) {
      const colaborador = colaboradores.find(col => col.email === user.email);
      setUserColaboradorId(colaborador?.id || null);
    }
  }, [user?.email, colaboradores]);

  // Determinar qué rotas mostrar según el rol del usuario
  const availableRotas = currentUserRole === 'super_admin' || currentUserRole === 'admin' 
    ? rotas 
    : colaboradorRotas;

  // Auto-seleccionar la única rota disponible si hay solo una
  useEffect(() => {
    if (availableRotas.length === 1 && !selectedRotaId && !rotasLoading) {
      onRotaChange(availableRotas[0].id);
    }
  }, [availableRotas, selectedRotaId, onRotaChange, rotasLoading]);

  if (rotasLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Calendar className="h-4 w-4" />
        <span className="text-sm">Cargando rotas...</span>
      </div>
    );
  }

  if (availableRotas.length === 0) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Calendar className="h-4 w-4" />
        <span className="text-sm">No tienes acceso a ninguna rota</span>
      </div>
    );
  }

  if (availableRotas.length === 1) {
    const rota = availableRotas[0];
    return (
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-primary" />
        <Badge variant="default" className="flex items-center gap-1">
          {rota.name}
          <Users className="h-3 w-3" />
          {rota.member_count}
        </Badge>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">Rota:</span>
      </div>
      <Select 
        value={selectedRotaId || ''} 
        onValueChange={(value) => onRotaChange(value === '' ? null : value)}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Seleccionar rota" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">Todas las rotas</SelectItem>
          {availableRotas.map((rota) => (
            <SelectItem key={rota.id} value={rota.id}>
              <div className="flex items-center gap-2">
                <span>{rota.name}</span>
                <Badge variant="outline" className="text-xs">
                  <Users className="h-3 w-3 mr-1" />
                  {rota.member_count}
                </Badge>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};