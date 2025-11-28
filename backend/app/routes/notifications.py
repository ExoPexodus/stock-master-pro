from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import Notification
from datetime import datetime

bp = Blueprint('notifications', __name__, url_prefix='/api/notifications')

@bp.route('/', methods=['GET'])
@jwt_required()
def get_notifications():
    user_id = int(get_jwt_identity())
    
    # Get recent notifications (last 50)
    notifications = Notification.query.filter_by(
        user_id=user_id
    ).order_by(
        Notification.created_at.desc()
    ).limit(50).all()
    
    return jsonify([notification.to_dict() for notification in notifications]), 200


@bp.route('/<int:notification_id>/read', methods=['POST'])
@jwt_required()
def mark_as_read(notification_id):
    user_id = int(get_jwt_identity())
    
    notification = Notification.query.filter_by(
        id=notification_id,
        user_id=user_id
    ).first_or_404()
    
    notification.is_read = True
    db.session.commit()
    
    return jsonify(notification.to_dict()), 200


@bp.route('/read-all', methods=['POST'])
@jwt_required()
def mark_all_as_read():
    user_id = int(get_jwt_identity())
    
    Notification.query.filter_by(
        user_id=user_id,
        is_read=False
    ).update({'is_read': True})
    
    db.session.commit()
    
    return jsonify({'message': 'All notifications marked as read'}), 200


@bp.route('/unread-count', methods=['GET'])
@jwt_required()
def get_unread_count():
    user_id = int(get_jwt_identity())
    
    count = Notification.query.filter_by(
        user_id=user_id,
        is_read=False
    ).count()
    
    return jsonify({'count': count}), 200


# Helper function to create notifications (to be used by other routes)
def create_notification(user_id: int, notification_type: str, title: str, message: str, 
                       entity_type: str = None, entity_id: int = None):
    """
    Create a new notification for a user
    
    Types: 'low_stock', 'purchase_order_created', 'order_approved', 'order_rejected', 'delivery_completed'
    """
    notification = Notification(
        user_id=user_id,
        type=notification_type,
        title=title,
        message=message,
        entity_type=entity_type,
        entity_id=entity_id
    )
    db.session.add(notification)
    db.session.commit()
    return notification
