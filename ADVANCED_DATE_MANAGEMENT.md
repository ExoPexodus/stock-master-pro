# Advanced Date Management Feature

## Overview
The Advanced Date Management feature provides comprehensive date tracking across the inventory system, including order lifecycle tracking, lead time calculations, warranty/expiry monitoring, and visual timeline representation.

## Features

### 1. Order Timeline Visualization
- **Visual Timeline**: Interactive timeline showing order progression through all stages
- **Lead Time Metrics**: Calculated metrics for approval, sending, delivery, and total lead times
- **Delivery Performance**: Compare expected vs actual delivery dates with variance analysis
- **Status Indicators**: Color-coded icons showing completion status of each stage

### 2. Date Tracking for Purchase Orders
- **Order Date**: When the order was created
- **Approved Date**: When the order was approved
- **Sent Date**: When the order was sent to vendor
- **Delivered Date**: When the order was received
- **Expected Delivery Date**: Supplier's estimated delivery date
- **Actual Delivery Date**: Actual date the order arrived

### 3. Date Tracking for Items
- **Created At**: When the item was added to the system
- **Updated At**: Last modification timestamp (auto-updated)
- **Warranty Months**: Warranty duration for items
- **Expiry Date**: For perishable/time-sensitive items

### 4. Lead Time Analytics
- **Approval Lead Time**: Days between order creation and approval
- **Send Lead Time**: Days between approval and sending to vendor
- **Delivery Lead Time**: Days between sending and receiving
- **Total Lead Time**: Days from order creation to delivery
- **Delivery Variance**: Difference between expected and actual delivery (positive = late, negative = early)

## Database Schema

### New Columns Added

#### Items Table
```sql
warranty_months INTEGER         -- Warranty duration in months
expiry_date DATE               -- Expiration date for perishable items
updated_at TIMESTAMP           -- Auto-updated on modifications
```

#### Purchase Orders Table
```sql
expected_delivery_date DATE    -- Expected delivery date from supplier
actual_delivery_date DATE      -- Actual date when order was delivered
```

### Database View: purchase_order_metrics
A view that automatically calculates lead time metrics:
- `approval_lead_time_days`
- `send_lead_time_days`
- `delivery_lead_time_days`
- `total_lead_time_days`
- `delivery_variance_days`

### Auto-Update Trigger
Trigger `update_items_updated_at` automatically updates the `updated_at` column whenever an item record is modified.

## Backend Implementation

### Updated Models

#### Item Model (`backend/app/models.py`)
- Added `warranty_months` field
- Added `expiry_date` field
- Returns warranty and expiry information in `to_dict()`

#### PurchaseOrder Model (`backend/app/models.py`)
- Added `expected_delivery_date` field
- Added `actual_delivery_date` field
- Added `calculate_lead_times()` method
- Enhanced `to_dict()` to include lead time metrics
- Added user relationships for created_by, approved_by, rejected_by

### Lead Time Calculation
The `calculate_lead_times()` method in PurchaseOrder model:
- Calculates time differences between key order milestones
- Returns metrics object with all lead times
- Handles null dates gracefully
- Included automatically in API responses

## Frontend Components

### OrderTimelineModal Component
**Location**: `src/components/orders/OrderTimelineModal.tsx`

Features:
- **Statistics Cards**: Show lead time metrics at a glance
- **Delivery Performance Card**: Compare expected vs actual delivery
- **Visual Timeline**: Step-by-step progression with icons
- **Status Indicators**: Checkmarks, circles, and X marks for each stage
- **Date Formatting**: Human-readable date and time display
- **Responsive Design**: Works on all screen sizes

Timeline Stages:
1. Order Created (Package icon)
2. Pending Approval (Clock icon)
3. Order Approved/Rejected (CheckCircle/XCircle icon)
4. Sent to Vendor (Send icon)
5. Delivered (Truck icon)

### Updated Orders Page
**Location**: `src/pages/Orders.tsx`

Enhancements:
- Added "View Timeline" button (Calendar icon) for each purchase order
- Added expected delivery date field to order creation form
- Integrated OrderTimelineModal component
- Timeline accessible from order table actions

## User Interface

### Timeline Modal Sections

1. **Lead Time Summary**
   - 4 metric cards showing approval, send, delivery, and total lead times
   - Values displayed in days
   - Shows "-" if metric not yet available

2. **Delivery Performance** (conditional)
   - Shows expected delivery date
   - Shows actual delivery date
   - Variance badge (green if early/on-time, red if late)

3. **Order Lifecycle Timeline**
   - Vertical timeline with connecting lines
   - Icon for each stage
   - Date and time for completed stages
   - Lead time badges showing days between stages
   - Color-coded status indicators

### Visual Status Indicators
- ✓ Completed (green circle with icon)
- ● In Progress (yellow circle with icon)
- ✗ Rejected (red circle with icon)
- ○ Pending (gray circle with icon)

## User Roles & Permissions

### All Users (admin, manager, viewer)
- View order timelines
- View lead time metrics
- View delivery performance

### Admin & Manager
- Set expected delivery dates when creating orders
- Update actual delivery dates

## Benefits

1. **Performance Tracking**: Monitor supplier lead times and delivery reliability
2. **Process Optimization**: Identify bottlenecks in approval and delivery processes
3. **Accurate Planning**: Use historical lead times for better inventory planning
4. **Vendor Management**: Track supplier performance on delivery commitments
5. **Transparency**: Complete visibility into order lifecycle
6. **Decision Support**: Data-driven insights for purchasing decisions

## Usage

### Viewing Order Timeline
1. Navigate to **Orders** page
2. Click the **calendar icon** (📅) next to any purchase order
3. View complete timeline with metrics
4. See delivery performance and variance

### Creating Orders with Expected Delivery
1. Click "Add Purchase Order"
2. Fill in order details
3. Set **Expected Delivery Date** based on supplier information
4. Submit order

### Tracking Item Warranties & Expiry
- Set `warranty_months` when adding items with warranties
- Set `expiry_date` for perishable or time-sensitive items
- System automatically tracks `created_at` and `updated_at`

## Technical Implementation

### Database Migration
**File**: `db-init/add_advanced_dates.sql`

Run migration:
```bash
docker-compose exec db psql -U inventory_user -d inventory_db -f /docker-entrypoint-initdb.d/add_advanced_dates.sql
```

### Lead Time Calculation Logic
- Uses Python's `datetime` module for date arithmetic
- Converts datetime to date for day calculations
- Handles timezone-aware timestamps
- Returns None for incomplete metrics

### Auto-Update Mechanism
PostgreSQL trigger automatically updates `updated_at`:
```sql
CREATE TRIGGER update_items_updated_at 
    BEFORE UPDATE ON items 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
```

## Data Flow

1. **Order Creation**: User sets expected_delivery_date
2. **Approval**: System records approved_date
3. **Sending**: System records sent_date
4. **Delivery**: System records delivered_date and actual_delivery_date
5. **Calculation**: Backend calculates lead times on-the-fly
6. **Display**: Frontend shows timeline with all metrics

## Future Enhancements

Potential additions:
- Average lead time by supplier
- Lead time trend charts
- Automated alerts for overdue deliveries
- Predictive lead time estimations
- Warranty expiration notifications
- Expiry date alerts for perishable items

## Next Steps

This completes the Advanced Date Management feature. Next feature to implement:
- Audit Log Enhancements (advanced filtering and export capabilities)
