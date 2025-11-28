"""
Database seeding script for inventory management system
Run this script to populate the database with mock data for testing
"""
from app import create_app, db
from app.models import (
    User, Category, Supplier, Warehouse, Item, Stock,
    PurchaseOrder, SalesOrder, AuditLog
)
from werkzeug.security import generate_password_hash
from datetime import datetime, timedelta
import random

def seed_database():
    app = create_app()
    with app.app_context():
        print("🌱 Starting database seeding...")
        
        # Clear existing data (optional - comment out if you want to keep existing data)
        print("Clearing existing data...")
        db.session.query(AuditLog).delete()
        db.session.query(SalesOrder).delete()
        db.session.query(PurchaseOrder).delete()
        db.session.query(Stock).delete()
        db.session.query(Item).delete()
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
        ]
        db.session.add_all(categories)
        db.session.commit()
        
        # Create subcategories
        subcategories = [
            Category(name='Laptops', description='Laptop computers', parent_id=categories[0].id),
            Category(name='Monitors', description='Computer monitors', parent_id=categories[0].id),
            Category(name='Desks', description='Office desks', parent_id=categories[1].id),
            Category(name='Chairs', description='Office chairs', parent_id=categories[1].id),
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
        ]
        db.session.add_all(suppliers)
        db.session.commit()
        print(f"✓ Created {len(suppliers)} suppliers")
        
        # Create Warehouses
        print("Creating warehouses...")
        warehouses = [
            Warehouse(
                name='Main Warehouse',
                location='Downtown District, Building A',
                capacity=10000
            ),
            Warehouse(
                name='North Branch',
                location='North Industrial Park, Unit 5',
                capacity=5000
            ),
            Warehouse(
                name='South Storage',
                location='South Commerce Zone, Warehouse 12',
                capacity=7500
            ),
        ]
        db.session.add_all(warehouses)
        db.session.commit()
        print(f"✓ Created {len(warehouses)} warehouses")
        
        # Create Items
        print("Creating items...")
        items_data = [
            # Electronics
            ('LAP-001', 'Dell Latitude 5520', 'Business laptop with Intel i7', categories[0].id, 1299.99, 10),
            ('LAP-002', 'HP EliteBook 840', 'Premium business laptop', categories[0].id, 1499.99, 8),
            ('MON-001', 'Dell UltraSharp 27"', '4K monitor with USB-C', categories[0].id, 599.99, 15),
            ('MON-002', 'LG 24" Monitor', 'Full HD IPS display', categories[0].id, 249.99, 20),
            
            # Furniture
            ('DSK-001', 'Executive Desk Oak', 'Solid oak executive desk', categories[1].id, 899.99, 5),
            ('DSK-002', 'Standing Desk Electric', 'Height adjustable electric desk', categories[1].id, 699.99, 12),
            ('CHR-001', 'Ergonomic Office Chair', 'Mesh back ergonomic chair', categories[1].id, 399.99, 25),
            ('CHR-002', 'Executive Leather Chair', 'Premium leather executive chair', categories[1].id, 799.99, 8),
            
            # Stationery
            ('PEN-001', 'Ballpoint Pens Box', 'Box of 50 blue pens', categories[2].id, 12.99, 100),
            ('PAP-001', 'A4 Paper Ream', '500 sheets premium paper', categories[2].id, 8.99, 200),
            ('NOT-001', 'Spiral Notebooks', 'Pack of 5 notebooks', categories[2].id, 15.99, 150),
            
            # Hardware
            ('DRL-001', 'Cordless Drill Kit', '20V cordless drill with bits', categories[3].id, 149.99, 30),
            ('HMR-001', 'Claw Hammer', 'Steel claw hammer 16oz', categories[3].id, 24.99, 50),
            ('SCR-001', 'Screwdriver Set', '10-piece precision set', categories[3].id, 34.99, 40),
            
            # Consumables
            ('CLN-001', 'Cleaning Spray', 'Multi-surface cleaner 500ml', categories[4].id, 6.99, 300),
            ('TOW-001', 'Paper Towels', 'Pack of 12 rolls', categories[4].id, 19.99, 250),
        ]
        
        items = []
        for sku, name, desc, cat_id, price, reorder in items_data:
            item = Item(
                sku=sku,
                name=name,
                description=desc,
                category_id=cat_id,
                unit_price=price,
                reorder_level=reorder
            )
            items.append(item)
        
        db.session.add_all(items)
        db.session.commit()
        print(f"✓ Created {len(items)} items")
        
        # Create Stock Records
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
        
        # Create Purchase Orders
        print("Creating purchase orders...")
        purchase_orders = []
        statuses = ['pending', 'approved', 'received']
        
        for i in range(10):
            po = PurchaseOrder(
                po_number=f'PO-2024-{1001 + i}',
                supplier_id=random.choice(suppliers).id,
                warehouse_id=random.choice(warehouses).id,
                status=random.choice(statuses),
                order_date=datetime.utcnow() - timedelta(days=random.randint(1, 90)),
                expected_date=datetime.utcnow() + timedelta(days=random.randint(1, 30)),
                total_amount=round(random.uniform(500, 10000), 2),
                created_by=users[0].id
            )
            purchase_orders.append(po)
        
        db.session.add_all(purchase_orders)
        db.session.commit()
        print(f"✓ Created {len(purchase_orders)} purchase orders")
        
        # Create Sales Orders
        print("Creating sales orders...")
        sales_orders = []
        so_statuses = ['pending', 'processing', 'shipped', 'delivered']
        customers = ['Acme Corp', 'Global Industries', 'Tech Solutions Inc', 'Metro Enterprises', 'Alpha Systems']
        
        for i in range(15):
            so = SalesOrder(
                so_number=f'SO-2024-{2001 + i}',
                customer_name=random.choice(customers),
                warehouse_id=random.choice(warehouses).id,
                status=random.choice(so_statuses),
                order_date=datetime.utcnow() - timedelta(days=random.randint(1, 60)),
                total_amount=round(random.uniform(200, 5000), 2),
                created_by=users[1].id
            )
            sales_orders.append(so)
        
        db.session.add_all(sales_orders)
        db.session.commit()
        print(f"✓ Created {len(sales_orders)} sales orders")
        
        # Create Audit Logs
        print("Creating audit logs...")
        audit_logs = []
        actions = ['CREATE', 'UPDATE', 'DELETE', 'LOGIN']
        entities = ['Item', 'Category', 'Warehouse', 'Supplier', 'PurchaseOrder', 'SalesOrder']
        
        for i in range(50):
            log = AuditLog(
                user_id=random.choice(users).id,
                action=random.choice(actions),
                entity_type=random.choice(entities),
                entity_id=random.randint(1, 20),
                details=f'Sample audit log entry #{i + 1}',
                timestamp=datetime.utcnow() - timedelta(hours=random.randint(1, 720))
            )
            audit_logs.append(log)
        
        db.session.add_all(audit_logs)
        db.session.commit()
        print(f"✓ Created {len(audit_logs)} audit logs")
        
        print("\n✅ Database seeding completed successfully!")
        print("\n📋 Login Credentials:")
        print("   Admin    - username: admin    | password: admin123")
        print("   Manager  - username: manager  | password: manager123")
        print("   Viewer   - username: viewer   | password: viewer123")
        print("\n🎉 You can now login and explore the system with sample data!")

if __name__ == '__main__':
    seed_database()
