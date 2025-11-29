# Audit Log Enhancements

## Overview
Enhanced audit logging system with advanced filtering capabilities and CSV export functionality to track and analyze all system activities.

## Features

### 1. Advanced Filtering
Filter audit logs by multiple criteria:
- **User ID**: Filter by specific user
- **Action**: Filter by action type (CREATE, UPDATE, DELETE, LOGIN, LOGOUT)
- **Entity Type**: Filter by entity (Item, PurchaseOrder, Supplier, Category, Warehouse, Location)
- **Entity ID**: Filter by specific entity identifier
- **Date Range**: Filter by start and end dates

### 2. CSV Export
Export filtered audit logs to CSV format for:
- Compliance reporting
- External analysis
- Long-term archival
- Data sharing with stakeholders

### 3. Enhanced User Information
Each audit log entry now displays:
- Username
- User email address
- User ID

### 4. Filter Management
- Toggle filter visibility
- Clear all filters with one click
- Real-time result count
- Persistent filtering across pagination

## Technical Implementation

### Backend Changes

#### Updated `backend/app/routes/reports.py`:
- Added filtering parameters to `/api/reports/audit-logs` endpoint
  - `user_id`: Filter by user
  - `action`: Filter by action type
  - `entity_type`: Filter by entity type
  - `entity_id`: Filter by entity ID
  - `start_date`: Filter by start date (ISO format)
  - `end_date`: Filter by end date (ISO format)
- Added `/api/reports/audit-logs/export` endpoint for CSV export
- Enhanced audit logs with user information (username, email)
- Implemented dynamic query building based on active filters

#### Dependencies:
- `csv`: For CSV generation
- `io`: For in-memory file handling
- `datetime`: For timestamp parsing

### Frontend Changes

#### Updated `src/pages/AuditLogs.tsx`:
- Added filter controls UI
  - User ID input
  - Action dropdown
  - Entity Type dropdown
  - Entity ID input
  - Date range pickers (start and end date)
- Added "Show/Hide Filters" toggle button
- Added "Export CSV" button
- Implemented filter state management
- Added "Clear All Filters" functionality
- Enhanced user display with username and email
- Real-time filter count in description

#### Updated `src/lib/api.ts`:
- Extended `reportsApi.getAuditLogs()` to accept filter parameters
- Added `reportsApi.exportAuditLogs()` method for CSV export

## Database Schema

Uses existing `audit_logs` table with columns:
- `id`: Primary key
- `user_id`: Foreign key to users table
- `action`: Action type (CREATE, UPDATE, DELETE, LOGIN, LOGOUT)
- `entity_type`: Type of entity affected
- `entity_id`: ID of entity affected
- `details`: Additional details about the action
- `timestamp`: When the action occurred

## Usage

### Viewing Audit Logs
1. Navigate to the Audit Logs page
2. View paginated list of all system activities
3. Each entry shows timestamp, user information, action, entity type/ID, and details

### Filtering Logs
1. Click "Show Filters" button
2. Select desired filter criteria:
   - Enter User ID to see specific user's activities
   - Select Action type to filter by operation
   - Select Entity Type to focus on specific resources
   - Enter Entity ID to track specific record changes
   - Set date range to analyze specific time periods
3. Filters apply automatically on change
4. Use "Clear All" to reset filters

### Exporting Data
1. Apply desired filters (optional)
2. Click "Export CSV" button
3. CSV file downloads with filtered results
4. Filename includes timestamp: `audit_logs_YYYYMMDD_HHMMSS.csv`

## CSV Export Format

Exported CSV includes the following columns:
- ID
- Timestamp (ISO format)
- User ID
- Username
- User Email
- Action
- Entity Type
- Entity ID
- Details

## Security & Permissions

- All endpoints require JWT authentication (`@jwt_required()`)
- Only authenticated users can view audit logs
- Export functionality respects the same authentication requirements
- Sensitive user information (passwords, tokens) is never logged

## Performance Considerations

- Pagination limits results per page (default: 20, max: 50)
- Filters use database indexes for efficient querying
- Export generates CSV in-memory for fast downloads
- Large exports may take time based on result count

## Future Enhancements

Potential improvements:
- Excel export format (.xlsx)
- Real-time log streaming with WebSockets
- Scheduled export reports via email
- Advanced search with text matching in details
- Visual analytics and charts
- Audit log retention policies
- Automated compliance reports
