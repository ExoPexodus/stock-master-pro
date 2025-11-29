# Warehouse & Inventory Integration Update

## Overview
This update merges the Locations and Warehouses functionality into a unified system, and adds direct warehouse/supplier relationships to inventory items.

## Database Changes

### New Columns in `items` Table
- `warehouse_id` - Links items directly to their primary warehouse location
- `supplier_id` - Links items directly to their primary supplier

### Migration Required
Run the following command to apply the database changes:

```bash
docker-compose exec db psql -U inventory_user -d inventory_db -f /docker-entrypoint-initdb.d/add_item_relationships.sql
```

Or restart the backend:
```bash
docker-compose restart backend
```

## Changes Summary

### Backend Changes
1. **Models** (`backend/app/models.py`)
   - Added `warehouse_id` and `supplier_id` columns to `Item` model
   - Added relationships: `warehouse` and `supplier` to Item model
   - Updated `to_dict()` method to include warehouse and supplier data

2. **API Routes** (`backend/app/routes/items.py`)
   - Create and update endpoints now accept `warehouse_id` and `supplier_id`
   - Item responses now include full warehouse and supplier objects

3. **Warehouse Routes** (`backend/app/routes/warehouses.py`)
   - Existing stock viewing functionality maintained

### Frontend Changes
1. **Items Page** (`src/pages/Items.tsx`)
   - Added warehouse and supplier select dropdowns in item form
   - Table now displays warehouse and supplier columns
   - Form uses controlled components for better state management

2. **Warehouses Page** (`src/pages/Warehouses.tsx`)
   - Merged location functionality into warehouses
   - Added "View Stock" button to see items in each warehouse
   - Stock dialog shows all items stored in a warehouse with quantities

3. **Navigation**
   - Removed separate "Locations" menu item
   - All location/stock management now under "Warehouses"

4. **Types** (`src/types/index.ts`)
   - Updated `Item` interface to include warehouse and supplier relationships

5. **Bug Fixes**
   - Fixed Select component error in Categories page (empty string value)

## Benefits
1. **Simplified Navigation** - One place to manage warehouses and view stock
2. **Direct Relationships** - Items now have clear warehouse and supplier associations
3. **Better Data Model** - More intuitive relationships between entities
4. **Unified UI** - Consistent experience for location/warehouse management

## Usage

### Creating an Item
When creating or editing an item, you can now:
- Select a warehouse (primary location for the item)
- Select a supplier (primary supplier for the item)
- These are optional but recommended for better tracking

### Viewing Warehouse Stock
1. Go to Warehouses page
2. Click "View Stock" button on any warehouse
3. See all items stored in that warehouse with quantities

### Migration Notes
- Existing items will have NULL warehouse_id and supplier_id initially
- Update items as needed to assign warehouses and suppliers
- The system will still work with NULL values (showing "-" in the UI)
