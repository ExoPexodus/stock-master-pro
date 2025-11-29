-- Add advanced date tracking fields to items and purchase orders

-- Add warranty and expiry tracking to items
ALTER TABLE items ADD COLUMN IF NOT EXISTS warranty_months INTEGER;
ALTER TABLE items ADD COLUMN IF NOT EXISTS expiry_date DATE;
ALTER TABLE items ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Create trigger to auto-update updated_at for items
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_items_updated_at ON items;
CREATE TRIGGER update_items_updated_at 
    BEFORE UPDATE ON items 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add expected delivery date to purchase orders
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS expected_delivery_date DATE;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS actual_delivery_date DATE;

-- Create view for calculating lead times
CREATE OR REPLACE VIEW purchase_order_metrics AS
SELECT 
    po.id,
    po.po_number,
    po.order_date,
    po.approved_date,
    po.sent_date,
    po.delivered_date,
    po.expected_delivery_date,
    po.actual_delivery_date,
    CASE 
        WHEN po.approved_date IS NOT NULL AND po.order_date IS NOT NULL 
        THEN EXTRACT(DAY FROM po.approved_date - po.order_date)
        ELSE NULL 
    END as approval_lead_time_days,
    CASE 
        WHEN po.sent_date IS NOT NULL AND po.approved_date IS NOT NULL 
        THEN EXTRACT(DAY FROM po.sent_date - po.approved_date)
        ELSE NULL 
    END as send_lead_time_days,
    CASE 
        WHEN po.delivered_date IS NOT NULL AND po.sent_date IS NOT NULL 
        THEN EXTRACT(DAY FROM po.delivered_date - po.sent_date)
        ELSE NULL 
    END as delivery_lead_time_days,
    CASE 
        WHEN po.delivered_date IS NOT NULL AND po.order_date IS NOT NULL 
        THEN EXTRACT(DAY FROM po.delivered_date - po.order_date)
        ELSE NULL 
    END as total_lead_time_days,
    CASE 
        WHEN po.actual_delivery_date IS NOT NULL AND po.expected_delivery_date IS NOT NULL 
        THEN EXTRACT(DAY FROM po.actual_delivery_date - po.expected_delivery_date)
        ELSE NULL 
    END as delivery_variance_days
FROM purchase_orders po;

-- Add comments
COMMENT ON COLUMN items.warranty_months IS 'Warranty duration in months';
COMMENT ON COLUMN items.expiry_date IS 'Expiration date for perishable items';
COMMENT ON COLUMN items.updated_at IS 'Last modification timestamp';
COMMENT ON COLUMN purchase_orders.expected_delivery_date IS 'Expected delivery date from supplier';
COMMENT ON COLUMN purchase_orders.actual_delivery_date IS 'Actual date when order was delivered';
COMMENT ON VIEW purchase_order_metrics IS 'Calculated lead time metrics for purchase orders';
