# Hypergigs Platform

> Modern freelance platform for digital teams - A complete migration from Teamstack.co

## 🚀 Overview

Hypergigs is a freelance platform connecting digital agencies, startups, and freelancers for project collaboration. Built with modern technologies for scalability, performance, and developer experience.

## 📦 Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for blazing-fast builds
- **ShadCN-UI** + **Tailwind CSS** for beautiful, accessible components
- **React Query** for data fetching and caching
- **Zustand** for state management
- **React Router** for navigation

### Backend
- **Node.js 20** with Express
- **TypeScript** for type safety
- **Prisma ORM** for database management
- **Socket.io** for real-time features
- **JWT** for authentication

### Testing
- **Vitest** for unit and integration tests
- **React Testing Library** for component tests
- **Playwright** for E2E tests

### Database
- **SQLite** (development)
- **PostgreSQL** (production)

## 🏗️ Project Structure

```
hypergigs/
├── packages/
│   ├── backend/          # Express API server
│   └── frontend/         # React application
├── .github/
│   └── workflows/        # CI/CD pipelines
├── package.json          # Root package configuration
└── README.md
```

## 🛠️ Development Setup

### Prerequisites
- Node.js >= 20.0.0
- npm >= 10.0.0

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd hypergigs

# Install dependencies
npm install

# Set up environment variables
cp packages/backend/.env.example packages/backend/.env
cp packages/frontend/.env.example packages/frontend/.env

# Run database migrations
npm run db:migrate -w packages/backend

# Seed the database (optional)
npm run db:seed -w packages/backend
```

### Running the Application

```bash
# Run both frontend and backend
npm run dev

# Run backend only
npm run dev:backend

# Run frontend only
npm run dev:frontend
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001
- API Docs: http://localhost:3001/api-docs

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm test -- --watch
```

## 📝 Development Workflow

This project follows a feature-branch workflow:

1. Create a new branch from `main` for each feature
2. Branch naming: `feature/X.X-feature-name`
3. Write tests before implementing features (TDD)
4. Ensure all tests pass before creating PR
5. Maintain >85% code coverage

### Example:
```bash
# Create feature branch
git checkout -b feature/0.1-project-setup

# Make changes and commit
git add .
git commit -m "feat: initial project setup"

# Push to remote
git push origin feature/0.1-project-setup
```

## 📚 Documentation

- [Phase 0: Foundation Setup](../00-Phase-0-Foundation-setup.md)
- [Phase 1: Core Features](../01-Phase-1-core-features.md)
- [Phase 2: Social Features](../02-Phase-2-Social-features.md)
- [Phase 3: Polish & Migration](../03-Phase-3-polish-migration.md)
- [Migration PRD](../migration-prd.md)
- [TDD Document](../migration-TDD.md)

## 🤝 Contributing

1. Follow the established code style (Prettier + ESLint)
2. Write tests for all new features
3. Update documentation as needed
4. Follow conventional commits specification

## 📄 License

UNLICENSED - Private Project

## 👥 Team

Hypergigs Development Team

---

**Built with ❤️ for the freelance community**
