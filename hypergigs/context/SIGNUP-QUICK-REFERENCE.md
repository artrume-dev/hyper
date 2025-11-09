# Sign-Up Form - Quick Reference Guide

**Last Updated:** October 17, 2025

---

## Visual Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│                         HYPERGIGS SIGN-UP                           │
├──────────────────────────────┬──────────────────────────────────────┤
│  LEFT COLUMN (40%)           │  RIGHT COLUMN (60%)                  │
│  [Form Area]                 │  [Marketing Content]                 │
│                              │                                      │
│  Join HyperGigs              │  Welcome to HyperGigs                │
│  Create your account...      │  The ultimate platform for...        │
│                              │                                      │
│  ┌────────────────────────┐  │  ┌──────────────────────────────┐   │
│  │ 🔵 Sign up with Google │  │  │ 👥 Build Your Dream Team    │   │
│  └────────────────────────┘  │  │ Connect with talented...     │   │
│  ┌────────────────────────┐  │  └──────────────────────────────┘   │
│  │ 💼 Sign up with LinkedIn│ │                                      │
│  └────────────────────────┘  │  ┌──────────────────────────────┐   │
│                              │  │ ⚡ Grow Your Career          │   │
│  ── Or continue with email ──│  │ Showcase your skills...      │   │
│                              │  └──────────────────────────────┘   │
│  Full Name                   │                                      │
│  [John Doe...............]   │  ┌──────────────────────────────┐   │
│                              │  │ 🛡️ Secure & Reliable         │   │
│  Username                    │  │ Your data is protected...    │   │
│  [johndoe...............]    │  └──────────────────────────────┘   │
│  3-20 chars, alphanumeric    │                                      │
│                              │  ┌─────────┬─────────┬──────────┐   │
│  Email address               │  │  10K+   │  5K+    │   95%    │   │
│  [john@example.com......]    │  │  Users  │ Projects│   Rate   │   │
│                              │  └─────────┴─────────┴──────────┘   │
│  Password                    │                                      │
│  [••••••••...............]   │                                      │
│  Minimum 6 characters        │                                      │
│                              │                                      │
│  I am a...                   │                                      │
│  [Freelancer ▼............]  │                                      │
│                              │                                      │
│  Country                     │                                      │
│  [Select country... ▼....]   │                                      │
│                              │                                      │
│  ┌────────────────────────┐  │                                      │
│  │   Create account       │  │                                      │
│  └────────────────────────┘  │                                      │
│                              │                                      │
│  Terms • Privacy             │                                      │
│  Already have account? Sign in                                     │
│                              │                                      │
└──────────────────────────────┴──────────────────────────────────────┘
```

---

## Form Fields

| Field | Type | Required | Validation | Error Example |
|-------|------|----------|------------|---------------|
| Full Name | Text | ✅ Yes | Min 2 chars | "Name must be at least 2 characters" |
| Username | Text | ✅ Yes | 3-20 chars, alphanumeric + `-` `_` | "Username can only contain letters, numbers..." |
| Email | Email | ✅ Yes | Valid email format | "Please enter a valid email address" |
| Password | Password | ✅ Yes | Min 6 chars | "Password must be at least 6 characters" |
| Role | Select | ✅ Yes | One of: FREELANCER, AGENCY, STARTUP | Required |
| Country | Searchable Select | ❌ No | Any valid country code | Optional |

---

## OAuth Flow

### Google OAuth

```
User clicks "Sign up with Google"
  ↓
Google Login Popup Opens
  ↓
User selects Google account
  ↓
Google returns credential token
  ↓
Frontend sends to: POST /api/auth/oauth/google
  {
    credential: "google_jwt_token",
    role: "FREELANCER",
    country: "US"
  }
  ↓
Backend verifies token with Google
  ↓
Backend creates/updates user
  ↓
Returns user + JWT token
  ↓
User redirected to /dashboard
```

### LinkedIn OAuth (Placeholder)

```
Button ready, implementation pending React 19 compatible library
Similar flow to Google OAuth
```

---

## API Integration

### Registration Endpoint

```typescript
// Email Registration
POST /api/auth/register
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "secret123",
  "name": "John Doe",
  "username": "johndoe",
  "role": "FREELANCER",
  "country": "US"  // optional
}

// Success Response
{
  "user": {
    "id": "uuid",
    "email": "john@example.com",
    "username": "johndoe",
    "firstName": "John",
    "lastName": "Doe",
    "role": "FREELANCER",
    "country": "US",
    "avatar": null,
    "createdAt": "2025-10-17T..."
  },
  "token": "jwt_token_here"
}

// Error Response
{
  "error": "User already exists with this email"
}
```

### OAuth Endpoint

```typescript
// Google OAuth
POST /api/auth/oauth/google
Content-Type: application/json

{
  "credential": "google_jwt_token",
  "role": "FREELANCER",
  "country": "US"
}

// Success Response - Same as email registration
```

---

## Component Usage

### Form Component

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription
} from '@/components/ui/form';

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Min 6 chars'),
});

const form = useForm({
  resolver: zodResolver(schema),
  defaultValues: { email: '', password: '' }
});

// In JSX
<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)}>
    <FormField
      control={form.control}
      name="email"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Email</FormLabel>
          <FormControl>
            <Input {...field} />
          </FormControl>
          <FormMessage /> {/* Errors show here */}
        </FormItem>
      )}
    />
  </form>
</Form>
```

### Country Select Component

```typescript
import { CountrySelect } from '@/components/ui/country-select';

<CountrySelect
  value={selectedCountry}
  onChange={(value) => setSelectedCountry(value)}
  placeholder="Select your country"
/>

// Returns 2-letter country code (e.g., "US", "GB", "FR")
```

### Google OAuth Component

```typescript
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';

<GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
  <GoogleLogin
    onSuccess={(response) => handleOAuthSuccess(response)}
    onError={() => console.error('Login failed')}
    useOneTap
    theme="outline"
    size="large"
    text="signup_with"
  />
</GoogleOAuthProvider>
```

---

## Validation Rules

### Username

```typescript
const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;

✅ Valid:
- johndoe
- john_doe
- john-doe
- user123
- a_b_c

❌ Invalid:
- ab (too short)
- a (too short)
- john.doe (no dots)
- john doe (no spaces)
- john@doe (no special chars)
- averylongusernamethatisgreaterthan20chars (too long)
```

### Password

```typescript
✅ Valid:
- abc123 (6+ chars)
- password123
- MyP@ssw0rd!

❌ Invalid:
- 12345 (too short)
- abc (too short)
```

### Email

```typescript
✅ Valid:
- john@example.com
- user.name+tag@example.co.uk
- test@subdomain.example.com

❌ Invalid:
- john@example (no TLD)
- @example.com (no local part)
- john (no @ sign)
```

---

## Responsive Behavior

### Desktop (≥ 1024px)

```
┌─────────────┬──────────────────┐
│    Form     │  Marketing Info  │
│    40%      │       60%        │
└─────────────┴──────────────────┘
```

### Tablet (768px - 1023px)

```
┌──────────────────────────────┐
│          Form Only           │
│         Full Width           │
│     (Info panel hidden)      │
└──────────────────────────────┘
```

### Mobile (< 768px)

```
┌──────────────┐
│     Form     │
│  Full Width  │
│              │
│  (Centered)  │
└──────────────┘
```

---

## Error Handling

### Field-Level Errors

Errors appear directly under each field:

```
Email address
[john@invalid]
└─ Please enter a valid email address
```

### Form-Level Errors

Global errors appear at top of form:

```
┌─────────────────────────────────────┐
│ ⚠️ User already exists with this   │
│    email                            │
└─────────────────────────────────────┘
```

### Backend Errors

```typescript
// Registration fails
{
  "error": "User already exists with this email"
}

// OAuth fails
{
  "error": "Invalid Google token"
}

// Login with OAuth account using password
{
  "error": "Please use OAuth to login with this account"
}
```

---

## State Management

### Form State (react-hook-form)

```typescript
const form = useForm<RegisterFormValues>({
  resolver: zodResolver(registerSchema),
  defaultValues: {
    email: '',
    password: '',
    name: '',
    username: '',
    role: 'FREELANCER',
    country: '',
  },
});

// Access values
form.watch('email')

// Set values
form.setValue('country', 'US')

// Get errors
form.formState.errors.email?.message
```

### Auth Store (Zustand)

```typescript
const { register, error, isLoading, clearError } = useAuthStore();

// Register user
await register({
  email: 'john@example.com',
  password: 'secret',
  name: 'John Doe',
  username: 'johndoe',
  role: 'FREELANCER',
  country: 'US'
});

// Clear errors
clearError();

// Check loading state
if (isLoading) {
  // Show loading spinner
}
```

---

## Testing Checklist

### Manual Testing

- [ ] Open `/register` page
- [ ] Verify two-column layout on desktop
- [ ] Verify single-column on mobile
- [ ] Click Google OAuth button
- [ ] Click LinkedIn OAuth button (should show placeholder)
- [ ] Fill form with invalid data → Check errors appear
- [ ] Fill form with valid data → Submit successfully
- [ ] Search for country → Select one
- [ ] Try username with special chars → See error
- [ ] Try short password → See error
- [ ] Try invalid email → See error
- [ ] Submit form while loading → Button disabled
- [ ] Click "Sign in" link → Navigate to login

### Automated Testing (Future)

```typescript
describe('RegisterPage', () => {
  it('renders two-column layout on desktop')
  it('validates email format')
  it('validates username length')
  it('validates password length')
  it('shows field-level errors')
  it('disables submit during loading')
  it('handles OAuth success')
  it('handles OAuth failure')
  it('navigates to dashboard on success')
});
```

---

## Quick Commands

```bash
# Start development
npm run dev

# Build for production
npm run build

# Type check
npm run build  # TypeScript errors will show

# Update dependencies
npm install

# Database migration
npx prisma db push
npx prisma generate

# View database
npx prisma studio
```

---

## Troubleshooting

### Issue: OAuth button not showing

**Solution:** Check `VITE_GOOGLE_CLIENT_ID` in `.env`

```bash
# Frontend .env
VITE_GOOGLE_CLIENT_ID=your_actual_client_id
```

### Issue: Country selector not opening

**Solution:** Verify all dependencies installed

```bash
npm install cmdk @radix-ui/react-popover world-countries
```

### Issue: Form validation not working

**Solution:** Check Zod schema and form setup

```typescript
// Ensure zodResolver is imported
import { zodResolver } from '@hookform/resolvers/zod';

// Ensure schema is passed to useForm
const form = useForm({
  resolver: zodResolver(registerSchema)
});
```

### Issue: TypeScript errors

**Solution:** Run build to see all errors

```bash
npm run build
```

Common fixes:
- Use `type` imports for types
- Remove unused imports
- Check null safety

---

## Resources

- [React Hook Form Docs](https://react-hook-form.com/)
- [Zod Validation](https://zod.dev/)
- [Radix UI](https://www.radix-ui.com/)
- [Google OAuth Setup](https://developers.google.com/identity/protocols/oauth2)
- [ShadCN Components](https://ui.shadcn.com/)

---

**Quick Reference Complete!** Use this guide for quick lookups and troubleshooting.
