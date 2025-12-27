-- Restaurant Management System Database Schema
-- Run this SQL in your Supabase SQL Editor to create all necessary tables
-- Tabla de elementos del menú
create table if not exists menu_items (
  id UUID default gen_random_uuid () primary key,
  name TEXT not null,
  price DECIMAL(10, 2) not null,
  created_at timestamp with time zone default NOW()
);

-- Tabla de órdenes
create table if not exists orders (
  id TEXT primary key,
  timestamp BIGINT not null,
  status TEXT not null check (status in ('Pendiente', 'Listo', 'Entregado')),
  created_at timestamp with time zone default NOW()
);

-- Tabla de items de cada orden
create table if not exists order_items (
  id UUID default gen_random_uuid () primary key,
  order_id TEXT not null references orders (id) on delete CASCADE,
  menu_item_id UUID not null,
  menu_item_name TEXT not null,
  price DECIMAL(10, 2) not null,
  quantity INTEGER not null,
  notes TEXT,
  created_at timestamp with time zone default NOW()
);

-- Índices para mejorar el rendimiento
create index IF not exists idx_orders_status on orders (status);

create index IF not exists idx_orders_timestamp on orders (timestamp desc);

create index IF not exists idx_order_items_order_id on order_items (order_id);

-- Comentarios para documentación
COMMENT on table menu_items is 'Almacena los platos disponibles en el menú';

COMMENT on table orders is 'Almacena las órdenes realizadas';

COMMENT on table order_items is 'Almacena los items individuales de cada orden';

-- =============================================
-- ACTUALIZACIÓN PARA SPRINT 2: VENTAS Y FINANZAS
-- =============================================
-- 1. Actualizar la restricción de estado en 'orders'
-- Necesitamos agregar el estado 'Pagado' para cerrar el ciclo.
alter table orders
drop constraint orders_status_check;

alter table orders
add constraint orders_status_check check (
  status in (
    'Pendiente',
    'Listo',
    'Entregado',
    'Pagado',
    'Cancelado'
  )
);

-- 2. Crear tabla de VENTAS (Para HU4: Registrar pagos)
-- Registra el cobro final, método de pago y vincula con la orden.
create table if not exists sales (
  id UUID default gen_random_uuid () primary key,
  order_id TEXT not null references orders (id),
  total_amount DECIMAL(10, 2) not null,
  payment_method TEXT not null check (payment_method in ('Efectivo', 'Yape')),
  is_receipt_issued BOOLEAN default false, -- Si se emitió boleta
  created_at timestamp with time zone default NOW()
);

-- 3. Crear tabla de GASTOS (Para HU5: Calcular ganancias)
-- Permite a la dueña registrar egresos diarios (Luz, Agua, Moza, Insumos).
create table if not exists expenses (
  id UUID default gen_random_uuid () primary key,
  description TEXT not null, -- Ej: "Pago del día a la moza"
  amount DECIMAL(10, 2) not null,
  category TEXT not null check (
    category in ('Servicios', 'Personal', 'Insumos', 'Otros')
  ),
  created_at timestamp with time zone default NOW()
);

-- 4. Índices para reportes financieros rápidos
create index IF not exists idx_sales_created_at on sales (created_at desc);

create index IF not exists idx_expenses_created_at on expenses (created_at desc);

-- 5. Comentarios para documentación
COMMENT on table sales is 'Registro de transacciones de cobro (ingresos)';

COMMENT on table expenses is 'Registro de gastos operativos diarios (egresos)';

-- 1. Tabla de Insumos (Supplies)
create table if not exists supplies (
  id UUID default gen_random_uuid () primary key,
  name TEXT not null,
  unit TEXT not null, -- ej: 'kg', 'lt', 'unid'
  current_stock DECIMAL(10, 2) default 0,
  min_stock DECIMAL(10, 2) default 0, -- Para alertas
  created_at timestamp with time zone default NOW()
);

-- 2. Tabla de Movimientos de Inventario (Compras/Ajustes)
create table if not exists supply_movements (
  id UUID default gen_random_uuid () primary key,
  supply_id UUID references supplies (id) on delete CASCADE,
  type TEXT not null check (type in ('Compra', 'Ajuste', 'Venta')),
  quantity DECIMAL(10, 2) not null,
  cost DECIMAL(10, 2), -- Solo para compras
  description TEXT,
  created_at timestamp with time zone default NOW()
);

-- 3. Tabla de Recetas (Relación Plato -> Insumos)
create table if not exists recipes (
  id UUID default gen_random_uuid () primary key,
  menu_item_id UUID references menu_items (id) on delete CASCADE,
  supply_id UUID references supplies (id) on delete CASCADE,
  quantity_required DECIMAL(10, 3) not null, -- Cantidad a descontar por plato
  created_at timestamp with time zone default NOW()
);

-- Comentarios
COMMENT on table supplies is 'Catálogo de ingredientes e insumos';

COMMENT on table recipes is 'Ficha técnica: qué insumos consume cada plato';

-- 1. Tabla de Usuarios
create table if not exists users (
  id UUID default gen_random_uuid () primary key,
  email TEXT unique not null,
  password TEXT not null, -- Almacenaremos el hash, no la contraseña plana
  name TEXT not null,
  role TEXT not null check (role in ('admin', 'waiter')), -- admin=Dueña, waiter=Moza
  created_at timestamp with time zone default NOW()
);




-- Función transaccional para registrar compra
CREATE OR REPLACE FUNCTION register_purchase_transaction(
  p_supply_id UUID,
  p_quantity NUMERIC,
  p_cost NUMERIC,
  p_description TEXT,
  p_supply_name TEXT
) 
RETURNS VOID 
LANGUAGE plpgsql 
AS $$
BEGIN
  -- 1. Registrar el movimiento de inventario
  INSERT INTO supply_movements (supply_id, type, quantity, cost, description)
  VALUES (p_supply_id, 'Compra', p_quantity, p_cost, p_description);

  -- 2. Registrar el gasto financiero
  INSERT INTO expenses (description, amount, category)
  VALUES ('Compra Insumo: ' || p_supply_name, p_cost, 'Insumos');

  -- 3. Actualizar el stock actual del insumo
  UPDATE supplies
  SET current_stock = current_stock + p_quantity
  WHERE id = p_supply_id;
END;
$$;


-- 1. Eliminar la restricción de categorías fijas en Gastos
ALTER TABLE expenses DROP CONSTRAINT IF EXISTS expenses_category_check;

-- 2. (Opcional pero recomendado) Crear índice para buscar ventas por fecha rápido
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(created_at);

-- Agregar columna para el número de mesa
ALTER TABLE orders 
ADD COLUMN table_number TEXT;




-- =============================================
-- MIGRACIÓN: TABLA DE RECIBOS (RECEIPTS)
-- Para control y trazabilidad de recibos emitidos
-- =============================================
-- Fecha: 2025-12-26
-- Descripción: Crea la tabla receipts para almacenar los recibos/boletas emitidos

-- 1. Crear tabla de recibos
create table if not exists receipts (
  id UUID default gen_random_uuid () primary key,
  sale_id UUID not null references sales (id) on delete CASCADE,
  receipt_number TEXT not null unique,
  order_id TEXT not null references orders (id),
  table_number TEXT,
  subtotal DECIMAL(10, 2) not null,
  tax DECIMAL(10, 2) not null, -- IGV 18%
  total DECIMAL(10, 2) not null,
  payment_method TEXT not null check (payment_method in ('Efectivo', 'Yape')),
  items JSONB not null, -- Array de items en formato JSON
  issued_at timestamp with time zone default NOW(),
  created_at timestamp with time zone default NOW()
);

-- 2. Crear índices para consultas rápidas
create index IF not exists idx_receipts_sale_id on receipts (sale_id);
create index IF not exists idx_receipts_receipt_number on receipts (receipt_number);
create index IF not exists idx_receipts_issued_at on receipts (issued_at desc);
create index IF not exists idx_receipts_order_id on receipts (order_id);

-- 3. Agregar comentarios para documentación
COMMENT on table receipts is 'Registro de recibos/boletas emitidos para control y auditoría';
COMMENT on column receipts.receipt_number is 'Número único de recibo con formato R-YYYYMMDD-XXXXXXXX';
COMMENT on column receipts.items is 'Array JSON con los items del recibo (menuItemId, menuItemName, price, quantity, notes)';
COMMENT on column receipts.subtotal is 'Subtotal sin IGV';
COMMENT on column receipts.tax is 'Impuesto IGV (18%)';
COMMENT on column receipts.total is 'Total incluyendo IGV';

-- 4. Verificación
SELECT 
  'Tabla receipts creada exitosamente' as mensaje,
  COUNT(*) as total_recibos
FROM receipts;






SELECT 'orders' as tabla, count(*) FROM orders
UNION ALL SELECT 'sales', count(*) FROM sales
UNION ALL SELECT 'receipts', count(*) FROM receipts
UNION ALL SELECT 'menu_items', count(*) FROM menu_items


UNION ALL SELECT 'users', count(*) FROM users;


select * from users;




-- =============================================
-- MIGRACIÓN: ÓRDENES PARA LLEVAR
-- =============================================
-- Esta migración agrega soporte para órdenes "Para Llevar"

-- 1. Agregar columna order_type a la tabla orders
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS order_type TEXT DEFAULT 'Dine-In' 
CHECK (order_type IN ('Dine-In', 'Takeaway'));

-- 2. Agregar columna customer_name para órdenes takeaway
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS customer_name TEXT;

-- 3. Actualizar órdenes existentes para que sean Dine-In
UPDATE orders 
SET order_type = 'Dine-In' 
WHERE order_type IS NULL;

-- 4. Hacer table_number nullable ya que takeaway no necesita mesa
ALTER TABLE orders 
ALTER COLUMN table_number DROP NOT NULL;

-- 5. Crear índice para búsqueda por tipo de orden
CREATE INDEX IF NOT EXISTS idx_orders_type ON orders (order_type);

-- 6. Comentario
COMMENT ON COLUMN orders.order_type IS 'Tipo de orden: Dine-In (para comer aquí) o Takeaway (para llevar)';
COMMENT ON COLUMN orders.customer_name IS 'Nombre del cliente (requerido solo para órdenes Takeaway)';





-- =============================================
-- MIGRACIÓN: Campo de disponibilidad para items del menú
-- =============================================
-- Agregar campo para marcar items como agotados

-- 1. Agregar columna is_available (TRUE = disponible, FALSE = agotado)
ALTER TABLE menu_items 
ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT TRUE;

-- 2. Crear índice para consultas rápidas de items disponibles
CREATE INDEX IF NOT EXISTS idx_menu_items_available ON menu_items(is_available);

-- 3. Actualizar items existentes como disponibles
UPDATE menu_items SET is_available = TRUE WHERE is_available IS NULL;

-- 4. Comentario de documentación
COMMENT ON COLUMN menu_items.is_available IS 'Indica si el item está disponible (TRUE) o agotado (FALSE)';






--=============================================
-- Migration: Add menu_history table for Business Intelligence
-- Purpose: Store daily menu snapshots with sales statistics for analysis
-- Created: 2025-12-27
--=============================================

-- Create menu_history table
CREATE TABLE IF NOT EXISTS menu_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date DATE NOT NULL UNIQUE,
  
  -- Menu items snapshot with their details at that time
  menu_items JSONB NOT NULL,
  
  -- Sales statistics per menu item
  sales_stats JSONB NOT NULL,
  
  -- Aggregated metrics for BI
  total_revenue DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_orders INTEGER NOT NULL DEFAULT 0,
  total_items_sold INTEGER NOT NULL DEFAULT 0,
  
  -- Order type breakdown
  dine_in_orders INTEGER NOT NULL DEFAULT 0,
  takeaway_orders INTEGER NOT NULL DEFAULT 0,
  
  -- Time-based metrics
  avg_order_value DECIMAL(10,2),
  peak_hour INTEGER, -- Hour of the day with most orders (0-23)
  
  -- Additional notes for context
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX idx_menu_history_date ON menu_history(snapshot_date DESC);
CREATE INDEX idx_menu_history_created_at ON menu_history(created_at DESC);

-- Add GIN index for JSONB columns for efficient querying
CREATE INDEX idx_menu_history_menu_items ON menu_history USING GIN (menu_items);
CREATE INDEX idx_menu_history_sales_stats ON menu_history USING GIN (sales_stats);

-- Comments for documentation
COMMENT ON TABLE menu_history IS 'Stores daily menu snapshots with sales statistics for Business Intelligence analysis';
COMMENT ON COLUMN menu_history.menu_items IS 'Array of menu items with their properties at the time of snapshot (name, price, category, etc.)';
COMMENT ON COLUMN menu_history.sales_stats IS 'Sales statistics per menu item including quantity sold, revenue, and other metrics';
COMMENT ON COLUMN menu_history.peak_hour IS 'Hour of the day (0-23) with the highest number of orders';

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_menu_history_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER trigger_update_menu_history_updated_at
  BEFORE UPDATE ON menu_history
  FOR EACH ROW
  EXECUTE FUNCTION update_menu_history_updated_at();
