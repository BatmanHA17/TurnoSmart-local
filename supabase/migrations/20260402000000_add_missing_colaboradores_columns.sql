-- Migration: Add missing columns to colaboradores table
-- These columns exist in the frontend model (ColaboradorBaseData) but were missing from cloud DB
-- Root cause: they were defined in migrations_backup/ but never in active migrations/

ALTER TABLE colaboradores
  ADD COLUMN IF NOT EXISTS empleado_id TEXT,
  ADD COLUMN IF NOT EXISTS fecha_nacimiento DATE,
  ADD COLUMN IF NOT EXISTS telefono_movil TEXT,
  ADD COLUMN IF NOT EXISTS pais_movil TEXT DEFAULT 'ES',
  ADD COLUMN IF NOT EXISTS telefono_fijo TEXT,
  ADD COLUMN IF NOT EXISTS pais_fijo TEXT DEFAULT 'ES',
  ADD COLUMN IF NOT EXISTS hora_inicio_contrato TIME,
  ADD COLUMN IF NOT EXISTS responsable_directo UUID REFERENCES colaboradores(id),
  ADD COLUMN IF NOT EXISTS pais_nacimiento TEXT DEFAULT 'España',
  ADD COLUMN IF NOT EXISTS direccion TEXT,
  ADD COLUMN IF NOT EXISTS ciudad TEXT,
  ADD COLUMN IF NOT EXISTS codigo_postal TEXT,
  ADD COLUMN IF NOT EXISTS provincia TEXT,
  ADD COLUMN IF NOT EXISTS pais_residencia TEXT DEFAULT 'España',
  ADD COLUMN IF NOT EXISTS genero TEXT,
  ADD COLUMN IF NOT EXISTS apellidos_nacimiento TEXT,
  ADD COLUMN IF NOT EXISTS nacionalidad TEXT,
  ADD COLUMN IF NOT EXISTS ciudad_nacimiento TEXT,
  ADD COLUMN IF NOT EXISTS estado_civil TEXT,
  ADD COLUMN IF NOT EXISTS numero_personas_dependientes INTEGER,
  ADD COLUMN IF NOT EXISTS fecha_antiguedad DATE,
  ADD COLUMN IF NOT EXISTS job_id UUID REFERENCES jobs(id);

-- Note: apellidos_uso was added in a previous hotfix (ALTER TABLE run directly on 2026-04-02)
ALTER TABLE colaboradores ADD COLUMN IF NOT EXISTS apellidos_uso TEXT;
