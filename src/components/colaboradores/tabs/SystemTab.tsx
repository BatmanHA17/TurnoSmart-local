import { useParams } from "react-router-dom";
import { useColaboradorById } from "@/hooks/useColaboradorFull";
import { UserSystemManagement } from "@/components/colaboradores/UserSystemManagement";

export default function SystemTab() {
  const { id } = useParams<{ id: string }>();
  const { colaborador } = useColaboradorById(id);

  const isInactive = colaborador?.status === 'inactivo';

  return (
    <div className={`space-y-6 ${isInactive ? 'opacity-50 pointer-events-none' : ''}`}>
      <UserSystemManagement 
        colaboradorId={colaborador?.id || ''} 
        colaboradorEmail={colaborador?.email || ''} 
      />
    </div>
  );
}
