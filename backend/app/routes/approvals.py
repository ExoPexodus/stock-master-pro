from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from app import db
from app.models import PurchaseOrder, ApprovalHistory, AuditLog, User, Supplier
from app.utils.decorators import role_required
from app.utils.email_templates import (
    get_approval_request_template,
    get_approval_granted_template,
    get_approval_rejected_template,
    get_order_sent_template
)
from app.utils.email_sender import send_email

bp = Blueprint('approvals', __name__, url_prefix='/api/approvals')

# Permission matrix for workflow state transitions
WORKFLOW_PERMISSIONS = {
    'draft': {
        'pending_approval': ['admin', 'manager'],
    },
    'pending_approval': {
        'approved': ['admin'],
        'rejected': ['admin'],
        'draft': ['admin', 'manager'],  # Can return to draft
    },
    'approved': {
        'sent_to_vendor': ['admin', 'manager'],
    },
    'sent_to_vendor': {
        'delivered': ['admin', 'manager'],
    },
    'rejected': {
        'draft': ['admin', 'manager'],  # Can resubmit
    },
}


def can_transition(user_role, from_status, to_status):
    """Check if user role can perform status transition"""
    if from_status not in WORKFLOW_PERMISSIONS:
        return False
    if to_status not in WORKFLOW_PERMISSIONS[from_status]:
        return False
    return user_role in WORKFLOW_PERMISSIONS[from_status][to_status]


@bp.route('/purchase-order/<int:order_id>/submit', methods=['POST'])
@jwt_required()
@role_required(['admin', 'manager'])
def submit_for_approval(order_id):
    """Submit PO for approval (draft -> pending_approval)"""
    identity = get_jwt_identity()
    user = User.query.get(int(identity))
    
    order = PurchaseOrder.query.get_or_404(order_id)
    
    if not can_transition(user.role, order.status, 'pending_approval'):
        return jsonify({'error': 'Cannot submit this order for approval'}), 403
    
    old_status = order.status
    order.status = 'pending_approval'
    
    # Create approval history
    history = ApprovalHistory(
        purchase_order_id=order.id,
        user_id=int(identity),
        from_status=old_status,
        to_status='pending_approval',
        comments=request.json.get('comments')
    )
    db.session.add(history)
    
    # Create audit log
    log = AuditLog(
        user_id=int(identity),
        action='SUBMIT_APPROVAL',
        entity_type='PurchaseOrder',
        entity_id=order.id,
        details=f'Submitted PO {order.po_number} for approval'
    )
    db.session.add(log)
    db.session.commit()
    
    # Send email to admins
    admins = User.query.filter_by(role='admin').all()
    supplier = Supplier.query.get(order.supplier_id)
    for admin in admins:
        if admin.email:
            subject, body = get_approval_request_template(
                order.po_number,
                supplier.name if supplier else 'Unknown',
                float(order.total_amount) if order.total_amount else 0,
                admin.username
            )
            send_email(admin.email, subject, body)
    
    return jsonify(order.to_dict()), 200


@bp.route('/purchase-order/<int:order_id>/approve', methods=['POST'])
@jwt_required()
@role_required(['admin'])
def approve_order(order_id):
    """Approve PO (pending_approval -> approved)"""
    identity = get_jwt_identity()
    user = User.query.get(int(identity))
    data = request.get_json()
    
    order = PurchaseOrder.query.get_or_404(order_id)
    
    if not can_transition(user.role, order.status, 'approved'):
        return jsonify({'error': 'Cannot approve this order'}), 403
    
    old_status = order.status
    order.status = 'approved'
    order.approved_by = int(identity)
    order.approved_date = datetime.utcnow()
    order.comments = data.get('comments')
    
    # Create approval history
    history = ApprovalHistory(
        purchase_order_id=order.id,
        user_id=int(identity),
        from_status=old_status,
        to_status='approved',
        comments=data.get('comments')
    )
    db.session.add(history)
    
    # Create audit log
    log = AuditLog(
        user_id=int(identity),
        action='APPROVE',
        entity_type='PurchaseOrder',
        entity_id=order.id,
        details=f'Approved PO {order.po_number}'
    )
    db.session.add(log)
    db.session.commit()
    
    # Send email to requester
    requester = User.query.get(order.created_by)
    supplier = Supplier.query.get(order.supplier_id)
    if requester and requester.email:
        subject, body = get_approval_granted_template(
            order.po_number,
            supplier.name if supplier else 'Unknown',
            float(order.total_amount) if order.total_amount else 0,
            requester.username
        )
        send_email(requester.email, subject, body)
    
    return jsonify(order.to_dict()), 200


@bp.route('/purchase-order/<int:order_id>/reject', methods=['POST'])
@jwt_required()
@role_required(['admin'])
def reject_order(order_id):
    """Reject PO (pending_approval -> rejected)"""
    identity = get_jwt_identity()
    user = User.query.get(int(identity))
    data = request.get_json()
    
    order = PurchaseOrder.query.get_or_404(order_id)
    
    if not can_transition(user.role, order.status, 'rejected'):
        return jsonify({'error': 'Cannot reject this order'}), 403
    
    old_status = order.status
    order.status = 'rejected'
    order.rejected_by = int(identity)
    order.rejected_date = datetime.utcnow()
    order.comments = data.get('comments')
    
    # Create approval history
    history = ApprovalHistory(
        purchase_order_id=order.id,
        user_id=int(identity),
        from_status=old_status,
        to_status='rejected',
        comments=data.get('comments')
    )
    db.session.add(history)
    
    # Create audit log
    log = AuditLog(
        user_id=int(identity),
        action='REJECT',
        entity_type='PurchaseOrder',
        entity_id=order.id,
        details=f'Rejected PO {order.po_number}'
    )
    db.session.add(log)
    db.session.commit()
    
    # Send email to requester
    requester = User.query.get(order.created_by)
    supplier = Supplier.query.get(order.supplier_id)
    if requester and requester.email:
        subject, body = get_approval_rejected_template(
            order.po_number,
            supplier.name if supplier else 'Unknown',
            float(order.total_amount) if order.total_amount else 0,
            requester.username,
            data.get('comments')
        )
        send_email(requester.email, subject, body)
    
    return jsonify(order.to_dict()), 200


@bp.route('/purchase-order/<int:order_id>/send', methods=['POST'])
@jwt_required()
@role_required(['admin', 'manager'])
def send_to_vendor(order_id):
    """Send PO to vendor (approved -> sent_to_vendor)"""
    identity = get_jwt_identity()
    user = User.query.get(int(identity))
    
    order = PurchaseOrder.query.get_or_404(order_id)
    
    if not can_transition(user.role, order.status, 'sent_to_vendor'):
        return jsonify({'error': 'Cannot send this order'}), 403
    
    old_status = order.status
    order.status = 'sent_to_vendor'
    order.sent_date = datetime.utcnow()
    
    # Create approval history
    history = ApprovalHistory(
        purchase_order_id=order.id,
        user_id=int(identity),
        from_status=old_status,
        to_status='sent_to_vendor',
        comments=request.json.get('comments')
    )
    db.session.add(history)
    
    # Create audit log
    log = AuditLog(
        user_id=int(identity),
        action='SEND_TO_VENDOR',
        entity_type='PurchaseOrder',
        entity_id=order.id,
        details=f'Sent PO {order.po_number} to vendor'
    )
    db.session.add(log)
    db.session.commit()
    
    # Send email to supplier
    supplier = Supplier.query.get(order.supplier_id)
    if supplier and supplier.email:
        subject, body = get_order_sent_template(
            order.po_number,
            supplier.name,
            supplier.email,
            float(order.total_amount) if order.total_amount else 0
        )
        send_email(supplier.email, subject, body)
    
    return jsonify(order.to_dict()), 200


@bp.route('/purchase-order/<int:order_id>/deliver', methods=['POST'])
@jwt_required()
@role_required(['admin', 'manager'])
def mark_delivered(order_id):
    """Mark PO as delivered (sent_to_vendor -> delivered)"""
    identity = get_jwt_identity()
    user = User.query.get(int(identity))
    
    order = PurchaseOrder.query.get_or_404(order_id)
    
    if not can_transition(user.role, order.status, 'delivered'):
        return jsonify({'error': 'Cannot mark this order as delivered'}), 403
    
    old_status = order.status
    order.status = 'delivered'
    order.delivered_date = datetime.utcnow()
    
    # Create approval history
    history = ApprovalHistory(
        purchase_order_id=order.id,
        user_id=int(identity),
        from_status=old_status,
        to_status='delivered',
        comments=request.json.get('comments')
    )
    db.session.add(history)
    
    # Create audit log
    log = AuditLog(
        user_id=int(identity),
        action='DELIVER',
        entity_type='PurchaseOrder',
        entity_id=order.id,
        details=f'Marked PO {order.po_number} as delivered'
    )
    db.session.add(log)
    db.session.commit()
    
    return jsonify(order.to_dict()), 200


@bp.route('/purchase-order/<int:order_id>/history', methods=['GET'])
@jwt_required()
def get_approval_history(order_id):
    """Get approval history for a purchase order"""
    history = ApprovalHistory.query.filter_by(purchase_order_id=order_id).order_by(
        ApprovalHistory.timestamp.desc()
    ).all()
    
    result = []
    for h in history:
        user = User.query.get(h.user_id)
        result.append({
            **h.to_dict(),
            'username': user.username if user else 'Unknown'
        })
    
    return jsonify(result), 200
