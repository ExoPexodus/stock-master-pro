from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from dotenv import load_dotenv
import os

load_dotenv()

db = SQLAlchemy()
jwt = JWTManager()

def create_app():
    app = Flask(__name__)
    
    # Disable strict slashes to prevent 308 redirects
    app.url_map.strict_slashes = False
    
    # Configuration
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key')
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'jwt-secret-key')
    app.config['JWT_TOKEN_LOCATION'] = ['headers']
    app.config['JWT_HEADER_NAME'] = 'Authorization'
    app.config['JWT_HEADER_TYPE'] = 'Bearer'
    app.config['MAX_CONTENT_LENGTH'] = int(os.getenv('MAX_CONTENT_LENGTH', 52428800))
    app.config['UPLOAD_FOLDER'] = os.getenv('UPLOAD_FOLDER', '/tmp/uploads')
    
    # Initialize extensions
    db.init_app(app)
    jwt.init_app(app)
    
    # JWT error handlers
    @jwt.invalid_token_loader
    def invalid_token_callback(error_string):
        app.logger.error(f'❌ Invalid JWT token: {error_string}')
        return jsonify({'error': 'Invalid token', 'details': error_string}), 422
    
    @jwt.unauthorized_loader
    def unauthorized_callback(error_string):
        app.logger.error(f'❌ Missing JWT token: {error_string}')
        return jsonify({'error': 'Missing authorization header', 'details': error_string}), 422
    
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        app.logger.error(f'❌ Expired JWT token')
        return jsonify({'error': 'Token has expired'}), 401
    
    # Request logging
    @app.before_request
    def log_request():
        app.logger.info(f'🔵 {request.method} {request.path}')
        # Log headers but hide sensitive data
        headers = dict(request.headers)
        if 'Authorization' in headers:
            headers['Authorization'] = 'Bearer [REDACTED]'
        app.logger.info(f'   Headers: {headers}')
        # Don't consume the request body - just log if it exists
        if request.is_json:
            app.logger.info(f'   Has JSON body: True')
    
    @app.after_request
    def log_response(response):
        app.logger.info(f'🔵 Response: {response.status}')
        return response
    
    # Global error handler (but don't catch JWT errors)
    @app.errorhandler(Exception)
    def handle_exception(e):
        # Don't catch JWT-related errors - let JWT error handlers deal with them
        from jwt.exceptions import PyJWTError
        if isinstance(e, PyJWTError):
            app.logger.error(f'❌ JWT Error (will be handled by JWT handler): {str(e)}', exc_info=True)
            raise e
        
        app.logger.error(f'❌ Unhandled exception: {str(e)}', exc_info=True)
        app.logger.error(f'   Exception type: {type(e).__name__}')
        app.logger.error(f'   Exception details: {repr(e)}')
        return jsonify({'error': str(e), 'type': type(e).__name__}), 400
    
    # CORS configuration - DISABLED
    # cors_origins = os.getenv('CORS_ORIGINS', '*').split(',')
    # CORS(app, 
    #      resources={r"/api/*": {"origins": cors_origins}},
    #      supports_credentials=True,
    #      allow_headers=["Content-Type", "Authorization", "Access-Control-Allow-Credentials"],
    #      methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    #      expose_headers=["Content-Type", "Authorization"]
    # )
    
    # Register blueprints
    from app.routes import auth, items, categories, warehouses, suppliers, orders, reports, imports, custom_fields
    
    app.register_blueprint(auth.bp)
    app.register_blueprint(items.bp)
    app.register_blueprint(categories.bp)
    app.register_blueprint(warehouses.bp)
    app.register_blueprint(suppliers.bp)
    app.register_blueprint(orders.bp)
    app.register_blueprint(reports.bp)
    app.register_blueprint(imports.bp)
    app.register_blueprint(custom_fields.bp)
    app.register_blueprint(reports.bp)
    app.register_blueprint(imports.bp)
    
    # Create tables
    with app.app_context():
        db.create_all()
    
    return app
