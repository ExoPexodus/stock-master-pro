-- Multi-Location Inventory Schema

-- Create locations table
CREATE TABLE IF NOT EXISTS locations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    address TEXT,
    capacity INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create stock_locations table for tracking inventory per location
CREATE TABLE IF NOT EXISTS stock_locations (
    id SERIAL PRIMARY KEY,
    item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    location_id INTEGER NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 0,
    min_threshold INTEGER DEFAULT 10,
    max_threshold INTEGER,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by INTEGER REFERENCES users(id),
    UNIQUE(item_id, location_id),
    CHECK (quantity >= 0)
);

-- Create stock_transfers table for tracking movements between locations
CREATE TABLE IF NOT EXISTS stock_transfers (
    id SERIAL PRIMARY KEY,
    item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    from_location_id INTEGER REFERENCES locations(id) ON DELETE SET NULL,
    to_location_id INTEGER NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL,
    transfer_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    transferred_by INTEGER REFERENCES users(id),
    notes TEXT,
    status VARCHAR(20) DEFAULT 'completed',
    CHECK (quantity > 0)
);

-- Create indexes for better query performance
CREATE INDEX idx_stock_locations_item ON stock_locations(item_id);
CREATE INDEX idx_stock_locations_location ON stock_locations(location_id);
CREATE INDEX idx_stock_transfers_item ON stock_transfers(item_id);
CREATE INDEX idx_stock_transfers_date ON stock_transfers(transfer_date);

-- Insert some default locations
INSERT INTO locations (name, address, capacity) VALUES
    ('Main Warehouse', '123 Main St, City', 10000),
    ('East Branch', '456 East Ave, City', 5000),
    ('West Branch', '789 West Blvd, City', 5000)
ON CONFLICT (name) DO NOTHING;

-- Function to update stock_locations timestamp
CREATE OR REPLACE FUNCTION update_stock_location_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for stock_locations
DROP TRIGGER IF EXISTS stock_locations_update_timestamp ON stock_locations;
CREATE TRIGGER stock_locations_update_timestamp
    BEFORE UPDATE ON stock_locations
    FOR EACH ROW
    EXECUTE FUNCTION update_stock_location_timestamp();
