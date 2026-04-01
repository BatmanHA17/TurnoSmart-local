import { format } from "date-fns";

interface ShiftAssignment {
  employeeId: string;
  date: string;
  statusCode: string;
  startTime: string;
}

// Códigos que requieren horario
const codesRequiringTime = ["C", "X", "XB"];

export const validateShiftAssignments = (assignments: ShiftAssignment[]): boolean => {
  return assignments.every(assignment => 
    !codesRequiringTime.includes(assignment.statusCode) || 
    (codesRequiringTime.includes(assignment.statusCode) && assignment.startTime !== "")
  );
};

export const rebalanceWeeklySchedule = (
  assignments: ShiftAssignment[], 
  employeeId: string, 
  days: Date[]
): ShiftAssignment[] => {
  const employeeAssignments = assignments.filter(a => a.employeeId === employeeId);
  
  // Contar días de trabajo y libres
  const workDays = employeeAssignments.filter(a => ["X", "XB", "C"].includes(a.statusCode));
  const freeDays = employeeAssignments.filter(a => a.statusCode === "D");

  // Si hay menos de 5 días de trabajo, buscar un horario existente para completar
  if (workDays.length < 5 && freeDays.length > 2) {
    const existingWorkTime = workDays.find(a => a.startTime !== "")?.startTime || "";
    const existingWorkCode = workDays.find(a => ["X", "XB"].includes(a.statusCode))?.statusCode || "X";

    if (existingWorkTime) {
      // Convertir días libres a días de trabajo hasta completar 5 días
      const maxConvertible = Math.min(5 - workDays.length, Math.max(0, freeDays.length - 2));
      let converted = 0;
      
      for (let i = 0; i < freeDays.length && converted < maxConvertible; i++) {
        const dayToConvert = freeDays[i];
        const assignmentIndex = assignments.findIndex(
          a => a.employeeId === employeeId && a.date === dayToConvert.date
        );
        
        if (assignmentIndex !== -1) {
          assignments[assignmentIndex] = {
            ...assignments[assignmentIndex],
            statusCode: existingWorkCode,
            startTime: existingWorkTime
          };
          converted++;
        }
      }
    }
  }

  return assignments;
};

export const getTimeSlot = (time: string): 'mañana' | 'tarde' | 'noche' | null => {
  if (!time) return null;
  
  const [hours, minutes] = time.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes;
  
  // Mañana: 6:00 a 15:59
  if (totalMinutes >= 360 && totalMinutes < 960) return 'mañana';
  // Tarde: 16:00 a 23:59
  if (totalMinutes >= 960 && totalMinutes < 1440) return 'tarde';
  // Noche: 0:00 a 5:59
  if (totalMinutes >= 0 && totalMinutes < 360) return 'noche';
  
  return null;
};

export const calculatePresenceByTimeSlot = (assignments: ShiftAssignment[], days: Date[]) => {
  const presenceByDay = { mañana: 0, tarde: 0, noche: 0 };
  const totalDays = days.length;

  days.forEach(day => {
    const dateKey = format(day, "yyyy-MM-dd");
    const dayAssignments = assignments.filter(a => a.date === dateKey && (a.statusCode === "X" || a.statusCode === "XB"));
    
    const morningCount = dayAssignments.filter(a => getTimeSlot(a.startTime) === 'mañana').length;
    const afternoonCount = dayAssignments.filter(a => getTimeSlot(a.startTime) === 'tarde').length;
    const nightCount = dayAssignments.filter(a => getTimeSlot(a.startTime) === 'noche').length;
    
    presenceByDay.mañana += morningCount;
    presenceByDay.tarde += afternoonCount;
    presenceByDay.noche += nightCount;
  });

  return {
    mañana: totalDays > 0 ? (presenceByDay.mañana / totalDays).toFixed(1) : '0.0',
    tarde: totalDays > 0 ? (presenceByDay.tarde / totalDays).toFixed(1) : '0.0',
    noche: totalDays > 0 ? (presenceByDay.noche / totalDays).toFixed(1) : '0.0'
  };
};