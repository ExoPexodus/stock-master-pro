import pandas as pd
from app import db
from app.models import Item, ImportJob, CustomField
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
        
        # Known core fields that shouldn't be treated as custom
        core_fields = {'sku', 'name', 'description', 'unit_price', 'reorder_level', 'category_id'}
        
        # Detect unknown columns and auto-create custom fields
        unknown_columns = [col for col in df.columns if col not in core_fields]
        existing_custom_fields = {field.field_key for field in CustomField.query.all()}
        
        for col in unknown_columns:
            if col not in existing_custom_fields:
                # Auto-create new custom field
                field = CustomField(
                    field_key=col,
                    field_label=col.replace('_', ' ').title(),
                    field_type='text',
                    field_group='Imported Fields',
                    visible_in_form=False,  # Hidden by default
                    visible_in_table=False,
                    sort_order=999
                )
                db.session.add(field)
        
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
                
                # Collect custom data from unknown columns
                custom_data = {}
                for col in unknown_columns:
                    if not pd.isna(row.get(col)):
                        custom_data[col] = str(row[col])
                
                if item:
                    # Update existing item
                    item.name = row['name']
                    item.description = row.get('description')
                    item.unit_price = float(row['unit_price'])
                    item.reorder_level = int(row.get('reorder_level', 10))
                    # Merge custom_data (preserve existing, add new)
                    if item.custom_data:
                        item.custom_data.update(custom_data)
                    else:
                        item.custom_data = custom_data
                else:
                    # Create new item
                    item = Item(
                        sku=row['sku'],
                        name=row['name'],
                        description=row.get('description'),
                        unit_price=float(row['unit_price']),
                        reorder_level=int(row.get('reorder_level', 10)),
                        custom_data=custom_data
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
