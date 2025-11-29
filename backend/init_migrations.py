#!/usr/bin/env python3
"""
Initialize Alembic migrations for the first time.
Run this script once to set up the migrations system.
"""
import os
import sys
from app import create_app, db
from flask_migrate import init, migrate, stamp

def initialize_migrations():
    """Initialize the migrations directory and create initial migration."""
    app = create_app()
    
    with app.app_context():
        migrations_dir = os.path.join(os.path.dirname(__file__), 'migrations')
        
        # Check if already initialized
        if os.path.exists(os.path.join(migrations_dir, 'versions')):
            print('✅ Migrations already initialized')
            
            # Check if we need to stamp the database
            try:
                from flask_migrate import current
                current()
                print('✅ Database is already stamped with migration version')
            except:
                print('🔧 Stamping database with initial migration...')
                # Stamp the database as being at the latest migration
                stamp()
                print('✅ Database stamped successfully')
        else:
            print('🔧 Initializing migrations directory...')
            init()
            print('✅ Migrations directory initialized')
            
            print('🔧 Creating initial migration...')
            migrate(message='initial migration')
            print('✅ Initial migration created')
            
            print('🔧 Stamping existing database...')
            stamp()
            print('✅ Database stamped with initial migration')
        
        print('\n✅ Migration system ready!')
        print('Future schema changes will be automatically applied on startup.')

if __name__ == '__main__':
    try:
        initialize_migrations()
    except Exception as e:
        print(f'❌ Error initializing migrations: {str(e)}')
        sys.exit(1)
