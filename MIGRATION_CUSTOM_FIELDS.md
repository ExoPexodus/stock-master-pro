# Custom Fields Migration Guide

This guide explains how to add custom field support to your inventory management system.

## What's New

The system now supports user-defined custom fields stored in a JSON structure:

- **JSON-based storage**: All custom fields are stored in an `items.custom_data` JSON column
- **Field Manager**: UI to create, edit, and configure custom fields
- **Dynamic forms**: Add/Edit forms automatically render custom fields
- **Dynamic tables**: Table views show custom columns based on visibility settings
- **Smart imports**: CSV/Excel imports automatically detect unknown columns and create custom fields
- **Smart exports**: Exports include all custom fields (flattened from JSON)

## Database Migration

### Step 1: Run the Migration Script

Execute the migration SQL script to add the necessary database structures:

```bash
# Connect to your PostgreSQL database
psql -U inventory_user -d inventory_db -f backend/migrations/add_custom_fields.sql
```

Or using Docker:

```bash
docker exec -i inventory-db psql -U inventory_user -d inventory_db < backend/migrations/add_custom_fields.sql
```

### Step 2: Rebuild Backend Container

After running the migration, rebuild the backend to load the new models:

```bash
docker-compose down backend
docker-compose up -d --build backend
```

## Features

### 1. Field Manager

Navigate to **Field Manager** (available for admin/manager roles) to:

- Create new custom fields with labels, types, and groups
- Set field visibility in forms and tables
- Define default values
- Organize fields into groups (e.g., "Specifications", "Packaging")

### 2. Dynamic Forms

When adding or editing items:

- Core fields (SKU, Name, Description, Price, Reorder Level) are always shown
- Custom fields marked as "visible_in_form" are rendered dynamically
- Fields are grouped by their configured group
- Supports text, number, date, and boolean field types

### 3. Dynamic Table Views

The Items table automatically shows:

- All core columns
- Custom field columns marked as "visible_in_table"
- Values are displayed from the `custom_data` JSON field

### 4. Smart CSV/Excel Imports

When importing data:

1. The system identifies columns not matching core fields
2. Automatically creates new custom fields for unknown columns
3. Stores values in the item's `custom_data` JSON
4. New fields are hidden by default (can be enabled in Field Manager)
5. Grouped under "Imported Fields"

**Example CSV:**
```csv
sku,name,unit_price,weight,color,manufacturer
ITEM001,Widget A,29.99,500g,Red,ACME Corp
ITEM002,Widget B,39.99,750g,Blue,XYZ Ltd
```

Result: `weight`, `color`, and `manufacturer` become custom fields automatically.

### 5. Smart Exports

Excel exports include:

- All core item fields
- All custom fields (flattened from JSON into separate columns)
- Preserves structure for re-import

## API Changes

### Items API

**Create/Update Item:**
```json
{
  "sku": "ITEM001",
  "name": "Product Name",
  "unit_price": 29.99,
  "custom_data": {
    "weight": "500g",
    "color": "Red",
    "manufacturer": "ACME Corp"
  }
}
```

**Response:**
```json
{
  "id": 1,
  "sku": "ITEM001",
  "name": "Product Name",
  "unit_price": 29.99,
  "custom_data": {
    "weight": "500g",
    "color": "Red",
    "manufacturer": "ACME Corp"
  }
}
```

### Custom Fields API

**Endpoints:**
- `GET /api/custom-fields` - List all custom fields
- `POST /api/custom-fields` - Create a new field
- `PUT /api/custom-fields/:id` - Update a field
- `DELETE /api/custom-fields/:id` - Delete a field
- `POST /api/custom-fields/bulk-update` - Bulk update visibility/order

## Migration Checklist

- [ ] Backup database
- [ ] Run migration SQL script
- [ ] Rebuild backend container
- [ ] Test Field Manager access
- [ ] Create sample custom fields
- [ ] Test item creation with custom fields
- [ ] Test CSV import with unknown columns
- [ ] Test Excel export
- [ ] Verify custom fields display in table

## Rollback

If you need to rollback:

```sql
-- Remove custom fields table
DROP TABLE IF EXISTS custom_fields;

-- Remove custom_data column from items
ALTER TABLE items DROP COLUMN IF EXISTS custom_data;
```

## Best Practices

1. **Field Keys**: Use snake_case for field keys (e.g., `product_weight`, not `Product Weight`)
2. **Groups**: Organize related fields into groups for better UX
3. **Visibility**: Start with fields hidden in tables to avoid clutter
4. **Default Values**: Set sensible defaults for common fields
5. **Imports**: Review auto-created fields after first import and configure visibility

## Support

For issues or questions about custom fields:

1. Check audit logs for field configuration changes
2. Verify custom_data JSON structure in database
3. Check backend logs for import processing errors
4. Ensure proper role permissions (admin/manager for field management)
