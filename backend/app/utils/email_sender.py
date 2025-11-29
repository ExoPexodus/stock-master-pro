"""
SMTP email sending utility.
Configured via environment variables.
"""
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from flask import current_app


def send_email(to_email, subject, body):
    """
    Send email using SMTP configuration from environment variables.
    
    Required environment variables:
    - SMTP_HOST: SMTP server host
    - SMTP_PORT: SMTP server port
    - SMTP_USER: SMTP username
    - SMTP_PASSWORD: SMTP password
    - SMTP_FROM_EMAIL: From email address
    """
    try:
        smtp_host = os.getenv('SMTP_HOST')
        smtp_port = int(os.getenv('SMTP_PORT', 587))
        smtp_user = os.getenv('SMTP_USER')
        smtp_password = os.getenv('SMTP_PASSWORD')
        from_email = os.getenv('SMTP_FROM_EMAIL', smtp_user)
        
        if not all([smtp_host, smtp_user, smtp_password]):
            current_app.logger.warning('SMTP not configured. Email not sent.')
            return False
        
        msg = MIMEMultipart()
        msg['From'] = from_email
        msg['To'] = to_email
        msg['Subject'] = subject
        msg.attach(MIMEText(body, 'plain'))
        
        server = smtplib.SMTP(smtp_host, smtp_port)
        server.starttls()
        server.login(smtp_user, smtp_password)
        server.send_message(msg)
        server.quit()
        
        current_app.logger.info(f'Email sent to {to_email}: {subject}')
        return True
    except Exception as e:
        current_app.logger.error(f'Failed to send email: {str(e)}')
        return False
