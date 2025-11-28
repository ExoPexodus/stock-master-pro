from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import CustomField, AuditLog
from app.utils.decorators import role_required

bp = Blueprint('custom_fields', __name__, url_prefix='/api/custom-fields')

@bp.route('/', methods=['GET'])
@jwt_required()
def get_custom_fields():
    fields = CustomField.query.order_by(CustomField.sort_order, CustomField.field_label).all()
    return jsonify([field.to_dict() for field in fields]), 200


@bp.route('/', methods=['POST'])
@jwt_required()
@role_required(['admin', 'manager'])
def create_custom_field():
    data = request.get_json()
    identity = get_jwt_identity()
    
    if not data or not data.get('field_key') or not data.get('field_label'):
        return jsonify({'error': 'Missing required fields'}), 400
    
    # Check if field_key already exists
    if CustomField.query.filter_by(field_key=data['field_key']).first():
        return jsonify({'error': 'Field key already exists'}), 400
    
    field = CustomField(
        field_key=data['field_key'],
        field_label=data['field_label'],
        field_type=data.get('field_type', 'text'),
        field_group=data.get('field_group'),
        visible_in_form=data.get('visible_in_form', True),
        visible_in_table=data.get('visible_in_table', False),
        default_value=data.get('default_value'),
        sort_order=data.get('sort_order', 0)
    )
    
    db.session.add(field)
    db.session.commit()
    
    # Log the action
    log = AuditLog(
        user_id=int(identity),
        action='CREATE',
        entity_type='CustomField',
        entity_id=field.id,
        details=f'Created custom field: {field.field_label}'
    )
    db.session.add(log)
    db.session.commit()
    
    return jsonify(field.to_dict()), 201


@bp.route('/<int:field_id>', methods=['PUT'])
@jwt_required()
@role_required(['admin', 'manager'])
def update_custom_field(field_id):
    field = CustomField.query.get_or_404(field_id)
    data = request.get_json()
    identity = get_jwt_identity()
    
    if 'field_label' in data:
        field.field_label = data['field_label']
    if 'field_type' in data:
        field.field_type = data['field_type']
    if 'field_group' in data:
        field.field_group = data['field_group']
    if 'visible_in_form' in data:
        field.visible_in_form = data['visible_in_form']
    if 'visible_in_table' in data:
        field.visible_in_table = data['visible_in_table']
    if 'default_value' in data:
        field.default_value = data['default_value']
    if 'sort_order' in data:
        field.sort_order = data['sort_order']
    
    db.session.commit()
    
    # Log the action
    log = AuditLog(
        user_id=int(identity),
        action='UPDATE',
        entity_type='CustomField',
        entity_id=field.id,
        details=f'Updated custom field: {field.field_label}'
    )
    db.session.add(log)
    db.session.commit()
    
    return jsonify(field.to_dict()), 200


@bp.route('/<int:field_id>', methods=['DELETE'])
@jwt_required()
@role_required(['admin'])
def delete_custom_field(field_id):
    field = CustomField.query.get_or_404(field_id)
    identity = get_jwt_identity()
    
    # Log before deletion
    log = AuditLog(
        user_id=int(identity),
        action='DELETE',
        entity_type='CustomField',
        entity_id=field.id,
        details=f'Deleted custom field: {field.field_label}'
    )
    db.session.add(log)
    
    db.session.delete(field)
    db.session.commit()
    
    return jsonify({'message': 'Custom field deleted successfully'}), 200


@bp.route('/bulk-update', methods=['POST'])
@jwt_required()
@role_required(['admin', 'manager'])
def bulk_update_fields():
    """Bulk update field visibility and sort order"""
    data = request.get_json()
    identity = get_jwt_identity()
    
    if not data or not isinstance(data.get('fields'), list):
        return jsonify({'error': 'Invalid data format'}), 400
    
    try:
        for field_data in data['fields']:
            field = CustomField.query.get(field_data['id'])
            if field:
                if 'visible_in_form' in field_data:
                    field.visible_in_form = field_data['visible_in_form']
                if 'visible_in_table' in field_data:
                    field.visible_in_table = field_data['visible_in_table']
                if 'sort_order' in field_data:
                    field.sort_order = field_data['sort_order']
        
        db.session.commit()
        
        # Log the action
        log = AuditLog(
            user_id=int(identity),
            action='BULK_UPDATE',
            entity_type='CustomField',
            entity_id=None,
            details=f'Bulk updated {len(data["fields"])} custom fields'
        )
        db.session.add(log)
        db.session.commit()
        
        return jsonify({'message': 'Fields updated successfully'}), 200
    
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
