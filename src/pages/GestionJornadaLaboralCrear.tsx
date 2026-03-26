import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { GestionJornadaStep1 } from "@/components/GestionJornadaStep1";
import { useState, useEffect } from "react";

const GestionJornadaLaboralCrear = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const [existingPeriod, setExistingPeriod] = useState(null);

  useEffect(() => {
    if (editId) {
      const savedPeriods = JSON.parse(localStorage.getItem('gestion-jornada-periods') || '[]');
      const period = savedPeriods.find(p => p.id === editId);
      setExistingPeriod(period);
    }
  }, [editId]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header with back button */}
      <div className="border-b bg-white px-6 py-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
          <h1 className="text-xl font-semibold">
            {editId ? 'Editar Período' : 'Crear Nuevo Período'}
          </h1>
        </div>
      </div>

      {/* Main content */}
      <div className="p-6">
        {editId && !existingPeriod ? (
          <div>Cargando período...</div>
        ) : (
          <GestionJornadaStep1 
            onClose={() => navigate(-1)} 
            editMode={!!editId}
            existingPeriod={existingPeriod}
          />
        )}
      </div>
    </div>
  );
};

export default GestionJornadaLaboralCrear;