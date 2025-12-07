# MindPal - Clinical Notes for Psychologists

A professional, production-ready clinical notes management system with AI-powered features built for psychologists. Developed as a full-stack monorepo using modern web technologies.

## 🚀 Features

### ✨ Implemented (Authentication Feature)

- **User Authentication**
  - JWT-based authentication with access (15min) and refresh (30d) tokens
  - Argon2 password hashing for maximum security
  - Secure token refresh mechanism
  - Role-based access control (psychologist, admin)
  - Email/password login and registration
  - Password reset flow (email stubbed for development)

- **User Management**
  - User profile viewing and editing
  - Password change functionality
  - Clinic association support

- **Professional UI/UX**
  - Modern, clean design inspired by Factorial
  - Dark mode support
  - Mobile-responsive layouts
  - Gradient accents and smooth animations
  - Accessible components using Shadcn UI

## 🛠️ Tech Stack

### Backend
- **Framework**: FastAPI 0.104.1
- **Database**: PostgreSQL 15 with SQLAlchemy 2.0
- **Search**: Elasticsearch 8.x (ready for future features)
- **Authentication**: PyJWT with Argon2 password hashing
- **Migrations**: Alembic
- **Testing**: pytest with coverage
- **Code Quality**: Ruff, Black, mypy

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 3
- **UI Components**: Shadcn UI
- **State Management**: Zustand
- **Data Fetching**: TanStack React Query (React Query v5)
- **Forms**: React Hook Form with Zod validation
- **HTTP Client**: Axios with interceptors

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Database**: PostgreSQL 15
- **Search Engine**: Elasticsearch 8.11
- **CI/CD**: GitHub Actions

## 📋 Prerequisites

- **Docker** and **Docker Compose** (recommended for easiest setup)
- **Node.js** 18+ and **npm** (for frontend development)
- **Python** 3.11+ (for backend development)
- **PostgreSQL** 15+ (if not using Docker)

## 🚀 Quick Start with Docker

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd mindpal
   ```

2. **Set up backend environment**
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env and add your secret keys (see Environment Variables section)
   cd ..
   ```

3. **Set up frontend environment**
   ```bash
   cd frontend
   cp .env.local.example .env.local
   cd ..
   ```

4. **Start all services**
   ```bash
   docker-compose up -d
   ```

5. **Apply database migrations**
   ```bash
   docker-compose exec api alembic upgrade head
   ```

6. **Seed test data** (optional)
   ```bash
   docker-compose exec api python -m app.db.seed
   ```

7. **Access the applications**
   - **Frontend**: http://localhost:3000
   - **Backend API**: http://localhost:8000
   - **API Documentation**: http://localhost:8000/docs

### Test Accounts (if seeded)
- **Admin**: admin@mindpal.com / admin123
- **Psychologist**: dr.smith@mindpal.com / psychologist123

## 🔧 Development Setup

### Backend Development

1. **Create virtual environment**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Run migrations**
   ```bash
   alembic upgrade head
   ```

5. **Run development server**
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

6. **Run tests**
   ```bash
   pytest tests/ -v --cov=app
   ```

### Frontend Development

1. **Install dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Set up environment**
   ```bash
   cp .env.local.example .env.local
   ```

3. **Run development server**
   ```bash
   npm run dev
   ```

4. **Build for production**
   ```bash
   npm run build
   npm start
   ```

5. **Run linter**
   ```bash
   npm run lint
   ```

## 🔐 Environment Variables

### Backend (.env)

```bash
# Database
DATABASE_URL=postgresql://mindpal:password@localhost:5432/mindpal

# Elasticsearch
ELASTICSEARCH_URL=http://localhost:9200

# JWT Configuration (CHANGE IN PRODUCTION!)
JWT_SECRET_KEY=<generate-with-openssl-rand-hex-32>
JWT_REFRESH_SECRET_KEY=<generate-with-openssl-rand-hex-32>
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=30

# CORS
BACKEND_CORS_ORIGINS=["http://localhost:3000"]

# Google Gemini API (for future AI features)
GOOGLE_GEMINI_API_KEY=your-api-key-here
```

### Frontend (.env.local)

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

## 📚 API Documentation

Once the backend is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Key Endpoints

#### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login and receive tokens
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - Revoke refresh token
- `POST /api/v1/auth/password-reset-request` - Request password reset
- `POST /api/v1/auth/password-reset-confirm` - Confirm password reset

#### User Management
- `GET /api/v1/users/me` - Get current user profile
- `PATCH /api/v1/users/me` - Update user profile
- `PATCH /api/v1/users/me/password` - Change password

## 🗄️ Database Migrations

### Create a new migration
```bash
cd backend
alembic revision --autogenerate -m "Description of changes"
```

### Apply migrations
```bash
alembic upgrade head
```

### Rollback migration
```bash
alembic downgrade -1
```

## 🧪 Testing

### Backend Tests
```bash
cd backend
pytest tests/ -v --cov=app --cov-report=html
```

View coverage report: `backend/htmlcov/index.html`

### Frontend Tests
```bash
cd frontend
npm test
```

## 🏗️ Project Structure

```
mindpal/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── api/v1/          # API endpoints
│   │   ├── core/            # Config, security, dependencies
│   │   ├── db/              # Database session and seeds
│   │   ├── models/          # SQLAlchemy models
│   │   ├── schemas/         # Pydantic schemas
│   │   ├── services/        # Business logic
│   │   └── main.py          # FastAPI app
│   ├── alembic/             # Database migrations
│   ├── tests/               # Pytest tests
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/                # Next.js frontend
│   ├── src/
│   │   ├── app/             # App Router pages
│   │   ├── components/      # React components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── lib/             # Utilities and API client
│   │   ├── stores/          # Zustand stores
│   │   └── types/           # TypeScript types
│   ├── public/
│   ├── package.json
│   └── tailwind.config.ts
├── docker-compose.yml       # Docker orchestration
└── README.md
```

## 🎨 Design System

The application uses a modern, professional design inspired by Factorial:

- **Colors**: Blue and purple gradient accents
- **Typography**: Inter font family
- **Components**: Shadcn UI component library
- **Dark Mode**: System-aware with manual toggle
- **Responsive**: Mobile-first design approach

## 🔒 Security Best Practices

- ✅ Passwords hashed with Argon2 (industry standard)
- ✅ JWT tokens with separate access and refresh tokens
- ✅ Refresh tokens stored hashed in database for revocation
- ✅ Short-lived access tokens (15 minutes)
- ✅ HTTP-only cookies ready (currently using localStorage for demo)
- ✅ CORS configuration
- ✅ SQL injection protection via SQLAlchemy ORM
- ✅ Input validation with Pydantic and Zod

## 🚧 Roadmap

### Upcoming Features
- [ ] Patient management (CRUD operations)
- [ ] Clinical notes creation and editing
- [ ] Note templates system
- [ ] AI-powered note enhancement (Google Gemini integration)
- [ ] Full-text search with Elasticsearch
- [ ] Conceptualization split files
- [ ] Export and reporting
- [ ] Admin dashboard

## 📝 License

[Your License Here]

## 👥 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

For support, email [your-email@example.com] or open an issue in the repository.

---

**Built with ❤️ for psychologists by the MindPal team**
