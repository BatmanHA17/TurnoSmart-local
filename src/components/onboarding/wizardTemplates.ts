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
      { id: 'job-jefe-recepcion', title: 'Jefe/a de Recepción', departmentId: 'dept-frontdesk', departmentName: 'Recepción', hours: 8, headcount: 1, selected: true, engine_role: 'FOM' },
      { id: 'job-recepcionista', title: 'Recepcionista', departmentId: 'dept-frontdesk', departmentName: 'Recepción', hours: 8, headcount: 2, selected: true, engine_role: 'FRONT_DESK_AGENT' },
      { id: 'job-aux-recepcion', title: 'Auxiliar de Recepción', departmentId: 'dept-frontdesk', departmentName: 'Recepción', hours: 6, headcount: 1, selected: false, engine_role: 'FRONT_DESK_AGENT' },
      // Bar
      { id: 'job-jefe-bares', title: 'Jefe/a de Bar', departmentId: 'dept-bar', departmentName: 'Bar', hours: 8, headcount: 1, selected: true, engine_role: 'FIJO_NO_ROTA' },
      { id: 'job-barman', title: 'Barman / Barmaid', departmentId: 'dept-bar', departmentName: 'Bar', hours: 8, headcount: 2, selected: true, engine_role: 'ROTA_COMPLETO' },
      { id: 'job-ayudante-bar', title: 'Ayudante de Bar', departmentId: 'dept-bar', departmentName: 'Bar', hours: 6, headcount: 1, selected: false, engine_role: 'ROTA_PARCIAL' },
      // Cocina
      { id: 'job-jefe-cocina', title: 'Jefe/a de Cocina', departmentId: 'dept-kitchen', departmentName: 'Cocina', hours: 8, headcount: 1, selected: true, engine_role: 'FIJO_NO_ROTA' },
      { id: 'job-cocinero', title: 'Cocinero/a', departmentId: 'dept-kitchen', departmentName: 'Cocina', hours: 8, headcount: 2, selected: true, engine_role: 'ROTA_COMPLETO' },
      { id: 'job-ayudante-cocina', title: 'Ayudante de Cocina', departmentId: 'dept-kitchen', departmentName: 'Cocina', hours: 6, headcount: 1, selected: false, engine_role: 'ROTA_PARCIAL' },
      // Sala
      { id: 'job-jefe-sala', title: 'Jefe/a de Sala', departmentId: 'dept-restaurant', departmentName: 'Sala / Restaurante', hours: 8, headcount: 1, selected: true, engine_role: 'FIJO_NO_ROTA' },
      { id: 'job-camarero', title: 'Camarero/a', departmentId: 'dept-restaurant', departmentName: 'Sala / Restaurante', hours: 8, headcount: 3, selected: true, engine_role: 'ROTA_COMPLETO' },
      { id: 'job-ayudante-sala', title: 'Ayudante de Sala', departmentId: 'dept-restaurant', departmentName: 'Sala / Restaurante', hours: 6, headcount: 1, selected: false, engine_role: 'ROTA_PARCIAL' },
      // Limpieza (dept not selected by default → jobs unselected)
      { id: 'job-jefe-limpieza', title: 'Jefe/a de Limpieza', departmentId: 'dept-housekeeping', departmentName: 'Limpieza', hours: 8, headcount: 1, selected: false, engine_role: 'FIJO_NO_ROTA' },
      { id: 'job-limpieza', title: 'Personal de Limpieza', departmentId: 'dept-housekeeping', departmentName: 'Limpieza', hours: 6, headcount: 3, selected: false, engine_role: 'ROTA_COMPLETO' },
      // Room Service (dept not selected by default → jobs unselected)
      { id: 'job-jefe-roomservice', title: 'Jefe/a de Room Service', departmentId: 'dept-roomservice', departmentName: 'Room Service', hours: 8, headcount: 1, selected: false, engine_role: 'FIJO_NO_ROTA' },
      { id: 'job-mozo-roomservice', title: 'Mozo/a de Room Service', departmentId: 'dept-roomservice', departmentName: 'Room Service', hours: 8, headcount: 2, selected: false, engine_role: 'ROTA_COMPLETO' },
      // Mantenimiento (dept not selected by default → jobs unselected)
      { id: 'job-jefe-mant', title: 'Jefe/a de Mantenimiento', departmentId: 'dept-maintenance', departmentName: 'Mantenimiento', hours: 8, headcount: 1, selected: false, engine_role: 'FIJO_NO_ROTA' },
      { id: 'job-tecnico', title: 'Técnico de Mantenimiento', departmentId: 'dept-maintenance', departmentName: 'Mantenimiento', hours: 8, headcount: 2, selected: false, engine_role: 'ROTA_COMPLETO' },
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
      { id: 'job-gerente', title: 'Gerente de Tienda', departmentId: 'dept-tienda', departmentName: 'Tienda', hours: 8, headcount: 1, selected: true, engine_role: 'FIJO_NO_ROTA' },
      { id: 'job-encargado', title: 'Encargado/a de Turno', departmentId: 'dept-tienda', departmentName: 'Tienda', hours: 8, headcount: 1, selected: true, engine_role: 'COBERTURA' },
      { id: 'job-vendedor', title: 'Vendedor/a', departmentId: 'dept-tienda', departmentName: 'Tienda', hours: 8, headcount: 3, selected: true, engine_role: 'ROTA_COMPLETO' },
      { id: 'job-jefe-caja', title: 'Jefe/a de Caja', departmentId: 'dept-caja', departmentName: 'Caja', hours: 8, headcount: 1, selected: true, engine_role: 'FIJO_NO_ROTA' },
      { id: 'job-cajero', title: 'Cajero/a', departmentId: 'dept-caja', departmentName: 'Caja', hours: 8, headcount: 2, selected: true, engine_role: 'ROTA_COMPLETO' },
      { id: 'job-jefe-almacen', title: 'Jefe/a de Almacén', departmentId: 'dept-almacen', departmentName: 'Almacén', hours: 8, headcount: 1, selected: true, engine_role: 'FIJO_NO_ROTA' },
      { id: 'job-reponedor', title: 'Reponedor/a', departmentId: 'dept-almacen', departmentName: 'Almacén', hours: 6, headcount: 2, selected: true, engine_role: 'ROTA_PARCIAL' },
      { id: 'job-atencion', title: 'Agente de Atención al Cliente', departmentId: 'dept-atencion', departmentName: 'Atención al Cliente', hours: 8, headcount: 2, selected: true, engine_role: 'ROTA_COMPLETO' },
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
      { id: 'job-supervisor-enf', title: 'Supervisor/a de Enfermería', departmentId: 'dept-enfermeria', departmentName: 'Enfermería', hours: 8, headcount: 1, selected: true, engine_role: 'FIJO_NO_ROTA' },
      { id: 'job-enfermero', title: 'Enfermero/a', departmentId: 'dept-enfermeria', departmentName: 'Enfermería', hours: 8, headcount: 3, selected: true, engine_role: 'ROTA_COMPLETO' },
      { id: 'job-supervisor-aux', title: 'Supervisor/a Auxiliares', departmentId: 'dept-auxiliares', departmentName: 'Auxiliares', hours: 8, headcount: 1, selected: true, engine_role: 'FIJO_NO_ROTA' },
      { id: 'job-auxiliar', title: 'Auxiliar de Enfermería', departmentId: 'dept-auxiliares', departmentName: 'Auxiliares', hours: 8, headcount: 3, selected: true, engine_role: 'ROTA_COMPLETO' },
      { id: 'job-jefe-admision', title: 'Jefe/a de Admisión', departmentId: 'dept-admision', departmentName: 'Admisión', hours: 8, headcount: 1, selected: true, engine_role: 'FIJO_NO_ROTA' },
      { id: 'job-administrativo', title: 'Administrativo/a', departmentId: 'dept-admision', departmentName: 'Admisión', hours: 8, headcount: 2, selected: true, engine_role: 'ROTA_COMPLETO' },
      { id: 'job-farmaceutico', title: 'Farmacéutico/a', departmentId: 'dept-farmacia', departmentName: 'Farmacia', hours: 8, headcount: 1, selected: true, engine_role: 'FIJO_NO_ROTA' },
      { id: 'job-tecnico-farmacia', title: 'Técnico/a de Farmacia', departmentId: 'dept-farmacia', departmentName: 'Farmacia', hours: 8, headcount: 2, selected: true, engine_role: 'ROTA_COMPLETO' },
    ],
  },
  restaurant: {
    label: 'Restaurante independiente',
    hasTemplates: true,
    departments: [
      { id: 'dept-sala', name: 'Sala', selected: true },
      { id: 'dept-cocina', name: 'Cocina', selected: true },
      { id: 'dept-barra', name: 'Barra', selected: false },
    ],
    jobs: [
      // Sala
      { id: 'job-r-jefe-sala', title: 'Jefe/a de Sala', departmentId: 'dept-sala', departmentName: 'Sala', hours: 8, headcount: 1, selected: true, engine_role: 'FIJO_NO_ROTA' },
      { id: 'job-r-segundo-sala', title: '2ndo/a de Sala', departmentId: 'dept-sala', departmentName: 'Sala', hours: 8, headcount: 1, selected: true, engine_role: 'COBERTURA' },
      { id: 'job-r-camarero', title: 'Camarero/a', departmentId: 'dept-sala', departmentName: 'Sala', hours: 8, headcount: 4, selected: true, engine_role: 'ROTA_COMPLETO' },
      { id: 'job-r-ayudante-sala', title: 'Ayudante de Sala', departmentId: 'dept-sala', departmentName: 'Sala', hours: 6, headcount: 2, selected: true, engine_role: 'ROTA_PARCIAL' },
      // Cocina
      { id: 'job-r-jefe-cocina', title: 'Jefe/a de Cocina', departmentId: 'dept-cocina', departmentName: 'Cocina', hours: 8, headcount: 1, selected: true, engine_role: 'FIJO_NO_ROTA' },
      { id: 'job-r-cocinero', title: 'Cocinero/a', departmentId: 'dept-cocina', departmentName: 'Cocina', hours: 8, headcount: 3, selected: true, engine_role: 'ROTA_COMPLETO' },
      { id: 'job-r-ayudante-cocina', title: 'Ayudante de Cocina', departmentId: 'dept-cocina', departmentName: 'Cocina', hours: 6, headcount: 2, selected: true, engine_role: 'ROTA_PARCIAL' },
      // Barra
      { id: 'job-r-barman', title: 'Barman / Barmaid', departmentId: 'dept-barra', departmentName: 'Barra', hours: 8, headcount: 2, selected: false, engine_role: 'ROTA_COMPLETO' },
    ],
  },
  services: {
    label: 'Servicios',
    hasTemplates: true,
    departments: [
      { id: 'dept-operaciones', name: 'Operaciones', selected: true },
      { id: 'dept-admin', name: 'Administración', selected: true },
      { id: 'dept-soporte', name: 'Soporte / Atención', selected: false },
    ],
    jobs: [
      { id: 'job-s-responsable', title: 'Responsable de Operaciones', departmentId: 'dept-operaciones', departmentName: 'Operaciones', hours: 8, headcount: 1, selected: true, engine_role: 'FIJO_NO_ROTA' },
      { id: 'job-s-tecnico', title: 'Técnico/a', departmentId: 'dept-operaciones', departmentName: 'Operaciones', hours: 8, headcount: 3, selected: true, engine_role: 'ROTA_COMPLETO' },
      { id: 'job-s-auxiliar', title: 'Auxiliar', departmentId: 'dept-operaciones', departmentName: 'Operaciones', hours: 6, headcount: 2, selected: true, engine_role: 'ROTA_PARCIAL' },
      { id: 'job-s-admin', title: 'Administrativo/a', departmentId: 'dept-admin', departmentName: 'Administración', hours: 8, headcount: 2, selected: true, engine_role: 'FIJO_NO_ROTA' },
      { id: 'job-s-soporte', title: 'Agente de Soporte', departmentId: 'dept-soporte', departmentName: 'Soporte / Atención', hours: 8, headcount: 3, selected: false, engine_role: 'ROTA_COMPLETO' },
    ],
  },
  manufacturing: {
    label: 'Manufactura / Industria',
    hasTemplates: true,
    departments: [
      { id: 'dept-produccion', name: 'Producción', selected: true },
      { id: 'dept-calidad', name: 'Calidad', selected: true },
      { id: 'dept-logistica', name: 'Logística', selected: false },
    ],
    jobs: [
      { id: 'job-m-jefe-prod', title: 'Jefe/a de Producción', departmentId: 'dept-produccion', departmentName: 'Producción', hours: 8, headcount: 1, selected: true, engine_role: 'FIJO_NO_ROTA' },
      { id: 'job-m-supervisor', title: 'Supervisor/a de Turno', departmentId: 'dept-produccion', departmentName: 'Producción', hours: 8, headcount: 2, selected: true, engine_role: 'COBERTURA' },
      { id: 'job-m-operario', title: 'Operario/a', departmentId: 'dept-produccion', departmentName: 'Producción', hours: 8, headcount: 6, selected: true, engine_role: 'ROTA_COMPLETO' },
      { id: 'job-m-calidad', title: 'Inspector/a de Calidad', departmentId: 'dept-calidad', departmentName: 'Calidad', hours: 8, headcount: 2, selected: true, engine_role: 'ROTA_PARCIAL' },
      { id: 'job-m-logistica', title: 'Mozo/a de Almacén', departmentId: 'dept-logistica', departmentName: 'Logística', hours: 8, headcount: 3, selected: false, engine_role: 'ROTA_COMPLETO' },
    ],
  },
  generic: {
    label: 'Genérico (cualquier sector)',
    hasTemplates: true,
    departments: [
      { id: 'dept-general', name: 'Departamento General', selected: true },
    ],
    jobs: [
      { id: 'job-g-jefe', title: 'Jefe/a de Departamento', departmentId: 'dept-general', departmentName: 'Departamento General', hours: 8, headcount: 1, selected: true, engine_role: 'FIJO_NO_ROTA' },
      { id: 'job-g-supervisor', title: 'Supervisor/a', departmentId: 'dept-general', departmentName: 'Departamento General', hours: 8, headcount: 1, selected: true, engine_role: 'COBERTURA' },
      { id: 'job-g-agente', title: 'Agente / Empleado', departmentId: 'dept-general', departmentName: 'Departamento General', hours: 8, headcount: 4, selected: true, engine_role: 'ROTA_COMPLETO' },
    ],
  },

  // --- Industries without specific templates (use 'generic' defaults) ---
  aerospace: { label: 'Aerospace & Defense', hasTemplates: false, departments: [], jobs: [] },
  agriculture: { label: 'Agriculture', hasTemplates: false, departments: [], jobs: [] },
  automobiles: { label: 'Automobiles & Components', hasTemplates: false, departments: [], jobs: [] },
  banking: { label: 'Banking & Insurance', hasTemplates: false, departments: [], jobs: [] },
  chemicals: { label: 'Chemicals', hasTemplates: false, departments: [], jobs: [] },
  commercial_services: { label: 'Commercial & Professional Services', hasTemplates: false, departments: [], jobs: [] },
  commodities: { label: 'Commodities', hasTemplates: false, departments: [], jobs: [] },
  construction: { label: 'Construction & Engineering', hasTemplates: false, departments: [], jobs: [] },
  consumer_durables: { label: 'Consumer Durables & Apparel', hasTemplates: false, departments: [], jobs: [] },
  consumer_services: { label: 'Consumer Services', hasTemplates: false, departments: [], jobs: [] },
  containers: { label: 'Containers & Packaging', hasTemplates: false, departments: [], jobs: [] },
  diversified_financials: { label: 'Diversified Financials', hasTemplates: false, departments: [], jobs: [] },
  education: { label: 'Education', hasTemplates: false, departments: [], jobs: [] },
  energy: { label: 'Energy', hasTemplates: false, departments: [], jobs: [] },
  food_retailing: { label: 'Food & Staples Retailing', hasTemplates: false, departments: [], jobs: [] },
  food_beverage: { label: 'Food, Beverage & Tobacco', hasTemplates: false, departments: [], jobs: [] },
  government: { label: 'Government Administration', hasTemplates: false, departments: [], jobs: [] },
  healthcare_equipment: { label: 'Health Care Equipment & Services', hasTemplates: false, departments: [], jobs: [] },
  internet_marketing: { label: 'Internet & Direct Marketing Retail', hasTemplates: false, departments: [], jobs: [] },
  legal: { label: 'Legal Services', hasTemplates: false, departments: [], jobs: [] },
  machinery: { label: 'Machinery', hasTemplates: false, departments: [], jobs: [] },
  media: { label: 'Media & Entertainment', hasTemplates: false, departments: [], jobs: [] },
  metals_mining: { label: 'Metals & Mining', hasTemplates: false, departments: [], jobs: [] },
  military: { label: 'Military', hasTemplates: false, departments: [], jobs: [] },
  nonprofit: { label: 'Non-Profit Organization', hasTemplates: false, departments: [], jobs: [] },
  pharma: { label: 'Pharmaceuticals & Biotechnology', hasTemplates: false, departments: [], jobs: [] },
  real_estate: { label: 'Real Estate', hasTemplates: false, departments: [], jobs: [] },
  research: { label: 'Research & Consulting Services', hasTemplates: false, departments: [], jobs: [] },
  semiconductors: { label: 'Semiconductors', hasTemplates: false, departments: [], jobs: [] },
  software: { label: 'Software & IT Services', hasTemplates: false, departments: [], jobs: [] },
  tech_hardware: { label: 'Technology Hardware & Equipment', hasTemplates: false, departments: [], jobs: [] },
  telecom: { label: 'Telecommunication', hasTemplates: false, departments: [], jobs: [] },
  trading: { label: 'Trading Companies & Distributors', hasTemplates: false, departments: [], jobs: [] },
  transportation: { label: 'Transportation', hasTemplates: false, departments: [], jobs: [] },
  travel_tourism: { label: 'Travel & Tourism', hasTemplates: false, departments: [], jobs: [] },
  utilities: { label: 'Utilities', hasTemplates: false, departments: [], jobs: [] },
  other: { label: 'Other', hasTemplates: false, departments: [], jobs: [] },
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
