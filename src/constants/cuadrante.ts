// Constantes del módulo Cuadrante — extraídas de CuadranteEditor.tsx

export const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export const YEARS = [
  2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020,
  2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030,
  2031, 2032, 2033, 2034, 2035
];

export const STATUS_CODES = [
  { code: 'X',  label: 'X - Presencial',         color: 'bg-foreground/5 text-foreground border-foreground/10' },
  { code: 'D',  label: 'D - Descanso',             color: 'bg-muted text-muted-foreground border-border' },
  { code: 'V',  label: 'V - Vacaciones',          color: 'bg-foreground/8 text-foreground border-foreground/15' },
  { code: 'E',  label: 'E - Enfermedad',          color: 'bg-foreground/10 text-foreground border-foreground/20' },
  { code: 'F',  label: 'F - Falta',               color: 'bg-foreground/7 text-foreground border-foreground/12' },
  { code: 'P',  label: 'P - Permiso',             color: 'bg-foreground/6 text-foreground border-foreground/11' },
  { code: 'C',  label: 'C - Curso',               color: 'bg-foreground/9 text-foreground border-foreground/16' },
  { code: 'H',  label: 'H - Horas Sindicales',    color: 'bg-foreground/4 text-foreground border-foreground/9' },
  { code: 'S',  label: 'S - Sanción',             color: 'bg-foreground/12 text-foreground border-foreground/22' },
  { code: 'XB', label: 'XB - Banquetes',          color: 'bg-foreground/11 text-foreground border-foreground/18' },
];

export const getStatusColor = (code: string): string => {
  const status = STATUS_CODES.find(s => s.code === code);
  return status ? status.color : 'bg-muted text-muted-foreground border-border';
};
