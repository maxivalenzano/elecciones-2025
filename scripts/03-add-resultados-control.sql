-- Crear tabla para controlar el estado de carga de resultados
CREATE TABLE IF NOT EXISTS configuracion_eleccion (
    id SERIAL PRIMARY KEY,
    clave VARCHAR(50) UNIQUE NOT NULL,
    valor TEXT NOT NULL,
    descripcion TEXT,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Insertar configuración inicial
INSERT INTO configuracion_eleccion (clave, valor, descripcion) VALUES
('carga_resultados_habilitada', 'false', 'Controla si los fiscales pueden cargar resultados'),
('eleccion_finalizada', 'false', 'Indica si la elección ha finalizado')
ON CONFLICT (clave) DO NOTHING;

-- Crear función para actualizar timestamp
CREATE OR REPLACE FUNCTION update_configuracion_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear trigger
CREATE TRIGGER update_configuracion_timestamp BEFORE UPDATE ON configuracion_eleccion
    FOR EACH ROW EXECUTE FUNCTION update_configuracion_timestamp();
