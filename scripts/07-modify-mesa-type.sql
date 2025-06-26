BEGIN;

-- 1. Eliminar índices que dependen de mesa
DROP INDEX IF EXISTS idx_padron_mesa;
DROP INDEX IF EXISTS idx_padron_mesa_distinct;
DROP INDEX IF EXISTS idx_votos_mesa;

-- 2. Modificar el tipo de dato de mesa en las tablas afectadas
ALTER TABLE padron
  ALTER COLUMN mesa TYPE VARCHAR USING mesa::VARCHAR;

ALTER TABLE fiscales
  ALTER COLUMN mesa_asignada TYPE VARCHAR USING mesa_asignada::VARCHAR;

ALTER TABLE votos
  ALTER COLUMN mesa TYPE VARCHAR USING mesa::VARCHAR;

-- 3. Ajustar la restricción UNIQUE en votos
ALTER TABLE votos
  DROP CONSTRAINT IF EXISTS votos_mesa_candidato_id_key,
  ADD CONSTRAINT votos_mesa_candidato_id_key UNIQUE(mesa, candidato_id);

-- 4. Recrear índices para optimizar consultas por mesa
CREATE INDEX idx_padron_mesa ON padron(mesa);
CREATE INDEX idx_padron_mesa_distinct ON padron(mesa);
CREATE INDEX idx_votos_mesa ON votos(mesa);

-- 5. Reemplazar la función get_mesas_unicas() para trabajar con texto
DROP FUNCTION IF EXISTS get_mesas_unicas();

CREATE OR REPLACE FUNCTION get_mesas_unicas()
RETURNS TABLE(mesas text[], total integer) AS $$
BEGIN
  RETURN QUERY
  WITH mesas_ordenadas AS (
    SELECT DISTINCT mesa
      FROM padron
    ORDER BY mesa
  )
  SELECT
    ARRAY(SELECT mesa FROM mesas_ordenadas) AS mesas,
    (SELECT COUNT(DISTINCT mesa) FROM padron)::integer AS total;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_mesas_unicas() IS
  'Obtiene todas las mesas únicas del padrón de manera eficiente, retornando un array de mesas (texto) y el total';

COMMIT;
