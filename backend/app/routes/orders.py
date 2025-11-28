from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import PurchaseOrder, SalesOrder, AuditLog
from app.utils.decorators import role_required

bp = Blueprint('orders', __name__, url_prefix='/api/orders')

# Purchase Orders
@bp.route('/purchase', methods=['GET'])
@jwt_required()
def get_purchase_orders():
    orders = PurchaseOrder.query.all()
    return jsonify([order.to_dict() for order in orders]), 200


@bp.route('/purchase/<int:order_id>', methods=['GET'])
@jwt_required()
def get_purchase_order(order_id):
    order = PurchaseOrder.query.get_or_404(order_id)
    return jsonify(order.to_dict()), 200


@bp.route('/purchase', methods=['POST'])
@jwt_required()
@role_required(['admin', 'manager'])
def create_purchase_order():
    data = request.get_json()
    identity = get_jwt_identity()
    
    if not data or not data.get('po_number') or not data.get('supplier_id') or not data.get('warehouse_id'):
        return jsonify({'error': 'Missing required fields'}), 400
    
    order = PurchaseOrder(
        po_number=data['po_number'],
        supplier_id=data['supplier_id'],
        warehouse_id=data['warehouse_id'],
        status=data.get('status', 'pending'),
        expected_date=data.get('expected_date'),
        total_amount=data.get('total_amount'),
        created_by=identity['id']
    )
    
    db.session.add(order)
    db.session.commit()
    
    log = AuditLog(
        user_id=identity['id'],
        action='CREATE',
        entity_type='PurchaseOrder',
        entity_id=order.id,
        details=f'Created purchase order: {order.po_number}'
    )
    db.session.add(log)
    db.session.commit()
    
    return jsonify(order.to_dict()), 201


# Sales Orders
@bp.route('/sales', methods=['GET'])
@jwt_required()
def get_sales_orders():
    orders = SalesOrder.query.all()
    return jsonify([order.to_dict() for order in orders]), 200


@bp.route('/sales/<int:order_id>', methods=['GET'])
@jwt_required()
def get_sales_order(order_id):
    order = SalesOrder.query.get_or_404(order_id)
    return jsonify(order.to_dict()), 200


@bp.route('/sales', methods=['POST'])
@jwt_required()
@role_required(['admin', 'manager'])
def create_sales_order():
    data = request.get_json()
    identity = get_jwt_identity()
    
    if not data or not data.get('so_number') or not data.get('customer_name') or not data.get('warehouse_id'):
        return jsonify({'error': 'Missing required fields'}), 400
    
    order = SalesOrder(
        so_number=data['so_number'],
        customer_name=data['customer_name'],
        warehouse_id=data['warehouse_id'],
        status=data.get('status', 'pending'),
        total_amount=data.get('total_amount'),
        created_by=identity['id']
    )
    
    db.session.add(order)
    db.session.commit()
    
    log = AuditLog(
        user_id=identity['id'],
        action='CREATE',
        entity_type='SalesOrder',
        entity_id=order.id,
        details=f'Created sales order: {order.so_number}'
    )
    db.session.add(log)
    db.session.commit()
    
    return jsonify(order.to_dict()), 201
