import { useNavigate } from "react-router-dom";
import { AddColaboradorSheet } from "./AddColaboradorSheet";

/**
 * Wrapper para usar AddColaboradorSheet como ruta persistente.
 * Permite deep-linking a /colaboradores/new manteniendo el mismo Sheet usado para editar.
 */
export const AddColaboradorSheetRoute = () => {
  const navigate = useNavigate();
  
  const handleClose = () => {
    navigate('/colaboradores');
  };

  const handleColaboradorAdded = () => {
    navigate('/colaboradores');
  };

  return (
    <AddColaboradorSheet 
      open={true}
      onOpenChange={handleClose}
      onColaboradorAdded={handleColaboradorAdded}
    />
  );
};
