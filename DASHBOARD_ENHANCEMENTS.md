# Dashboard Enhancements - Implementation Guide

## Overview
This document describes the dashboard enhancements including clickable cards with modals, low stock alerts, and an in-app notifications panel.

## Features Implemented

### 1. Clickable Dashboard Cards
Dashboard cards now open detailed modal windows when clicked:

- **Total Items Card**: Opens a modal showing all items with search, pagination, and CSV export
- **Low Stock Items Card**: Opens a modal showing items below reorder level with status badges and export

### 2. Notifications Panel
A comprehensive in-app notification system with:

- Bell icon in header with unread count badge
- Dropdown panel showing recent notifications
- Notification types:
  - Low stock alerts (orange, AlertTriangle icon)
  - Purchase order created (blue, Package icon)
  - Order approved (green, CheckCircle icon)
  - Order rejected (red, XCircle icon)
  - Delivery completed (purple, TruckIcon icon)
- Mark individual notifications as read
- Mark all as read button
- Auto-refresh every 30 seconds
- Relative timestamps (e.g., "2m ago", "5h ago")

### 3. Low Stock Alert System (Foundation)
- Backend endpoint `/reports/low-stock` provides low stock items
- Stock level badges (Out of Stock, Critical, Low, Normal)
- Ready for email notification integration

## Database Setup

### Run the migration:
```bash
# From the project root
docker-compose exec db psql -U inventory_user -d inventory_db -f /docker-entrypoint-initdb.d/add_notifications.sql
```

### Or manually execute:
```sql
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    entity_type VARCHAR(50),
    entity_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
```

## Backend Changes

### New Files
- `backend/app/routes/notifications.py` - Notification API endpoints
- `backend/app/models.py` - Added `Notification` model

### Modified Files
- `backend/app/__init__.py` - Registered notifications blueprint

### API Endpoints
- `GET /api/notifications` - Get recent notifications
- `POST /api/notifications/<id>/read` - Mark notification as read
- `POST /api/notifications/read-all` - Mark all as read
- `GET /api/notifications/unread-count` - Get unread count

### Helper Function
Use `create_notification()` in `backend/app/routes/notifications.py` to create notifications:

```python
from app.routes.notifications import create_notification

create_notification(
    user_id=user_id,
    notification_type='low_stock',
    title='Low Stock Alert',
    message=f'Item {item.name} is running low',
    entity_type='Item',
    entity_id=item.id
)
```

## Frontend Changes

### New Components
- `src/components/NotificationsPanel.tsx` - Notifications dropdown
- `src/components/dashboard/ItemsModal.tsx` - All items modal
- `src/components/dashboard/LowStockModal.tsx` - Low stock items modal

### Modified Files
- `src/components/Layout.tsx` - Added notifications panel to header
- `src/pages/Dashboard.tsx` - Added click handlers and modals

## Next Steps (For Future Enhancements)

### Email Notifications
To implement email notifications for low stock alerts:

1. **Configure SMTP in backend**:
```python
# backend/app/config.py
SMTP_SERVER = os.getenv('SMTP_SERVER')
SMTP_PORT = int(os.getenv('SMTP_PORT', 587))
SMTP_USERNAME = os.getenv('SMTP_USERNAME')
SMTP_PASSWORD = os.getenv('SMTP_PASSWORD')
SMTP_FROM_EMAIL = os.getenv('SMTP_FROM_EMAIL')
```

2. **Create email template**:
```python
# backend/app/utils/email.py
def send_low_stock_alert(item, user_email):
    subject = f"Low Stock Alert: {item.name}"
    body = f"""
    Item: {item.name}
    SKU: {item.sku}
    Current Stock: {current_stock}
    Reorder Level: {item.reorder_level}
    """
    # Send email using smtplib
```

3. **Add scheduled task** (using Celery or similar):
```python
# Check for low stock items every hour
# Send email to admins/managers
# Create in-app notification
```

### Configuration UI
Add a settings page for users to configure:
- Email notification preferences
- Reorder level thresholds per item
- Notification frequency
- Alert recipients

### Additional Modal Cards
Implement modals for:
- **Recent Activity Card**: Full audit log with filters
- **Total Stock Card**: Stock breakdown by warehouse
- **Pending Approvals**: (requires Purchase Order Approval Workflow feature)
- **Upcoming Expiries**: (requires Date Management feature)

## Testing

### Test Notifications
Create sample notifications using the backend:
```bash
docker-compose exec backend flask shell

from app import db
from app.models import Notification, User

user = User.query.first()
notif = Notification(
    user_id=user.id,
    type='low_stock',
    title='Test Low Stock Alert',
    message='Test item is running low',
    entity_type='Item',
    entity_id=1
)
db.session.add(notif)
db.session.commit()
```

### Verify Features
1. Click on "Total Items" card → Modal opens with items list
2. Click on "Low Stock Items" card → Modal opens with low stock items
3. Click bell icon → Notifications panel opens
4. Create a notification → Badge count updates
5. Click notification → Marked as read, badge decreases
6. Export CSVs from modals

## Known Limitations
- Notifications are stored in database (not real-time push)
- Poll-based refresh (30 seconds) - upgrade to WebSocket for instant updates
- No email notifications yet (requires SMTP configuration)
- No user preferences for notification types

## Security Considerations
- All endpoints require JWT authentication
- Users can only see their own notifications
- Notifications are filtered by user_id in queries
- No PII exposure in notification messages
