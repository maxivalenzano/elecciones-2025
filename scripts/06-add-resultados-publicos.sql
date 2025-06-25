-- Agregar configuración para resultados públicos
INSERT INTO configuracion_eleccion (clave, valor, descripcion) VALUES
('resultados_publicos', 'false', 'Controla si los resultados son visibles públicamente')
ON CONFLICT (clave) DO NOTHING;
