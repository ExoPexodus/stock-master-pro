# Purchase Order Approval Workflow

## Overview
Complete 6-state approval workflow for purchase orders with email notifications and approval history tracking.

## Workflow States

1. **Draft** - Initial state when PO is created
2. **Pending Approval** - Submitted for admin review
3. **Approved** - Admin approved the PO
4. **Rejected** - Admin rejected the PO (can return to draft)
5. **Sent to Vendor** - PO sent to supplier
6. **Delivered** - Order received and completed

## State Transitions

### Draft → Pending Approval
- **Who**: Admin, Manager
- **Action**: Submit for Approval
- **Email**: Sent to all admins with approval request

### Pending Approval → Approved
- **Who**: Admin only
- **Action**: Approve
- **Email**: Sent to requester with approval confirmation

### Pending Approval → Rejected
- **Who**: Admin only
- **Action**: Reject
- **Email**: Sent to requester with rejection reason

### Approved → Sent to Vendor
- **Who**: Admin, Manager
- **Action**: Send to Vendor
- **Email**: Sent to supplier with PO details

### Sent to Vendor → Delivered
- **Who**: Admin, Manager
- **Action**: Mark Delivered
- **Email**: None

### Rejected → Draft
- **Who**: Admin, Manager
- **Action**: Resubmit (automatic when editing)

## Features

### Approval History
- Every state change is recorded
- Includes: timestamp, user, from/to status, comments
- Viewable via History button on each PO

### Email Templates
Three email templates are configured:
1. **Approval Request** - To admins when PO submitted
2. **Approval Granted** - To requester when approved
3. **Approval Rejected** - To requester when rejected
4. **Order Sent** - To supplier when sent

### Role-Based Permissions
- **Admin**: Full approval authority (approve/reject)
- **Manager**: Can create, submit, send, deliver
- **Viewer**: Read-only access

## Database Changes

### Purchase Orders Table
New columns:
- `approved_by` - User ID who approved
- `approved_date` - When approved
- `rejected_by` - User ID who rejected
- `rejected_date` - When rejected
- `sent_date` - When sent to vendor
- `delivered_date` - When delivered
- `comments` - Latest comments

### New Table: approval_history
Tracks all state transitions:
- `purchase_order_id`
- `user_id`
- `from_status`
- `to_status`
- `comments`
- `timestamp`

## Setup Instructions

### 1. Run Database Migration
```bash
docker-compose exec db psql -U inventory_user -d inventory_db -f /docker-entrypoint-initdb.d/add_approval_workflow.sql
```

### 2. Configure SMTP (for emails)
Add to backend/.env:
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_EMAIL=your-email@gmail.com
```

For Gmail:
1. Enable 2FA on your Google account
2. Generate an App Password
3. Use the App Password in SMTP_PASSWORD

### 3. Rebuild Backend
```bash
docker-compose up -d --build backend
```

## Usage

### Creating a Purchase Order
1. Navigate to Orders page
2. Click "New PO" (Admin/Manager only)
3. Fill in details
4. PO is created in "Draft" status

### Submitting for Approval
1. Click Actions on a draft PO
2. Select "Submit for Approval"
3. Add optional comments
4. PO moves to "Pending Approval"
5. All admins receive email notification

### Approving/Rejecting
1. Admin clicks Actions on pending PO
2. Select "Approve" or "Reject"
3. Add comments (required for rejection)
4. Requester receives email notification

### Sending to Vendor
1. Click Actions on approved PO
2. Select "Send to Vendor"
3. Supplier receives email with PO details

### Marking Delivered
1. Click Actions on sent PO
2. Select "Mark Delivered"
3. PO marked as complete

### Viewing History
- Click History icon on any PO
- See complete timeline of all changes
- Includes user, timestamps, comments

## API Endpoints

### POST /api/approvals/purchase-order/:id/submit
Submit PO for approval

### POST /api/approvals/purchase-order/:id/approve
Approve PO (admin only)

### POST /api/approvals/purchase-order/:id/reject
Reject PO (admin only)

### POST /api/approvals/purchase-order/:id/send
Send PO to vendor

### POST /api/approvals/purchase-order/:id/deliver
Mark PO as delivered

### GET /api/approvals/purchase-order/:id/history
Get approval history

## Email Configuration Tips

### Gmail
- Use App Passwords (not your regular password)
- Enable "Less secure app access" if needed
- Port 587 with STARTTLS

### Office 365
```
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
```

### Custom SMTP
Configure your organization's SMTP server details
