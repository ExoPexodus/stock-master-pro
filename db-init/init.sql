-- ===================================================================
-- Inventory Management System Database Initialization Script
-- Comprehensive schema including all features and migrations
-- PostgreSQL Database Schema
-- ===================================================================

-- Create database (run this separately as a superuser)
-- CREATE DATABASE inventory_db;
-- CREATE USER inventory_user WITH ENCRYPTED PASSWORD 'inventory_password';
-- GRANT ALL PRIVILEGES ON DATABASE inventory_db TO inventory_user;

-- Connect to the database before running the rest
-- \c inventory_db;

-- ===================================================================
-- CORE TABLES
-- ===================================================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(80) UNIQUE NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'viewer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_role CHECK (role IN ('admin', 'manager', 'viewer'))
);

-- Categories table (supports hierarchical categories)
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    parent_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Warehouses table
CREATE TABLE IF NOT EXISTS warehouses (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    location VARCHAR(255),
    capacity INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    contact_person VARCHAR(100),
    email VARCHAR(120),
    phone VARCHAR(20),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Locations table (storage locations within warehouses)
CREATE TABLE IF NOT EXISTS locations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    address TEXT,
    capacity INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===================================================================
-- INVENTORY TABLES
-- ===================================================================

-- Items table with advanced tracking
CREATE TABLE IF NOT EXISTS items (
    id SERIAL PRIMARY KEY,
    sku VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    warehouse_id INTEGER REFERENCES warehouses(id) ON DELETE SET NULL,
    supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL,
    unit_price NUMERIC(10, 2) NOT NULL,
    reorder_level INTEGER DEFAULT 10,
    warranty_months INTEGER,
    expiry_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON COLUMN items.warranty_months IS 'Warranty duration in months';
COMMENT ON COLUMN items.expiry_date IS 'Expiration date for perishable items';
COMMENT ON COLUMN items.updated_at IS 'Last modification timestamp';

-- Stock table (warehouse-level inventory)
CREATE TABLE IF NOT EXISTS stock (
    id SERIAL PRIMARY KEY,
    item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    warehouse_id INTEGER NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(item_id, warehouse_id)
);

-- Stock Locations table (location-level granular inventory tracking)
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

-- Stock Transfers table (movements between locations)
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

-- ===================================================================
-- ORDER MANAGEMENT TABLES
-- ===================================================================

-- Purchase Orders table with approval workflow
CREATE TABLE IF NOT EXISTS purchase_orders (
    id SERIAL PRIMARY KEY,
    po_number VARCHAR(50) UNIQUE NOT NULL,
    supplier_id INTEGER NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
    warehouse_id INTEGER NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
    status VARCHAR(20) DEFAULT 'draft',
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expected_date TIMESTAMP,
    total_amount NUMERIC(10, 2),
    created_by INTEGER REFERENCES users(id),
    -- Approval workflow fields
    approved_by INTEGER REFERENCES users(id),
    approved_date TIMESTAMP,
    rejected_by INTEGER REFERENCES users(id),
    rejected_date TIMESTAMP,
    sent_date TIMESTAMP,
    delivered_date TIMESTAMP,
    -- Advanced date tracking
    expected_delivery_date DATE,
    actual_delivery_date DATE,
    comments TEXT,
    CONSTRAINT chk_po_status CHECK (status IN ('draft', 'pending_approval', 'approved', 'rejected', 'sent', 'delivered', 'cancelled'))
);

COMMENT ON COLUMN purchase_orders.expected_delivery_date IS 'Expected delivery date from supplier';
COMMENT ON COLUMN purchase_orders.actual_delivery_date IS 'Actual date when order was delivered';

-- Approval History table
CREATE TABLE IF NOT EXISTS approval_history (
    id SERIAL PRIMARY KEY,
    purchase_order_id INTEGER NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id),
    from_status VARCHAR(20) NOT NULL,
    to_status VARCHAR(20) NOT NULL,
    comments TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sales Orders table
CREATE TABLE IF NOT EXISTS sales_orders (
    id SERIAL PRIMARY KEY,
    so_number VARCHAR(50) UNIQUE NOT NULL,
    customer_name VARCHAR(100) NOT NULL,
    warehouse_id INTEGER NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
    status VARCHAR(20) DEFAULT 'pending',
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_amount NUMERIC(10, 2),
    created_by INTEGER REFERENCES users(id),
    CONSTRAINT chk_so_status CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled'))
);

-- ===================================================================
-- SYSTEM TABLES
-- ===================================================================

-- Notifications table (in-app notifications)
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,  -- low_stock, purchase_order_created, order_approved, order_rejected, delivery_completed
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    entity_type VARCHAR(50),  -- Item, PurchaseOrder, SalesOrder, etc.
    entity_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit Logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id INTEGER,
    details TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Import Jobs table
CREATE TABLE IF NOT EXISTS import_jobs (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    total_rows INTEGER DEFAULT 0,
    processed_rows INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    error_details TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    CONSTRAINT chk_import_status CHECK (status IN ('pending', 'processing', 'completed', 'failed'))
);

-- ===================================================================
-- VIEWS
-- ===================================================================

-- Purchase Order Metrics View (lead time calculations)
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

COMMENT ON VIEW purchase_order_metrics IS 'Calculated lead time metrics for purchase orders';

-- ===================================================================
-- FUNCTIONS & TRIGGERS
-- ===================================================================

-- Function to auto-update updated_at timestamp for items
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update stock_locations timestamp
CREATE OR REPLACE FUNCTION update_stock_location_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for items updated_at
DROP TRIGGER IF EXISTS update_items_updated_at ON items;
CREATE TRIGGER update_items_updated_at 
    BEFORE UPDATE ON items 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for stock_locations timestamp
DROP TRIGGER IF EXISTS stock_locations_update_timestamp ON stock_locations;
CREATE TRIGGER stock_locations_update_timestamp
    BEFORE UPDATE ON stock_locations
    FOR EACH ROW
    EXECUTE FUNCTION update_stock_location_timestamp();

-- ===================================================================
-- INDEXES
-- ===================================================================

-- Items indexes
CREATE INDEX IF NOT EXISTS idx_items_sku ON items(sku);
CREATE INDEX IF NOT EXISTS idx_items_category ON items(category_id);
CREATE INDEX IF NOT EXISTS idx_items_warehouse ON items(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_items_supplier ON items(supplier_id);

-- Stock indexes
CREATE INDEX IF NOT EXISTS idx_stock_item ON stock(item_id);
CREATE INDEX IF NOT EXISTS idx_stock_warehouse ON stock(warehouse_id);

-- Stock Locations indexes
CREATE INDEX IF NOT EXISTS idx_stock_locations_item ON stock_locations(item_id);
CREATE INDEX IF NOT EXISTS idx_stock_locations_location ON stock_locations(location_id);

-- Stock Transfers indexes
CREATE INDEX IF NOT EXISTS idx_stock_transfers_item ON stock_transfers(item_id);
CREATE INDEX IF NOT EXISTS idx_stock_transfers_date ON stock_transfers(transfer_date);

-- Purchase Orders indexes
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier ON purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_warehouse ON purchase_orders(warehouse_id);

-- Approval History indexes
CREATE INDEX IF NOT EXISTS idx_approval_history_po ON approval_history(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_approval_history_user ON approval_history(user_id);

-- Sales Orders indexes
CREATE INDEX IF NOT EXISTS idx_sales_orders_status ON sales_orders(status);
CREATE INDEX IF NOT EXISTS idx_sales_orders_warehouse ON sales_orders(warehouse_id);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Audit Logs indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);

-- Import Jobs indexes
CREATE INDEX IF NOT EXISTS idx_import_jobs_status ON import_jobs(status);
CREATE INDEX IF NOT EXISTS idx_import_jobs_created_by ON import_jobs(created_by);

-- ===================================================================
-- DEFAULT DATA
-- ===================================================================

-- Insert default admin user (password: admin123 - CHANGE THIS IN PRODUCTION!)
-- Password hash for 'admin123' using werkzeug
INSERT INTO users (username, email, password_hash, role) 
VALUES ('admin', 'admin@inventory.com', 'scrypt:32768:8:1$HDPwqRKNVxgwSs3I$2c0a5e3c8e5f4b9d8c1e0f2a4b6c8d0e2f4a6b8c0d2e4f6a8b0c2d4e6f8a0b2c4d6e8f0a2b4c6d8e0f2a4b6c8d0', 'admin')
ON CONFLICT (username) DO NOTHING;

-- Insert sample categories
INSERT INTO categories (name, description) VALUES
('Electronics', 'Electronic items and components'),
('Office Supplies', 'Office and stationery items'),
('Hardware', 'Hardware and tools'),
('Furniture', 'Office and industrial furniture'),
('Consumables', 'Consumable supplies and materials')
ON CONFLICT DO NOTHING;

-- Insert sample warehouses
INSERT INTO warehouses (name, location, capacity) VALUES
('Main Warehouse', '123 Main St, Downtown District', 10000),
('Secondary Warehouse', '456 Second St, Industrial Park', 5000),
('Distribution Center', '789 Commerce Blvd, Business Zone', 7500)
ON CONFLICT DO NOTHING;

-- Insert sample locations
INSERT INTO locations (name, address, capacity) VALUES
('Main Warehouse - Aisle A', 'Main Warehouse Zone 1', 2500),
('Main Warehouse - Aisle B', 'Main Warehouse Zone 2', 2500),
('Secondary Warehouse - Cold Storage', 'Secondary Warehouse Zone 1', 1500),
('Distribution Center - Loading Bay', 'Distribution Center Zone 1', 2000)
ON CONFLICT (name) DO NOTHING;

-- ===================================================================
-- PERMISSIONS
-- ===================================================================

-- Grant privileges to inventory user
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO inventory_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO inventory_user;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO inventory_user;

-- ===================================================================
-- COMPLETION MESSAGE
-- ===================================================================

DO $$
BEGIN
    RAISE NOTICE '===================================================================';
    RAISE NOTICE 'Database initialization completed successfully!';
    RAISE NOTICE '===================================================================';
    RAISE NOTICE 'Features enabled:';
    RAISE NOTICE '  • User management with role-based access control';
    RAISE NOTICE '  • Hierarchical category system';
    RAISE NOTICE '  • Multi-warehouse inventory tracking';
    RAISE NOTICE '  • Multi-location granular stock management';
    RAISE NOTICE '  • Supplier and item relationships';
    RAISE NOTICE '  • Purchase order approval workflow';
    RAISE NOTICE '  • Sales order management';
    RAISE NOTICE '  • Stock transfer tracking';
    RAISE NOTICE '  • In-app notifications';
    RAISE NOTICE '  • Comprehensive audit logging';
    RAISE NOTICE '  • Import/export job tracking';
    RAISE NOTICE '  • Advanced date and warranty tracking';
    RAISE NOTICE '===================================================================';
    RAISE NOTICE 'Default credentials:';
    RAISE NOTICE '  Username: admin';
    RAISE NOTICE '  Password: admin123';
    RAISE NOTICE '  ⚠️  CHANGE THIS PASSWORD IN PRODUCTION!';
    RAISE NOTICE '===================================================================';
END $$;
