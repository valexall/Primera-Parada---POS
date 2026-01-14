-- =============================================
-- HABILITAR REALTIME PARA SINCRONIZACIÓN AUTOMÁTICA
-- =============================================
-- Esta migración habilita la replicación en tiempo real
-- para las tablas críticas del sistema, permitiendo que
-- los cambios se sincronicen automáticamente entre
-- todos los clientes conectados.
-- =============================================

-- Habilitar realtime en la tabla de órdenes
ALTER PUBLICATION supabase_realtime ADD TABLE orders;

-- Habilitar realtime en los items de las órdenes
ALTER PUBLICATION supabase_realtime ADD TABLE order_items;

-- Habilitar realtime en el menú (para actualizaciones de disponibilidad)
ALTER PUBLICATION supabase_realtime ADD TABLE menu_items;

-- Opcional: Habilitar realtime en ventas si se necesita dashboard en vivo
-- ALTER PUBLICATION supabase_realtime ADD TABLE sales;

-- Verificar que las tablas están en la publicación
-- SELECT schemaname, tablename 
-- FROM pg_publication_tables 
-- WHERE pubname = 'supabase_realtime';
