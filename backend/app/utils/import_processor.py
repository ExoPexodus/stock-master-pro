import pandas as pd
from app import db
from app.models import Item, ImportJob
from datetime import datetime

def process_file_sync(filepath, job_id):
    """Process small files synchronously"""
    job = ImportJob.query.get(job_id)
    
    try:
        # Read file
        if filepath.endswith('.csv'):
            df = pd.read_csv(filepath)
        else:
            df = pd.read_excel(filepath)
        
        job.total_rows = len(df)
        job.status = 'processing'
        db.session.commit()
        
        errors = []
        success_count = 0
        
        for idx, row in df.iterrows():
            try:
                # Validate required fields
                if pd.isna(row.get('sku')) or pd.isna(row.get('name')) or pd.isna(row.get('unit_price')):
                    errors.append(f"Row {idx + 2}: Missing required fields")
                    continue
                
                # Check if item exists
                item = Item.query.filter_by(sku=row['sku']).first()
                
                if item:
                    # Update existing item
                    item.name = row['name']
                    item.description = row.get('description')
                    item.unit_price = float(row['unit_price'])
                    item.reorder_level = int(row.get('reorder_level', 10))
                else:
                    # Create new item
                    item = Item(
                        sku=row['sku'],
                        name=row['name'],
                        description=row.get('description'),
                        unit_price=float(row['unit_price']),
                        reorder_level=int(row.get('reorder_level', 10))
                    )
                    db.session.add(item)
                
                success_count += 1
                
            except Exception as e:
                errors.append(f"Row {idx + 2}: {str(e)}")
        
        db.session.commit()
        
        job.processed_rows = len(df)
        job.success_count = success_count
        job.error_count = len(errors)
        job.error_details = '\n'.join(errors) if errors else None
        job.status = 'completed'
        job.completed_at = datetime.utcnow()
        db.session.commit()
        
        return {
            'total_rows': job.total_rows,
            'success_count': success_count,
            'error_count': len(errors),
            'errors': errors
        }
        
    except Exception as e:
        job.status = 'failed'
        job.error_details = str(e)
        db.session.commit()
        raise
