-- Restaurant Management System Database Schema
-- Run this SQL in your Supabase SQL Editor to create all necessary tables
-- Tabla de elementos del menú
CREATE TABLE IF NOT EXISTS menu_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Tabla de órdenes
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  timestamp BIGINT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Pendiente', 'Listo', 'Entregado')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Tabla de items de cada orden
CREATE TABLE IF NOT EXISTS order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id UUID NOT NULL,
  menu_item_name TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  quantity INTEGER NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_timestamp ON orders(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
-- Comentarios para documentación
COMMENT ON TABLE menu_items IS 'Almacena los platos disponibles en el menú';
COMMENT ON TABLE orders IS 'Almacena las órdenes realizadas';
COMMENT ON TABLE order_items IS 'Almacena los items individuales de cada orden';