from flask import Flask
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
    
    # Configuration
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key')
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'jwt-secret-key')
    app.config['MAX_CONTENT_LENGTH'] = int(os.getenv('MAX_CONTENT_LENGTH', 52428800))
    app.config['UPLOAD_FOLDER'] = os.getenv('UPLOAD_FOLDER', '/tmp/uploads')
    
    # Initialize extensions
    db.init_app(app)
    jwt.init_app(app)
    
    # CORS configuration
    cors_origins = os.getenv('CORS_ORIGINS', '*').split(',')
    CORS(app, resources={r"/api/*": {"origins": cors_origins}})
    
    # Register blueprints
    from app.routes import auth, items, categories, warehouses, suppliers, orders, reports, imports
    
    app.register_blueprint(auth.bp)
    app.register_blueprint(items.bp)
    app.register_blueprint(categories.bp)
    app.register_blueprint(warehouses.bp)
    app.register_blueprint(suppliers.bp)
    app.register_blueprint(orders.bp)
    app.register_blueprint(reports.bp)
    app.register_blueprint(imports.bp)
    
    # Create tables
    with app.app_context():
        db.create_all()
    
    return app
