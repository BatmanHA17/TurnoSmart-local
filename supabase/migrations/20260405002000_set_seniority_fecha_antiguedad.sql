-- Set seniority dates (fecha_antiguedad) for Hotel Victoria FDAs
-- This determines night coverage rotation order: earliest date = most senior = covers first.
-- Triana = most senior (2020), Belen = 2021, Elena D. = 2022, Vera = 2023, Nuevo 3 = least (2024)

UPDATE colaboradores SET fecha_antiguedad = '2020-01-01' WHERE nombre = 'Triana';
UPDATE colaboradores SET fecha_antiguedad = '2021-01-01' WHERE nombre = 'Belén';
UPDATE colaboradores SET fecha_antiguedad = '2022-01-01' WHERE nombre LIKE 'Elena%';
UPDATE colaboradores SET fecha_antiguedad = '2023-01-01' WHERE nombre = 'Vera';
UPDATE colaboradores SET fecha_antiguedad = '2024-01-01' WHERE nombre = 'Nuevo 3';
