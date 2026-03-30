import { useParams } from 'react-router-dom';
import { useColaboradorById } from '@/hooks/useColaboradorFull';
import { useCurrentOrganization } from '@/hooks/useCurrentOrganization';
import { useNominas } from '@/hooks/useNominas';
import { useUserRoleCanonical } from '@/hooks/useUserRoleCanonical';
import { useAuth } from '@/hooks/useAuth';
import { NominaCard } from '@/components/nominas/NominaCard';
import { NotionCard } from '@/components/ui/notion-components';
import { FileText } from 'lucide-react';

export default function NominasTab() {
  const { id } = useParams<{ id: string }>();
  const { colaborador } = useColaboradorById(id);
  const { org } = useCurrentOrganization();
  const { user } = useAuth();
  const { isManager } = useUserRoleCanonical();

  const orgId = org?.id ?? null;

  const { nominas, loading, sendNomina, acknowledgeNomina, deleteNomina } = useNominas(orgId, {
    colaboradorId: id,
  });

  // Determine if the logged-in user IS this employee
  // (colaborador.user_id matches auth.uid)
  const isOwnProfile = !!(colaborador && user && (colaborador as any).user_id === user.id);

  const isInactive = colaborador?.status === 'inactivo';

  return (
    <div className={`space-y-6 ${isInactive ? 'opacity-50 pointer-events-none' : ''}`}>
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
          <FileText className="h-4 w-4 text-emerald-600" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">Nóminas</h3>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground py-6 text-center">Cargando nóminas...</div>
      ) : nominas.length === 0 ? (
        <NotionCard className="p-8 text-center text-muted-foreground">
          <FileText className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No hay nóminas registradas para este colaborador</p>
        </NotionCard>
      ) : (
        <div className="space-y-3">
          {nominas.map((nomina) => (
            <NominaCard
              key={nomina.id}
              nomina={nomina}
              showEmployee={false}
              isManager={isManager}
              isEmployee={isOwnProfile}
              onSend={sendNomina}
              onAcknowledge={acknowledgeNomina}
              onDelete={deleteNomina}
            />
          ))}
        </div>
      )}
    </div>
  );
}
