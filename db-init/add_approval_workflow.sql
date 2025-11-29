-- Add approval workflow fields to purchase_orders table
ALTER TABLE purchase_orders 
ADD COLUMN IF NOT EXISTS approved_by INTEGER REFERENCES users(id),
ADD COLUMN IF NOT EXISTS approved_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS rejected_by INTEGER REFERENCES users(id),
ADD COLUMN IF NOT EXISTS rejected_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS sent_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS delivered_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS comments TEXT;

-- Update existing orders to 'draft' status if they are 'pending'
UPDATE purchase_orders SET status = 'draft' WHERE status = 'pending';

-- Create approval_history table
CREATE TABLE IF NOT EXISTS approval_history (
    id SERIAL PRIMARY KEY,
    purchase_order_id INTEGER NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id),
    from_status VARCHAR(20) NOT NULL,
    to_status VARCHAR(20) NOT NULL,
    comments TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_approval_history_po ON approval_history(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_approval_history_user ON approval_history(user_id);
