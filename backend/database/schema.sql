-- =============================================
-- RESTAURANT MANAGEMENT SYSTEM - DATABASE SCHEMA
-- =============================================
-- Sistema de gestión para restaurante con módulos de:
-- - Gestión de órdenes y menú
-- - Ventas y finanzas
-- - Inventario de insumos
-- - Control de usuarios
-- - Business Intelligence
-- =============================================

-- =============================================
-- SECCIÓN 1: TABLAS CORE DEL SISTEMA
-- =============================================

-- Tabla de usuarios del sistema
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'waiter')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE users IS 'Usuarios del sistema (administradores y mozos)';
COMMENT ON COLUMN users.is_active IS 'Indica si el usuario está activo. Usuarios inactivos no pueden hacer login.';

-- Tabla de elementos del menú
CREATE TABLE IF NOT EXISTS menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE menu_items IS 'Almacena los platos disponibles en el menú';
COMMENT ON COLUMN menu_items.is_available IS 'Indica si el item está disponible (TRUE) o agotado (FALSE)';

-- Tabla de órdenes
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  timestamp BIGINT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Pendiente', 'Listo', 'Entregado', 'Pagado', 'Cancelado')),
  table_number TEXT,
  order_type TEXT NOT NULL DEFAULT 'Dine-In' CHECK (order_type IN ('Dine-In', 'Takeaway')),
  customer_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE orders IS 'Almacena las órdenes realizadas';
COMMENT ON COLUMN orders.order_type IS 'Tipo de orden: Dine-In (para comer aquí) o Takeaway (para llevar)';
COMMENT ON COLUMN orders.customer_name IS 'Nombre del cliente (requerido solo para órdenes Takeaway)';

-- Tabla de items de cada orden
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id UUID NOT NULL,
  menu_item_name TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  quantity INTEGER NOT NULL,
  notes TEXT,
  item_status TEXT NOT NULL DEFAULT 'Pendiente' CHECK (item_status IN ('Pendiente', 'Listo', 'Entregado')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE order_items IS 'Almacena los items individuales de cada orden';
COMMENT ON COLUMN order_items.item_status IS 'Estado individual del item: Pendiente (en preparación), Listo (terminado en cocina), Entregado (servido al cliente)';

-- =============================================
-- SECCIÓN 2: MÓDULO DE VENTAS Y FINANZAS
-- =============================================

-- Tabla de ventas (Registros de cobro)
CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT NOT NULL REFERENCES orders(id),
  total_amount DECIMAL(10, 2) NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('Efectivo', 'Yape')),
  is_receipt_issued BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE sales IS 'Registro de transacciones de cobro (ingresos)';

-- Tabla de gastos operativos
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  description TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  category TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE expenses IS 'Registro de gastos operativos diarios (egresos)';

-- Tabla de recibos/boletas
CREATE TABLE IF NOT EXISTS receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  receipt_number TEXT UNIQUE NOT NULL,
  order_id TEXT NOT NULL REFERENCES orders(id),
  table_number TEXT,
  subtotal DECIMAL(10, 2) NOT NULL,
  tax DECIMAL(10, 2) NOT NULL,
  total DECIMAL(10, 2) NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('Efectivo', 'Yape')),
  items JSONB NOT NULL,
  issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE receipts IS 'Registro de recibos/boletas emitidos para control y auditoría';
COMMENT ON COLUMN receipts.receipt_number IS 'Número único de recibo con formato R-YYYYMMDD-XXXXXXXX';
COMMENT ON COLUMN receipts.items IS 'Array JSON con los items del recibo (menuItemId, menuItemName, price, quantity, notes)';
COMMENT ON COLUMN receipts.subtotal IS 'Subtotal sin IGV';
COMMENT ON COLUMN receipts.tax IS 'Impuesto IGV (18%)';
COMMENT ON COLUMN receipts.total IS 'Total incluyendo IGV';

-- =============================================
-- SECCIÓN 3: MÓDULO DE INVENTARIO
-- =============================================

-- Tabla de insumos
CREATE TABLE IF NOT EXISTS supplies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  unit TEXT NOT NULL,
  current_stock DECIMAL(10, 2) DEFAULT 0,
  min_stock DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE supplies IS 'Catálogo de ingredientes e insumos';

-- Tabla de movimientos de inventario
CREATE TABLE IF NOT EXISTS supply_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supply_id UUID REFERENCES supplies(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('Compra', 'Ajuste', 'Venta')),
  quantity DECIMAL(10, 2) NOT NULL,
  cost DECIMAL(10, 2),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de recetas (relación plato-insumos)
CREATE TABLE IF NOT EXISTS recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id UUID REFERENCES menu_items(id) ON DELETE CASCADE,
  supply_id UUID REFERENCES supplies(id) ON DELETE CASCADE,
  quantity_required DECIMAL(10, 3) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE recipes IS 'Ficha técnica: qué insumos consume cada plato';

-- =============================================
-- SECCIÓN 4: BUSINESS INTELLIGENCE
-- =============================================

-- Tabla de historial del menú para análisis
CREATE TABLE IF NOT EXISTS menu_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date DATE UNIQUE NOT NULL,
  menu_items JSONB NOT NULL,
  sales_stats JSONB NOT NULL,
  total_revenue DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_orders INTEGER NOT NULL DEFAULT 0,
  total_items_sold INTEGER NOT NULL DEFAULT 0,
  dine_in_orders INTEGER NOT NULL DEFAULT 0,
  takeaway_orders INTEGER NOT NULL DEFAULT 0,
  avg_order_value DECIMAL(10,2),
  peak_hour INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE menu_history IS 'Stores daily menu snapshots with sales statistics for Business Intelligence analysis';
COMMENT ON COLUMN menu_history.menu_items IS 'Array of menu items with their properties at the time of snapshot (name, price, category, etc.)';
COMMENT ON COLUMN menu_history.sales_stats IS 'Sales statistics per menu item including quantity sold, revenue, and other metrics';
COMMENT ON COLUMN menu_history.peak_hour IS 'Hour of the day (0-23) with the highest number of orders';

-- =============================================
-- SECCIÓN 5: ÍNDICES PARA PERFORMANCE
-- =============================================

-- Índices de usuarios
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_unique ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_email_active ON users(email, password) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role) WHERE is_active = true;

-- Índices de menú
CREATE INDEX IF NOT EXISTS idx_menu_items_available ON menu_items(is_available);

-- Índices de órdenes
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_timestamp ON orders(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_orders_type ON orders(order_type);
CREATE INDEX IF NOT EXISTS idx_orders_status_timestamp ON orders(status, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_orders_type_status ON orders(order_type, status);

-- Índices de order_items
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_item_status ON order_items(item_status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_status ON order_items(order_id, item_status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id_name ON order_items(order_id, menu_item_name);

-- Índices de ventas
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(created_at);

-- Índices de gastos
CREATE INDEX IF NOT EXISTS idx_expenses_created_at ON expenses(created_at DESC);

-- Índices de recibos
CREATE INDEX IF NOT EXISTS idx_receipts_sale_id ON receipts(sale_id);
CREATE INDEX IF NOT EXISTS idx_receipts_receipt_number ON receipts(receipt_number);
CREATE INDEX IF NOT EXISTS idx_receipts_issued_at ON receipts(issued_at DESC);
CREATE INDEX IF NOT EXISTS idx_receipts_order_id ON receipts(order_id);

-- Índices de Business Intelligence
CREATE INDEX IF NOT EXISTS idx_menu_history_date ON menu_history(snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_menu_history_created_at ON menu_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_menu_history_menu_items ON menu_history USING GIN (menu_items);
CREATE INDEX IF NOT EXISTS idx_menu_history_sales_stats ON menu_history USING GIN (sales_stats);

-- =============================================
-- SECCIÓN 6: FUNCIONES ALMACENADAS (STORED PROCEDURES)
-- =============================================

-- Función para registrar compras de insumos (transaccional)
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
  INSERT INTO supply_movements (supply_id, type, quantity, cost, description)
  VALUES (p_supply_id, 'Compra', p_quantity, p_cost, p_description);

  INSERT INTO expenses (description, amount, category)
  VALUES ('Compra Insumo: ' || p_supply_name, p_cost, 'Insumos');

  UPDATE supplies
  SET current_stock = current_stock + p_quantity
  WHERE id = p_supply_id;
END;
$$;

-- Función para obtener resumen diario de finanzas
CREATE OR REPLACE FUNCTION get_daily_summary(target_date DATE)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  result JSON;
  v_total_sales DECIMAL(10, 2);
  v_total_expenses DECIMAL(10, 2);
  v_net_income DECIMAL(10, 2);
  v_cash_sales DECIMAL(10, 2);
  v_yape_sales DECIMAL(10, 2);
  v_date TEXT;
BEGIN
  v_date := target_date::TEXT;
  
  SELECT COALESCE(SUM(total_amount), 0)
  INTO v_total_sales
  FROM sales
  WHERE DATE(created_at) = target_date;
  
  SELECT COALESCE(SUM(amount), 0)
  INTO v_total_expenses
  FROM expenses
  WHERE DATE(created_at) = target_date;
  
  SELECT COALESCE(SUM(total_amount), 0)
  INTO v_cash_sales
  FROM sales
  WHERE DATE(created_at) = target_date AND payment_method = 'Efectivo';
  
  SELECT COALESCE(SUM(total_amount), 0)
  INTO v_yape_sales
  FROM sales
  WHERE DATE(created_at) = target_date AND payment_method = 'Yape';
  
  v_net_income := v_total_sales - v_total_expenses;
  
  result := json_build_object(
    'date', v_date,
    'totalSales', v_total_sales,
    'totalExpenses', v_total_expenses,
    'netIncome', v_net_income,
    'breakdown', json_build_object(
      'cash', v_cash_sales,
      'yape', v_yape_sales
    )
  );
  
  RETURN result;
END;
$$;

COMMENT ON FUNCTION get_daily_summary(DATE) IS 'Returns daily financial summary with sales, expenses, net income, and payment method breakdown. Optimized for performance by delegating aggregations to PostgreSQL.';

-- Función para obtener estadísticas diarias del menú
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
  WHERE o.status IN ('Entregado', 'Pagado') AND o.timestamp >= start_timestamp
  GROUP BY oi.menu_item_name
  ORDER BY quantity DESC;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_daily_menu_stats(BIGINT) IS 'Obtiene estadísticas agregadas de platos vendidos en el día. Optimizado para evitar Query N+1.';

-- Función para actualizar estado de item de orden (optimizada)
CREATE OR REPLACE FUNCTION update_order_item_status_optimized(
  p_item_id UUID,
  p_new_status TEXT,
  p_order_id TEXT
)
RETURNS TABLE(
  id TEXT,
  "timestamp" BIGINT,
  status TEXT,
  table_number TEXT,
  order_type TEXT,
  customer_name TEXT,
  order_items_json JSONB
) 
LANGUAGE plpgsql
AS $$
DECLARE
  v_all_items_ready BOOLEAN;
  v_timestamp BIGINT;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM order_items 
    WHERE order_items.id = p_item_id AND order_items.order_id = p_order_id
  ) THEN
    RAISE EXCEPTION 'Item not found in order';
  END IF;

  UPDATE order_items 
  SET item_status = p_new_status
  WHERE order_items.id = p_item_id AND order_items.order_id = p_order_id;

  SELECT NOT EXISTS (
    SELECT 1 
    FROM order_items 
    WHERE order_items.order_id = p_order_id AND item_status != 'Listo'
  ) INTO v_all_items_ready;

  IF v_all_items_ready THEN
    v_timestamp := EXTRACT(EPOCH FROM NOW())::BIGINT * 1000;
    UPDATE orders 
    SET status = 'Listo', timestamp = v_timestamp
    WHERE orders.id = p_order_id;
  END IF;

  RETURN QUERY
  SELECT 
    o.id,
    o.timestamp,
    o.status,
    o.table_number,
    o.order_type,
    o.customer_name,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', oi.id,
          'menuItemId', oi.menu_item_id,
          'menuItemName', oi.menu_item_name,
          'price', oi.price,
          'quantity', oi.quantity,
          'notes', oi.notes,
          'itemStatus', oi.item_status
        ) ORDER BY oi.created_at
      ),
      '[]'::jsonb
    ) as order_items_json
  FROM orders o
  LEFT JOIN order_items oi ON oi.order_id = o.id
  WHERE o.id = p_order_id
  GROUP BY o.id, o.timestamp, o.status, o.table_number, o.order_type, o.customer_name;
END;
$$;

COMMENT ON FUNCTION update_order_item_status_optimized IS 'Actualiza estado de item y orden en una transacción atómica. Reemplaza 4 queries por 1.';

-- Función para upsert de items de orden (optimizada)
CREATE OR REPLACE FUNCTION upsert_order_items_optimized(
  p_order_id TEXT,
  p_items JSONB
)
RETURNS TABLE(
  id TEXT,
  "timestamp" BIGINT,
  status TEXT,
  table_number TEXT,
  order_type TEXT,
  customer_name TEXT,
  order_items_json JSONB
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_item JSONB;
  v_timestamp BIGINT;
  v_existing_ids UUID[];
  v_new_ids UUID[];
  v_inserted_ids UUID[] := '{}';
  v_temp_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM orders WHERE orders.id = p_order_id) THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  SELECT COALESCE(ARRAY_AGG(oi.id), '{}')
  INTO v_existing_ids
  FROM order_items oi 
  WHERE oi.order_id = p_order_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    IF v_item->>'id' IS NOT NULL AND v_item->>'id' != 'null' AND 
       (v_item->>'id')::UUID = ANY(v_existing_ids) THEN
      
      UPDATE order_items
      SET 
        menu_item_name = v_item->>'menuItemName',
        price = (v_item->>'price')::NUMERIC,
        quantity = (v_item->>'quantity')::INTEGER,
        notes = v_item->>'notes',
        item_status = COALESCE(v_item->>'itemStatus', 'Pendiente')
      WHERE order_items.id = (v_item->>'id')::UUID
        AND order_items.order_id = p_order_id;
    
    ELSE
      v_temp_id := gen_random_uuid();
      
      INSERT INTO order_items (
        id,
        order_id,
        menu_item_id,
        menu_item_name,
        price,
        quantity,
        notes,
        item_status
      ) VALUES (
        v_temp_id,
        p_order_id,
        CASE 
          WHEN v_item->>'menuItemId' LIKE 'CUSTOM-%' 
          THEN gen_random_uuid()
          ELSE (v_item->>'menuItemId')::UUID
        END,
        v_item->>'menuItemName',
        (v_item->>'price')::NUMERIC,
        (v_item->>'quantity')::INTEGER,
        v_item->>'notes',
        COALESCE(v_item->>'itemStatus', 'Pendiente')
      );
      
      v_inserted_ids := array_append(v_inserted_ids, v_temp_id);
    END IF;
  END LOOP;

  SELECT COALESCE(ARRAY_AGG((json_data->>'id')::UUID), '{}')
  INTO v_new_ids
  FROM jsonb_array_elements(p_items) json_data 
  WHERE json_data->>'id' IS NOT NULL AND json_data->>'id' != 'null';

  v_new_ids := v_new_ids || v_inserted_ids;

  IF array_length(v_new_ids, 1) > 0 THEN
    DELETE FROM order_items
    WHERE order_items.order_id = p_order_id AND order_items.id != ALL(v_new_ids);
  ELSE
    DELETE FROM order_items WHERE order_items.order_id = p_order_id;
  END IF;

  v_timestamp := EXTRACT(EPOCH FROM NOW())::BIGINT * 1000;
  UPDATE orders SET timestamp = v_timestamp WHERE orders.id = p_order_id;

  RETURN QUERY
  SELECT 
    o.id,
    o.timestamp,
    o.status,
    o.table_number,
    o.order_type,
    o.customer_name,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', oi.id,
          'menuItemId', oi.menu_item_id,
          'menuItemName', oi.menu_item_name,
          'price', oi.price,
          'quantity', oi.quantity,
          'notes', oi.notes,
          'itemStatus', oi.item_status
        ) ORDER BY oi.created_at
      ),
      '[]'::jsonb
    ) as order_items_json
  FROM orders o
  LEFT JOIN order_items oi ON oi.order_id = o.id
  WHERE o.id = p_order_id
  GROUP BY o.id, o.timestamp, o.status, o.table_number, o.order_type, o.customer_name;
END;
$$;

COMMENT ON FUNCTION upsert_order_items_optimized IS 'UPSERT inteligente de items. Preserva IDs, actualiza existentes, inserta nuevos, elimina removidos.';

-- =============================================
-- SECCIÓN 7: TRIGGERS
-- =============================================

-- Función para actualizar timestamp automáticamente
CREATE OR REPLACE FUNCTION update_menu_history_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para menu_history
CREATE TRIGGER trigger_update_menu_history_updated_at
  BEFORE UPDATE ON menu_history
  FOR EACH ROW
  EXECUTE FUNCTION update_menu_history_updated_at();

-- =============================================
-- SECCIÓN 8: COMANDOS DE UTILIDAD
-- =============================================

-- Verificación de conteo de registros
-- SELECT 'orders' as tabla, count(*) FROM orders
-- UNION ALL SELECT 'sales', count(*) FROM sales
-- UNION ALL SELECT 'receipts', count(*) FROM receipts
-- UNION ALL SELECT 'menu_items', count(*) FROM menu_items
-- UNION ALL SELECT 'users', count(*) FROM users;

-- Comando para limpiar base de datos (¡USAR CON PRECAUCIÓN!)
-- TRUNCATE TABLE 
--   receipts, sales, order_items, orders, menu_history, 
--   supply_movements, recipes, expenses, supplies, menu_items
-- RESTART IDENTITY CASCADE;

-- =============================================
-- FIN DEL SCHEMA
-- =============================================