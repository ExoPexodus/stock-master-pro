# Inventory Management System

A complete, production-ready, self-hosted inventory management web application with Flask backend and React frontend.

## 🚀 Quick Start

```bash
# 1. Configure environment
cp backend/.env.example backend/.env
cp .env.example .env

# 2. Start all services with Docker
docker-compose up --build -d

# 3. Access the application
# Frontend: http://localhost:80
# Backend API: http://localhost:5000
```

**Default Admin Credentials:**
- Username: `admin`
- Password: `admin123` ⚠️ **CHANGE THIS IMMEDIATELY!**

## 📋 Features

### Core Functionality
- ✅ Complete CRUD operations for Items, Categories, Warehouses, Suppliers
- ✅ Stock level management with reorder thresholds
- ✅ Real-time stock adjustments across multiple warehouses
- ✅ Purchase orders and sales orders tracking
- ✅ Goods received notes (GRN) management
- ✅ Comprehensive audit logging
- ✅ User activity tracking

### Import/Export System
- ✅ CSV and Excel file imports with drag-and-drop
- ✅ Column mapping and validation
- ✅ Row-level error reporting
- ✅ Hybrid processing (small files immediate, large files background)
- ✅ Bulk insert and update operations
- ✅ Import history with detailed logs
- ✅ Excel export functionality

### Dashboard & Analytics
- ✅ Real-time inventory statistics
- ✅ Low stock alerts
- ✅ Recent activity feed
- ✅ Advanced filtering and global search

### Security & Access Control
- ✅ JWT-based authentication
- ✅ Role-based access control (Admin, Manager, Viewer)
- ✅ Password hashing with werkzeug
- ✅ API and UI-level permission enforcement

## 🏗️ Architecture

```
Frontend (React + Vite + TypeScript)
         ↓ REST API
Backend (Flask + PostgreSQL + Celery + Redis)
```

**Frontend:** React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui
**Backend:** Flask 3.0, PostgreSQL, Celery, Redis, Pandas

## 📖 Documentation

- **[SETUP.md](SETUP.md)** - Detailed setup instructions including Celery/Redis
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Production deployment guide

## 🔧 Local Development (with Lovable)

This project is built with [Lovable](https://lovable.dev) for the frontend.

### Frontend Development

```sh
# Clone the repository
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>

# Install dependencies
npm i

# Start development server
npm run dev
```

Visit http://localhost:5173 to see the frontend.

### Backend Setup

See [SETUP.md](SETUP.md) for complete backend setup instructions.

Quick backend start:
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python run.py
```

## 📊 Tech Stack

**Frontend:**
- Vite - Fast build tool
- TypeScript - Type safety
- React - UI framework
- shadcn-ui - Component library
- Tailwind CSS - Styling

**Backend:**
- Flask - Python web framework
- PostgreSQL - Database
- Celery - Background tasks
- Redis - Message broker

## 🚢 Deployment

**Option 1: Lovable Hosting (Frontend only)**
Open [Lovable](https://lovable.dev/projects/af9dc70e-0c89-453f-b2f9-4d7fe91eeae3) and click Share -> Publish.

**Option 2: Self-Hosted (Full Stack)**
Use Docker Compose to deploy everything:
```bash
docker-compose up --build -d
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for production deployment details.

## 🎯 User Roles

- **Admin**: Full system access including user management and deletions
- **Manager**: CRUD operations, imports/exports, order management
- **Viewer**: Read-only access to all data and reports

## 📝 API Documentation

Base URL: `http://localhost:5000/api`

### Key Endpoints
- `POST /auth/login` - Authentication
- `GET /items` - List inventory items
- `POST /imports/upload` - Import CSV/Excel
- `GET /reports/dashboard` - Dashboard stats

See backend route files in `backend/app/routes/` for complete API documentation.

## 🐛 Troubleshooting

Check [SETUP.md](SETUP.md) for detailed troubleshooting steps.

Quick checks:
```bash
# View all logs
docker-compose logs -f

# Check specific service
docker-compose logs backend
docker-compose logs celery_worker
```

## 🤝 Contributing

Feel free to fork and customize this project for your needs!

## 📞 Support

- **Setup Issues**: Check [SETUP.md](SETUP.md)
- **Deployment Issues**: Check [DEPLOYMENT.md](DEPLOYMENT.md)
- **Lovable Documentation**: https://docs.lovable.dev

---

**Built with ❤️ using Lovable + Flask**
