import { Employee, StaffCalculation, ComplianceAlert, MonthlyStats, OccupancyBudget } from "@/types/employee";
import { occupancyBudgets } from "@/data/employees";

export const calculateStaffing = (
  occupancy: number, 
  absenteeismRate: number = 0.1
): StaffCalculation => {
  // Find the appropriate budget based on occupancy
  const budget = occupancyBudgets.find(b => occupancy >= b.occupancy) || occupancyBudgets[occupancyBudgets.length - 1];
  
  const presentialStaff = budget.presentialTotal;
  
  // Plantilla librando = Plantilla presencial * 1.4 - Plantilla presencial
  // 1.4 viene de 7 días / 5 días trabajados = 1.4
  const leaveStaff = presentialStaff * 1.4 - presentialStaff;
  
  // Plantilla activa = Plantilla presencial + Plantilla librando
  const activeStaff = presentialStaff + leaveStaff;
  
  // Plantilla vacaciones = (Plantilla activa * 48 días vacaciones) / (365 - 48)
  const vacationStaff = (activeStaff * 48) / (365 - 48);
  
  // Plantilla absentismo = Plantilla activa * % absentismo
  const absenteeismStaff = activeStaff * absenteeismRate;
  
  // Plantilla total bruta = Plantilla activa + Plantilla vacaciones + Plantilla absentismo
  const grossStaff = activeStaff + vacationStaff + absenteeismStaff;
  
  return {
    presentialStaff,
    leaveStaff,
    activeStaff,
    vacationStaff,
    absenteeismStaff,
    grossStaff
  };
};

export const calculateMonthlyStats = (employees: Employee[]): MonthlyStats => {
  let totalPresent = 0;
  let totalFree = 0;
  let totalVacation = 0;
  let totalSick = 0;
  let totalAbsent = 0;
  let totalPermit = 0;
  let totalCourse = 0;
  
  employees.forEach(emp => {
    emp.schedule.forEach(status => {
      switch (status.toUpperCase()) {
        case 'X':
        case 'XB':
          totalPresent++;
          break;
        case 'D':
          totalFree++;
          break;
        case 'V':
          totalVacation++;
          break;
        case 'E':
          totalSick++;
          break;
        case 'F':
          totalAbsent++;
          break;
        case 'P':
          totalPermit++;
          break;
        case 'C':
          totalCourse++;
          break;
      }
    });
  });
  
  const averagePresent = totalPresent / 31; // January has 31 days
  const complianceIssues = checkComplianceViolations(employees).length;
  
  return {
    totalPresent,
    totalFree,
    totalVacation,
    totalSick,
    totalAbsent,
    totalPermit,
    totalCourse,
    averagePresent,
    complianceIssues
  };
};

export const checkComplianceViolations = (employees: Employee[]): ComplianceAlert[] => {
  const alerts: ComplianceAlert[] = [];
  
  employees.forEach(emp => {
    // Check for consecutive free days violations
    for (let week = 0; week < 5; week++) { // 5 weeks in January
      const weekStart = week * 7;
      const weekEnd = Math.min(weekStart + 7, emp.schedule.length);
      const weekSchedule = emp.schedule.slice(weekStart, weekEnd);
      
      // Find free days in the week
      const freeDays: number[] = [];
      weekSchedule.forEach((status, index) => {
        if (status === 'D') {
          freeDays.push(index);
        }
      });
      
      // Check if free days are consecutive
      if (freeDays.length >= 2) {
        let hasConsecutive = false;
        for (let i = 0; i < freeDays.length - 1; i++) {
          if (freeDays[i + 1] - freeDays[i] === 1) {
            hasConsecutive = true;
            break;
          }
        }
        
        if (!hasConsecutive && freeDays.length >= 2) {
          alerts.push({
            employeeId: emp.id,
            employeeName: emp.name,
            week: week + 1,
            violation: 'NON_CONSECUTIVE_DAYS',
            description: `Días libres no consecutivos en semana ${week + 1}`,
            suggestion: 'Reorganizar turnos para cumplir con días libres consecutivos'
          });
        }
      }
      
      // Check if employee has less than 2 free days per week
      if (freeDays.length < 2 && !weekSchedule.includes('V') && !weekSchedule.includes('E')) {
        alerts.push({
          employeeId: emp.id,
          employeeName: emp.name,
          week: week + 1,
          violation: 'INSUFFICIENT_REST_DAYS',
          description: `Solo ${freeDays.length} día(s) libre(s) en semana ${week + 1}`,
          suggestion: 'Asegurar 2 días libres por semana según normativa'
        });
      }
    }
  });
  
  return alerts;
};

export const calculateDailyPresence = (employees: Employee[], day: number): number => {
  return employees.filter(emp => {
    const status = emp.schedule[day];
    return status === 'X' || status === 'XB';
  }).length;
};

export const calculateDailyPresenceByUnit = (employees: Employee[], day: number): number => {
  return employees.reduce((total, emp) => {
    const status = emp.schedule[day];
    if (status === 'X' || status === 'XB') {
      return total + emp.contractUnit;
    }
    return total;
  }, 0);
};

export const getContractTypeDistribution = (employees: Employee[]) => {
  const distribution = {
    '8h': employees.filter(e => e.contract === 8).length,
    '6h': employees.filter(e => e.contract === 6).length,
    '5h': employees.filter(e => e.contract === 5).length,
    '4h': employees.filter(e => e.contract === 4).length,
  };
  
  return distribution;
};

export const getStatusLegend = () => [
  { code: 'X', name: 'Presencial', color: 'bg-green-100 text-green-800' },
  { code: 'XB', name: 'Presencial Banquetes', color: 'bg-emerald-100 text-emerald-800' },
  { code: 'D', name: 'Descanso', color: 'bg-blue-100 text-blue-800' },
  { code: 'V', name: 'Vacaciones', color: 'bg-yellow-100 text-yellow-800' },
  { code: 'E', name: 'Enfermedad', color: 'bg-purple-100 text-purple-800' },
  { code: 'F', name: 'Falta', color: 'bg-red-100 text-red-800' },
  { code: 'P', name: 'Permiso', color: 'bg-indigo-100 text-indigo-800' },
  { code: 'C', name: 'Curso', color: 'bg-pink-100 text-pink-800' },
  { code: 'H', name: 'Horas Sindicales', color: 'bg-orange-100 text-orange-800' },
  { code: 'S', name: 'Sanción', color: 'bg-gray-100 text-gray-800' }
];