from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app import db
from app.models import Item, Stock, AuditLog
from sqlalchemy import func

bp = Blueprint('reports', __name__, url_prefix='/api/reports')

@bp.route('/dashboard', methods=['GET'])
@jwt_required()
def get_dashboard():
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
    
    pagination = AuditLog.query.order_by(
        AuditLog.timestamp.desc()
    ).paginate(page=page, per_page=per_page, error_out=False)
    
    return jsonify({
        'logs': [log.to_dict() for log in pagination.items],
        'total': pagination.total,
        'page': page,
        'per_page': per_page,
        'pages': pagination.pages
    }), 200
