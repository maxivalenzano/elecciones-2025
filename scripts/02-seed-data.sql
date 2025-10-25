-- Insertar candidatos de ejemplo
INSERT INTO candidatos (nombre, partido, color) VALUES
'PRINCIPIOS Y CONVICCIÓN', '503',
'PARTIDO DEL OBRERO', '71',
'FRENTE DE LA VICTORIA', '501',
'ALIANZA LA LIBERTAD AVANZA', '504',
'JUNTOS POR LA LIBERTAD Y LA REPÚBLICA', '502'
ON CONFLICT DO NOTHING;

-- Insertar algunos fiscales de ejemplo
INSERT INTO fiscales (nombre, mesa_asignada, password),
('Fiscal Mesa 1', 1, 'fiscal-1'),
('Fiscal Mesa 2', 2, 'fiscal-2'),
('Fiscal Mesa 3', 3, 'fiscal-3'),
('Fiscal Mesa 4', 4, 'fiscal-4'),
('Fiscal Mesa 5', 5, 'fiscal-5'),
('Fiscal Mesa 6', 6, 'fiscal-6'),
('Fiscal Mesa 7', 7, 'fiscal-7'),
('Fiscal Mesa 8', 8, 'fiscal-8'),
('Fiscal Mesa 9', 9, 'fiscal-9'),
ON CONFLICT DO NOTHING;

-- Insertar algunos registros de padrón de ejemplo
INSERT INTO padron (dni, sexo, clase, apellido_nombre, domicilio, mesa, orden) VALUES
('12345678', 'M', '1985', 'GARCÍA, PEDRO JOSÉ', 'AV. SIETE PALMAS 123', 1, 1),
('11223344', 'M', '1975', 'MARTÍNEZ, CARLOS ALBERTO', 'AV. LIBERTAD 789', 2, 1),
('22334455', 'F', '1988', 'RODRÍGUEZ, ANA MARÍA', 'CALLE RIVADAVIA 234', 3, 1),
('33445566', 'M', '1992', 'FERNÁNDEZ, JUAN CARLOS', 'AV. SAN MARTÍN 567', 4, 1),
('44556677', 'F', '1980', 'GONZÁLEZ, LAURA BEATRIZ', 'CALLE BELGRANO 890', 5, 1),
('55667788', 'M', '1995', 'PÉREZ, ROBERTO DANIEL', 'AV. CÓRDOBA 345', 6, 1),
('66778899', 'F', '1987', 'SÁNCHEZ, PATRICIA ELENA', 'CALLE MITRE 678', 7, 1),
('77889900', 'M', '1983', 'ROMERO, DIEGO ALBERTO', 'AV. INDEPENDENCIA 901', 8, 1),
('88990011', 'F', '1991', 'TORRES, VALERIA SOLEDAD', 'CALLE MORENO 123', 9, 1)
ON CONFLICT (dni) DO NOTHING;
