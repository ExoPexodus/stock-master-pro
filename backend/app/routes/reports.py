from flask import Blueprint, request, jsonify, current_app, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import Item, Stock, AuditLog, User, Supplier
from sqlalchemy import func, and_, or_
from datetime import datetime
import csv
import io

bp = Blueprint('reports', __name__, url_prefix='/api/reports')

@bp.route('/dashboard', methods=['GET'])
@jwt_required()
def get_dashboard():
    current_app.logger.info('🔵 Dashboard endpoint called')
    identity = get_jwt_identity()
    current_app.logger.info(f'🔵 User identity: {identity}')
    total_items = Item.query.count()
    total_stock = db.session.query(func.sum(Stock.quantity)).scalar() or 0
    low_stock_items = db.session.query(Item).join(Stock).filter(
        Stock.quantity < Item.reorder_level
    ).count()
    
    recent_activities = AuditLog.query.order_by(
        AuditLog.timestamp.desc()
    ).limit(10).all()
    
    return jsonify({
        'total_items': total_items,
        'total_stock': int(total_stock),
        'low_stock_items': low_stock_items,
        'recent_activities': [log.to_dict() for log in recent_activities]
    }), 200


@bp.route('/low-stock', methods=['GET'])
@jwt_required()
def get_low_stock():
    items = db.session.query(Item, Stock).join(Stock).filter(
        Stock.quantity < Item.reorder_level
    ).all()
    
    result = []
    for item, stock in items:
        item_dict = item.to_dict()
        item_dict['current_stock'] = stock.quantity
        item_dict['warehouse_id'] = stock.warehouse_id
        result.append(item_dict)
    
    return jsonify(result), 200


@bp.route('/audit-logs', methods=['GET'])
@jwt_required()
def get_audit_logs():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 50, type=int)
    
    # Filtering parameters
    user_id = request.args.get('user_id', type=int)
    action = request.args.get('action')
    entity_type = request.args.get('entity_type')
    entity_id = request.args.get('entity_id', type=int)
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    # Build query with filters
    query = AuditLog.query
    
    filters = []
    if user_id:
        filters.append(AuditLog.user_id == user_id)
    if action:
        filters.append(AuditLog.action == action)
    if entity_type:
        filters.append(AuditLog.entity_type == entity_type)
    if entity_id:
        filters.append(AuditLog.entity_id == entity_id)
    if start_date:
        try:
            start = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            filters.append(AuditLog.timestamp >= start)
        except ValueError:
            pass
    if end_date:
        try:
            end = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            filters.append(AuditLog.timestamp <= end)
        except ValueError:
            pass
    
    if filters:
        query = query.filter(and_(*filters))
    
    pagination = query.order_by(
        AuditLog.timestamp.desc()
    ).paginate(page=page, per_page=per_page, error_out=False)
    
    # Enrich logs with user information
    logs_with_user = []
    for log in pagination.items:
        log_dict = log.to_dict()
        if log.user_id:
            user = User.query.get(log.user_id)
            if user:
                log_dict['username'] = user.username
                log_dict['user_email'] = user.email
        logs_with_user.append(log_dict)
    
    return jsonify({
        'logs': logs_with_user,
        'total': pagination.total,
        'page': page,
        'per_page': per_page,
        'pages': pagination.pages
    }), 200


@bp.route('/audit-logs/export', methods=['GET'])
@jwt_required()
def export_audit_logs():
    # Same filtering parameters as get_audit_logs
    user_id = request.args.get('user_id', type=int)
    action = request.args.get('action')
    entity_type = request.args.get('entity_type')
    entity_id = request.args.get('entity_id', type=int)
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    # Build query with filters
    query = AuditLog.query
    
    filters = []
    if user_id:
        filters.append(AuditLog.user_id == user_id)
    if action:
        filters.append(AuditLog.action == action)
    if entity_type:
        filters.append(AuditLog.entity_type == entity_type)
    if entity_id:
        filters.append(AuditLog.entity_id == entity_id)
    if start_date:
        try:
            start = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            filters.append(AuditLog.timestamp >= start)
        except ValueError:
            pass
    if end_date:
        try:
            end = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            filters.append(AuditLog.timestamp <= end)
        except ValueError:
            pass
    
    if filters:
        query = query.filter(and_(*filters))
    
    logs = query.order_by(AuditLog.timestamp.desc()).all()
    
    # Create CSV in memory
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Write header
    writer.writerow(['ID', 'Timestamp', 'User ID', 'Username', 'User Email', 'Action', 'Entity Type', 'Entity ID', 'Details'])
    
    # Write data rows
    for log in logs:
        username = ''
        user_email = ''
        if log.user_id:
            user = User.query.get(log.user_id)
            if user:
                username = user.username
                user_email = user.email
        
        writer.writerow([
            log.id,
            log.timestamp.isoformat(),
            log.user_id or '',
            username,
            user_email,
            log.action,
            log.entity_type or '',
            log.entity_id or '',
            log.details or ''
        ])
    
    # Prepare the file for download
    output.seek(0)
    
    return send_file(
        io.BytesIO(output.getvalue().encode('utf-8')),
        mimetype='text/csv',
        as_attachment=True,
        download_name=f'audit_logs_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv'
    )
