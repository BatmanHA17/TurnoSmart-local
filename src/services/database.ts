import { supabase } from "@/integrations/supabase/client";
import type { 
  Employee, 
  Cuadrante, 
  CuadranteAssignment, 
  DailyOccupancy, 
  OccupancyBudget, 
  StatusCode,
  CuadranteStats 
} from "@/types/database";

// Nota: Este archivo es legacy y no debe usarse para nuevas funcionalidades
// Las tablas 'employees' y 'cuadrantes' no existen en la nueva estructura

// Empleados
export const getEmployees = async (): Promise<Employee[]> => {
  // Esta tabla no existe - usar 'colaboradores' en su lugar
  return [];
};

export const createEmployee = async (employee: Omit<Employee, 'id' | 'created_at' | 'updated_at'>): Promise<Employee> => {
  throw new Error('Esta función es legacy - usar tabla colaboradores');
};

export const updateEmployee = async (id: string, updates: Partial<Employee>): Promise<Employee> => {
  throw new Error('Esta función es legacy - usar tabla colaboradores');
};

export const deleteEmployee = async (id: string): Promise<void> => {
  throw new Error('Esta función es legacy - usar tabla colaboradores');
};

// Cuadrantes
export const getCuadrantes = async (): Promise<Cuadrante[]> => {
  // Esta tabla no existe
  return [];
};

export const createCuadrante = async (cuadrante: Omit<Cuadrante, 'id' | 'created_at' | 'updated_at'>): Promise<Cuadrante> => {
  throw new Error('Esta función es legacy');
};

export const getCuadranteById = async (id: string): Promise<Cuadrante | null> => {
  return null;
};

// Asignaciones de cuadrante
export const getCuadranteAssignments = async (cuadranteId: string): Promise<CuadranteAssignment[]> => {
  return [];
};

export const updateCuadranteAssignment = async (
  cuadranteId: string,
  employeeId: string,
  dayOfMonth: number,
  assignment: Partial<CuadranteAssignment>
): Promise<CuadranteAssignment> => {
  throw new Error('Esta función es legacy');
};

// Ocupación diaria
export const getDailyOccupancy = async (cuadranteId: string): Promise<DailyOccupancy[]> => {
  return [];
};

export const updateDailyOccupancy = async (
  cuadranteId: string,
  dayOfMonth: number,
  occupancyData: Partial<DailyOccupancy>
): Promise<DailyOccupancy> => {
  throw new Error('Esta función es legacy');
};

// Presupuestos por ocupación
export const getOccupancyBudgets = async (): Promise<OccupancyBudget[]> => {
  const { data, error } = await supabase
    .from('occupancy_budgets')
    .select('*')
    .order('occupancy_percentage', { ascending: false });
  
  if (error) throw error;
  return (data || []) as any;
};

export const getOccupancyBudgetByPercentage = async (percentage: number): Promise<OccupancyBudget | null> => {
  const { data, error } = await supabase
    .from('occupancy_budgets')
    .select('*')
    .eq('occupancy_percentage', percentage)
    .single();
  
  if (error) return null;
  return data as any;
};

// Códigos de estado
export const getStatusCodes = async (): Promise<StatusCode[]> => {
  return [];
};

// Estadísticas de cuadrante
export const getCuadranteStats = async (cuadranteId: string, dayOfMonth: number): Promise<CuadranteStats | null> => {
  const { data, error } = await supabase
    .rpc('calculate_cuadrante_stats', {
      cuadrante_uuid: cuadranteId,
      target_date: dayOfMonth
    });
  
  if (error || !data?.[0]) return null;
  return data[0] as any;
};

// Validar días libres consecutivos
export const validateConsecutiveDaysOff = async (
  cuadranteId: string,
  employeeId: string,
  weekStart: number
): Promise<boolean> => {
  const { data, error } = await supabase
    .rpc('validate_consecutive_days_off', {
      cuadrante_uuid: cuadranteId,
      employee_uuid: employeeId,
      week_start: weekStart
    });
  
  if (error) return false;
  return data || false;
};
