-- =============================================
-- Migración: Actualizar roles de usuarios
-- Fecha: 2026-01-13
-- Descripción: Cambiar rol 'waiter' a 'moza' para coincidir con la terminología del sistema
-- =============================================

-- 1. Eliminar el constraint actual de role
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- 2. Actualizar registros existentes de 'waiter' a 'moza'
UPDATE users SET role = 'moza' WHERE role = 'waiter';

-- 3. Agregar nuevo constraint con los roles correctos
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'moza'));

-- Verificación
SELECT role, COUNT(*) as cantidad 
FROM users 
GROUP BY role;

COMMENT ON CONSTRAINT users_role_check ON users IS 'Roles permitidos: admin (administrador), moza (personal de servicio)';
