-- Migration: Add item_status column to order_items table
-- Date: 2025-12-28
-- Purpose: Enable granular status tracking for individual items within orders

-- 1. Add item_status column with default 'Pendiente'
ALTER TABLE order_items 
ADD COLUMN item_status TEXT DEFAULT 'Pendiente' NOT NULL;

-- 2. Add check constraint for valid status values
ALTER TABLE order_items 
ADD CONSTRAINT order_items_item_status_check 
CHECK (item_status IN ('Pendiente', 'Listo', 'Entregado'));

-- 3. Create index for performance when filtering by item status
CREATE INDEX IF NOT EXISTS idx_order_items_item_status ON order_items(item_status);

-- 4. Create composite index for filtering items by order and status
CREATE INDEX IF NOT EXISTS idx_order_items_order_status ON order_items(order_id, item_status);

-- 5. Add comment for documentation
COMMENT ON COLUMN order_items.item_status IS 
'Estado individual del item: Pendiente (en preparación), Listo (terminado en cocina), Entregado (servido al cliente)';

-- Migration rollback (if needed):
-- ALTER TABLE order_items DROP CONSTRAINT order_items_item_status_check;
-- DROP INDEX IF EXISTS idx_order_items_item_status;
-- DROP INDEX IF EXISTS idx_order_items_order_status;
-- ALTER TABLE order_items DROP COLUMN item_status;
