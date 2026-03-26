-- Limpiar datos existentes incorrectos y insertar niveles y categorías profesionales correctos
-- del convenio colectivo de hostelería de Las Palmas

-- Eliminar datos existentes que puedan ser incorrectos
DELETE FROM public.professional_categories;
DELETE FROM public.professional_levels;

-- Insertar los niveles profesionales correctos
INSERT INTO public.professional_levels (level_name, level_code, description, org_id, created_by) VALUES
('NIVEL I', 'NIV_I', 'Jefes principales y titulados superiores', NULL, NULL),
('NIVEL II', 'NIV_II', 'Segundos jefes y supervisores', NULL, NULL),
('NIVEL III', 'NIV_III', 'Encargados y oficiales especializados', NULL, NULL),
('NIVEL IV', 'NIV_IV', 'Empleados especializados y técnicos', NULL, NULL),
('NIVEL IV BIS', 'NIV_IV_BIS', 'Categoría especial', NULL, NULL),
('NIVEL V', 'NIV_V', 'Empleados de apoyo y servicios generales', NULL, NULL);

-- Insertar las categorías profesionales del NIVEL I
INSERT INTO public.professional_categories (category_name, level_id, description, org_id, created_by)
SELECT 
    categoria,
    (SELECT id FROM public.professional_levels WHERE level_code = 'NIV_I' LIMIT 1),
    'Categoría del Nivel I - Jefes principales',
    NULL,
    NULL
FROM (VALUES 
    ('Jefe/a de recepción'),
    ('Contable general'),
    ('Jefe/a de administración'),
    ('Jefe/a de cocina'),
    ('Primer/a jefe/a de comedor'),
    ('Jefe/a de sala'),
    ('Primer/a conserje de día'),
    ('Encargado/a general o gobernante/a de primera'),
    ('Encargado/a de trabajos o jefes/as de servicios técnicos en hoteles'),
    ('Jefes/as de operaciones en catering'),
    ('Jefe/a de sala en catering'),
    ('Primer/a encargado/a de mostrador en cafeterías y café-bar'),
    ('Titulado/a de grado medio o superior'),
    ('Primer/a barman o jefe/a de bares'),
    ('Jefe/a de relaciones públicas'),
    ('Profesor/a de educación física, masajista, profesor/a de tenis')
) AS categorias(categoria);

-- Insertar las categorías profesionales del NIVEL II
INSERT INTO public.professional_categories (category_name, level_id, description, org_id, created_by)
SELECT 
    categoria,
    (SELECT id FROM public.professional_levels WHERE level_code = 'NIV_II' LIMIT 1),
    'Categoría del Nivel II - Segundos jefes y supervisores',
    NULL,
    NULL
FROM (VALUES 
    ('Segundo/a jefe/a de recepción o primer/a recepcionista'),
    ('Cajero/a general'),
    ('Contable'),
    ('Interventor/a'),
    ('Jefe/a de reservas'),
    ('Segundo/a conserje de día'),
    ('Conserje de noche'),
    ('Segundo/a jefe/a de cocina'),
    ('Repostero/a jefe/a'),
    ('Encargado/a de economato o bodega'),
    ('Segundo/a jefe/a de comedor'),
    ('Mayordomo de pisos'),
    ('Segunda/o gobernanta/e'),
    ('Jefe/a de equipo de catering'),
    ('Segundo/a encargado/a de mostrador en cafetería y café-bar'),
    ('Jefe/a de compras'),
    ('Segundo/a barman o segundo/a jefe/a de bares'),
    ('Jefe/a de personal'),
    ('Segundo/a jefe/a de sala'),
    ('Encargado/a de trabajos en apartamentos'),
    ('Segundo/a jefe de relaciones públicas'),
    ('Supervisor/a de catering'),
    ('Segundo/a encargado/a de trabajos en hoteles'),
    ('Secretaria/o de primera (idiomas + taquimecanografía)')
) AS categorias(categoria);

-- Insertar las categorías profesionales del NIVEL III
INSERT INTO public.professional_categories (category_name, level_id, description, org_id, created_by)
SELECT 
    categoria,
    (SELECT id FROM public.professional_levels WHERE level_code = 'NIV_III' LIMIT 1),
    'Categoría del Nivel III - Encargados y oficiales especializados',
    NULL,
    NULL
FROM (VALUES 
    ('Recepcionista'),
    ('Cajero/a de recepción'),
    ('Tenedor/a de cuentas de clientes'),
    ('Telefonista de primera'),
    ('Jefe/a de partida'),
    ('Oficial repostero/a'),
    ('Jefe/a de sector en comedor, bar y sala de fiesta'),
    ('Encargada/o de limpieza'),
    ('Encargado/a de lencería y lavadero'),
    ('Segundo/a encargado/a de trabajos en apartamentos'),
    ('Encargado/a de jardineros'),
    ('Encargado/a de almacén en cafetería'),
    ('Conserje'),
    ('Chófer de primera (pasajeros o camiones > 3.500 kg)'),
    ('Monitores/as de educación física, deportes y animación'),
    ('Secretario/a de segunda'),
    ('Oficial de contabilidad'),
    ('Pinchadiscos')
) AS categorias(categoria);

-- Insertar las categorías profesionales del NIVEL IV
INSERT INTO public.professional_categories (category_name, level_id, description, org_id, created_by)
SELECT 
    categoria,
    (SELECT id FROM public.professional_levels WHERE level_code = 'NIV_IV' LIMIT 1),
    'Categoría del Nivel IV - Empleados especializados y técnicos',
    NULL,
    NULL
FROM (VALUES 
    ('Cajero/a de comedor o bar'),
    ('Ayudante de recepción / ayudante de reservas'),
    ('Ayudante de conserjería'),
    ('Cocinero/a, cafetero/a, bodeguero/a'),
    ('Jefe/a de platería'),
    ('Camarero/a'),
    ('Mecánico/a'),
    ('Calefactor/a'),
    ('Oficial de fontanero/a, electricista, pintor/a, albañil, carpintero/a, ebanista'),
    ('Conductor/a de segunda y resto'),
    ('Ayudante de supervisión de catering'),
    ('Dependiente/a'),
    ('Auxiliar de caja en cafetería'),
    ('Planchista'),
    ('Taquillero/a'),
    ('Ayudante de relaciones públicas'),
    ('Ayudante de monitor/a educación física, deportes y animación'),
    ('Encargado/a de sala de billares'),
    ('Portero/a de servicios'),
    ('Auxiliar administrativo'),
    ('Telefonista de segunda'),
    ('Piscinero/a'),
    ('Socorrista'),
    ('Sumiller'),
    ('Oficial de mantenimiento'),
    ('Camarero/a de pisos'),
    ('Especialista termal'),
    ('Quiromasajista'),
    ('Esteticista'),
    ('Hidroterapeuta'),
    ('Lenceras/os'),
    ('Jardineros/as')
) AS categorias(categoria);

-- Insertar la categoría profesional del NIVEL IV BIS
INSERT INTO public.professional_categories (category_name, level_id, description, org_id, created_by)
SELECT 
    'Mozo/a de habitación',
    (SELECT id FROM public.professional_levels WHERE level_code = 'NIV_IV_BIS' LIMIT 1),
    'Categoría especial del Nivel IV BIS',
    NULL,
    NULL;

-- Insertar las categorías profesionales del NIVEL V
INSERT INTO public.professional_categories (category_name, level_id, description, org_id, created_by)
SELECT 
    categoria,
    (SELECT id FROM public.professional_levels WHERE level_code = 'NIV_V' LIMIT 1),
    'Categoría del Nivel V - Empleados de apoyo y servicios generales',
    NULL,
    NULL
FROM (VALUES 
    ('Ordenanza de salón'),
    ('Vigilante de noche'),
    ('Portero/a de acceso'),
    ('Portero/a de discotecas y salas de fiestas'),
    ('Ascensorista'),
    ('Mozo/a de equipajes'),
    ('Ayudantes no incluidos en el nivel IV'),
    ('Marmitón'),
    ('Pinche fregaderos/as y plateros/as'),
    ('Planchadoras/es, costureras/os y lavanderas/os'),
    ('Mozo/a de lavandería'),
    ('Guarda de exteriores'),
    ('Preparador/a de catering'),
    ('Mozo/a de almacén en cafetería'),
    ('Encargado/a de lavabos'),
    ('Dependiente/a de segunda'),
    ('Mozo/a de billar'),
    ('Vigilante de estacionamiento de vehículos'),
    ('Botones'),
    ('Limpiador/a o fregador/a en cafetería'),
    ('Limpiador/a'),
    ('Guardarropa'),
    ('Dependiente/a de autoservicios'),
    ('Auxiliar de mantenimiento repartidor/a a domicilio')
) AS categorias(categoria);