// ============= Organization Types =============
// Tipos centralizados para toda la información de organizaciones/establecimientos

export interface Organization {
  id: string;
  name: string;
  country?: string;
  created_at: string;
  updated_at?: string;
  // Campos de dirección y ubicación
  address?: string; // Legacy field
  establishment_address?: string;
  postal_code?: string;
  city?: string;
  // Campos de empresa
  cif?: string;
  is_franchise?: boolean;
  health_service_code?: string;
  logo_url?: string;
  contact_email?: string;
  phone?: string;
  // Campos de convenio y políticas laborales
  convenio_colectivo?: string;
  mutua?: string;
  codigo_naf?: string;
  base_calculo_vacaciones?: string;
  tipo_comida?: string;
  adquisicion_mensual?: number;
  periodo_adquisicion_del?: number;
  periodo_adquisicion_mes?: string;
  periodo_adquisicion_ano?: string;
  // Subscription
  subscription_status?: string;
  trial_ends_at?: string;
  // Establecimiento por defecto
  is_default_establishment?: boolean;
}

export interface UserOrganization {
  org_id: string;
  org_name: string;
  user_role: 'OWNER' | 'ADMIN' | 'MANAGER' | 'DIRECTOR' | 'EMPLOYEE';
  is_primary: boolean;
  member_since: string;
}

export interface OrganizationFilterOption {
  id: string;
  name: string;
  type?: 'all' | 'establishment' | 'team';
}

// Interfaces para componentes de filtro unificados
export interface OrganizationFilterProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  showSearch?: boolean;
  showTeams?: boolean;
  variant?: 'popover' | 'select' | 'dropdown';
}

// Estados de filtro unificados
export interface OrganizationFilterState {
  selectedOrganization: string;
  searchTerm: string;
  isOpen: boolean;
}

// Legacy aliases para compatibilidad
export type Establishment = Organization;
export type EstablishmentFilterProps = OrganizationFilterProps;