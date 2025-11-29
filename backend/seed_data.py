"""
Database seeding script for inventory management system
Run this script to populate the database with mock data for testing
"""
from app import create_app, db
from app.models import (
    User, Category, Supplier, Warehouse, Item, Stock,
    PurchaseOrder, SalesOrder, AuditLog, Location, StockLocation,
    StockTransfer, Notification, ApprovalHistory, ImportJob
)
from werkzeug.security import generate_password_hash
from datetime import datetime, timedelta, date
import random

def seed_database():
    app = create_app()
    with app.app_context():
        print("🌱 Starting database seeding...")
        
        # Clear existing data (optional - comment out if you want to keep existing data)
        print("Clearing existing data...")
        db.session.query(ApprovalHistory).delete()
        db.session.query(Notification).delete()
        db.session.query(ImportJob).delete()
        db.session.query(StockTransfer).delete()
        db.session.query(StockLocation).delete()
        db.session.query(AuditLog).delete()
        db.session.query(SalesOrder).delete()
        db.session.query(PurchaseOrder).delete()
        db.session.query(Stock).delete()
        db.session.query(Item).delete()
        db.session.query(Location).delete()
        db.session.query(Category).delete()
        db.session.query(Supplier).delete()
        db.session.query(Warehouse).delete()
        db.session.query(User).delete()
        db.session.commit()
        
        # Create Users
        print("Creating users...")
        users = [
            User(
                username='admin',
                email='admin@inventory.com',
                password_hash=generate_password_hash('admin123'),
                role='admin'
            ),
            User(
                username='manager',
                email='manager@inventory.com',
                password_hash=generate_password_hash('manager123'),
                role='manager'
            ),
            User(
                username='viewer',
                email='viewer@inventory.com',
                password_hash=generate_password_hash('viewer123'),
                role='viewer'
            ),
            User(
                username='john_doe',
                email='john@inventory.com',
                password_hash=generate_password_hash('password123'),
                role='manager'
            ),
            User(
                username='jane_smith',
                email='jane@inventory.com',
                password_hash=generate_password_hash('password123'),
                role='viewer'
            )
        ]
        db.session.add_all(users)
        db.session.commit()
        print(f"✓ Created {len(users)} users")
        
        # Create Categories
        print("Creating categories...")
        categories = [
            Category(name='Electronics', description='Electronic devices and components'),
            Category(name='Furniture', description='Office and home furniture'),
            Category(name='Stationery', description='Office supplies and stationery'),
            Category(name='Hardware', description='Tools and hardware equipment'),
            Category(name='Consumables', description='Consumable items and supplies'),
            Category(name='Safety Equipment', description='Personal protective equipment and safety gear'),
        ]
        db.session.add_all(categories)
        db.session.commit()
        
        # Create subcategories
        subcategories = [
            Category(name='Laptops', description='Laptop computers', parent_id=categories[0].id),
            Category(name='Monitors', description='Computer monitors', parent_id=categories[0].id),
            Category(name='Peripherals', description='Computer accessories', parent_id=categories[0].id),
            Category(name='Desks', description='Office desks', parent_id=categories[1].id),
            Category(name='Chairs', description='Office chairs', parent_id=categories[1].id),
            Category(name='Storage', description='Filing cabinets and shelving', parent_id=categories[1].id),
            Category(name='Power Tools', description='Electric and battery tools', parent_id=categories[3].id),
            Category(name='Hand Tools', description='Manual tools', parent_id=categories[3].id),
        ]
        db.session.add_all(subcategories)
        db.session.commit()
        print(f"✓ Created {len(categories) + len(subcategories)} categories")
        
        # Create Suppliers
        print("Creating suppliers...")
        suppliers = [
            Supplier(
                name='TechCorp Ltd',
                contact_person='John Smith',
                email='contact@techcorp.com',
                phone='+1-555-0101',
                address='123 Tech Street, Silicon Valley, CA'
            ),
            Supplier(
                name='Office Supplies Co',
                contact_person='Sarah Johnson',
                email='orders@officesupplies.com',
                phone='+1-555-0102',
                address='456 Supply Ave, New York, NY'
            ),
            Supplier(
                name='Furniture World',
                contact_person='Mike Brown',
                email='sales@furnitureworld.com',
                phone='+1-555-0103',
                address='789 Furniture Blvd, Chicago, IL'
            ),
            Supplier(
                name='Hardware Plus',
                contact_person='Emily Davis',
                email='info@hardwareplus.com',
                phone='+1-555-0104',
                address='321 Hardware Lane, Houston, TX'
            ),
            Supplier(
                name='Global Electronics',
                contact_person='Robert Chen',
                email='sales@globalelectronics.com',
                phone='+1-555-0105',
                address='555 Innovation Drive, Seattle, WA'
            ),
            Supplier(
                name='Safety First Inc',
                contact_person='Lisa Anderson',
                email='orders@safetyfirst.com',
                phone='+1-555-0106',
                address='777 Protection Blvd, Boston, MA'
            ),
        ]
        db.session.add_all(suppliers)
        db.session.commit()
        print(f"✓ Created {len(suppliers)} suppliers")
        
        # Create Warehouses
        print("Creating warehouses...")
        warehouses = [
            Warehouse(
                name='Main Warehouse',
                location='Downtown District, Building A, 100 Commerce Street',
                capacity=10000
            ),
            Warehouse(
                name='North Branch',
                location='North Industrial Park, Unit 5, 250 Industrial Ave',
                capacity=5000
            ),
            Warehouse(
                name='South Storage',
                location='South Commerce Zone, Warehouse 12, 350 Logistics Road',
                capacity=7500
            ),
            Warehouse(
                name='East Distribution Center',
                location='East Business Park, Building C, 400 Distribution Way',
                capacity=6000
            ),
        ]
        db.session.add_all(warehouses)
        db.session.commit()
        print(f"✓ Created {len(warehouses)} warehouses")
        
        # Create Locations (storage locations within warehouses)
        print("Creating locations...")
        locations = []
        location_types = ['Aisle A', 'Aisle B', 'Aisle C', 'Cold Storage', 'Loading Bay', 'Secure Storage']
        for warehouse in warehouses:
            for i, loc_type in enumerate(location_types[:4]):  # 4 locations per warehouse
                location = Location(
                    name=f'{warehouse.name} - {loc_type}',
                    address=f'{warehouse.location} - Zone {i+1}',
                    capacity=warehouse.capacity // 4,
                    is_active=True
                )
                locations.append(location)
        
        db.session.add_all(locations)
        db.session.commit()
        print(f"✓ Created {len(locations)} locations")
        
        # Create Items (with warehouse_id and supplier_id)
        print("Creating items...")
        items_data = [
            # Electronics
            ('LAP-001', 'Dell Latitude 5520', 'Business laptop with Intel i7, 16GB RAM, 512GB SSD', categories[0].id, 1299.99, 10, 12, None),
            ('LAP-002', 'HP EliteBook 840', 'Premium business laptop with AMD Ryzen 7', categories[0].id, 1499.99, 8, 12, None),
            ('LAP-003', 'Lenovo ThinkPad X1', 'Ultra-portable business laptop', categories[0].id, 1799.99, 5, 12, None),
            ('MON-001', 'Dell UltraSharp 27"', '4K monitor with USB-C hub', categories[0].id, 599.99, 15, 24, None),
            ('MON-002', 'LG 24" Monitor', 'Full HD IPS display', categories[0].id, 249.99, 20, 24, None),
            ('MON-003', 'Samsung Curved 32"', 'Ultra-wide curved display', categories[0].id, 899.99, 10, 24, None),
            ('KEY-001', 'Mechanical Keyboard', 'RGB mechanical gaming keyboard', categories[0].id, 129.99, 30, 12, None),
            ('MOU-001', 'Wireless Mouse', 'Ergonomic wireless mouse', categories[0].id, 49.99, 50, 12, None),
            
            # Furniture
            ('DSK-001', 'Executive Desk Oak', 'Solid oak executive desk 72x36', categories[1].id, 899.99, 5, None, None),
            ('DSK-002', 'Standing Desk Electric', 'Height adjustable electric desk', categories[1].id, 699.99, 12, None, None),
            ('DSK-003', 'Corner Desk L-Shape', 'Space-saving corner desk', categories[1].id, 449.99, 8, None, None),
            ('CHR-001', 'Ergonomic Office Chair', 'Mesh back ergonomic chair', categories[1].id, 399.99, 25, None, None),
            ('CHR-002', 'Executive Leather Chair', 'Premium leather executive chair', categories[1].id, 799.99, 8, None, None),
            ('CHR-003', 'Task Chair Basic', 'Affordable task chair', categories[1].id, 149.99, 40, None, None),
            ('CAB-001', 'Filing Cabinet 4-Drawer', 'Lockable metal filing cabinet', categories[1].id, 299.99, 15, None, None),
            
            # Stationery
            ('PEN-001', 'Ballpoint Pens Box', 'Box of 50 blue pens', categories[2].id, 12.99, 100, None, None),
            ('PEN-002', 'Marker Set', 'Pack of 12 permanent markers', categories[2].id, 18.99, 80, None, None),
            ('PAP-001', 'A4 Paper Ream', '500 sheets premium white paper', categories[2].id, 8.99, 200, None, None),
            ('PAP-002', 'Color Paper Pack', 'Assorted colors, 250 sheets', categories[2].id, 15.99, 120, None, None),
            ('NOT-001', 'Spiral Notebooks', 'Pack of 5 college-ruled notebooks', categories[2].id, 15.99, 150, None, None),
            ('FOL-001', 'File Folders Box', 'Box of 100 manila folders', categories[2].id, 24.99, 60, None, None),
            
            # Hardware
            ('DRL-001', 'Cordless Drill Kit', '20V cordless drill with bits and case', categories[3].id, 149.99, 30, None, None),
            ('DRL-002', 'Impact Driver', '18V impact driver kit', categories[3].id, 129.99, 25, None, None),
            ('HMR-001', 'Claw Hammer', 'Steel claw hammer 16oz', categories[3].id, 24.99, 50, None, None),
            ('SCR-001', 'Screwdriver Set', '10-piece precision screwdriver set', categories[3].id, 34.99, 40, None, None),
            ('WRN-001', 'Socket Wrench Set', '42-piece socket set with case', categories[3].id, 89.99, 20, None, None),
            ('LEV-001', 'Laser Level', 'Self-leveling laser level', categories[3].id, 79.99, 15, None, None),
            
            # Consumables
            ('CLN-001', 'Cleaning Spray', 'Multi-surface cleaner 500ml', categories[4].id, 6.99, 300, None, date(2025, 12, 31)),
            ('CLN-002', 'Disinfectant Wipes', 'Container of 75 wipes', categories[4].id, 8.99, 250, None, date(2025, 10, 15)),
            ('TOW-001', 'Paper Towels', 'Pack of 12 rolls', categories[4].id, 19.99, 250, None, None),
            ('GLV-001', 'Disposable Gloves', 'Box of 100 latex gloves', categories[4].id, 14.99, 200, None, date(2026, 6, 30)),
            ('BAT-001', 'AA Batteries', 'Pack of 24 alkaline batteries', categories[4].id, 16.99, 180, None, date(2028, 3, 15)),
            
            # Safety Equipment
            ('HLM-001', 'Hard Hat', 'ANSI approved safety helmet', categories[5].id, 29.99, 50, None, None),
            ('VES-001', 'Safety Vest', 'High-visibility reflective vest', categories[5].id, 19.99, 60, None, None),
            ('GLV-002', 'Work Gloves', 'Cut-resistant work gloves', categories[5].id, 24.99, 80, None, None),
            ('GOG-001', 'Safety Goggles', 'Anti-fog safety goggles', categories[5].id, 15.99, 70, None, None),
        ]
        
        items = []
        for sku, name, desc, cat_id, price, reorder, warranty, expiry in items_data:
            item = Item(
                sku=sku,
                name=name,
                description=desc,
                category_id=cat_id,
                warehouse_id=warehouses[random.randint(0, len(warehouses)-1)].id,  # Random warehouse
                supplier_id=suppliers[random.randint(0, len(suppliers)-1)].id,  # Random supplier
                unit_price=price,
                reorder_level=reorder,
                warranty_months=warranty,
                expiry_date=expiry
            )
            items.append(item)
        
        db.session.add_all(items)
        db.session.commit()
        print(f"✓ Created {len(items)} items")
        
        # Create Stock Records (warehouse-level)
        print("Creating stock records...")
        stock_records = []
        for item in items:
            for warehouse in warehouses:
                # Random quantity between 0 and 150% of reorder level
                quantity = random.randint(0, int(item.reorder_level * 1.5))
                stock = Stock(
                    item_id=item.id,
                    warehouse_id=warehouse.id,
                    quantity=quantity
                )
                stock_records.append(stock)
        
        db.session.add_all(stock_records)
        db.session.commit()
        print(f"✓ Created {len(stock_records)} stock records")
        
        # Create Stock Location Records (location-level granular tracking)
        print("Creating stock location records...")
        stock_locations = []
        for item in items[:20]:  # First 20 items get detailed location tracking
            for location in locations[:8]:  # Use first 8 locations
                quantity = random.randint(5, 50)
                stock_loc = StockLocation(
                    item_id=item.id,
                    location_id=location.id,
                    quantity=quantity,
                    min_threshold=10,
                    max_threshold=100,
                    updated_by=users[1].id
                )
                stock_locations.append(stock_loc)
        
        db.session.add_all(stock_locations)
        db.session.commit()
        print(f"✓ Created {len(stock_locations)} stock location records")
        
        # Create Stock Transfers
        print("Creating stock transfers...")
        transfers = []
        for i in range(15):
            item = random.choice(items[:20])
            from_loc = random.choice(locations[:8])
            to_loc = random.choice([loc for loc in locations[:8] if loc.id != from_loc.id])
            
            transfer = StockTransfer(
                item_id=item.id,
                from_location_id=from_loc.id if random.choice([True, False]) else None,
                to_location_id=to_loc.id,
                quantity=random.randint(5, 30),
                transfer_date=datetime.utcnow() - timedelta(days=random.randint(1, 30)),
                transferred_by=random.choice(users[:3]).id,
                notes=f'Transfer #{i+1} - Inventory redistribution',
                status='completed'
            )
            transfers.append(transfer)
        
        db.session.add_all(transfers)
        db.session.commit()
        print(f"✓ Created {len(transfers)} stock transfers")
        
        # Create Purchase Orders (with approval workflow)
        print("Creating purchase orders...")
        purchase_orders = []
        statuses = ['draft', 'pending_approval', 'approved', 'rejected', 'sent', 'delivered']
        
        for i in range(20):
            order_date = datetime.utcnow() - timedelta(days=random.randint(1, 90))
            status = random.choice(statuses)
            
            po = PurchaseOrder(
                po_number=f'PO-2024-{1001 + i}',
                supplier_id=random.choice(suppliers).id,
                warehouse_id=random.choice(warehouses).id,
                status=status,
                order_date=order_date,
                expected_date=order_date + timedelta(days=random.randint(7, 30)),
                total_amount=round(random.uniform(500, 10000), 2),
                created_by=users[0].id if i % 2 == 0 else users[1].id,
                expected_delivery_date=date.today() + timedelta(days=random.randint(5, 25)),
                comments=f'Purchase order #{i+1}'
            )
            
            # Add workflow dates based on status
            if status in ['approved', 'sent', 'delivered']:
                po.approved_by = users[0].id  # Admin approves
                po.approved_date = order_date + timedelta(days=random.randint(1, 3))
            
            if status == 'rejected':
                po.rejected_by = users[0].id
                po.rejected_date = order_date + timedelta(days=random.randint(1, 2))
            
            if status in ['sent', 'delivered']:
                po.sent_date = po.approved_date + timedelta(days=random.randint(1, 2))
            
            if status == 'delivered':
                po.delivered_date = po.sent_date + timedelta(days=random.randint(3, 10))
                po.actual_delivery_date = po.delivered_date.date()
            
            purchase_orders.append(po)
        
        db.session.add_all(purchase_orders)
        db.session.commit()
        print(f"✓ Created {len(purchase_orders)} purchase orders")
        
        # Create Approval History
        print("Creating approval history...")
        approval_history = []
        for po in purchase_orders:
            if po.status != 'draft':
                # Initial submission
                history = ApprovalHistory(
                    purchase_order_id=po.id,
                    user_id=po.created_by,
                    from_status='draft',
                    to_status='pending_approval',
                    comments='Submitted for approval',
                    timestamp=po.order_date
                )
                approval_history.append(history)
                
                # Approval or rejection
                if po.approved_by:
                    history = ApprovalHistory(
                        purchase_order_id=po.id,
                        user_id=po.approved_by,
                        from_status='pending_approval',
                        to_status='approved',
                        comments='Approved by admin',
                        timestamp=po.approved_date
                    )
                    approval_history.append(history)
                
                if po.rejected_by:
                    history = ApprovalHistory(
                        purchase_order_id=po.id,
                        user_id=po.rejected_by,
                        from_status='pending_approval',
                        to_status='rejected',
                        comments='Rejected - needs revision',
                        timestamp=po.rejected_date
                    )
                    approval_history.append(history)
        
        db.session.add_all(approval_history)
        db.session.commit()
        print(f"✓ Created {len(approval_history)} approval history records")
        
        # Create Sales Orders
        print("Creating sales orders...")
        sales_orders = []
        so_statuses = ['pending', 'processing', 'shipped', 'delivered']
        customers = ['Acme Corp', 'Global Industries', 'Tech Solutions Inc', 'Metro Enterprises', 
                    'Alpha Systems', 'Beta Technologies', 'Gamma Logistics', 'Delta Manufacturing']
        
        for i in range(25):
            so = SalesOrder(
                so_number=f'SO-2024-{2001 + i}',
                customer_name=random.choice(customers),
                warehouse_id=random.choice(warehouses).id,
                status=random.choice(so_statuses),
                order_date=datetime.utcnow() - timedelta(days=random.randint(1, 60)),
                total_amount=round(random.uniform(200, 5000), 2),
                created_by=users[1].id if i % 2 == 0 else users[3].id
            )
            sales_orders.append(so)
        
        db.session.add_all(sales_orders)
        db.session.commit()
        print(f"✓ Created {len(sales_orders)} sales orders")
        
        # Create Notifications
        print("Creating notifications...")
        notifications = []
        notification_types = [
            ('low_stock', 'Low Stock Alert', 'Item {item} is running low in {warehouse}', 'Item'),
            ('purchase_order_created', 'New Purchase Order', 'Purchase order {po} has been created', 'PurchaseOrder'),
            ('order_approved', 'Order Approved', 'Purchase order {po} has been approved', 'PurchaseOrder'),
            ('order_rejected', 'Order Rejected', 'Purchase order {po} has been rejected', 'PurchaseOrder'),
            ('order_delivered', 'Order Delivered', 'Purchase order {po} has been delivered', 'PurchaseOrder'),
        ]
        
        for i in range(30):
            notif_type, title, msg_template, entity_type = random.choice(notification_types)
            user = random.choice(users[:3])
            
            if entity_type == 'Item':
                entity_id = random.choice(items).id
                message = msg_template.format(
                    item=f'SKU-{entity_id}',
                    warehouse=random.choice(warehouses).name
                )
            else:
                entity_id = random.choice(purchase_orders).id
                message = msg_template.format(po=f'PO-{entity_id}')
            
            notification = Notification(
                user_id=user.id,
                type=notif_type,
                title=title,
                message=message,
                is_read=random.choice([True, False]),
                entity_type=entity_type,
                entity_id=entity_id,
                created_at=datetime.utcnow() - timedelta(hours=random.randint(1, 168))
            )
            notifications.append(notification)
        
        db.session.add_all(notifications)
        db.session.commit()
        print(f"✓ Created {len(notifications)} notifications")
        
        # Create Import Jobs
        print("Creating import jobs...")
        import_jobs = []
        filenames = ['items_import_jan.csv', 'stock_update_feb.xlsx', 'suppliers_batch.csv', 
                    'inventory_update.xlsx', 'new_items.csv']
        job_statuses = ['completed', 'failed', 'processing']
        
        for i in range(8):
            status = random.choice(job_statuses)
            total = random.randint(50, 500)
            processed = total if status == 'completed' else random.randint(0, total)
            
            job = ImportJob(
                filename=random.choice(filenames),
                status=status,
                total_rows=total,
                processed_rows=processed,
                success_count=processed if status == 'completed' else random.randint(0, processed),
                error_count=0 if status == 'completed' else random.randint(0, processed),
                error_details='Import successful' if status == 'completed' else 'Some rows had validation errors',
                created_by=users[1].id,
                created_at=datetime.utcnow() - timedelta(days=random.randint(1, 30)),
                completed_at=datetime.utcnow() - timedelta(days=random.randint(0, 29)) if status == 'completed' else None
            )
            import_jobs.append(job)
        
        db.session.add_all(import_jobs)
        db.session.commit()
        print(f"✓ Created {len(import_jobs)} import jobs")
        
        # Create Audit Logs
        print("Creating audit logs...")
        audit_logs = []
        actions = ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'APPROVE', 'REJECT', 'TRANSFER', 'EXPORT']
        entities = ['Item', 'Category', 'Warehouse', 'Supplier', 'PurchaseOrder', 'SalesOrder', 
                   'Location', 'StockLocation', 'User']
        
        for i in range(100):
            log = AuditLog(
                user_id=random.choice(users).id,
                action=random.choice(actions),
                entity_type=random.choice(entities),
                entity_id=random.randint(1, 50),
                details=f'Sample audit log entry #{i + 1} - {random.choice(["User performed operation", "System update", "Data modification", "Record access"])}',
                timestamp=datetime.utcnow() - timedelta(hours=random.randint(1, 2160))
            )
            audit_logs.append(log)
        
        db.session.add_all(audit_logs)
        db.session.commit()
        print(f"✓ Created {len(audit_logs)} audit logs")
        
        print("\n" + "="*70)
        print("✅ DATABASE SEEDING COMPLETED SUCCESSFULLY!")
        print("="*70)
        print("\n📊 Summary of Created Records:")
        print(f"   • Users: {len(users)}")
        print(f"   • Categories: {len(categories) + len(subcategories)}")
        print(f"   • Suppliers: {len(suppliers)}")
        print(f"   • Warehouses: {len(warehouses)}")
        print(f"   • Locations: {len(locations)}")
        print(f"   • Items: {len(items)}")
        print(f"   • Stock Records: {len(stock_records)}")
        print(f"   • Stock Locations: {len(stock_locations)}")
        print(f"   • Stock Transfers: {len(transfers)}")
        print(f"   • Purchase Orders: {len(purchase_orders)}")
        print(f"   • Approval History: {len(approval_history)}")
        print(f"   • Sales Orders: {len(sales_orders)}")
        print(f"   • Notifications: {len(notifications)}")
        print(f"   • Import Jobs: {len(import_jobs)}")
        print(f"   • Audit Logs: {len(audit_logs)}")
        print("\n📋 Login Credentials:")
        print("   " + "-"*50)
        print("   Admin    | username: admin    | password: admin123")
        print("   Manager  | username: manager  | password: manager123")
        print("   Viewer   | username: viewer   | password: viewer123")
        print("   Manager  | username: john_doe | password: password123")
        print("   Viewer   | username: jane_smith | password: password123")
        print("   " + "-"*50)
        print("\n🎉 You can now login and explore the system with comprehensive sample data!")
        print("="*70 + "\n")

if __name__ == '__main__':
    seed_database()
