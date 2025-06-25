-- Crear función para obtener todas las mesas únicas de manera eficiente
CREATE OR REPLACE FUNCTION get_mesas_unicas()
RETURNS TABLE(mesas integer[], total integer) AS $$
BEGIN
    RETURN QUERY
    WITH mesas_ordenadas AS (
        SELECT DISTINCT mesa 
        FROM padron 
        ORDER BY mesa
    )
    SELECT 
        ARRAY(SELECT mesa FROM mesas_ordenadas) as mesas,
        (SELECT COUNT(DISTINCT mesa) FROM padron)::integer as total;
END;
$$ LANGUAGE plpgsql;

-- Crear índice para optimizar la consulta de mesas si no existe
CREATE INDEX IF NOT EXISTS idx_padron_mesa_distinct ON padron(mesa);

-- Comentario sobre la función
COMMENT ON FUNCTION get_mesas_unicas() IS 'Obtiene todas las mesas únicas del padrón de manera eficiente, retornando un array de mesas y el total';
