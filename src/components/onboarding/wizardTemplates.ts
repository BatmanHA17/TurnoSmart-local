import type { DepartmentData, JobData } from '@/hooks/useOnboardingWizard';

export interface IndustryTemplate {
  label: string;
  hasTemplates: boolean;
  departments: DepartmentData[];
  jobs: JobData[];
}

export const INDUSTRIES: Record<string, IndustryTemplate> = {
  hospitality: {
    label: 'Hostelería (Hotel, Restaurante, Bar)',
    hasTemplates: true,
    departments: [
      { id: 'dept-frontdesk', name: 'Recepción', selected: true },
      { id: 'dept-bar', name: 'Bar', selected: true },
      { id: 'dept-kitchen', name: 'Cocina', selected: true },
      { id: 'dept-restaurant', name: 'Sala / Restaurante', selected: true },
      { id: 'dept-housekeeping', name: 'Limpieza', selected: false },
      { id: 'dept-roomservice', name: 'Room Service', selected: false },
      { id: 'dept-maintenance', name: 'Mantenimiento', selected: false },
    ],
    jobs: [
      // Recepción
      { id: 'job-jefe-recepcion', title: 'Jefe/a de Recepción', departmentId: 'dept-frontdesk', departmentName: 'Recepción', hours: 8, headcount: 1, selected: true },
      { id: 'job-recepcionista', title: 'Recepcionista', departmentId: 'dept-frontdesk', departmentName: 'Recepción', hours: 8, headcount: 2, selected: true },
      { id: 'job-aux-recepcion', title: 'Auxiliar de Recepción', departmentId: 'dept-frontdesk', departmentName: 'Recepción', hours: 6, headcount: 1, selected: false },
      // Bar
      { id: 'job-jefe-bares', title: 'Jefe/a de Bar', departmentId: 'dept-bar', departmentName: 'Bar', hours: 8, headcount: 1, selected: true },
      { id: 'job-barman', title: 'Barman / Barmaid', departmentId: 'dept-bar', departmentName: 'Bar', hours: 8, headcount: 2, selected: true },
      { id: 'job-ayudante-bar', title: 'Ayudante de Bar', departmentId: 'dept-bar', departmentName: 'Bar', hours: 6, headcount: 1, selected: false },
      // Cocina
      { id: 'job-jefe-cocina', title: 'Jefe/a de Cocina', departmentId: 'dept-kitchen', departmentName: 'Cocina', hours: 8, headcount: 1, selected: true },
      { id: 'job-cocinero', title: 'Cocinero/a', departmentId: 'dept-kitchen', departmentName: 'Cocina', hours: 8, headcount: 2, selected: true },
      { id: 'job-ayudante-cocina', title: 'Ayudante de Cocina', departmentId: 'dept-kitchen', departmentName: 'Cocina', hours: 6, headcount: 1, selected: false },
      // Sala
      { id: 'job-jefe-sala', title: 'Jefe/a de Sala', departmentId: 'dept-restaurant', departmentName: 'Sala / Restaurante', hours: 8, headcount: 1, selected: true },
      { id: 'job-camarero', title: 'Camarero/a', departmentId: 'dept-restaurant', departmentName: 'Sala / Restaurante', hours: 8, headcount: 3, selected: true },
      { id: 'job-ayudante-sala', title: 'Ayudante de Sala', departmentId: 'dept-restaurant', departmentName: 'Sala / Restaurante', hours: 6, headcount: 1, selected: false },
      // Limpieza (dept not selected by default → jobs unselected)
      { id: 'job-jefe-limpieza', title: 'Jefe/a de Limpieza', departmentId: 'dept-housekeeping', departmentName: 'Limpieza', hours: 8, headcount: 1, selected: false },
      { id: 'job-limpieza', title: 'Personal de Limpieza', departmentId: 'dept-housekeeping', departmentName: 'Limpieza', hours: 6, headcount: 3, selected: false },
      // Room Service (dept not selected by default → jobs unselected)
      { id: 'job-jefe-roomservice', title: 'Jefe/a de Room Service', departmentId: 'dept-roomservice', departmentName: 'Room Service', hours: 8, headcount: 1, selected: false },
      { id: 'job-mozo-roomservice', title: 'Mozo/a de Room Service', departmentId: 'dept-roomservice', departmentName: 'Room Service', hours: 8, headcount: 2, selected: false },
      // Mantenimiento (dept not selected by default → jobs unselected)
      { id: 'job-jefe-mant', title: 'Jefe/a de Mantenimiento', departmentId: 'dept-maintenance', departmentName: 'Mantenimiento', hours: 8, headcount: 1, selected: false },
      { id: 'job-tecnico', title: 'Técnico de Mantenimiento', departmentId: 'dept-maintenance', departmentName: 'Mantenimiento', hours: 8, headcount: 2, selected: false },
    ],
  },
  retail: {
    label: 'Comercio / Retail',
    hasTemplates: true,
    departments: [
      { id: 'dept-tienda', name: 'Tienda', selected: true },
      { id: 'dept-caja', name: 'Caja', selected: true },
      { id: 'dept-almacen', name: 'Almacén', selected: true },
      { id: 'dept-atencion', name: 'Atención al Cliente', selected: false },
    ],
    jobs: [
      { id: 'job-gerente', title: 'Gerente de Tienda', departmentId: 'dept-tienda', departmentName: 'Tienda', hours: 8, headcount: 1, selected: true },
      { id: 'job-encargado', title: 'Encargado/a de Turno', departmentId: 'dept-tienda', departmentName: 'Tienda', hours: 8, headcount: 1, selected: true },
      { id: 'job-vendedor', title: 'Vendedor/a', departmentId: 'dept-tienda', departmentName: 'Tienda', hours: 8, headcount: 3, selected: true },
      { id: 'job-jefe-caja', title: 'Jefe/a de Caja', departmentId: 'dept-caja', departmentName: 'Caja', hours: 8, headcount: 1, selected: true },
      { id: 'job-cajero', title: 'Cajero/a', departmentId: 'dept-caja', departmentName: 'Caja', hours: 8, headcount: 2, selected: true },
      { id: 'job-jefe-almacen', title: 'Jefe/a de Almacén', departmentId: 'dept-almacen', departmentName: 'Almacén', hours: 8, headcount: 1, selected: true },
      { id: 'job-reponedor', title: 'Reponedor/a', departmentId: 'dept-almacen', departmentName: 'Almacén', hours: 6, headcount: 2, selected: true },
      { id: 'job-atencion', title: 'Agente de Atención al Cliente', departmentId: 'dept-atencion', departmentName: 'Atención al Cliente', hours: 8, headcount: 2, selected: true },
    ],
  },
  healthcare: {
    label: 'Sanidad',
    hasTemplates: true,
    departments: [
      { id: 'dept-enfermeria', name: 'Enfermería', selected: true },
      { id: 'dept-auxiliares', name: 'Auxiliares', selected: true },
      { id: 'dept-admision', name: 'Admisión', selected: true },
      { id: 'dept-farmacia', name: 'Farmacia', selected: false },
    ],
    jobs: [
      { id: 'job-supervisor-enf', title: 'Supervisor/a de Enfermería', departmentId: 'dept-enfermeria', departmentName: 'Enfermería', hours: 8, headcount: 1, selected: true },
      { id: 'job-enfermero', title: 'Enfermero/a', departmentId: 'dept-enfermeria', departmentName: 'Enfermería', hours: 8, headcount: 3, selected: true },
      { id: 'job-supervisor-aux', title: 'Supervisor/a Auxiliares', departmentId: 'dept-auxiliares', departmentName: 'Auxiliares', hours: 8, headcount: 1, selected: true },
      { id: 'job-auxiliar', title: 'Auxiliar de Enfermería', departmentId: 'dept-auxiliares', departmentName: 'Auxiliares', hours: 8, headcount: 3, selected: true },
      { id: 'job-jefe-admision', title: 'Jefe/a de Admisión', departmentId: 'dept-admision', departmentName: 'Admisión', hours: 8, headcount: 1, selected: true },
      { id: 'job-administrativo', title: 'Administrativo/a', departmentId: 'dept-admision', departmentName: 'Admisión', hours: 8, headcount: 2, selected: true },
      { id: 'job-farmaceutico', title: 'Farmacéutico/a', departmentId: 'dept-farmacia', departmentName: 'Farmacia', hours: 8, headcount: 1, selected: true },
      { id: 'job-tecnico-farmacia', title: 'Técnico/a de Farmacia', departmentId: 'dept-farmacia', departmentName: 'Farmacia', hours: 8, headcount: 2, selected: true },
    ],
  },
  services: {
    label: 'Servicios',
    hasTemplates: false,
    departments: [],
    jobs: [],
  },
  manufacturing: {
    label: 'Manufactura / Industria',
    hasTemplates: false,
    departments: [],
    jobs: [],
  },
  other: {
    label: 'Otro',
    hasTemplates: false,
    departments: [],
    jobs: [],
  },
};

export const COUNTRIES = [
  { code: 'ES', name: 'España' },
  { code: 'MX', name: 'México' },
  { code: 'AR', name: 'Argentina' },
  { code: 'CO', name: 'Colombia' },
  { code: 'CL', name: 'Chile' },
  { code: 'PE', name: 'Perú' },
  { code: 'OTHER', name: 'Otro' },
];

export const CONTRACT_HOURS = [
  { value: 12, label: '12h (Turno guardia)' },
  { value: 10, label: '10h' },
  { value: 8, label: '8h (Jornada completa)' },
  { value: 7, label: '7h (35h/semana)' },
  { value: 6, label: '6h (75%)' },
  { value: 5, label: '5h (62.5%)' },
  { value: 4, label: '4h (Media jornada)' },
];
