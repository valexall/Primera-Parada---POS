-- Migration: Optimizar estadísticas diarias del menú
-- Fecha: 2025-12-29
-- Propósito: Eliminar Query N+1 en getDailyStats con RPC optimizado

-- ============================================
-- 1. Función RPC para estadísticas diarias
-- ============================================
CREATE OR REPLACE FUNCTION get_daily_menu_stats(start_timestamp BIGINT)
RETURNS TABLE(
  name TEXT,
  quantity BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    oi.menu_item_name::TEXT as name,
    SUM(oi.quantity)::BIGINT as quantity
  FROM order_items oi
  INNER JOIN orders o ON o.id = oi.order_id
  WHERE o.status = 'Entregado'
    AND o.timestamp >= start_timestamp
  GROUP BY oi.menu_item_name
  ORDER BY quantity DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- Comentario para documentación
COMMENT ON FUNCTION get_daily_menu_stats(BIGINT) IS 
'Obtiene estadísticas agregadas de platos vendidos en el día. 
Optimizado para evitar Query N+1.
Parámetros:
  - start_timestamp: Unix timestamp del inicio del día
Retorna:
  - name: Nombre del plato
  - quantity: Cantidad total vendida';

-- ============================================
-- 2. Índice compuesto para optimizar el JOIN
-- ============================================
-- Este índice optimiza la query del RPC
CREATE INDEX IF NOT EXISTS idx_orders_status_timestamp 
ON orders(status, timestamp DESC)
WHERE status = 'Entregado';

-- Este índice optimiza el JOIN con order_items
CREATE INDEX IF NOT EXISTS idx_order_items_order_id_name 
ON order_items(order_id, menu_item_name);

-- ============================================
-- 3. Verificación de la función
-- ============================================
-- Para probar la función, descomenta y ejecuta:
-- SELECT * FROM get_daily_menu_stats(EXTRACT(EPOCH FROM DATE_TRUNC('day', NOW()))::BIGINT * 1000);
