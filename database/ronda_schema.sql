-- =====================================================
-- RONDA | Esquema base para login de meseros en Supabase
-- =====================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS meseros (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre_usuario VARCHAR(100) NOT NULL,
  usuario VARCHAR(60) UNIQUE,
  contrasena VARCHAR(255),
  pin VARCHAR(255),
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE meseros ADD COLUMN IF NOT EXISTS usuario VARCHAR(60);
ALTER TABLE meseros ADD COLUMN IF NOT EXISTS contrasena VARCHAR(255);
ALTER TABLE meseros ADD COLUMN IF NOT EXISTS pin VARCHAR(255);

-- Si la version anterior tenia PIN obligatorio, se libera para compatibilidad
-- con el nuevo login por usuario + contrasena.
ALTER TABLE meseros ALTER COLUMN pin DROP NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'meseros_usuario_key'
  ) THEN
    ALTER TABLE meseros ADD CONSTRAINT meseros_usuario_key UNIQUE (usuario);
  END IF;
END $$;

-- Compatibilidad con versiones antiguas: mover hash de pin a contrasena si existe.
UPDATE meseros
SET contrasena = pin
WHERE contrasena IS NULL
  AND pin IS NOT NULL;

-- Si faltan usuarios en filas antiguas, se generan de forma determinista.
UPDATE meseros
SET usuario = LOWER(REPLACE(nombre_usuario, ' ', '.'))
WHERE usuario IS NULL;

ALTER TABLE meseros ALTER COLUMN usuario SET NOT NULL;
ALTER TABLE meseros ALTER COLUMN contrasena SET NOT NULL;

-- Mesero de prueba:
-- usuario: carlos.mesero
-- contrasena real: Mesero123
INSERT INTO meseros (nombre_usuario, usuario, contrasena, activo)
VALUES ('Carlos Mesero', 'carlos.mesero', '$2b$10$3Rp8yRV7i0GwHbDjKX0D2.Ky8qQFW7oMro.jN5fCJB6kQchDdudSe', TRUE)
ON CONFLICT (usuario) DO NOTHING;
