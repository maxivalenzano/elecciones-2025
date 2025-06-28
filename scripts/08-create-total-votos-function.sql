-- Función para obtener el total de votos emitidos
-- Esta función suma todos los votos de la tabla votos sin límites

CREATE OR REPLACE FUNCTION get_total_votos()
RETURNS TABLE(total bigint)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT COALESCE(SUM(cantidad_votos), 0) as total
  FROM votos;
$$;

-- Comentario sobre la función
COMMENT ON FUNCTION get_total_votos() IS 'Obtiene el total de votos emitidos sumando cantidad_votos de todos los registros';
