-- Migration: Fix daily menu stats to include 'Pagado' orders
-- Fecha: 2026-01-14
-- Propósito: Las estadísticas deben incluir órdenes 'Pagado' además de 'Entregado'

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
  WHERE o.status IN ('Entregado', 'Pagado') 
    AND o.timestamp >= start_timestamp
  GROUP BY oi.menu_item_name
  ORDER BY quantity DESC;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_daily_menu_stats(BIGINT) IS 
'Obtiene estadísticas agregadas de platos vendidos en el día. 
Incluye órdenes con estado Entregado o Pagado.
Optimizado para evitar Query N+1.';
