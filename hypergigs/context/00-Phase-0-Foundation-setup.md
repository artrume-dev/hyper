# System Design Document (SDD) - Phase 0
## Foundation & Project Setup

**Phase:** 0 - Foundation  
**Duration:** 2 weeks  
**Priority:** P0 (Critical)  
**Status:** Planning

---

## Phase 0 Overview

### Goals
- Establish project structure and development environment
- Set up database schema and ORM
- Implement authentication system
- Create core UI components library
- Configure testing infrastructure
- Establish CI/CD pipeline

### Dependencies
- The complete existing project code are in this Teamstack main folder here. 
- And sub-folders contain: teamstack-api, teamstack-ui, and teamstack-webapp code. Please refer the the code step by step before implementing any new feature. 

### Success Criteria
- [ ] Project builds successfully in dev environment
- [ ] Database migrations working
- [ ] Authentication flow functional
- [ ] Basic component library in place
- [ ] Testing framework operational
- [ ] Documentation complete

---

## Architecture Overview

```
┌────────────────────────────────────────────────────────────────┐
│                       Client Layer                             │
│  React 18 + TypeScript + ShadCN-UI + Tailwind Socket.io Client │
└────────────────────────┬───────────────────────────────────────┘
                         │ HTTPS/WSS
┌────────────────────────▼────────────────────────────────────┐
│                     API Gateway Layer                       │
│              Express + TypeScript + CORS                    │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                   Business Logic Layer                      │
│         Controllers + Services + Middleware                 │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                    Data Access Layer                        │
│                  Prisma ORM + Models                        │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                     Database Layer                          │
│            SQLite (dev) / PostgreSQL (prod)                 │
└─────────────────────────────────────────────────────────────┘
```

---

## Feature Tasks

### Task 0.1: Project Initialization
**Branch:** `feature/0.1-project-setup`  
**Assignee:** TBD

#### Subtasks
- [ ] Create monorepo structure
- [ ] Initialize frontend React app with Vite
- [ ] Initialize backend Express app
- [ ] Configure TypeScript for both projects
- [ ] Set up ESLint and Prettier
- [ ] Configure environment variables
- [ ] Create README with setup instructions

#### Technical Specifications

**Directory Structure:**
```
teamstack-platform/
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── deploy.yml
├── packages/
│   ├── frontend/
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── pages/
│   │   │   ├── hooks/
│   │   │   ├── services/
│   │   │   ├── utils/
│   │   │   ├── types/
│   │   │   ├── App.tsx
│   │   │   └── main.tsx
│   │   ├── public/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── vite.config.ts
│   │   └── index.html
│   └── backend/
│       ├── src/
│       │   ├── controllers/
│       │   ├── services/
│       │   ├── middleware/
│       │   ├── routes/
│       │   ├── models/
│       │   ├── utils/
│       │   ├── types/
│       │   ├── config/
│       │   └── server.ts
│       ├── prisma/
│       │   ├── schema.prisma
│       │   └── migrations/
│       ├── tests/
│       ├── package.json
│       └── tsconfig.json
├── .gitignore
├── .prettierrc
├── .eslintrc.js
├── package.json
└── README.md
```

**package.json (root):**
```json
{
  "name": "teamstack-platform",
  "private": true,
  "workspaces": ["packages/*"],
  "scripts": {
    "dev": "concurrently \"npm run dev:backend\" \"npm run dev:frontend\"",
    "dev:frontend": "npm run dev --workspace=packages/frontend",
    "dev:backend": "npm run dev --workspace=packages/backend",
    "build": "npm run build --workspaces",
    "test": "npm run test --workspaces",
    "lint": "npm run lint --workspaces"
  }
}
```

#### Acceptance Criteria
- Project builds without errors
- Development server runs successfully
- Linting passes
- Environment variables load correctly

---

### Task 0.2: Database Schema Design
**Branch:** `feature/0.2-database-schema`  
**Estimated Time:** 3 days  
**Assignee:** TBD

#### Subtasks
- [ ] Design initial database schema
- [ ] Create Prisma schema file
- [ ] Configure database connections
- [ ] Create seed data scripts
- [ ] Write migration scripts
- [ ] Document schema decisions

#### Technical Specifications

**Prisma Schema (prisma/schema.prisma):**
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum UserRole {
  FREELANCER
  AGENCY
  STARTUP
}

enum TeamType {
  PROJECT
  AGENCY
  STARTUP
}

enum InvitationStatus {
  PENDING
  ACCEPTED
  DECLINED
  EXPIRED
}

enum TeamRole {
  OWNER
  ADMIN
  MEMBER
}

model User {
  id                String    @id @default(uuid())
  email             String    @unique
  password          String
  firstName         String
  lastName          String
  username          String?   @unique
  role              UserRole  @default(FREELANCER)
  avatar            String?
  bio               String?
  skills            String[]
  location          String?
  website           String?
  isVerified        Boolean   @default(false)
  isActive          Boolean   @default(true)
  lastLoginAt       DateTime?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  // Relations
  teamMemberships   TeamMember[]
  sentInvitations   Invitation[] @relation("InvitationSender")
  receivedInvitations Invitation[] @relation("InvitationReceiver")
  followers         Follow[]     @relation("Following")
  following         Follow[]     @relation("Follower")
  sentMessages      Message[]    @relation("MessageSender")
  receivedMessages  Message[]    @relation("MessageReceiver")
  
  @@index([email])
  @@index([username])
}

model Team {
  id          String    @id @default(uuid())
  name        String
  slug        String    @unique
  description String?
  avatar      String?
  type        TeamType  @default(PROJECT)
  isActive    Boolean   @default(true)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  // Relations
  members     TeamMember[]
  sentInvitations     Invitation[] @relation("TeamInvitationSender")
  receivedInvitations Invitation[] @relation("TeamInvitationReceiver")
  
  @@index([slug])
}

model TeamMember {
  id        String    @id @default(uuid())
  userId    String
  teamId    String
  role      TeamRole  @default(MEMBER)
  joinedAt  DateTime  @default(now())
  
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  team      Team      @relation(fields: [teamId], references: [id], onDelete: Cascade)
  
  @@unique([userId, teamId])
  @@index([userId])
  @@index([teamId])
}

model Invitation {
  id          String           @id @default(uuid())
  senderId    String
  receiverId  String?
  teamId      String?
  targetTeamId String?
  status      InvitationStatus @default(PENDING)
  message     String?
  expiresAt   DateTime
  respondedAt DateTime?
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt
  
  sender      User             @relation("InvitationSender", fields: [senderId], references: [id], onDelete: Cascade)
  receiver    User?            @relation("InvitationReceiver", fields: [receiverId], references: [id], onDelete: Cascade)
  team        Team?            @relation("TeamInvitationSender", fields: [teamId], references: [id], onDelete: Cascade)
  targetTeam  Team?            @relation("TeamInvitationReceiver", fields: [targetTeamId], references: [id], onDelete: Cascade)
  
  @@index([senderId])
  @@index([receiverId])
  @@index([status])
}

model Follow {
  id          String   @id @default(uuid())
  followerId  String
  followingId String
  createdAt   DateTime @default(now())
  
  follower    User     @relation("Follower", fields: [followerId], references: [id], onDelete: Cascade)
  following   User     @relation("Following", fields: [followingId], references: [id], onDelete: Cascade)
  
  @@unique([followerId, followingId])
  @@index([followerId])
  @@index([followingId])
}

model Message {
  id         String   @id @default(uuid())
  senderId   String
  receiverId String
  content    String
  isRead     Boolean  @default(false)
  readAt     DateTime?
  createdAt  DateTime @default(now())
  
  sender     User     @relation("MessageSender", fields: [senderId], references: [id], onDelete: Cascade)
  receiver   User     @relation("MessageReceiver", fields: [receiverId], references: [id], onDelete: Cascade)
  
  @@index([senderId])
  @@index([receiverId])
  @@index([createdAt])
}
```

**Migration Commands:**
```bash
# Create migration
npx prisma migrate dev --name init

# Generate Prisma Client
npx prisma generate

# Seed database
npx prisma db seed
```

#### Acceptance Criteria
- Schema compiles without errors
- Migrations run successfully
- Seed data populates correctly
- All relationships defined properly

---

### Task 0.3: Authentication System
**Branch:** `feature/0.3-authentication`  
**Estimated Time:** 4 days  
**Assignee:** TBD

#### Subtasks
- [ ] Implement JWT token generation
- [ ] Create authentication middleware
- [ ] Build register endpoint
- [ ] Build login endpoint
- [ ] Build logout endpoint
- [ ] Implement password hashing
- [ ] Add refresh token logic
- [ ] Create password reset flow

#### Technical Specifications

**Auth Service (backend/src/services/auth.service.ts):**
```typescript
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export class AuthService {
  private readonly JWT_SECRET = process.env.JWT_SECRET!;
  private readonly JWT_EXPIRES_IN = '7d';
  
  async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: string;
  }) {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    });
    
    if (existingUser) {
      throw new Error('User already exists');
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 12);
    
    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role as any
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true
      }
    });
    
    // Generate token
    const token = this.generateToken({
      userId: user.id,
      email: user.email,
      role: user.role
    });
    
    return { user, token };
  }
  
  async login(email: string, password: string) {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });
    
    if (!user) {
      throw new Error('Invalid credentials');
    }
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }
    
    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });
    
    // Generate token
    const token = this.generateToken({
      userId: user.id,
      email: user.email,
      role: user.role
    });
    
    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      },
      token
    };
  }
  
  private generateToken(payload: TokenPayload): string {
    return jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: this.JWT_EXPIRES_IN
    });
  }
  
  verifyToken(token: string): TokenPayload {
    return jwt.verify(token, this.JWT_SECRET) as TokenPayload;
  }
}
```

**Auth Middleware (backend/src/middleware/auth.middleware.ts):**
```typescript
import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';

const authService = new AuthService();

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const decoded = authService.verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};
```

**Auth Routes (backend/src/routes/auth.routes.ts):**
```typescript
import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';

const router = Router();
const authController = new AuthController();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.get('/me', authenticate, authController.getCurrentUser);

export default router;
```

#### Acceptance Criteria
- Users can register successfully
- Users can login and receive JWT
- Protected routes require authentication
- Passwords are securely hashed
- Tokens expire correctly

---

### Task 0.4: Core UI Components
**Branch:** `feature/0.4-ui-components`  
**Estimated Time:** 3 days  
**Assignee:** TBD

#### Subtasks
- [ ] Set up Material-UI theme
- [ ] Create Button component
- [ ] Create Input component
- [ ] Create Card component
- [ ] Create Layout components
- [ ] Create Loading states
- [ ] Create Error states
- [ ] Document component usage

#### Technical Specifications

**Theme Configuration (frontend/src/theme/index.ts):**
```typescript
import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
    },
    secondary: {
      main: '#dc004e',
      light: '#e33371',
      dark: '#9a0036',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '10px 24px',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        },
      },
    },
  },
});
```

**Layout Component (frontend/src/components/Layout/MainLayout.tsx):**
```typescript
import React from 'react';
import { Box, Container, AppBar, Toolbar, Typography } from '@mui/material';

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Teamstack
          </Typography>
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, flex: 1 }}>
        {children}
      </Container>
    </Box>
  );
};
```

#### Component List
- MainLayout
- AppBar/Navigation
- Button (variants: primary, secondary, text)
- TextField
- Card
- Avatar
- Badge
- Chip
- LoadingSpinner
- ErrorMessage
- EmptyState

#### Acceptance Criteria
- All components render correctly
- Components are responsive
- Theme applies consistently
- Components documented in Storybook (optional)

---

### Task 0.5: Testing Infrastructure
**Branch:** `feature/0.5-testing-setup`  
**Estimated Time:** 2 days  
**Assignee:** TBD

#### Subtasks
- [ ] Configure Vitest for backend
- [ ] Configure React Testing Library
- [ ] Set up