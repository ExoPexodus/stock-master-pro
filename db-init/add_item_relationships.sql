-- Add warehouse_id and supplier_id to items table

ALTER TABLE items 
ADD COLUMN IF NOT EXISTS warehouse_id INTEGER REFERENCES warehouses(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_items_warehouse ON items(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_items_supplier ON items(supplier_id);

-- Update existing items to have a default warehouse if they don't have one
UPDATE items 
SET warehouse_id = (SELECT id FROM warehouses LIMIT 1)
WHERE warehouse_id IS NULL 
AND EXISTS (SELECT 1 FROM warehouses LIMIT 1);
