from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import Warehouse, Stock, AuditLog
from app.utils.decorators import role_required

bp = Blueprint('warehouses', __name__, url_prefix='/api/warehouses')

@bp.route('/', methods=['GET'])
@jwt_required()
def get_warehouses():
    warehouses = Warehouse.query.all()
    return jsonify([wh.to_dict() for wh in warehouses]), 200


@bp.route('/<int:warehouse_id>', methods=['GET'])
@jwt_required()
def get_warehouse(warehouse_id):
    warehouse = Warehouse.query.get_or_404(warehouse_id)
    stock_records = Stock.query.filter_by(warehouse_id=warehouse_id).all()
    
    result = warehouse.to_dict()
    result['stock_records'] = [s.to_dict() for s in stock_records]
    
    return jsonify(result), 200


@bp.route('/', methods=['POST'])
@jwt_required()
@role_required(['admin', 'manager'])
def create_warehouse():
    data = request.get_json()
    identity = get_jwt_identity()
    
    if not data or not data.get('name'):
        return jsonify({'error': 'Name is required'}), 400
    
    warehouse = Warehouse(
        name=data['name'],
        location=data.get('location'),
        capacity=data.get('capacity')
    )
    
    db.session.add(warehouse)
    db.session.commit()
    
    log = AuditLog(
        user_id=int(identity),
        action='CREATE',
        entity_type='Warehouse',
        entity_id=warehouse.id,
        details=f'Created warehouse: {warehouse.name}'
    )
    db.session.add(log)
    db.session.commit()
    
    return jsonify(warehouse.to_dict()), 201


@bp.route('/<int:warehouse_id>', methods=['PUT'])
@jwt_required()
@role_required(['admin', 'manager'])
def update_warehouse(warehouse_id):
    warehouse = Warehouse.query.get_or_404(warehouse_id)
    data = request.get_json()
    identity = get_jwt_identity()
    
    if 'name' in data:
        warehouse.name = data['name']
    if 'location' in data:
        warehouse.location = data['location']
    if 'capacity' in data:
        warehouse.capacity = data['capacity']
    
    db.session.commit()
    
    log = AuditLog(
        user_id=int(identity),
        action='UPDATE',
        entity_type='Warehouse',
        entity_id=warehouse.id,
        details=f'Updated warehouse: {warehouse.name}'
    )
    db.session.add(log)
    db.session.commit()
    
    return jsonify(warehouse.to_dict()), 200


@bp.route('/<int:warehouse_id>', methods=['DELETE'])
@jwt_required()
@role_required(['admin'])
def delete_warehouse(warehouse_id):
    warehouse = Warehouse.query.get_or_404(warehouse_id)
    identity = get_jwt_identity()
    
    log = AuditLog(
        user_id=int(identity),
        action='DELETE',
        entity_type='Warehouse',
        entity_id=warehouse.id,
        details=f'Deleted warehouse: {warehouse.name}'
    )
    db.session.add(log)
    
    db.session.delete(warehouse)
    db.session.commit()
    
    return jsonify({'message': 'Warehouse deleted successfully'}), 200
