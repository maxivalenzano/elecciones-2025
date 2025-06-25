-- Insertar candidatos de ejemplo
INSERT INTO candidatos (nombre, partido, color) VALUES
('Juan Pérez', 'Partido Azul', '#3B82F6'),
('María González', 'Partido Rojo', '#EF4444'),
('Carlos Rodríguez', 'Partido Verde', '#10B981'),
('Ana Martínez', 'Partido Amarillo', '#F59E0B')
ON CONFLICT DO NOTHING;

-- Insertar algunos fiscales de ejemplo
INSERT INTO fiscales (nombre, mesa_asignada, password) VALUES
('Fiscal Mesa 1', 1, 'fiscal123'),
('Fiscal Mesa 2', 2, 'fiscal456'),
('Fiscal Mesa 3', 3, 'fiscal789')
ON CONFLICT DO NOTHING;

-- Insertar algunos registros de padrón de ejemplo
INSERT INTO padron (dni, sexo, clase, apellido_nombre, domicilio, mesa, orden) VALUES
('12345678', 'M', '1985', 'GARCÍA, PEDRO JOSÉ', 'AV. SIETE PALMAS 123', 1, 1),
('87654321', 'F', '1990', 'LÓPEZ, MARÍA CARMEN', 'CALLE FALSA 456', 1, 2),
('11223344', 'M', '1975', 'MARTÍNEZ, CARLOS ALBERTO', 'AV. LIBERTAD 789', 2, 1),
('44332211', 'F', '1988', 'RODRÍGUEZ, ANA SOFÍA', 'CALLE ESPERANZA 321', 2, 2),
('55667788', 'M', '1992', 'FERNÁNDEZ, LUIS MIGUEL', 'AV. PROGRESO 654', 3, 1)
ON CONFLICT (dni) DO NOTHING;
