from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from app import db
from app.models import User

bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@bp.route('/register', methods=['POST'])
def register():
    current_app.logger.info('🔵 Register endpoint called')
    data = request.get_json()
    
    if not data or not data.get('username') or not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Missing required fields'}), 400
    
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'error': 'Username already exists'}), 400
    
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already exists'}), 400
    
    user = User(
        username=data['username'],
        email=data['email'],
        role=data.get('role', 'viewer')
    )
    user.set_password(data['password'])
    
    db.session.add(user)
    db.session.commit()
    
    return jsonify({'message': 'User created successfully', 'user': user.to_dict()}), 201


@bp.route('/login', methods=['POST'])
def login():
    current_app.logger.info('🔵 Login endpoint called')
    data = request.get_json()
    current_app.logger.info(f'🔵 Login attempt for username: {data.get("username") if data else "NO DATA"}')
    
    if not data or not data.get('username') or not data.get('password'):
        current_app.logger.error('❌ Login failed: Missing credentials')
        return jsonify({'error': 'Missing username or password'}), 400
    
    user = User.query.filter_by(username=data['username']).first()
    
    if not user or not user.check_password(data['password']):
        current_app.logger.error(f'❌ Login failed: Invalid credentials for {data["username"]}')
        return jsonify({'error': 'Invalid credentials'}), 401
    
    access_token = create_access_token(identity={'id': user.id, 'role': user.role})
    current_app.logger.info(f'✅ Login successful for {user.username}, token generated')
    
    return jsonify({
        'access_token': access_token,
        'user': user.to_dict()
    }), 200


@bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    current_app.logger.info('🔵 /me endpoint called')
    identity = get_jwt_identity()
    current_app.logger.info(f'🔵 JWT identity: {identity}')
    user = User.query.get(identity['id'])
    
    if not user:
        current_app.logger.error(f'❌ User not found for id: {identity["id"]}')
        return jsonify({'error': 'User not found'}), 404
    
    current_app.logger.info(f'✅ User found: {user.username}')
    return jsonify(user.to_dict()), 200
