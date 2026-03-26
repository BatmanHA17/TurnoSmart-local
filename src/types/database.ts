export interface Employee {
  id: string;
  name: string;
  category: string;
  contract_hours: number;
  contract_unit: number;
  department: string;
  employee_type: 'propio' | 'ett';
  employee_number: number | null;
  created_at: string;
  updated_at: string;
}

export interface Cuadrante {
  id: string;
  name: string;
  month: number;
  year: number;
  hotel_rooms: number;
  created_at: string;
  updated_at: string;
}

export interface CuadranteAssignment {
  id: string;
  cuadrante_id: string;
  employee_id: string;
  day_of_month: number;
  status_code: string;
  start_time: string | null;
  location: string | null;
  created_at: string;
}

export interface DailyOccupancy {
  id: string;
  cuadrante_id: string;
  day_of_month: number;
  occupancy_percentage: number;
  total_clients: number;
  created_at: string;
}

export interface OccupancyBudget {
  id: string;
  occupancy_percentage: number;
  total_clients: number;
  jefe_bares: number;
  segundo_jefe_bares: number;
  jefe_sector: number;
  camareros: number;
  ayudantes: number;
  presencial_total: number;
  ett_external: number;
  ratio_clients_barman: number | null;
  plantilla_librando: number | null;
  plantilla_activa: number | null;
  plantilla_vacaciones: number | null;
  absentismo_percentage: number;
  plantilla_absentismo: number | null;
  plantilla_bruta_total: number | null;
  created_at: string;
}

export interface StatusCode {
  code: string;
  description: string;
  color: string;
}

export interface CuadranteStats {
  presencial_count: number;
  banquetes_count: number;
  libres_count: number;
  vacaciones_count: number;
  enfermos_count: number;
  faltas_count: number;
  total_plantilla: number;
}