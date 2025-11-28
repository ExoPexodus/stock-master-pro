# Inventory Management System - Deployment Guide

## Prerequisites

- Docker and Docker Compose installed
- PostgreSQL (if running database separately)
- Redis (for Celery background tasks)
- Python 3.11+ (for local backend development)
- Node.js 20+ (for local frontend development)

## Quick Start with Docker Compose

### 1. Clone and Configure

```bash
# Clone the repository
git clone <your-repo-url>
cd inventory-management-system

# Create environment file for backend
cp backend/.env.example backend/.env

# Edit backend/.env and update:
# - SECRET_KEY (generate a strong random key)
# - JWT_SECRET_KEY (generate a strong random key)
# - Other configuration as needed

# Create environment file for frontend
cp .env.example .env

# Edit .env and update:
# - VITE_API_URL (your backend API URL)
```

### 2. Build and Run

```bash
# Build and start all containers
docker-compose up --build -d

# Check container status
docker-compose ps

# View logs
docker-compose logs -f
```

### 3. Initialize Database

The database will be automatically initialized with the schema from `db-init/init.sql`.

Default admin credentials:
- Username: `admin`
- Password: `admin123` (CHANGE THIS IMMEDIATELY!)

### 4. Access the Application

- Frontend: http://localhost:80
- Backend API: http://localhost:5000
- Database: localhost:5432

## Celery and Redis Setup

### What is Celery?

Celery is a distributed task queue that handles background job processing. In this application, it's used for processing large file imports asynchronously.

### What is Redis?

Redis is an in-memory data store used as a message broker for Celery. It queues tasks and stores results.

### Setup Instructions

#### Using Docker Compose (Recommended)

Redis and Celery worker are already configured in `docker-compose.yml`. They start automatically when you run:

```bash
docker-compose up -d
```

#### Manual Setup (Without Docker)

1. **Install Redis:**

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install redis-server
sudo systemctl start redis
sudo systemctl enable redis

# macOS
brew install redis
brew services start redis

# Windows
# Download from https://github.com/microsoftarchive/redis/releases
```

2. **Verify Redis is running:**

```bash
redis-cli ping
# Should return: PONG
```

3. **Start Celery Worker:**

```bash
cd backend
celery -A app.tasks worker --loglevel=info
```

4. **Start Celery Beat (for scheduled tasks - optional):**

```bash
celery -A app.tasks beat --loglevel=info
```

### Monitoring Celery

1. **Using Flower (Web-based monitoring):**

```bash
pip install flower
celery -A app.tasks flower
# Access at http://localhost:5555
```

2. **Using command line:**

```bash
# Check active tasks
celery -A app.tasks inspect active

# Check registered tasks
celery -A app.tasks inspect registered

# Check worker status
celery -A app.tasks status
```

## Individual Container Deployment

### Frontend Only

```bash
# Build frontend
docker build -t inventory-frontend .

# Run frontend
docker run -d -p 80:80 --name inventory-frontend inventory-frontend
```

### Backend Only

```bash
# Build backend
docker build -t inventory-backend ./backend

# Run backend (with environment variables)
docker run -d -p 5000:5000 \
  -e DATABASE_URL=postgresql://user:pass@host:5432/db \
  -e CELERY_BROKER_URL=redis://redis:6379/0 \
  -e CELERY_RESULT_BACKEND=redis://redis:6379/0 \
  --name inventory-backend \
  inventory-backend
```

## Production Deployment

### Security Checklist

1. **Change default credentials:**
   - Update admin password in database
   - Generate strong SECRET_KEY and JWT_SECRET_KEY
   - Update database credentials

2. **Environment Variables:**
   - Never commit `.env` files to version control
   - Use secure password generation tools
   - Rotate keys periodically

3. **Database:**
   - Use strong passwords
   - Enable SSL connections
   - Regular backups
   - Limit network access

4. **CORS Configuration:**
   - Update CORS_ORIGINS to include only your frontend domain
   - Remove localhost origins in production

5. **Nginx/Reverse Proxy:**
   - Enable HTTPS with SSL certificates
   - Configure rate limiting
   - Set up proper security headers

### Scaling Considerations

1. **Database:**
   - Set up PostgreSQL replication
   - Enable connection pooling
   - Configure proper indexes

2. **Celery Workers:**
   - Run multiple worker instances
   - Use Celery's autoscaling
   - Monitor queue lengths

3. **Redis:**
   - Use Redis Sentinel for high availability
   - Configure persistence
   - Set up monitoring

4. **Application:**
   - Use Gunicorn with multiple workers
   - Enable health checks
   - Set up load balancer

### Kubernetes Deployment (Advanced)

For Kubernetes deployment, create separate manifests for:
- Database StatefulSet
- Redis Deployment
- Backend Deployment
- Celery Worker Deployment
- Frontend Deployment
- Services and Ingress

Example structure:
```
k8s/
├── database/
│   ├── statefulset.yaml
│   └── service.yaml
├── redis/
│   ├── deployment.yaml
│   └── service.yaml
├── backend/
│   ├── deployment.yaml
│   └── service.yaml
├── celery/
│   └── deployment.yaml
├── frontend/
│   ├── deployment.yaml
│   └── service.yaml
└── ingress.yaml
```

## Database Management

### Manual Initialization

```bash
# Connect to database
docker exec -it inventory_db psql -U inventory_user -d inventory_db

# Run initialization script
docker exec -i inventory_db psql -U inventory_user -d inventory_db < db-init/init.sql
```

### Backup

```bash
# Backup database
docker exec inventory_db pg_dump -U inventory_user inventory_db > backup.sql

# Restore database
docker exec -i inventory_db psql -U inventory_user inventory_db < backup.sql
```

### Migrations

For schema changes, you can use Alembic (already included in requirements.txt):

```bash
cd backend

# Initialize migrations (first time only)
flask db init

# Create migration
flask db migrate -m "Description of changes"

# Apply migration
flask db upgrade
```

## Troubleshooting

### Backend won't start

```bash
# Check logs
docker-compose logs backend

# Check database connection
docker exec inventory_backend python -c "from app import db; db.engine.execute('SELECT 1')"
```

### Frontend can't connect to backend

1. Check VITE_API_URL in `.env`
2. Verify CORS_ORIGINS in backend `.env`
3. Check network connectivity

### Celery tasks not processing

```bash
# Check Celery worker logs
docker-compose logs celery_worker

# Check Redis connection
docker exec inventory_redis redis-cli ping

# Verify task registration
docker exec inventory_backend celery -A app.tasks inspect registered
```

### Import jobs failing

1. Check file permissions on /tmp/uploads
2. Verify file format (CSV/Excel)
3. Check Celery worker logs
4. Ensure Redis is running

## Monitoring and Logging

### Application Logs

```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f celery_worker
```

### Health Checks

Backend health endpoint:
```bash
curl http://localhost:5000/api/health
```

Database health:
```bash
docker exec inventory_db pg_isready -U inventory_user
```

### Performance Monitoring

Consider integrating:
- Prometheus for metrics
- Grafana for visualization
- ELK Stack for centralized logging
- Sentry for error tracking

## Support

For issues and questions:
1. Check application logs
2. Review this documentation
3. Check GitHub issues
4. Contact support team

## License

[Your License Here]
