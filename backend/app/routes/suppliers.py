from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import Supplier, AuditLog, PurchaseOrder
from app.utils.decorators import role_required
import csv
import io
from datetime import datetime

bp = Blueprint('suppliers', __name__, url_prefix='/api/suppliers')

@bp.route('/', methods=['GET'])
@jwt_required()
def get_suppliers():
    suppliers = Supplier.query.all()
    return jsonify([sup.to_dict() for sup in suppliers]), 200


@bp.route('/<int:supplier_id>', methods=['GET'])
@jwt_required()
def get_supplier(supplier_id):
    supplier = Supplier.query.get_or_404(supplier_id)
    return jsonify(supplier.to_dict()), 200


@bp.route('/', methods=['POST'])
@jwt_required()
@role_required(['admin', 'manager'])
def create_supplier():
    data = request.get_json()
    identity = get_jwt_identity()
    
    if not data or not data.get('name'):
        return jsonify({'error': 'Name is required'}), 400
    
    supplier = Supplier(
        name=data['name'],
        contact_person=data.get('contact_person'),
        email=data.get('email'),
        phone=data.get('phone'),
        address=data.get('address')
    )
    
    db.session.add(supplier)
    db.session.commit()
    
    log = AuditLog(
        user_id=int(identity),
        action='CREATE',
        entity_type='Supplier',
        entity_id=supplier.id,
        details=f'Created supplier: {supplier.name}'
    )
    db.session.add(log)
    db.session.commit()
    
    return jsonify(supplier.to_dict()), 201


@bp.route('/<int:supplier_id>', methods=['PUT'])
@jwt_required()
@role_required(['admin', 'manager'])
def update_supplier(supplier_id):
    supplier = Supplier.query.get_or_404(supplier_id)
    data = request.get_json()
    identity = get_jwt_identity()
    
    if 'name' in data:
        supplier.name = data['name']
    if 'contact_person' in data:
        supplier.contact_person = data['contact_person']
    if 'email' in data:
        supplier.email = data['email']
    if 'phone' in data:
        supplier.phone = data['phone']
    if 'address' in data:
        supplier.address = data['address']
    
    db.session.commit()
    
    log = AuditLog(
        user_id=int(identity),
        action='UPDATE',
        entity_type='Supplier',
        entity_id=supplier.id,
        details=f'Updated supplier: {supplier.name}'
    )
    db.session.add(log)
    db.session.commit()
    
    return jsonify(supplier.to_dict()), 200


@bp.route('/<int:supplier_id>', methods=['DELETE'])
@jwt_required()
@role_required(['admin'])
def delete_supplier(supplier_id):
    supplier = Supplier.query.get_or_404(supplier_id)
    identity = get_jwt_identity()
    
    log = AuditLog(
        user_id=int(identity),
        action='DELETE',
        entity_type='Supplier',
        entity_id=supplier.id,
        details=f'Deleted supplier: {supplier.name}'
    )
    db.session.add(log)
    
    db.session.delete(supplier)
    db.session.commit()
    
    return jsonify({'message': 'Supplier deleted successfully'}), 200


@bp.route('/<int:supplier_id>/orders', methods=['GET'])
@jwt_required()
def get_supplier_orders(supplier_id):
    """Get all purchase orders for a specific supplier"""
    supplier = Supplier.query.get_or_404(supplier_id)
    
    # Query purchase orders for this supplier
    orders = PurchaseOrder.query.filter_by(supplier_id=supplier_id).order_by(PurchaseOrder.order_date.desc()).all()
    
    # Calculate statistics
    total_orders = len(orders)
    total_amount = sum(order.total_amount for order in orders)
    pending_orders = sum(1 for order in orders if order.status in ['draft', 'pending_approval'])
    completed_orders = sum(1 for order in orders if order.status == 'delivered')
    
    return jsonify({
        'supplier': supplier.to_dict(),
        'orders': [order.to_dict() for order in orders],
        'statistics': {
            'total_orders': total_orders,
            'total_amount': float(total_amount),
            'pending_orders': pending_orders,
            'completed_orders': completed_orders
        }
    }), 200


@bp.route('/<int:supplier_id>/orders/export', methods=['GET'])
@jwt_required()
def export_supplier_orders(supplier_id):
    """Export supplier orders to CSV"""
    supplier = Supplier.query.get_or_404(supplier_id)
    orders = PurchaseOrder.query.filter_by(supplier_id=supplier_id).order_by(PurchaseOrder.order_date.desc()).all()
    
    # Create CSV in memory
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Write header
    writer.writerow([
        'PO Number', 'Order Date', 'Status', 'Total Amount', 
        'Warehouse', 'Requested By', 'Approved By', 'Approved Date',
        'Sent Date', 'Delivered Date', 'Comments'
    ])
    
    # Write data
    for order in orders:
        writer.writerow([
            order.po_number,
            order.order_date.strftime('%Y-%m-%d') if order.order_date else '',
            order.status,
            float(order.total_amount),
            order.warehouse.name if order.warehouse else '',
            order.requested_by_user.username if order.requested_by_user else '',
            order.approved_by_user.username if order.approved_by_user else '',
            order.approved_date.strftime('%Y-%m-%d') if order.approved_date else '',
            order.sent_date.strftime('%Y-%m-%d') if order.sent_date else '',
            order.delivered_date.strftime('%Y-%m-%d') if order.delivered_date else '',
            order.comments or ''
        ])
    
    # Prepare file for download
    output.seek(0)
    filename = f"supplier_{supplier.name.replace(' ', '_')}_orders_{datetime.now().strftime('%Y%m%d')}.csv"
    
    return send_file(
        io.BytesIO(output.getvalue().encode('utf-8')),
        mimetype='text/csv',
        as_attachment=True,
        download_name=filename
    )
