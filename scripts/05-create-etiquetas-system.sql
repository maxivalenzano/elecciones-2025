-- Crear tabla de etiquetas
CREATE TABLE IF NOT EXISTS etiquetas (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    color VARCHAR(7) DEFAULT '#6B7280',
    descripcion TEXT,
    activa BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Crear tabla de relación entre padrón y etiquetas
CREATE TABLE IF NOT EXISTS padron_etiquetas (
    id SERIAL PRIMARY KEY,
    padron_id INTEGER NOT NULL REFERENCES padron(id) ON DELETE CASCADE,
    etiqueta_id INTEGER NOT NULL REFERENCES etiquetas(id) ON DELETE CASCADE,
    asignada_por VARCHAR(255), -- Nombre del fiscal que asignó la etiqueta
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(padron_id, etiqueta_id)
);

-- Insertar etiquetas de ejemplo
INSERT INTO etiquetas (nombre, color, descripcion) VALUES
('Adulto Mayor', '#F59E0B', 'Votante de tercera edad'),
('Discapacidad', '#8B5CF6', 'Votante con discapacidad'),
('Embarazada', '#EC4899', 'Votante embarazada'),
('Prioridad', '#EF4444', 'Votante con prioridad especial'),
('Observación', '#6B7280', 'Votante con observación general')
ON CONFLICT (nombre) DO NOTHING;

-- Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_padron_etiquetas_padron_id ON padron_etiquetas(padron_id);
CREATE INDEX IF NOT EXISTS idx_padron_etiquetas_etiqueta_id ON padron_etiquetas(etiqueta_id);
CREATE INDEX IF NOT EXISTS idx_etiquetas_activa ON etiquetas(activa);

-- Crear trigger para actualizar updated_at en etiquetas
CREATE TRIGGER update_etiquetas_updated_at BEFORE UPDATE ON etiquetas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comentarios sobre las tablas
COMMENT ON TABLE etiquetas IS 'Catálogo de etiquetas que pueden asignarse a los votantes';
COMMENT ON TABLE padron_etiquetas IS 'Relación muchos a muchos entre votantes y etiquetas';
COMMENT ON COLUMN padron_etiquetas.asignada_por IS 'Nombre del fiscal que asignó la etiqueta al votante';
