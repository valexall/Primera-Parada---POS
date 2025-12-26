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
-- TABLA DE RECIBOS (RECEIPTS)
-- Para control y trazabilidad de recibos emitidos
-- =============================================
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

-- Índices para consultas rápidas
create index IF not exists idx_receipts_sale_id on receipts (sale_id);
create index IF not exists idx_receipts_receipt_number on receipts (receipt_number);
create index IF not exists idx_receipts_issued_at on receipts (issued_at desc);
create index IF not exists idx_receipts_order_id on receipts (order_id);

-- Comentarios
COMMENT on table receipts is 'Registro de recibos/boletas emitidos para control y auditoría';