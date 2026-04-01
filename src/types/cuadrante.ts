export interface ContractType {
  hours: number;
  percentage: number;
  units: number;
  label: string;
}

export interface LaborContract {
  type: 'INDEFINIDO' | 'TEMPORAL' | 'FORMACION_ALTERNANCIA' | 'FORMATIVO_PRACTICA';
  hours: number;
  label: string;
}

export interface CuadranteEmployee {
  id: string;
  name: string;
  surname: string;
  category: string;
  contractHours: number;
  contractType: string;
  contractUnits: number;
  department: 'PROPIO' | 'ETT';
  position: number; // Para drag and drop
  schedule: { [day: number]: string }; // día del mes -> código
}

export interface DayOccupancy {
  day: number;
  occupancyPercentage: number;
  isManual: boolean;
}

export interface CuadranteMensual {
  id: string;
  name: string;
  month: number;
  year: number;
  daysInMonth: number;
  employees: CuadranteEmployee[];
  occupancy: DayOccupancy[];
  createdAt: Date;
  updatedAt: Date;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
}

export interface StatusCode {
  code: string;
  name: string;
  color: string;
  bgColor: string;
}

export const CONTRACT_TYPES: ContractType[] = [
  { hours: 8, percentage: 100, units: 1.0, label: '8h (100%)' },
  { hours: 7, percentage: 87.5, units: 0.875, label: '7h (87.5%)' },
  { hours: 6, percentage: 75, units: 0.75, label: '6h (75%)' },
  { hours: 5, percentage: 62.5, units: 0.625, label: '5h (62.5%)' },
  { hours: 4, percentage: 50, units: 0.5, label: '4h (50%)' },
  { hours: 3, percentage: 37.5, units: 0.375, label: '3h (37.5%)' },
  { hours: 2, percentage: 25, units: 0.25, label: '2h (25%)' },
  { hours: 1, percentage: 12.5, units: 0.125, label: '1h (12.5%)' }
];

export const LABOR_CONTRACTS: LaborContract[] = [
  { type: 'INDEFINIDO', hours: 0, label: 'Contrato Indefinido' },
  { type: 'TEMPORAL', hours: 0, label: 'Contrato Temporal' },
  { type: 'FORMACION_ALTERNANCIA', hours: 0, label: 'Formación en Alternancia' },
  { type: 'FORMATIVO_PRACTICA', hours: 0, label: 'Formativo para Práctica Profesional' }
];

export const STATUS_CODES: StatusCode[] = [
  { code: 'X', name: 'Presencial', color: 'text-matcha', bgColor: 'bg-matcha-light border-matcha/20' },
  { code: 'XB', name: 'Presencial Banquetes', color: 'text-bamboo', bgColor: 'bg-bamboo-light border-bamboo/20' },
  { code: 'D', name: 'Descanso', color: 'text-sky', bgColor: 'bg-sky-light border-sky/20' },
  { code: 'V', name: 'Vacaciones', color: 'text-sunset', bgColor: 'bg-sunset-light border-sunset/20' },
  { code: 'E', name: 'Enfermedad', color: 'text-accent', bgColor: 'bg-accent/20 border-accent/20' },
  { code: 'F', name: 'Falta', color: 'text-destructive', bgColor: 'bg-destructive/20 border-destructive/20' },
  { code: 'P', name: 'Permiso', color: 'text-sky', bgColor: 'bg-sky-light border-sky/20' },
  { code: 'C', name: 'Curso', color: 'text-sakura', bgColor: 'bg-sakura-light border-sakura/20' },
  { code: 'H', name: 'Horas Sindicales', color: 'text-sunset', bgColor: 'bg-sunset-light border-sunset/20' },
  { code: 'S', name: 'Sanción', color: 'text-stone', bgColor: 'bg-stone-light border-stone/20' }
];

export const WEEKDAYS = ['L', 'M', 'MI', 'J', 'V', 'S', 'D'];
export const WEEKDAYS_FULL = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export const MAX_EMPLOYEES_PER_CONTRACT = 50;