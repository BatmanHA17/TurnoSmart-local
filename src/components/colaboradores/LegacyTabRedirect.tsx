import { useEffect } from 'react';
import { Navigate, useParams, useSearchParams } from 'react-router-dom';

/**
 * Legacy Tab Redirect Component
 * Handles 301-style redirects from old ?tab= query params to clean nested routes
 */
export default function LegacyTabRedirect() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const tab = searchParams.get('tab');

  // Mapping from legacy tab query params to canonical routes
  const tabMapping: Record<string, string> = {
    'datos-personales': 'profile',
    'contratos': 'contract',
    'contrato-laboral': 'contract',
    'permisos-accesos': 'permissions',
    'rol-permisos': 'permissions',
    'planificacion': 'planning',
    'tiempo-planificacion': 'planning',
    'disponibilidad': 'planning', // Availability is part of planning
    'ausencias': 'absences',
    'vacaciones-ausencias': 'absences',
    'compensacion': 'absences', // Compensation is part of absences
    'compensacion-horas': 'absences',
    'documentos': 'profile', // Documents are part of profile for now
    'sistema-usuarios': 'system'
  };

  if (!tab) {
    // No tab param, redirect to default profile
    return <Navigate to={`/colaboradores/${id}/profile`} replace />;
  }

  const canonicalRoute = tabMapping[tab] || 'profile';
  
  // Log the redirect for analytics/debugging
  useEffect(() => {
  }, [tab, id, canonicalRoute]);

  return <Navigate to={`/colaboradores/${id}/${canonicalRoute}`} replace />;
}
