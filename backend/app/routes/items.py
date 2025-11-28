from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import Item, Stock, AuditLog
from app.utils.decorators import role_required

bp = Blueprint('items', __name__, url_prefix='/api/items')

@bp.route('/', methods=['GET'])
@jwt_required()
def get_items():
    current_app.logger.info('🔵 Get items endpoint called')
    identity = get_jwt_identity()
    current_app.logger.info(f'🔵 User identity: {identity}')
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    search = request.args.get('search', '')
    
    query = Item.query
    
    if search:
        query = query.filter(
            (Item.name.ilike(f'%{search}%')) |
            (Item.sku.ilike(f'%{search}%'))
        )
    
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    
    return jsonify({
        'items': [item.to_dict() for item in pagination.items],
        'total': pagination.total,
        'page': page,
        'per_page': per_page,
        'pages': pagination.pages
    }), 200


@bp.route('/<int:item_id>', methods=['GET'])
@jwt_required()
def get_item(item_id):
    item = Item.query.get_or_404(item_id)
    stock_info = Stock.query.filter_by(item_id=item_id).all()
    
    result = item.to_dict()
    result['stock'] = [s.to_dict() for s in stock_info]
    
    return jsonify(result), 200


@bp.route('/', methods=['POST'])
@jwt_required()
@role_required(['admin', 'manager'])
def create_item():
    data = request.get_json()
    identity = get_jwt_identity()
    
    if not data or not data.get('sku') or not data.get('name') or not data.get('unit_price'):
        return jsonify({'error': 'Missing required fields'}), 400
    
    if Item.query.filter_by(sku=data['sku']).first():
        return jsonify({'error': 'SKU already exists'}), 400
    
    item = Item(
        sku=data['sku'],
        name=data['name'],
        description=data.get('description'),
        category_id=data.get('category_id'),
        unit_price=data['unit_price'],
        reorder_level=data.get('reorder_level', 10)
    )
    
    db.session.add(item)
    db.session.commit()
    
    # Log the action
    log = AuditLog(
        user_id=identity['id'],
        action='CREATE',
        entity_type='Item',
        entity_id=item.id,
        details=f'Created item: {item.name}'
    )
    db.session.add(log)
    db.session.commit()
    
    return jsonify(item.to_dict()), 201


@bp.route('/<int:item_id>', methods=['PUT'])
@jwt_required()
@role_required(['admin', 'manager'])
def update_item(item_id):
    item = Item.query.get_or_404(item_id)
    data = request.get_json()
    identity = get_jwt_identity()
    
    if 'name' in data:
        item.name = data['name']
    if 'description' in data:
        item.description = data['description']
    if 'category_id' in data:
        item.category_id = data['category_id']
    if 'unit_price' in data:
        item.unit_price = data['unit_price']
    if 'reorder_level' in data:
        item.reorder_level = data['reorder_level']
    
    db.session.commit()
    
    # Log the action
    log = AuditLog(
        user_id=identity['id'],
        action='UPDATE',
        entity_type='Item',
        entity_id=item.id,
        details=f'Updated item: {item.name}'
    )
    db.session.add(log)
    db.session.commit()
    
    return jsonify(item.to_dict()), 200


@bp.route('/<int:item_id>', methods=['DELETE'])
@jwt_required()
@role_required(['admin'])
def delete_item(item_id):
    item = Item.query.get_or_404(item_id)
    identity = get_jwt_identity()
    
    # Log before deletion
    log = AuditLog(
        user_id=identity['id'],
        action='DELETE',
        entity_type='Item',
        entity_id=item.id,
        details=f'Deleted item: {item.name}'
    )
    db.session.add(log)
    
    db.session.delete(item)
    db.session.commit()
    
    return jsonify({'message': 'Item deleted successfully'}), 200


@bp.route('/<int:item_id>/stock', methods=['POST'])
@jwt_required()
@role_required(['admin', 'manager'])
def adjust_stock(item_id):
    item = Item.query.get_or_404(item_id)
    data = request.get_json()
    identity = get_jwt_identity()
    
    if not data or 'warehouse_id' not in data or 'quantity' not in data:
        return jsonify({'error': 'Missing required fields'}), 400
    
    stock = Stock.query.filter_by(
        item_id=item_id,
        warehouse_id=data['warehouse_id']
    ).first()
    
    if stock:
        old_quantity = stock.quantity
        stock.quantity += data['quantity']
    else:
        stock = Stock(
            item_id=item_id,
            warehouse_id=data['warehouse_id'],
            quantity=data['quantity']
        )
        old_quantity = 0
        db.session.add(stock)
    
    db.session.commit()
    
    # Log the action
    log = AuditLog(
        user_id=identity['id'],
        action='STOCK_ADJUSTMENT',
        entity_type='Stock',
        entity_id=stock.id,
        details=f'Adjusted stock for {item.name}: {old_quantity} -> {stock.quantity}'
    )
    db.session.add(log)
    db.session.commit()
    
    return jsonify(stock.to_dict()), 200
