# Inventory Management System - Setup Guide

## Quick Setup Overview

This system consists of:
- **Frontend**: React + Vite + TypeScript (this repo)
- **Backend**: Flask + PostgreSQL + Celery + Redis (in `backend/` folder)

## Prerequisites

- Docker & Docker Compose
- Node.js 20+ (for local frontend development)
- Python 3.11+ (for local backend development)

## Quick Start (Docker Compose - Recommended)

1. **Configure Environment**

```bash
# Backend configuration
cp backend/.env.example backend/.env
# Edit backend/.env and set your SECRET_KEY and JWT_SECRET_KEY

# Frontend configuration
cp .env.example .env
# Default API URL is http://localhost:5000/api
```

2. **Start All Services**

```bash
docker-compose up --build -d
```

This starts:
- PostgreSQL (port 5432)
- Redis (port 6379)
- Flask Backend (port 5000)
- Celery Worker
- React Frontend (port 80)

3. **Access the Application**

- Frontend: http://localhost:80
- Backend API: http://localhost:5000

**Default Admin Login:**
- Username: `admin`
- Password: `admin123` (CHANGE THIS!)

## Local Development Setup

### Backend Development

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment
cp .env.example .env
# Edit .env with your database and Redis URLs

# Run Flask development server
python run.py
```

### Frontend Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at http://localhost:5173

## Celery & Redis Setup

### Why Celery and Redis?

- **Celery**: Handles background processing for large file imports
- **Redis**: Acts as message broker and result backend for Celery

### Using Docker (Easiest)

Redis and Celery are included in `docker-compose.yml` - they start automatically.

### Manual Setup

**1. Install and Start Redis**

```bash
# Ubuntu/Debian
sudo apt-get update && sudo apt-get install redis-server
sudo systemctl start redis

# macOS
brew install redis
brew services start redis

# Verify Redis is running
redis-cli ping  # Should return PONG
```

**2. Start Celery Worker**

```bash
cd backend
celery -A app.tasks worker --loglevel=info
```

### Monitoring Celery

**Option 1: Flower (Web UI)**

```bash
pip install flower
celery -A app.tasks flower
# Access at http://localhost:5555
```

**Option 2: Command Line**

```bash
# Check active tasks
celery -A app.tasks inspect active

# Check registered tasks
celery -A app.tasks inspect registered
```

## Database Initialization

The database schema is automatically created on first run. The init script is in `db-init/init.sql`.

**Manual initialization:**

```bash
# Connect to PostgreSQL
docker exec -it inventory_db psql -U inventory_user -d inventory_db

# Or run the init script
docker exec -i inventory_db psql -U inventory_user -d inventory_db < db-init/init.sql
```

## Architecture Overview

```
┌─────────────────┐
│  React Frontend │  (Port 80/3000)
│   + Tailwind    │
└────────┬────────┘
         │ HTTP/REST
         ↓
┌─────────────────┐
│  Flask Backend  │  (Port 5000)
│   + JWT Auth    │
│   + RBAC        │
└────────┬────────┘
         │
    ┌────┴────┬────────────┬─────────────┐
    ↓         ↓            ↓             ↓
┌────────┐ ┌──────┐ ┌───────────┐ ┌────────┐
│ Postgre│ │ Redis│ │  Celery   │ │ File   │
│ SQL DB │ │      │ │  Worker   │ │ Storage│
└────────┘ └──────┘ └───────────┘ └────────┘
```

## API Endpoints

Base URL: `http://localhost:5000/api`

### Authentication
- POST `/auth/register` - Register new user
- POST `/auth/login` - Login
- GET `/auth/me` - Get current user

### Items
- GET `/items` - List items (with pagination & search)
- POST `/items` - Create item (admin/manager)
- GET `/items/:id` - Get item details
- PUT `/items/:id` - Update item (admin/manager)
- DELETE `/items/:id` - Delete item (admin only)

### Import/Export
- POST `/imports/upload` - Upload CSV/Excel file
- GET `/imports/jobs/:id` - Get import job status
- GET `/imports/jobs` - List all import jobs
- GET `/imports/export` - Export items to Excel

### Reports
- GET `/reports/dashboard` - Dashboard statistics
- GET `/reports/low-stock` - Low stock items
- GET `/reports/audit-logs` - Audit log history

## Features

### Role-Based Access Control

- **Admin**: Full access to all features
- **Manager**: CRUD operations + imports/exports
- **Viewer**: Read-only access

### Import System

- **Small files** (<5MB): Processed immediately
- **Large files** (≥5MB): Background processing via Celery
- Real-time progress tracking
- Row-level error reporting

### Security

- JWT token authentication
- Password hashing with werkzeug
- CORS protection
- Input validation
- Audit logging

## Production Deployment

See `DEPLOYMENT.md` for detailed production deployment instructions including:
- Security hardening
- HTTPS setup
- Kubernetes deployment
- Monitoring and logging
- Backup strategies

## Troubleshooting

### Backend won't start
```bash
# Check logs
docker-compose logs backend

# Verify database connection
docker exec inventory_backend python -c "from app import db; print('OK')"
```

### Frontend can't connect
1. Check `VITE_API_URL` in `.env`
2. Verify `CORS_ORIGINS` in backend `.env`
3. Ensure backend is running

### Celery not processing
```bash
# Check worker logs
docker-compose logs celery_worker

# Verify Redis
docker exec inventory_redis redis-cli ping
```

## Tech Stack

**Frontend:**
- React 18
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- React Router
- TanStack Query

**Backend:**
- Flask 3.0
- Flask-SQLAlchemy
- Flask-JWT-Extended
- PostgreSQL
- Celery + Redis
- Pandas (for file processing)

## Support

For issues:
1. Check logs: `docker-compose logs -f`
2. Review this documentation
3. Check `DEPLOYMENT.md` for advanced topics
