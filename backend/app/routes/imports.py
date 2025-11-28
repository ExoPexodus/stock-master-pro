from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
import os
from app import db
from app.models import ImportJob, Item
from app.utils.decorators import role_required
from app.tasks import process_import_file

bp = Blueprint('imports', __name__, url_prefix='/api/imports')

ALLOWED_EXTENSIONS = {'csv', 'xlsx', 'xls'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@bp.route('/upload', methods=['POST'])
@jwt_required()
@role_required(['admin', 'manager'])
def upload_file():
    identity = get_jwt_identity()
    
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    if not allowed_file(file.filename):
        return jsonify({'error': 'Invalid file type. Only CSV and Excel files are allowed'}), 400
    
    filename = secure_filename(file.filename)
    filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
    
    # Ensure upload directory exists
    os.makedirs(current_app.config['UPLOAD_FOLDER'], exist_ok=True)
    file.save(filepath)
    
    # Create import job
    import_job = ImportJob(
        filename=filename,
        status='pending',
        created_by=identity['id']
    )
    db.session.add(import_job)
    db.session.commit()
    
    # Check file size for hybrid processing
    file_size = os.path.getsize(filepath)
    threshold = current_app.config.get('LARGE_FILE_THRESHOLD', 5242880)  # 5MB
    
    if file_size < threshold:
        # Process small files synchronously
        try:
            from app.utils.import_processor import process_file_sync
            result = process_file_sync(filepath, import_job.id)
            return jsonify({
                'job_id': import_job.id,
                'status': 'completed',
                'result': result
            }), 200
        except Exception as e:
            import_job.status = 'failed'
            import_job.error_details = str(e)
            db.session.commit()
            return jsonify({'error': str(e)}), 500
    else:
        # Process large files asynchronously using Celery
        process_import_file.delay(filepath, import_job.id)
        return jsonify({
            'job_id': import_job.id,
            'status': 'processing',
            'message': 'File is being processed in the background'
        }), 202


@bp.route('/jobs/<int:job_id>', methods=['GET'])
@jwt_required()
def get_import_job(job_id):
    job = ImportJob.query.get_or_404(job_id)
    return jsonify(job.to_dict()), 200


@bp.route('/jobs', methods=['GET'])
@jwt_required()
def get_import_jobs():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    
    pagination = ImportJob.query.order_by(
        ImportJob.created_at.desc()
    ).paginate(page=page, per_page=per_page, error_out=False)
    
    return jsonify({
        'jobs': [job.to_dict() for job in pagination.items],
        'total': pagination.total,
        'page': page,
        'per_page': per_page,
        'pages': pagination.pages
    }), 200


@bp.route('/export', methods=['GET'])
@jwt_required()
def export_items():
    import pandas as pd
    from io import BytesIO
    from flask import send_file
    
    items = Item.query.all()
    data = [item.to_dict() for item in items]
    
    df = pd.DataFrame(data)
    
    output = BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='Items')
    
    output.seek(0)
    
    return send_file(
        output,
        mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        as_attachment=True,
        download_name='items_export.xlsx'
    )
