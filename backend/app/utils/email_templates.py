"""
Email templates for the inventory management system.
Uses SMTP configuration from environment variables.
"""

def get_approval_request_template(po_number, supplier_name, total_amount, approver_name):
    """Email template for approval request"""
    subject = f"Purchase Order Approval Required - {po_number}"
    body = f"""
Dear {approver_name},

A new purchase order requires your approval:

Purchase Order Number: {po_number}
Supplier: {supplier_name}
Total Amount: ${total_amount}

Please review and approve or reject this purchase order in the system.

Best regards,
Inventory Management System
"""
    return subject, body


def get_approval_granted_template(po_number, supplier_name, total_amount, requester_name):
    """Email template for approval granted"""
    subject = f"Purchase Order Approved - {po_number}"
    body = f"""
Dear {requester_name},

Your purchase order has been approved:

Purchase Order Number: {po_number}
Supplier: {supplier_name}
Total Amount: ${total_amount}

The purchase order is now ready to be sent to the vendor.

Best regards,
Inventory Management System
"""
    return subject, body


def get_approval_rejected_template(po_number, supplier_name, total_amount, requester_name, comments):
    """Email template for approval rejected"""
    subject = f"Purchase Order Rejected - {po_number}"
    body = f"""
Dear {requester_name},

Your purchase order has been rejected:

Purchase Order Number: {po_number}
Supplier: {supplier_name}
Total Amount: ${total_amount}

Comments: {comments or 'No comments provided'}

Please review the feedback and make necessary changes before resubmitting.

Best regards,
Inventory Management System
"""
    return subject, body


def get_order_sent_template(po_number, supplier_name, supplier_email, total_amount):
    """Email template for order sent to vendor"""
    subject = f"Purchase Order - {po_number}"
    body = f"""
Dear {supplier_name},

We would like to place the following purchase order:

Purchase Order Number: {po_number}
Total Amount: ${total_amount}

Please confirm receipt and provide an estimated delivery date.

Best regards,
Inventory Management System
"""
    return subject, body
