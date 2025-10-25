-- Script de ejemplo para modo simplificado
-- En modo simplificado, solo necesitas 1 registro por mesa en el padrón
-- para que el sistema pueda obtener las mesas existentes

-- EJEMPLO: Si tienes 9 fiscales (Mesa 1 a Mesa 9)
-- Solo necesitas insertar 1 votante por mesa en el padrón

-- Insertar fiscales (igual que antes)
INSERT INTO fiscales (nombre, mesa_asignada, password) VALUES
('Fiscal Mesa 1', '1', 'fiscal-1'),
('Fiscal Mesa 2', '2', 'fiscal-2'),
('Fiscal Mesa 3', '3', 'fiscal-3'),
('Fiscal Mesa 4', '4', 'fiscal-4'),
('Fiscal Mesa 5', '5', 'fiscal-5'),
('Fiscal Mesa 6', '6', 'fiscal-6'),
('Fiscal Mesa 7', '7', 'fiscal-7'),
('Fiscal Mesa 8', '8', 'fiscal-8'),
('Fiscal Mesa 9', '9', 'fiscal-9')
ON CONFLICT DO NOTHING;

-- Insertar 1 registro por mesa en el padrón (solo para definir las mesas)
-- IMPORTANTE: Los datos pueden ser ficticios, solo necesitamos el número de mesa
INSERT INTO padron (dni, sexo, clase, apellido_nombre, domicilio, mesa, orden) VALUES
('00000001', 'M', '2000', 'REFERENCIA MESA 1', 'N/A', '1', 1),
('00000002', 'M', '2000', 'REFERENCIA MESA 2', 'N/A', '2', 1),
('00000003', 'M', '2000', 'REFERENCIA MESA 3', 'N/A', '3', 1),
('00000004', 'M', '2000', 'REFERENCIA MESA 4', 'N/A', '4', 1),
('00000005', 'M', '2000', 'REFERENCIA MESA 5', 'N/A', '5', 1),
('00000006', 'M', '2000', 'REFERENCIA MESA 6', 'N/A', '6', 1),
('00000007', 'M', '2000', 'REFERENCIA MESA 7', 'N/A', '7', 1),
('00000008', 'M', '2000', 'REFERENCIA MESA 8', 'N/A', '8', 1),
('00000009', 'M', '2000', 'REFERENCIA MESA 9', 'N/A', '9', 1)
ON CONFLICT (dni) DO NOTHING;

-- NOTA: 
-- 1. En modo simplificado, estos registros del padrón solo sirven para que el sistema
--    detecte qué mesas existen (obtiene las mesas únicas del campo mesa)
-- 2. Los fiscales SOLO pueden cargar los resultados finales por mesa
-- 3. NO se usa la marcación individual de votantes
-- 4. NO se usa el sistema de etiquetas
-- 5. La búsqueda por DNI queda deshabilitada

-- Para activar el modo simplificado, ejecuta:
-- UPDATE configuracion_eleccion SET valor = 'true' WHERE clave = 'modo_simplificado';

-- Para volver al modo completo:
-- UPDATE configuracion_eleccion SET valor = 'false' WHERE clave = 'modo_simplificado';

