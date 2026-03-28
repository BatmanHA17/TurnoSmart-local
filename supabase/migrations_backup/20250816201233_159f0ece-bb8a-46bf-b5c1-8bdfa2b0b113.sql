-- Crear tabla de empleados
CREATE TABLE public.employees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL, -- jefe de bares, segundo jefe, camarero, etc.
  contract_hours INTEGER NOT NULL DEFAULT 8, -- 8, 6, 5, 4 horas
  contract_unit DECIMAL(3,2) NOT NULL DEFAULT 1.00, -- 1.00, 0.75, 0.625, 0.50
  department TEXT NOT NULL DEFAULT 'bares',
  employee_type TEXT NOT NULL DEFAULT 'propio', -- 'propio' o 'ett'
  employee_number INTEGER, -- número de empleado (1-174 para propios, 1-106 para ETT)
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear tabla de cuadrantes mensuales (plantillas Cantaclaro)
CREATE TABLE public.cuadrantes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL,
  hotel_rooms INTEGER DEFAULT 581,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear tabla de asignaciones diarias en cuadrantes
CREATE TABLE public.cuadrante_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cuadrante_id UUID NOT NULL REFERENCES public.cuadrantes(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  day_of_month INTEGER NOT NULL CHECK (day_of_month >= 1 AND day_of_month <= 31),
  status_code TEXT NOT NULL, -- L, X, XB, V, C, E, F, P, H, S
  start_time TIME, -- hora de inicio del turno
  location TEXT, -- ubicación del empleado
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(cuadrante_id, employee_id, day_of_month)
);

-- Crear tabla de ocupación diaria
CREATE TABLE public.daily_occupancy (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cuadrante_id UUID NOT NULL REFERENCES public.cuadrantes(id) ON DELETE CASCADE,
  day_of_month INTEGER NOT NULL CHECK (day_of_month >= 1 AND day_of_month <= 31),
  occupancy_percentage DECIMAL(5,2) NOT NULL,
  total_clients INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(cuadrante_id, day_of_month)
);

-- Crear tabla de presupuestos por ocupación
CREATE TABLE public.occupancy_budgets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  occupancy_percentage DECIMAL(5,2) NOT NULL,
  total_clients INTEGER NOT NULL,
  jefe_bares DECIMAL(4,2) NOT NULL DEFAULT 0,
  segundo_jefe_bares DECIMAL(4,2) NOT NULL DEFAULT 0,
  jefe_sector DECIMAL(4,2) NOT NULL DEFAULT 0,
  camareros DECIMAL(4,2) NOT NULL DEFAULT 0,
  ayudantes DECIMAL(4,2) NOT NULL DEFAULT 0,
  presencial_total DECIMAL(5,2) NOT NULL DEFAULT 0,
  ett_external DECIMAL(4,2) NOT NULL DEFAULT 0,
  ratio_clients_barman DECIMAL(6,2), -- clientes / personal presencial
  plantilla_librando DECIMAL(5,2), -- presencial * 1.4 - presencial
  plantilla_activa DECIMAL(5,2), -- presencial + librando
  plantilla_vacaciones DECIMAL(5,2), -- activa * 48 / (365-48)
  absentismo_percentage DECIMAL(4,2) DEFAULT 2.00,
  plantilla_absentismo DECIMAL(5,2), -- activa * absentismo%
  plantilla_bruta_total DECIMAL(6,2), -- activa + vacaciones + absentismo
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(occupancy_percentage)
);

-- Crear tabla de códigos de estado y su significado
CREATE TABLE public.status_codes (
  code TEXT PRIMARY KEY,
  description TEXT NOT NULL,
  color TEXT DEFAULT '#6b7280' -- color para la UI
);

-- Insertar códigos de estado
INSERT INTO public.status_codes (code, description, color) VALUES
('L', 'Día libre', '#10b981'),
('X', 'Presencial', '#3b82f6'),
('XB', 'Presencial banquetes', '#8b5cf6'),
('V', 'Vacaciones', '#f59e0b'),
('C', 'Curso', '#06b6d4'),
('E', 'Enfermo/Accidente', '#ef4444'),
('F', 'Falta', '#dc2626'),
('P', 'Permiso', '#f97316'),
('H', 'Horas sindicales', '#84cc16'),
('S', 'Sancionado', '#71717a');

-- Insertar datos de presupuestos de ocupación (basado en el Excel)
INSERT INTO public.occupancy_budgets (
  occupancy_percentage, total_clients, jefe_bares, segundo_jefe_bares, 
  jefe_sector, camareros, ayudantes, presencial_total, ett_external
) VALUES
(115, 1580, 1, 0, 4, 6, 17, 28, 3),
(110, 1511, 1, 0, 4, 6, 17, 28, 3),
(105, 1443, 1, 0, 4, 6, 17, 28, 3),
(100, 1374, 1, 0, 4, 6, 17, 28, 3),
(95, 1306, 1, 0, 4, 6, 17, 28, 3),
(90, 1237, 1, 0, 4, 6, 16.7, 27.7, 3),
(85, 1169, 1, 0, 4, 6, 16.7, 27.7, 3),
(80, 1100, 1, 0, 4, 6, 16.7, 27.7, 3),
(75, 1032, 1, 0, 3, 6, 16.7, 26.7, 3),
(70, 963, 1, 0, 3, 6, 16.7, 26.7, 3),
(65, 895, 1, 0, 3, 5, 16.7, 25.7, 3),
(60, 826, 1, 0, 3, 5, 15.5, 24.5, 3),
(55, 758, 1, 0, 3, 5, 15.5, 24.5, 3),
(50, 689, 1, 0, 3, 5, 14.5, 23.5, 3);

-- Calcular campos derivados para presupuestos
UPDATE public.occupancy_budgets SET
  ratio_clients_barman = ROUND(total_clients::DECIMAL / presencial_total, 2),
  plantilla_librando = ROUND(presencial_total * 1.4 - presencial_total, 2),
  plantilla_activa = ROUND(presencial_total + (presencial_total * 1.4 - presencial_total), 2);

UPDATE public.occupancy_budgets SET
  plantilla_vacaciones = ROUND(plantilla_activa * 48 / (365 - 48), 2),
  plantilla_absentismo = ROUND(plantilla_activa * absentismo_percentage / 100, 2);

UPDATE public.occupancy_budgets SET
  plantilla_bruta_total = ROUND(plantilla_activa + plantilla_vacaciones + plantilla_absentismo, 2);

-- Insertar empleados de ejemplo (basado en los datos del Excel)
INSERT INTO public.employees (name, category, contract_hours, contract_unit, employee_type, employee_number) VALUES
-- Personal propio de 8 horas
('Antonio Rahin', 'Jefe de Bares', 8, 1.00, 'propio', 1),
('Marcos Toledo', 'Segundo Jefe de Bares', 8, 1.00, 'propio', 2),
('Andrés Pérez', 'Jefe de Sector', 8, 1.00, 'propio', 3),
('Rogelio Pérez', 'Camarero', 8, 1.00, 'propio', 4),
('Minerva Arias', 'Camarera', 8, 1.00, 'propio', 5),
-- Personal propio de 6 horas
('Geiler Cruz', 'Camarero', 6, 0.75, 'propio', 36),
-- Personal propio de 5 horas  
('Rosaura Bordón', 'Ayudante Camarero', 5, 0.625, 'propio', 43),
-- Personal propio de 4 horas
('Caroline Gil', 'Ayudante Camarero', 4, 0.50, 'propio', 51),
-- Personal ETT
('Personal ETT 1', 'Ayudante Camarero', 8, 1.00, 'ett', 1),
('Personal ETT 2', 'Ayudante Camarero', 6, 0.75, 'ett', 2),
('Personal ETT 3', 'Ayudante Camarero', 4, 0.50, 'ett', 3);

-- Habilitar RLS en todas las tablas
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cuadrantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cuadrante_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_occupancy ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.occupancy_budgets ENABLE ROW LEVEL SECURITY;

-- Crear políticas RLS básicas (acceso público por ahora para desarrollo)
CREATE POLICY "Allow public read access on employees" ON public.employees FOR SELECT USING (true);
CREATE POLICY "Allow public read access on cuadrantes" ON public.cuadrantes FOR SELECT USING (true);
CREATE POLICY "Allow public read access on assignments" ON public.cuadrante_assignments FOR SELECT USING (true);
CREATE POLICY "Allow public read access on occupancy" ON public.daily_occupancy FOR SELECT USING (true);
CREATE POLICY "Allow public read access on budgets" ON public.occupancy_budgets FOR SELECT USING (true);
CREATE POLICY "Allow public read access on status codes" ON public.status_codes FOR SELECT USING (true);

CREATE POLICY "Allow public write access on employees" ON public.employees FOR ALL USING (true);
CREATE POLICY "Allow public write access on cuadrantes" ON public.cuadrantes FOR ALL USING (true);
CREATE POLICY "Allow public write access on assignments" ON public.cuadrante_assignments FOR ALL USING (true);
CREATE POLICY "Allow public write access on occupancy" ON public.daily_occupancy FOR ALL USING (true);

-- Crear función para calcular estadísticas de cuadrante
CREATE OR REPLACE FUNCTION public.calculate_cuadrante_stats(cuadrante_uuid UUID, target_date INTEGER)
RETURNS TABLE (
  presencial_count INTEGER,
  banquetes_count INTEGER,
  libres_count INTEGER,
  vacaciones_count INTEGER,
  enfermos_count INTEGER,
  faltas_count INTEGER,
  total_plantilla INTEGER
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(CASE WHEN ca.status_code = 'X' THEN 1 END)::INTEGER as presencial_count,
    COUNT(CASE WHEN ca.status_code = 'XB' THEN 1 END)::INTEGER as banquetes_count,
    COUNT(CASE WHEN ca.status_code = 'L' THEN 1 END)::INTEGER as libres_count,
    COUNT(CASE WHEN ca.status_code = 'V' THEN 1 END)::INTEGER as vacaciones_count,
    COUNT(CASE WHEN ca.status_code = 'E' THEN 1 END)::INTEGER as enfermos_count,
    COUNT(CASE WHEN ca.status_code = 'F' THEN 1 END)::INTEGER as faltas_count,
    COUNT(*)::INTEGER as total_plantilla
  FROM public.cuadrante_assignments ca
  WHERE ca.cuadrante_id = cuadrante_uuid 
    AND ca.day_of_month = target_date;
END;
$$;

-- Crear función para validar días libres consecutivos (normativa española)
CREATE OR REPLACE FUNCTION public.validate_consecutive_days_off(
  cuadrante_uuid UUID, 
  employee_uuid UUID,
  week_start INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  days_off INTEGER[];
  consecutive_count INTEGER := 0;
  has_two_consecutive BOOLEAN := FALSE;
  i INTEGER;
BEGIN
  -- Obtener días libres de la semana (7 días)
  SELECT ARRAY_AGG(day_of_month ORDER BY day_of_month) INTO days_off
  FROM public.cuadrante_assignments ca
  WHERE ca.cuadrante_id = cuadrante_uuid 
    AND ca.employee_id = employee_uuid
    AND ca.status_code = 'L'
    AND ca.day_of_month BETWEEN week_start AND week_start + 6;
  
  -- Verificar si hay al menos 2 días libres consecutivos
  IF array_length(days_off, 1) >= 2 THEN
    FOR i IN 1..array_length(days_off, 1) - 1 LOOP
      IF days_off[i+1] = days_off[i] + 1 THEN
        consecutive_count := consecutive_count + 1;
        IF consecutive_count >= 1 THEN -- 2 días consecutivos
          has_two_consecutive := TRUE;
          EXIT;
        END IF;
      ELSE
        consecutive_count := 0;
      END IF;
    END LOOP;
  END IF;
  
  RETURN has_two_consecutive;
END;
$$;

-- Crear trigger para actualizar timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_employees_updated_at
  BEFORE UPDATE ON public.employees
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cuadrantes_updated_at
  BEFORE UPDATE ON public.cuadrantes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();