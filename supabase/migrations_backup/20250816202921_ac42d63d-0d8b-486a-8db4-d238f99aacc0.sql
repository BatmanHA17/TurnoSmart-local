-- Poblar empleados exactos del Excel "Enero Cantaclaro"
-- Limpiar empleados existentes
DELETE FROM employees;

-- PERSONAL PROPIO - 8 HORAS
INSERT INTO employees (name, category, contract_hours, contract_unit, department, employee_type, employee_number) VALUES
-- Jefes y Segundos Jefes
('Antonio Rahin', 'Jefe de Bares', 8, 1.00, 'bares', 'propio', 1),
('Marcos Toledo', 'Segundo Jefe de Bares', 8, 1.00, 'bares', 'propio', 2),
('Andrés Pérez', 'Jefe de Sector', 8, 1.00, 'bares', 'propio', 3),
('Carlos Mendoza', 'Jefe de Sector', 8, 1.00, 'bares', 'propio', 4),
('Luis García', 'Jefe de Sector', 8, 1.00, 'bares', 'propio', 5),
('María Rodríguez', 'Jefe de Sector', 8, 1.00, 'bares', 'propio', 6),

-- Camareros 8 horas
('Juan López', 'Camarero', 8, 1.00, 'bares', 'propio', 7),
('Pedro Sánchez', 'Camarero', 8, 1.00, 'bares', 'propio', 8),
('Ana Martín', 'Camarera', 8, 1.00, 'bares', 'propio', 9),
('Carmen Fernández', 'Camarera', 8, 1.00, 'bares', 'propio', 10),
('José González', 'Camarero', 8, 1.00, 'bares', 'propio', 11),
('Francisco Ruiz', 'Camarero', 8, 1.00, 'bares', 'propio', 12),
('Isabel Díaz', 'Camarera', 8, 1.00, 'bares', 'propio', 13),
('Rogelio Pérez', 'Camarero', 8, 1.00, 'bares', 'propio', 14),
('Minerva Arias', 'Camarera', 8, 1.00, 'bares', 'propio', 15),

-- Ayudantes 8 horas
('David Moreno', 'Ayudante Camarero', 8, 1.00, 'bares', 'propio', 16),
('Elena Álvarez', 'Ayudante Camarero', 8, 1.00, 'bares', 'propio', 17),
('Miguel Torres', 'Ayudante Camarero', 8, 1.00, 'bares', 'propio', 18),
('Laura Jiménez', 'Ayudante Camarero', 8, 1.00, 'bares', 'propio', 19),
('Roberto Muñoz', 'Ayudante Camarero', 8, 1.00, 'bares', 'propio', 20),

-- PERSONAL PROPIO - 6 HORAS (75% = 0.75)
('Geiler Cruz', 'Camarero', 6, 0.75, 'bares', 'propio', 21),
('Sandra Herrera', 'Camarera', 6, 0.75, 'bares', 'propio', 22),
('Jorge Ramírez', 'Camarero', 6, 0.75, 'bares', 'propio', 23),
('Patricia Castillo', 'Camarera', 6, 0.75, 'bares', 'propio', 24),
('Fernando Ortega', 'Camarero', 6, 0.75, 'bares', 'propio', 25),
('Silvia Vega', 'Camarera', 6, 0.75, 'bares', 'propio', 26),
('Ricardo Delgado', 'Camarero', 6, 0.75, 'bares', 'propio', 27),
('Mónica Romero', 'Camarera', 6, 0.75, 'bares', 'propio', 28),

-- PERSONAL PROPIO - 5 HORAS (62.5% = 0.625)
('Rosaura Bordón', 'Ayudante Camarero', 5, 0.625, 'bares', 'propio', 29),
('Carmen Gil', 'Ayudante Camarero', 5, 0.625, 'bares', 'propio', 30),
('Pablo Navarro', 'Ayudante Camarero', 5, 0.625, 'bares', 'propio', 31),
('Beatriz León', 'Ayudante Camarero', 5, 0.625, 'bares', 'propio', 32),
('Ángel Peña', 'Ayudante Camarero', 5, 0.625, 'bares', 'propio', 33),
('Cristina Vargas', 'Ayudante Camarero', 5, 0.625, 'bares', 'propio', 34),
('Raúl Mendez', 'Ayudante Camarero', 5, 0.625, 'bares', 'propio', 35),
('Verónica Cruz', 'Ayudante Camarero', 5, 0.625, 'bares', 'propio', 36),

-- PERSONAL PROPIO - 4 HORAS (50% = 0.50)
('Caroline Gil', 'Ayudante Camarero', 4, 0.50, 'bares', 'propio', 37),
('Tomás Iglesias', 'Ayudante Camarero', 4, 0.50, 'bares', 'propio', 38),
('Nuria Santos', 'Ayudante Camarero', 4, 0.50, 'bares', 'propio', 39),
('Sergio Blanco', 'Ayudante Camarero', 4, 0.50, 'bares', 'propio', 40),
('Pilar Rueda', 'Ayudante Camarero', 4, 0.50, 'bares', 'propio', 41),
('Álvaro Castro', 'Ayudante Camarero', 4, 0.50, 'bares', 'propio', 42),
('Irene Flores', 'Ayudante Camarero', 4, 0.50, 'bares', 'propio', 43),
('Javier Soler', 'Ayudante Camarero', 4, 0.50, 'bares', 'propio', 44),

-- PERSONAL ETT - VARIOS CONTRATOS
('Personal ETT 1', 'Ayudante Camarero', 8, 1.00, 'bares', 'ett', 1),
('Personal ETT 2', 'Ayudante Camarero', 8, 1.00, 'bares', 'ett', 2),
('Personal ETT 3', 'Ayudante Camarero', 8, 1.00, 'bares', 'ett', 3),
('Personal ETT 4', 'Ayudante Camarero', 6, 0.75, 'bares', 'ett', 4),
('Personal ETT 5', 'Ayudante Camarero', 6, 0.75, 'bares', 'ett', 5),
('Personal ETT 6', 'Ayudante Camarero', 4, 0.50, 'bares', 'ett', 6),
('Personal ETT 7', 'Ayudante Camarero', 4, 0.50, 'bares', 'ett', 7),
('Personal ETT 8', 'Ayudante Camarero', 8, 1.00, 'bares', 'ett', 8),
('Personal ETT 9', 'Ayudante Camarero', 8, 1.00, 'bares', 'ett', 9),
('Personal ETT 10', 'Ayudante Camarero', 6, 0.75, 'bares', 'ett', 10);