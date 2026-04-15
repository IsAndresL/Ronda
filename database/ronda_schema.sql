-- =====================================================
-- RONDA | Esquema base para login de meseros en Supabase
-- =====================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS meseros (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre_usuario VARCHAR(100) NOT NULL,
  pin VARCHAR(255) NOT NULL,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Mesero de prueba: PIN real = 1234 (hash bcrypt saltRounds 10)
INSERT INTO meseros (nombre_usuario, pin)
VALUES ('Carlos Mesero', '$2b$10$O68fB7kz2mXDueG.Uv5V5elUiYG/Q7KJDmcr6jWOsJh6M9aEJ6//6');
