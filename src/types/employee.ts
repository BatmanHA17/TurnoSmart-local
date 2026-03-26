export interface Employee {
  id: number;
  name: string;
  category: string;
  contract: number; // Hours: 8, 6, 5, 4
  contractUnit: number; // Unit equivalent: 1.0, 0.75, 0.625, 0.5
  schedule: string[]; // 31 days array
  department: 'PROPIO' | 'ETT';
  position?: string;
}

export interface StaffCalculation {
  presentialStaff: number;
  leaveStaff: number;
  activeStaff: number;
  vacationStaff: number;
  absenteeismStaff: number;
  grossStaff: number;
}

export interface OccupancyBudget {
  occupancy: number;
  clients: number;
  jefeBares: number;
  segundoJefeBares: number;
  jefeSector: number;
  camareros: number;
  ayudantes: number;
  presentialTotal: number;
  ettExternal: number;
  ratio: number;
}

export interface ComplianceAlert {
  employeeId: number;
  employeeName: string;
  week: number;
  violation: string;
  description: string;
  suggestion: string;
}

export interface WeeklyShift {
  employeeId: number;
  monday: string;
  tuesday: string;
  wednesday: string;
  thursday: string;
  friday: string;
  saturday: string;
  sunday: string;
}

export interface MonthlyStats {
  totalPresent: number;
  totalFree: number;
  totalVacation: number;
  totalSick: number;
  totalAbsent: number;
  totalPermit: number;
  totalCourse: number;
  averagePresent: number;
  complianceIssues: number;
}