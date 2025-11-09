# Test-Driven Development (TDD) Document
## Teamstack.co Migration Project

**Version:** 1.0  
**Date:** October 2025  
**Status:** Active

---

## Table of Contents
1. [Testing Strategy](#testing-strategy)
2. [Testing Tools & Framework](#testing-tools--framework)
3. [Unit Tests](#unit-tests)
4. [Integration Tests](#integration-tests)
5. [End-to-End Tests](#end-to-end-tests)
6. [Performance Tests](#performance-tests)
7. [Security Tests](#security-tests)
8. [Test Coverage Requirements](#test-coverage-requirements)

---

## Testing Strategy

### Testing Pyramid
```
           ╱╲
          ╱E2E╲         10% - End-to-End Tests
         ╱──────╲
        ╱ Integ. ╲      30% - Integration Tests
       ╱──────────╲
      ╱   Unit     ╲    60% - Unit Tests
     ╱──────────────╲
```

### Testing Principles
1. **Write tests before code** (TDD approach)
2. **Test behavior, not implementation**
3. **Keep tests independent and isolated**
4. **Follow AAA pattern** (Arrange, Act, Assert)
5. **Maintain >85% code coverage**
6. **Run tests in CI/CD pipeline**

---

## Testing Tools & Framework

### Backend Testing Stack
```json
{
  "test-framework": "Vitest",
  "assertion-library": "Built-in Vitest",
  "mocking": "Vitest mocks",
  "coverage": "v8",
  "test-database": "SQLite in-memory"
}
```

### Frontend Testing Stack
```json
{
  "test-framework": "Vitest",
  "component-testing": "React Testing Library",
  "user-interaction": "@testing-library/user-event",
  "mocking": "MSW (Mock Service Worker)",
  "e2e": "Playwright"
}
```

---

## Unit Tests

### Backend Unit Tests

#### Authentication Service Tests

**File:** `packages/backend/tests/services/auth.service.spec.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AuthService } from '../../src/services/auth.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const authService = new AuthService();

describe('AuthService', () => {
  beforeEach(async () => {
    await prisma.user.deleteMany();
  });

  describe('register', () => {
    it('should create a new user with hashed password', async () => {
      // Arrange
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        role: 'FREELANCER'
      };

      // Act
      const result = await authService.register(userData);

      // Assert
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(userData.email);
      expect(result.user.firstName).toBe(userData.firstName);
      expect(result.token).toBeDefined();
      expect(result.token).toMatch(/^[\w-]*\.[\w-]*\.[\w-]*$/); // JWT format
    });

    it('should throw error if email already exists', async () => {
      // Arrange
      const userData = {
        email: 'duplicate@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        role: 'FREELANCER'
      };
      await authService.register(userData);

      // Act & Assert
      await expect(authService.register(userData))
        .rejects.toThrow('User already exists');
    });

    it('should not store plain text password', async () => {
      // Arrange
      const userData = {
        email: 'secure@example.com',
        password: 'mypassword',
        firstName: 'Jane',
        lastName: 'Doe',
        role: 'FREELANCER'
      };

      // Act
      await authService.register(userData);
      const user = await prisma.user.findUnique({
        where: { email: userData.email }
      });

      // Assert
      expect(user?.password).not.toBe(userData.password);
      expect(user?.password).toMatch(/^\$2[aby]\$/); // bcrypt hash format
    });
  });

  describe('login', () => {
    it('should return user and token with valid credentials', async () => {
      // Arrange
      const userData = {
        email: 'login@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        role: 'FREELANCER'
      };
      await authService.register(userData);

      // Act
      const result = await authService.login(
        userData.email,
        userData.password
      );

      // Assert
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(userData.email);
      expect(result.token).toBeDefined();
    });

    it('should throw error with invalid email', async () => {
      // Act & Assert
      await expect(authService.login('wrong@example.com', 'password'))
        .rejects.toThrow('Invalid credentials');
    });

    it('should throw error with invalid password', async () => {
      // Arrange
      const userData = {
        email: 'user@example.com',
        password: 'correctpassword',
        firstName: 'John',
        lastName: 'Doe',
        role: 'FREELANCER'
      };
      await authService.register(userData);

      // Act & Assert
      await expect(authService.login(userData.email, 'wrongpassword'))
        .rejects.toThrow('Invalid credentials');
    });

    it('should update lastLoginAt timestamp', async () => {
      // Arrange
      const userData = {
        email: 'timestamp@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        role: 'FREELANCER'
      };
      const { user } = await authService.register(userData);
      const initialLogin = user.createdAt;

      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 100));

      // Act
      await authService.login(userData.email, userData.password);
      const updatedUser = await prisma.user.findUnique({
        where: { id: user.id }
      });

      // Assert
      expect(updatedUser?.lastLoginAt).toBeDefined();
      expect(updatedUser?.lastLoginAt?.getTime()).toBeGreaterThan(
        initialLogin.getTime()
      );
    });
  });

  describe('verifyToken', () => {
    it('should decode valid token', async () => {
      // Arrange
      const userData = {
        email: 'token@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        role: 'FREELANCER'
      };
      const { token, user } = await authService.register(userData);

      // Act
      const decoded = authService.verifyToken(token);

      // Assert
      expect(decoded.userId).toBe(user.id);
      expect(decoded.email).toBe(user.email);
      expect(decoded.role).toBe(user.role);
    });

    it('should throw error with invalid token', () => {
      // Act & Assert
      expect(() => authService.verifyToken('invalid.token.here'))
        .toThrow();
    });

    it('should throw error with expired token', () => {
      // Note: Would need to mock jwt.sign with expired time
      // Implementation depends on your testing setup
    });
  });
});
```

#### User Service Tests

**File:** `packages/backend/tests/services/user.service.spec.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { UserService } from '../../src/services/user.service';
import { AuthService } from '../../src/services/auth.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const userService = new UserService();
const authService = new AuthService();

describe('UserService', () => {
  let testUserId: string;

  beforeEach(async () => {
    await prisma.user.deleteMany();
    
    const { user } = await authService.register({
      email: 'test@example.com',
      password: 'password123',
      firstName: 'John',
      lastName: 'Doe',
      role: 'FREELANCER'
    });
    testUserId = user.id;
  });

  describe('getUserById', () => {
    it('should return user with all fields', async () => {
      // Act
      const user = await userService.getUserById(testUserId);

      // Assert
      expect(user).toBeDefined();
      expect(user.email).toBe('test@example.com');
      expect(user.firstName).toBe('John');
      expect(user.lastName).toBe('Doe');
      expect(user._count).toBeDefined();
    });

    it('should throw error if user not found', async () => {
      // Act & Assert
      await expect(userService.getUserById('nonexistent-id'))
        .rejects.toThrow('User not found');
    });

    it('should not return password', async () => {
      // Act
      const user = await userService.getUserById(testUserId);

      // Assert
      expect(user).not.toHaveProperty('password');
    });
  });

  describe('updateProfile', () => {
    it('should update user profile', async () => {
      // Arrange
      const updates = {
        firstName: 'Jane',
        bio: 'New bio',
        skills: ['JavaScript', 'React']
      };

      // Act
      const updated = await userService.updateProfile(testUserId, updates);

      // Assert
      expect(updated.firstName).toBe('Jane');
      expect(updated.bio).toBe('New bio');
      expect(updated.skills).toEqual(['JavaScript', 'React']);
    });

    it('should update username if unique', async () => {
      // Act
      const updated = await userService.updateProfile(testUserId, {
        username: 'johndoe'
      });

      // Assert
      expect(updated.username).toBe('johndoe');
    });

    it('should throw error if username taken', async () => {
      // Arrange
      await authService.register({
        email: 'other@example.com',
        password: 'password123',
        firstName: 'Other',
        lastName: 'User',
        role: 'FREELANCER'
      });
      await userService.updateProfile(testUserId, { username: 'taken' });

      // Create another user
      const { user: otherUser } = await authService.register({
        email: 'another@example.com',
        password: 'password123',
        firstName: 'Another',
        lastName: 'User',
        role: 'FREELANCER'
      });

      // Act & Assert
      await expect(
        userService.updateProfile(otherUser.id, { username: 'taken' })
      ).rejects.toThrow('Username already taken');
    });
  });

  describe('searchUsers', () => {
    beforeEach(async () => {
      await authService.register({
        email: 'developer@example.com',
        password: 'password123',
        firstName: 'Jane',
        lastName: 'Developer',
        role: 'FREELANCER'
      });
    });

    it('should find users by name', async () => {
      // Act
      const results = await userService.searchUsers('Jane');

      // Assert
      expect(results).toHaveLength(1);
      expect(results[0].firstName).toBe('Jane');
    });

    it('should filter by role', async () => {
      // Act
      const results = await userService.searchUsers('', {
        role: 'FREELANCER'
      });

      // Assert
      expect(results.length).toBeGreaterThan(0);
      expect(results.every(u => u.role === 'FREELANCER')).toBe(true);
    });

    it('should filter by skills', async () => {
      // Arrange
      await userService.updateProfile(testUserId, {
        skills: ['React', 'Node.js']
      });

      // Act
      const results = await userService.searchUsers('', {
        skills: ['React']
      });

      // Assert
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(u => u.skills.includes('React'))).toBe(true);
    });
  });
});
```

#### Team Service Tests

**File:** `packages/backend/tests/services/team.service.spec.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { TeamService } from '../../src/services/team.service';
import { AuthService } from '../../src/services/auth.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const teamService = new TeamService();
const authService = new AuthService();

describe('TeamService', () => {
  let ownerId: string;

  beforeEach(async () => {
    await prisma.teamMember.deleteMany();
    await prisma.team.deleteMany();
    await prisma.user.deleteMany();

    const { user } = await authService.register({
      email: 'owner@example.com',
      password: 'password123',
      firstName: 'Team',
      lastName: 'Owner',
      role: 'AGENCY'
    });
    ownerId = user.id;
  });

  describe('createTeam', () => {
    it('should create team with owner', async () => {
      // Arrange
      const teamData = {
        name: 'Test Team',
        description: 'Test description',
        type: 'PROJECT' as const
      };

      // Act
      const team = await teamService.createTeam(ownerId, teamData);

      // Assert
      expect(team).toBeDefined();
      expect(team.name).toBe('Test Team');
      expect(team.slug).toBeDefined();
      expect(team.members).toHaveLength(1);
      expect(team.members[0].role).toBe('OWNER');
    });

    it('should generate unique slug', async () => {
      // Arrange
      const team1 = await teamService.createTeam(ownerId, {
        name: 'My Team',
        type: 'PROJECT'
      });

      // Act
      const team2 = await teamService.createTeam(ownerId, {
        name: 'My Team',
        type: 'PROJECT'
      });

      // Assert
      expect(team1.slug).not.toBe(team2.slug);
    });
  });

  describe('updateTeam', () => {
    it('should allow owner to update team', async () => {
      // Arrange
      const team = await teamService.createTeam(ownerId, {
        name: 'Original Name',
        type: 'PROJECT'
      });

      // Act
      const updated = await teamService.updateTeam(team.id, ownerId, {
        name: 'Updated Name'
      });

      // Assert
      expect(updated.name).toBe('Updated Name');
    });

    it('should not allow non-owner to update', async () => {
      // Arrange
      const team = await teamService.createTeam(ownerId, {
        name: 'Team',
        type: 'PROJECT'
      });

      const { user: nonOwner } = await authService.register({
        email: 'member@example.com',
        password: 'password123',
        firstName: 'Member',
        lastName: 'User',
        role: 'FREELANCER'
      });

      // Act & Assert
      await expect(
        teamService.updateTeam(team.id, nonOwner.id, { name: 'Hacked' })
      ).rejects.toThrow('Unauthorized');
    });
  });

  describe('addTeamMember', () => {
    it('should add member to team', async () => {
      // Arrange
      const team = await teamService.createTeam(ownerId, {
        name: 'Team',
        type: 'PROJECT'
      });

      const { user: newMember } = await authService.register({
        email: 'newmember@example.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'Member',
        role: 'FREELANCER'
      });

      // Act
      const member = await teamService.addTeamMember(
        team.id,
        ownerId,
        newMember.id
      );

      // Assert
      expect(member).toBeDefined();
      expect(member.userId).toBe(newMember.id);
      expect(member.role).toBe('MEMBER');
    });

    it('should not allow duplicate members', async () => {
      // Arrange
      const team = await teamService.createTeam(ownerId, {
        name: 'Team',
        type: 'PROJECT'
      });

      const { user: newMember } = await authService.register({
        email: 'member@example.com',
        password: 'password123',
        firstName: 'Member',
        lastName: 'User',
        role: 'FREELANCER'
      });

      await teamService.addTeamMember(team.id, ownerId, newMember.id);

      // Act & Assert
      await expect(
        teamService.addTeamMember(team.id, ownerId, newMember.id)
      ).rejects.toThrow('User is already a member');
    });
  });

  describe('removeTeamMember', () => {
    it('should remove member from team', async () => {
      // Arrange
      const team = await teamService.createTeam(ownerId, {
        name: 'Team',
        type: 'PROJECT'
      });

      const { user: member } = await authService.register({
        email: 'member@example.com',
        password: 'password123',
        firstName: 'Member',
        lastName: 'User',
        role: 'FREELANCER'
      });

      await teamService.addTeamMember(team.id, ownerId, member.id);

      // Act
      await teamService.removeTeamMember(team.id, ownerId, member.id);

      // Assert
      const updatedTeam = await teamService.getTeamById(team.id);
      expect(updatedTeam.members).toHaveLength(1); // Only owner
    });

    it('should not allow removing owner', async () => {
      // Arrange
      const team = await teamService.createTeam(ownerId, {
        name: 'Team',
        type: 'PROJECT'
      });

      // Act & Assert
      await expect(
        teamService.removeTeamMember(team.id, ownerId, ownerId)
      ).rejects.toThrow('Cannot remove team owner');
    });
  });
});
```

---

### Frontend Unit Tests

#### Button Component Test

**File:** `packages/frontend/tests/components/Button.spec.tsx`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../../src/components/Button';

describe('Button', () => {
  it('renders with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick when disabled', () => {
    const handleClick = vi.fn();
    render(
      <Button onClick={handleClick} disabled>
        Click me
      </Button>
    );
    
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('applies custom className', () => {
    render(<Button className="custom-class">Click me</Button>);
    expect(screen.getByText('Click me')).toHaveClass('custom-class');
  });

  it('renders loading state', () => {
    render(<Button loading>Click me</Button>);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });
});
```

#### Profile Page Test

**File:** `packages/frontend/tests/pages/ProfilePage.spec.tsx`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ProfilePage } from '../../src/pages/Profile/ProfilePage';
import * as userApi from '../../src/services/api/user.api';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } }
});

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <MemoryRouter initialEntries={['/profile/user-123']}>
      <Routes>
        <Route path="/profile/:userId" element={children} />
      </Routes>
    </MemoryRouter>
  </QueryClientProvider>
);

describe('ProfilePage', () => {
  it('displays user information', async () => {
    // Arrange
    const mockUser = {
      id: 'user-123',
      firstName: 'John',
      lastName: 'Doe',
      username: 'johndoe',
      email: 'john@example.com',
      role: 'FREELANCER',
      bio: 'Test bio',
      skills: ['React', 'Node.js'],
      _count: {
        followers: 10,
        following: 5,
        teamMemberships: 3
      }
    };

    vi.spyOn(userApi, 'getUserById').mockResolvedValue(mockUser);

    // Act
    render(<ProfilePage />, { wrapper: Wrapper });

    // Assert
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('@johndoe')).toBeInTheDocument();
      expect(screen.getByText('Test bio')).toBeInTheDocument();
      expect(screen.getByText('React')).toBeInTheDocument();
      expect(screen.getByText('Node.js')).toBeInTheDocument();
    });
  });

  it('displays loading state', () => {
    // Arrange
    vi.spyOn(userApi, 'getUserById').mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    // Act
    render(<ProfilePage />, { wrapper: Wrapper });

    // Assert
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('displays error state', async () => {
    // Arrange
    vi.spyOn(userApi, 'getUserById').mockRejectedValue(
      new Error('User not found')
    );

    // Act
    render(<ProfilePage />, { wrapper: Wrapper });

    // Assert
    await waitFor(() => {
      expect(screen.getByText('User not found')).toBeInTheDocument();
    });
  });
});
```

---

## Integration Tests

### API Integration Tests

**File:** `packages/backend/tests/integration/auth.integration.spec.ts`

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Authentication API', () => {
  beforeAll(async () => {
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/auth/register', () => {
    it('should register new user', async () => {
      // Act
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          firstName: 'John',
          lastName: 'Doe',
          role: 'FREELANCER'
        });

      // Assert
      expect(response.status).toBe(201);
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe('test@example.com');
      expect(response.body.token).toBeDefined();
    });

    it('should return 400 for invalid email', async () => {
      // Act
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: 'password123',
          firstName: 'John',
          lastName: 'Doe',
          role: 'FREELANCER'
        });

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it('should return 409 for duplicate email', async () => {
      // Arrange
      await request(app).post('/api/auth/register').send({
        email: 'duplicate@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        role: 'FREELANCER'
      });

      // Act
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'duplicate@example.com',
          password: 'password123',
          firstName: 'Jane',
          lastName: 'Doe',
          role: 'FREELANCER'
        });

      // Assert
      expect(response.status).toBe(409);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      // Arrange
      await request(app).post('/api/auth/register').send({
        email: 'login@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        role: 'FREELANCER'
      });

      // Act
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'password123'
        });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.token).toBeDefined();
      expect(response.body.user).toBeDefined();
    });

    it('should return 401 for invalid credentials', async () => {
      // Act
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'wrong@example.com',
          password: 'wrongpassword'
        });

      // Assert
      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user with valid token', async () => {
      // Arrange
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'me@example.com',
          password: 'password123',
          firstName: 'John',
          lastName: 'Doe',
          role: 'FREELANCER'
        });

      const token = registerResponse.body.token;

      // Act
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.email).toBe('me@example.com');
    });

    it('should return 401 without token', async () => {
      // Act
      const response = await request(app).get('/api/auth/me');

      // Assert
      expect(response.status).toBe(401);
    });
  });
});
```

---

## End-to-End Tests

### Playwright E2E Tests

**File:** `packages/frontend/e2e/auth.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
  });

  test('should register new user', async ({ page }) => {
    // Navigate to register
    await page.click('text=Sign Up');

    // Fill form
    await page.fill('input[name="email"]', 'newuser@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.fill('input[name="firstName"]', 'John');
    await page.fill('input[name="lastName"]', 'Doe');
    await page.selectOption('select[name="role"]', 'FREELANCER');

    // Submit
    await page.click('button[type="submit"]');

    // Verify redirect to dashboard
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.locator('text=John Doe')).toBeVisible();
  });

  test('should login existing user', async ({ page }) => {
    // Navigate to login
    await page.click('text=Sign In');

    // Fill credentials
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');

    // Submit
    await page.click('button[type="submit"]');

    // Verify dashboard
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('should show error for invalid login', async ({ page }) => {
    await page.click('text=Sign In');
    await page.fill('input[name="email"]', 'wrong@example.com');
    await page.fill('input[name="password"]', 'wrongpass');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Invalid credentials')).toBeVisible();
  });
});
```

**File:** `packages/frontend/e2e/team-management.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Team Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('http://localhost:5173/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
  });

  test('should create new team', async ({ page }) => {
    // Navigate to create team
    await page.click('text=Create Team');

    // Fill form
    await page.fill('input[name="name"]', 'My New Team');
    await page.fill('textarea[name="description"]', 'Team description');
    await page.selectOption('select[name="type"]', 'PROJECT');

    // Submit
    await page.click('button:has-text("Create Team")');

    // Verify team created
    await expect(page.locator('text=My New Team')).toBeVisible();
  });

  test('should invite member to team', async ({ page }) => {
    // Go to team page
    await page.click('text=My Team');

    // Click invite
    await page.click('button:has-text("Invite Member")');

    // Search and select user
    await page.fill('input[placeholder="Search users"]', 'jane@example.com');
    await page.click('text=Jane Doe');

    // Send invitation
    await page.click('button:has-text("Send Invitation")');

    // Verify success
    await expect(page.locator('text=Invitation sent')).toBeVisible();
  });
});
```

---

## Performance Tests

### Load Testing with k6

**File:** `packages/backend/tests/performance/load-test.js`

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up to 100 users
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 200 }, // Ramp up to 200 users
    { duration: '5m', target: 200 }, // Stay at 200 users
    { duration: '2m', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests under 500ms
    http_req_failed: ['rate<0.01'],   // Error rate under 1%
  },
};

const BASE_URL = 'http://localhost:3001/api';

export default function () {
  // Register user
  const registerRes = http.post(`${BASE_URL}/auth/register`, JSON.stringify({
    email: `user${__VU}@example.com`,
    password: 'password123',
    firstName: 'Test',
    lastName: 'User',
    role: 'FREELANCER'
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  check(registerRes, {
    'registration status is 201': (r) => r.status === 201,
    'has token': (r) => r.json('token') !== undefined,
  });

  const token = registerRes.json('token');

  // Get user profile
  const profileRes = http.get(`${BASE_URL}/users/me`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });

  check(profileRes, {
    'profile status is 200': (r) => r.status === 200,
  });

  sleep(1);
}
```

---

## Security Tests

### Security Test Checklist

```markdown
- [ ] SQL Injection Tests
- [ ] XSS Prevention Tests
- [ ] CSRF Protection Tests
- [ ] Authentication Bypass Tests
- [ ] Authorization Tests
- [ ] Rate Limiting Tests
- [ ] Input Validation Tests
- [ ] Password Strength Tests
```

**File:** `packages/backend/tests/security/injection.spec.ts`

```typescript
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app';

describe('Security: SQL Injection Prevention', () => {
  it('should not allow SQL injection in login', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: "admin' OR '1'='1",
        password: "anything"
      });

    expect(response.status).not.toBe(200);
    expect(response.body.token).toBeUndefined();
  });

  it('should not allow SQL injection in search', async () => {
    const response = await request(app)
      .get('/api/users/search')
      .query({ q: "'; DROP TABLE users; --" });

    expect(response.status).toBe(200);
    // Verify database still exists
    const users = await request(app).get('/api/users');
    expect(users.status).toBe(401); // Need auth, but endpoint works
  });
});
```

---

## Test Coverage Requirements

### Coverage Targets
```
Overall Coverage:     >85%
Backend Services:     >90%
Frontend Components:  >80%
API Endpoints:        >95%
Critical Paths:       100%
```

### Running Coverage
```bash
# Backend coverage
cd packages/backend
npm run test:coverage

# Frontend coverage
cd packages/frontend
npm run test:coverage

# View HTML report
open coverage/index.html
```

---

## CI/CD Integration

### GitHub Actions Test Workflow

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20.x'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm run test:unit
      
      - name: Run integration tests
        run: npm run test:integration
      
      - name: Generate coverage
        run: npm run test:coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
  
  e2e:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright
        run: npx playwright install --with-deps
      
      - name: Run E2E tests
        run: npm run test:e2e
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

---

**Document Owner:** QA Lead  
**Last Updated:** October 2025  
**Review Frequency:** Weekly during development