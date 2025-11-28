from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import Category, AuditLog
from app.utils.decorators import role_required

bp = Blueprint('categories', __name__, url_prefix='/api/categories')

@bp.route('/', methods=['GET'])
@jwt_required()
def get_categories():
    categories = Category.query.all()
    return jsonify([cat.to_dict() for cat in categories]), 200


@bp.route('/<int:category_id>', methods=['GET'])
@jwt_required()
def get_category(category_id):
    category = Category.query.get_or_404(category_id)
    result = category.to_dict()
    result['subcategories'] = [sub.to_dict() for sub in category.subcategories]
    return jsonify(result), 200


@bp.route('/', methods=['POST'])
@jwt_required()
@role_required(['admin', 'manager'])
def create_category():
    data = request.get_json()
    identity = get_jwt_identity()
    
    if not data or not data.get('name'):
        return jsonify({'error': 'Name is required'}), 400
    
    category = Category(
        name=data['name'],
        description=data.get('description'),
        parent_id=data.get('parent_id')
    )
    
    db.session.add(category)
    db.session.commit()
    
    log = AuditLog(
        user_id=int(identity),
        action='CREATE',
        entity_type='Category',
        entity_id=category.id,
        details=f'Created category: {category.name}'
    )
    db.session.add(log)
    db.session.commit()
    
    return jsonify(category.to_dict()), 201


@bp.route('/<int:category_id>', methods=['PUT'])
@jwt_required()
@role_required(['admin', 'manager'])
def update_category(category_id):
    category = Category.query.get_or_404(category_id)
    data = request.get_json()
    identity = get_jwt_identity()
    
    if 'name' in data:
        category.name = data['name']
    if 'description' in data:
        category.description = data['description']
    if 'parent_id' in data:
        category.parent_id = data['parent_id']
    
    db.session.commit()
    
    log = AuditLog(
        user_id=int(identity),
        action='UPDATE',
        entity_type='Category',
        entity_id=category.id,
        details=f'Updated category: {category.name}'
    )
    db.session.add(log)
    db.session.commit()
    
    return jsonify(category.to_dict()), 200


@bp.route('/<int:category_id>', methods=['DELETE'])
@jwt_required()
@role_required(['admin'])
def delete_category(category_id):
    category = Category.query.get_or_404(category_id)
    identity = get_jwt_identity()
    
    log = AuditLog(
        user_id=int(identity),
        action='DELETE',
        entity_type='Category',
        entity_id=category.id,
        details=f'Deleted category: {category.name}'
    )
    db.session.add(log)
    
    db.session.delete(category)
    db.session.commit()
    
    return jsonify({'message': 'Category deleted successfully'}), 200
