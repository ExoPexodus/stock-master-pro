from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import Location, StockLocation, StockTransfer, Item, AuditLog, User
from app.utils.decorators import role_required
from sqlalchemy import or_, and_

bp = Blueprint('locations', __name__, url_prefix='/api/locations')


@bp.route('', methods=['GET'])
@jwt_required()
def get_locations():
    """Get all locations"""
    locations = Location.query.filter_by(is_active=True).all()
    return jsonify([loc.to_dict() for loc in locations]), 200


@bp.route('/<int:location_id>', methods=['GET'])
@jwt_required()
def get_location(location_id):
    """Get location by ID with stock summary"""
    location = Location.query.get_or_404(location_id)
    
    # Get stock items at this location
    stock_items = StockLocation.query.filter_by(location_id=location_id).all()
    
    result = location.to_dict()
    result['stock_count'] = len(stock_items)
    result['total_quantity'] = sum(s.quantity for s in stock_items)
    
    return jsonify(result), 200


@bp.route('', methods=['POST'])
@jwt_required()
@role_required(['admin', 'manager'])
def create_location():
    """Create a new location"""
    identity = get_jwt_identity()
    data = request.get_json()
    
    location = Location(
        name=data['name'],
        address=data.get('address'),
        capacity=data.get('capacity'),
        is_active=data.get('is_active', True)
    )
    
    db.session.add(location)
    
    # Audit log
    log = AuditLog(
        user_id=int(identity),
        action='CREATE',
        entity_type='Location',
        entity_id=None,
        details=f'Created location: {location.name}'
    )
    db.session.add(log)
    db.session.commit()
    
    return jsonify(location.to_dict()), 201


@bp.route('/<int:location_id>', methods=['PUT'])
@jwt_required()
@role_required(['admin', 'manager'])
def update_location(location_id):
    """Update location"""
    identity = get_jwt_identity()
    location = Location.query.get_or_404(location_id)
    data = request.get_json()
    
    location.name = data.get('name', location.name)
    location.address = data.get('address', location.address)
    location.capacity = data.get('capacity', location.capacity)
    location.is_active = data.get('is_active', location.is_active)
    
    log = AuditLog(
        user_id=int(identity),
        action='UPDATE',
        entity_type='Location',
        entity_id=location_id,
        details=f'Updated location: {location.name}'
    )
    db.session.add(log)
    db.session.commit()
    
    return jsonify(location.to_dict()), 200


@bp.route('/<int:location_id>/stock', methods=['GET'])
@jwt_required()
def get_location_stock(location_id):
    """Get all stock items at a location with filtering"""
    location = Location.query.get_or_404(location_id)
    
    # Query parameters
    search = request.args.get('search', '')
    min_qty = request.args.get('min_qty', type=int)
    max_qty = request.args.get('max_qty', type=int)
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 50, type=int)
    
    query = StockLocation.query.filter_by(location_id=location_id).join(Item)
    
    # Search filter
    if search:
        query = query.filter(
            or_(
                Item.name.ilike(f'%{search}%'),
                Item.sku.ilike(f'%{search}%')
            )
        )
    
    # Quantity filters
    if min_qty is not None:
        query = query.filter(StockLocation.quantity >= min_qty)
    if max_qty is not None:
        query = query.filter(StockLocation.quantity <= max_qty)
    
    # Pagination
    paginated = query.paginate(page=page, per_page=per_page, error_out=False)
    
    result = []
    for stock in paginated.items:
        item = Item.query.get(stock.item_id)
        stock_dict = stock.to_dict()
        stock_dict['item'] = item.to_dict() if item else None
        result.append(stock_dict)
    
    return jsonify({
        'items': result,
        'total': paginated.total,
        'pages': paginated.pages,
        'current_page': page
    }), 200


@bp.route('/stock/<int:item_id>', methods=['GET'])
@jwt_required()
def get_item_stock_locations(item_id):
    """Get stock levels for an item across all locations"""
    item = Item.query.get_or_404(item_id)
    stock_locations = StockLocation.query.filter_by(item_id=item_id).all()
    
    result = []
    for stock in stock_locations:
        location = Location.query.get(stock.location_id)
        stock_dict = stock.to_dict()
        stock_dict['location'] = location.to_dict() if location else None
        result.append(stock_dict)
    
    return jsonify(result), 200


@bp.route('/stock', methods=['POST'])
@jwt_required()
@role_required(['admin', 'manager'])
def set_stock_location():
    """Set or update stock quantity at a location"""
    identity = get_jwt_identity()
    data = request.get_json()
    
    item_id = data['item_id']
    location_id = data['location_id']
    quantity = data['quantity']
    
    # Check if stock record exists
    stock = StockLocation.query.filter_by(
        item_id=item_id,
        location_id=location_id
    ).first()
    
    if stock:
        old_qty = stock.quantity
        stock.quantity = quantity
        stock.updated_by = int(identity)
        action = 'UPDATE'
    else:
        stock = StockLocation(
            item_id=item_id,
            location_id=location_id,
            quantity=quantity,
            min_threshold=data.get('min_threshold', 10),
            updated_by=int(identity)
        )
        db.session.add(stock)
        old_qty = 0
        action = 'CREATE'
    
    # Audit log
    item = Item.query.get(item_id)
    location = Location.query.get(location_id)
    log = AuditLog(
        user_id=int(identity),
        action=action,
        entity_type='StockLocation',
        entity_id=stock.id if action == 'UPDATE' else None,
        details=f'Set stock for {item.name} at {location.name}: {old_qty} → {quantity}'
    )
    db.session.add(log)
    db.session.commit()
    
    return jsonify(stock.to_dict()), 201 if action == 'CREATE' else 200


@bp.route('/transfer', methods=['POST'])
@jwt_required()
@role_required(['admin', 'manager'])
def transfer_stock():
    """Transfer stock between locations"""
    identity = get_jwt_identity()
    data = request.get_json()
    
    item_id = data['item_id']
    from_location_id = data.get('from_location_id')
    to_location_id = data['to_location_id']
    quantity = data['quantity']
    notes = data.get('notes', '')
    
    if quantity <= 0:
        return jsonify({'error': 'Quantity must be positive'}), 400
    
    # Get source stock (if from_location_id exists)
    if from_location_id:
        from_stock = StockLocation.query.filter_by(
            item_id=item_id,
            location_id=from_location_id
        ).first()
        
        if not from_stock or from_stock.quantity < quantity:
            return jsonify({'error': 'Insufficient stock at source location'}), 400
        
        # Decrease source
        from_stock.quantity -= quantity
        from_stock.updated_by = int(identity)
    
    # Get or create destination stock
    to_stock = StockLocation.query.filter_by(
        item_id=item_id,
        location_id=to_location_id
    ).first()
    
    if to_stock:
        to_stock.quantity += quantity
        to_stock.updated_by = int(identity)
    else:
        to_stock = StockLocation(
            item_id=item_id,
            location_id=to_location_id,
            quantity=quantity,
            updated_by=int(identity)
        )
        db.session.add(to_stock)
    
    # Create transfer record
    transfer = StockTransfer(
        item_id=item_id,
        from_location_id=from_location_id,
        to_location_id=to_location_id,
        quantity=quantity,
        transferred_by=int(identity),
        notes=notes,
        status='completed'
    )
    db.session.add(transfer)
    
    # Audit log
    item = Item.query.get(item_id)
    from_loc = Location.query.get(from_location_id) if from_location_id else None
    to_loc = Location.query.get(to_location_id)
    
    from_name = from_loc.name if from_loc else 'External'
    details = f'Transferred {quantity} units of {item.name} from {from_name} to {to_loc.name}'
    
    log = AuditLog(
        user_id=int(identity),
        action='TRANSFER',
        entity_type='StockTransfer',
        entity_id=None,
        details=details
    )
    db.session.add(log)
    db.session.commit()
    
    return jsonify(transfer.to_dict()), 201


@bp.route('/transfers', methods=['GET'])
@jwt_required()
def get_transfers():
    """Get transfer history with filtering"""
    item_id = request.args.get('item_id', type=int)
    location_id = request.args.get('location_id', type=int)
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 50, type=int)
    
    query = StockTransfer.query
    
    if item_id:
        query = query.filter_by(item_id=item_id)
    
    if location_id:
        query = query.filter(
            or_(
                StockTransfer.from_location_id == location_id,
                StockTransfer.to_location_id == location_id
            )
        )
    
    query = query.order_by(StockTransfer.transfer_date.desc())
    paginated = query.paginate(page=page, per_page=per_page, error_out=False)
    
    result = []
    for transfer in paginated.items:
        transfer_dict = transfer.to_dict()
        
        # Enrich with related data
        item = Item.query.get(transfer.item_id)
        from_loc = Location.query.get(transfer.from_location_id) if transfer.from_location_id else None
        to_loc = Location.query.get(transfer.to_location_id)
        user = User.query.get(transfer.transferred_by) if transfer.transferred_by else None
        
        transfer_dict['item'] = item.to_dict() if item else None
        transfer_dict['from_location'] = from_loc.to_dict() if from_loc else None
        transfer_dict['to_location'] = to_loc.to_dict() if to_loc else None
        transfer_dict['transferred_by_name'] = user.username if user else 'Unknown'
        
        result.append(transfer_dict)
    
    return jsonify({
        'transfers': result,
        'total': paginated.total,
        'pages': paginated.pages,
        'current_page': page
    }), 200
