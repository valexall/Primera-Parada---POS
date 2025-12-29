-- Migration: Índices de performance para optimización de login
-- Fecha: 2025-12-29
-- Propósito: Reducir tiempo de login de 2.5s a <500ms

-- ============================================
-- 1. PRIMERO: Añadir columna is_active (si no existe)
-- ============================================
-- IMPORTANTE: Debe ejecutarse ANTES de crear índices que la usan
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT true NOT NULL;
    
    COMMENT ON COLUMN users.is_active IS 
    'Indica si el usuario está activo. Usuarios inactivos no pueden hacer login.';
  END IF;
END $$;

-- ============================================
-- 2. Índice único en users.email
-- ============================================
-- CRÍTICO: Este índice debe existir para búsquedas rápidas en login
-- Si ya existe debido a UNIQUE constraint, este comando lo ignora
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_unique 
ON users(email);

-- ============================================
-- 3. Índice parcial para usuarios activos
-- ============================================
-- Optimiza queries que solo buscan usuarios activos
-- Reduce el espacio del índice ignorando usuarios inactivos
CREATE INDEX IF NOT EXISTS idx_users_email_active 
ON users(email, password) 
WHERE is_active = true;

-- Comentario para documentación
COMMENT ON INDEX idx_users_email_active IS 
'Índice parcial para optimizar login de usuarios activos. 
Incluye password en el índice para evitar lookup adicional.
Solo indexa registros donde is_active = true.';

-- ============================================
-- 4. Índice en is_active
-- ============================================
CREATE INDEX IF NOT EXISTS idx_users_is_active 
ON users(is_active);

-- ============================================
-- 5. Índice en role para queries de autorización
-- ============================================
CREATE INDEX IF NOT EXISTS idx_users_role 
ON users(role) 
WHERE is_active = true;

-- ============================================
-- 5. Estadísticas para el optimizador
-- ============================================
-- Actualizar estadísticas de la tabla users para mejores query plans
ANALYZE users;

-- ============================================
-- 6. Verificación de índices creados
-- ============================================
-- Para verificar los índices, ejecuta:
-- SELECT indexname, indexdef 
-- FROM pg_indexes 
-- WHERE tablename = 'users' 
-- ORDER BY indexname;
