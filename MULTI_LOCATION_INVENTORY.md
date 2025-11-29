# Multi-Location Inventory System

This feature implements comprehensive multi-location stock tracking capabilities with location filtering, transfers, and detailed reporting.

## Features Implemented

### 1. Location Management
- **CRUD Operations**: Create, read, update locations
- **Location Properties**: Name, address, capacity, active status
- **Location Cards**: Visual display of all locations with stock summaries

### 2. Stock Tracking Per Location
- **Stock Locations Table**: Tracks item quantities at each location
- **Per-Location Thresholds**: Min/max quantity thresholds per location
- **Real-time Updates**: Stock levels update immediately after transfers
- **Last Updated Tracking**: Timestamp and user tracking for all stock changes

### 3. Stock Filtering & Search
- **Item Search**: Search by item name or SKU
- **Quantity Range Filters**: Filter by min/max quantity
- **Location-Specific Views**: View all stock at a specific location
- **Item-Location Matrix**: View stock levels across all locations for an item

### 4. Stock Transfer System
- **Inter-Location Transfers**: Move stock between locations
- **Transfer Validation**: Checks for sufficient stock before transfer
- **Transfer History**: Complete audit trail of all transfers
- **Transfer Notes**: Add comments/reasons for transfers
- **External Receipts**: Support for receiving stock from external sources (no from_location)

### 5. Export & Reporting
- **CSV Export**: Export location stock data to CSV
- **Transfer Reports**: View and export transfer history
- **Location Summaries**: See total items and quantities per location

## Database Schema

### Tables Added

#### `locations`
```sql
- id: Primary key
- name: Unique location name
- address: Physical address
- capacity: Maximum capacity
- is_active: Active status flag
- created_at, updated_at: Timestamps
```

#### `stock_locations`
```sql
- id: Primary key
- item_id: Foreign key to items
- location_id: Foreign key to locations
- quantity: Current stock quantity
- min_threshold: Minimum quantity alert level
- max_threshold: Maximum quantity (optional)
- last_updated: Last modification timestamp
- updated_by: User who last updated
- UNIQUE(item_id, location_id): One record per item-location pair
```

#### `stock_transfers`
```sql
- id: Primary key
- item_id: Item being transferred
- from_location_id: Source location (NULL for external receipts)
- to_location_id: Destination location
- quantity: Amount transferred
- transfer_date: When transfer occurred
- transferred_by: User who performed transfer
- notes: Transfer comments/reason
- status: Transfer status (default: 'completed')
```

## API Endpoints

### Location Management
- `GET /api/locations` - List all active locations
- `GET /api/locations/:id` - Get location with stock summary
- `POST /api/locations` - Create new location (admin/manager)
- `PUT /api/locations/:id` - Update location (admin/manager)

### Stock Management
- `GET /api/locations/:id/stock` - Get all stock at a location (with filters)
- `GET /api/locations/stock/:item_id` - Get stock levels across all locations for an item
- `POST /api/locations/stock` - Set/update stock at a location (admin/manager)

### Transfers
- `POST /api/locations/transfer` - Transfer stock between locations (admin/manager)
- `GET /api/locations/transfers` - Get transfer history (with filters)

## Frontend Pages

### `/locations`
- Grid view of all locations
- Create new location (admin/manager)
- Quick navigation to location details
- Location capacity and stock summary cards

### `/locations/:id`
- Detailed stock table for specific location
- Search and filter controls
- Transfer stock UI with modal dialog
- CSV export functionality
- Pagination for large stock lists

## Usage Guide

### Creating a Location
1. Navigate to "Locations" in the sidebar
2. Click "Add Location" button
3. Enter location name (required), address, and capacity
4. Click "Create Location"

### Viewing Location Stock
1. From Locations page, click on a location card
2. Use search and filters to find items
3. View quantities, thresholds, and last update times
4. Export data using "Export CSV" button

### Transferring Stock
1. Navigate to location details page
2. Find the item to transfer
3. Click the transfer icon button
4. Select destination location
5. Enter quantity (validated against available stock)
6. Add optional notes
7. Click "Transfer" to execute

### Receiving External Stock
- Use the stock management API to add stock from external sources
- Leave `from_location_id` null to indicate external receipt
- System will create transfer record showing external source

## Permissions

### Admin & Manager
- Full access to all location features
- Can create, update locations
- Can set stock levels
- Can transfer stock
- Can view transfer history

### Viewer
- Can view locations
- Can view stock levels
- Cannot modify locations or stock
- Cannot perform transfers

## Implementation Notes

### Stock Validation
- All transfers validate source has sufficient quantity
- Negative quantities not allowed
- Stock decrements/increments are atomic operations

### Audit Trail
- All stock changes logged to audit_logs table
- Transfer history maintains complete record
- User tracking on all modifications

### Performance
- Indexes on item_id and location_id for fast queries
- Pagination support for large datasets
- Efficient filtering with SQL-level predicates

## Setup Instructions

1. **Run Database Migration**
   ```bash
   docker-compose exec db psql -U inventory_user -d inventory_db -f /docker-entrypoint-initdb.d/add_multi_location.sql
   ```

2. **Rebuild Backend**
   ```bash
   docker-compose up -d --build backend
   ```

3. **Verify Setup**
   - Login to the application
   - Navigate to "Locations" in sidebar
   - You should see 3 default locations (Main Warehouse, East Branch, West Branch)

## Next Steps

After implementing Multi-Location Inventory, the remaining features to implement are:
1. Vendor Order History (two-level vendor view)
2. Date Management Enhancements (advanced date tracking)
3. Audit Log Enhancements (advanced filtering)
