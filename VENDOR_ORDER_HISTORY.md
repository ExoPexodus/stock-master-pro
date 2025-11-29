# Vendor Order History Feature

## Overview
The Vendor Order History feature provides comprehensive order tracking and analytics for each supplier, including detailed purchase order history, statistics, and CSV export capabilities.

## Features

### 1. Order History View
- **Two-level View**: Supplier list → Detailed order history modal
- **Statistics Dashboard**: Shows total orders, total amount, pending orders, and completed orders
- **Complete Order Details**: PO number, dates, status, warehouse, amounts, and delivery information

### 2. Data Export
- **CSV Export**: Download complete order history for any supplier
- **Formatted Filename**: Includes supplier name and export date
- **Comprehensive Data**: All order fields including dates, approvals, and comments

### 3. User Interface
- **Modal Dialog**: Clean, organized view with statistics cards and order table
- **Status Badges**: Visual indicators for order status
- **Responsive Design**: Works on all screen sizes
- **Real-time Data**: Always shows current order information

## Backend Implementation

### New API Endpoints

#### Get Supplier Orders
```
GET /api/suppliers/<supplier_id>/orders
```
Returns:
- Supplier information
- List of all purchase orders
- Order statistics (total orders, total amount, pending, completed)

#### Export Supplier Orders
```
GET /api/suppliers/<supplier_id>/orders/export
```
Downloads a CSV file with complete order history including:
- PO Number
- Order Date
- Status
- Total Amount
- Warehouse
- Requested By
- Approved By
- Approval Date
- Sent Date
- Delivered Date
- Comments

### Database Schema
Uses existing `purchase_orders` table with:
- `supplier_id` foreign key
- Status tracking fields
- Date tracking (order_date, approved_date, sent_date, delivered_date)
- User references (requested_by, approved_by)

## Frontend Components

### SupplierOrdersModal Component
**Location**: `src/components/suppliers/SupplierOrdersModal.tsx`

Features:
- Statistics cards showing order metrics
- Full order table with sorting by date
- CSV export button
- Loading and empty states
- Status badges with color coding

### Updated Suppliers Page
**Location**: `src/pages/Suppliers.tsx`

Enhancements:
- "View Orders" button for each supplier
- Integrates SupplierOrdersModal component
- Available to all user roles

## User Roles & Permissions

### All Users (admin, manager, viewer)
- View supplier order history
- Export order data to CSV
- View order statistics

## Usage

### Viewing Order History
1. Navigate to **Suppliers** page
2. Click the **file icon** (📄) next to any supplier
3. View order statistics and complete order list
4. Click **Export to CSV** to download order history

### Exported CSV Contains
- All order details
- Status information
- Date tracking
- User information
- Comments and notes

## Technical Details

### Backend (Flask)
- **File**: `backend/app/routes/suppliers.py`
- **Dependencies**: csv, io, datetime
- **Authentication**: JWT required for all endpoints

### Frontend (React)
- **Main Component**: `src/components/suppliers/SupplierOrdersModal.tsx`
- **Updated Page**: `src/pages/Suppliers.tsx`
- **API Client**: `src/lib/api.ts` (suppliersApi.getOrders, suppliersApi.exportOrders)
- **Dependencies**: react-query for data fetching, date-fns for date formatting

### Data Flow
1. User clicks "View Orders" icon
2. Frontend requests order data via API
3. Backend queries purchase_orders table filtered by supplier_id
4. Calculates statistics on the fly
5. Returns formatted data to frontend
6. Modal displays statistics and order table
7. Export downloads pre-formatted CSV file

## Statistics Calculated

1. **Total Orders**: Count of all orders for the supplier
2. **Total Amount**: Sum of all order amounts
3. **Pending Orders**: Count of orders with status 'draft' or 'pending_approval'
4. **Completed Orders**: Count of orders with status 'delivered'

## Benefits

- **Supplier Performance Analysis**: Track order volume and value per supplier
- **Historical Reference**: Complete audit trail of all orders
- **Easy Reporting**: One-click CSV export for external analysis
- **Decision Support**: Statistics help evaluate supplier relationships
- **Transparency**: All users can view order history

## Next Steps

This completes the Vendor Order History feature. Next features to implement:
1. Advanced Date Management (created, updated, ordered, approved, delivered dates with timeline UI)
2. Audit Log Enhancements (advanced filtering and export)
3. Low Stock Alerts (automated notifications)
