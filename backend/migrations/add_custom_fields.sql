-- Migration: Add custom fields support to items
-- This migration adds JSON-based custom data to items and creates a custom fields configuration table

-- Add custom_data column to items table
ALTER TABLE items ADD COLUMN IF NOT EXISTS custom_data JSONB DEFAULT '{}';

-- Create custom_fields table
CREATE TABLE IF NOT EXISTS custom_fields (
    id SERIAL PRIMARY KEY,
    field_key VARCHAR(100) UNIQUE NOT NULL,
    field_label VARCHAR(200) NOT NULL,
    field_type VARCHAR(50) DEFAULT 'text',
    field_group VARCHAR(100),
    visible_in_form BOOLEAN DEFAULT TRUE,
    visible_in_table BOOLEAN DEFAULT FALSE,
    default_value VARCHAR(255),
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on field_key for faster lookups
CREATE INDEX IF NOT EXISTS idx_custom_fields_field_key ON custom_fields(field_key);
CREATE INDEX IF NOT EXISTS idx_custom_fields_sort_order ON custom_fields(sort_order);

-- Grant permissions to inventory_user
GRANT ALL PRIVILEGES ON TABLE custom_fields TO inventory_user;
GRANT USAGE, SELECT ON SEQUENCE custom_fields_id_seq TO inventory_user;

COMMENT ON TABLE custom_fields IS 'Configuration for user-defined custom fields in items';
COMMENT ON COLUMN items.custom_data IS 'JSON storage for custom field values';
