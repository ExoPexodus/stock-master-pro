from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import Supplier, AuditLog
from app.utils.decorators import role_required

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
        user_id=identity['id'],
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
        user_id=identity['id'],
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
        user_id=identity['id'],
        action='DELETE',
        entity_type='Supplier',
        entity_id=supplier.id,
        details=f'Deleted supplier: {supplier.name}'
    )
    db.session.add(log)
    
    db.session.delete(supplier)
    db.session.commit()
    
    return jsonify({'message': 'Supplier deleted successfully'}), 200
