-- Crear tabla de padrón electoral
CREATE TABLE IF NOT EXISTS padron (
    id SERIAL PRIMARY KEY,
    dni VARCHAR(20) NOT NULL UNIQUE,
    sexo VARCHAR(1),
    clase VARCHAR(10),
    apellido_nombre TEXT NOT NULL,
    domicilio TEXT,
    mesa INTEGER NOT NULL,
    orden INTEGER NOT NULL,
    voto_timestamp TIMESTAMP DEFAULT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Crear tabla de candidatos
CREATE TABLE IF NOT EXISTS candidatos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    partido VARCHAR(255),
    color VARCHAR(7) DEFAULT '#3B82F6',
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Crear tabla de fiscales
CREATE TABLE IF NOT EXISTS fiscales (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    mesa_asignada INTEGER,
    password VARCHAR(255) NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Crear tabla de votos por mesa y candidato
CREATE TABLE IF NOT EXISTS votos (
    id SERIAL PRIMARY KEY,
    mesa INTEGER NOT NULL,
    candidato_id INTEGER REFERENCES candidatos(id),
    cantidad_votos INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(mesa, candidato_id)
);

-- Crear índices para optimizar búsquedas
CREATE INDEX IF NOT EXISTS idx_padron_dni ON padron(dni);
CREATE INDEX IF NOT EXISTS idx_padron_apellido_nombre ON padron(apellido_nombre);
CREATE INDEX IF NOT EXISTS idx_padron_mesa ON padron(mesa);
CREATE INDEX IF NOT EXISTS idx_votos_mesa ON votos(mesa);

-- Crear función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear trigger para votos
CREATE TRIGGER update_votos_updated_at BEFORE UPDATE ON votos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
