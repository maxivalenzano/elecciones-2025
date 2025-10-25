-- Agregar configuración para modo simplificado
-- Este modo permite trabajar sin padrón completo, solo con mesas y resultados

INSERT INTO configuracion_eleccion (clave, valor, descripcion) VALUES
('modo_simplificado', 'false', 'Modo sin padrón completo: solo carga de resultados por mesa')
ON CONFLICT (clave) DO UPDATE SET 
    descripcion = EXCLUDED.descripcion;

-- Comentario sobre el funcionamiento:
-- Cuando modo_simplificado = 'true':
-- - No se requiere cargar el padrón completo
-- - Solo se necesita 1 registro por mesa en el padrón para obtener las mesas
-- - Los fiscales solo pueden cargar resultados finales
-- - Se oculta la búsqueda por DNI y la marcación individual de votantes
-- - Se oculta el tab del padrón en la vista de resultados

COMMENT ON TABLE configuracion_eleccion IS 
'Configuración del sistema electoral. Soporta dos modos: completo (con padrón) y simplificado (solo mesas y resultados)';

