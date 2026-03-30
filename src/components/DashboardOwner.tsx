import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Dashboard OWNER — redirige directamente al cuadrante semanal.
 * El cuadrante es la pantalla de mayor valor para el usuario.
 */
const DashboardOwner = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/turnosmart/week", { replace: true });
  }, [navigate]);

  return null;
};

export default DashboardOwner;
