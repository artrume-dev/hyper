# Currency Selector & Recommendation System Implementation

## Summary
Successfully implemented two major features for the profile system:
1. **Currency Selector** - Users can select their preferred currency (USD, GBP, EUR) with automatic rate conversion
2. **Recommendation System** - Users can request and manage professional recommendations through portfolio projects

Implementation Date: 2025-10-18
Status: ✅ Complete - Ready for Testing

---

## Feature 1: Currency Selector

### Overview
Users can now select their preferred currency for displaying their hourly rate. When changing currencies, the system automatically converts the rate using predefined exchange rates.

### Database Changes

#### Schema Updates
**File**: `packages/backend/prisma/schema.prisma`

Added `currency` field to User model:
```prisma
model User {
  // ... existing fields
  hourlyRate  Float?
  currency    String  @default("USD")  // New field
}
```

### Backend Implementation

#### 1. User Service
**File**: `packages/backend/src/services/user.service.ts`

**Changes**:
- Added `currency` to `UpdateProfileData` interface
- Included `currency` in all user select statements (getUserById, getUserByUsername, updateProfile)

```typescript
export interface UpdateProfileData {
  // ... existing fields
  currency?: string;
}
```

#### 2. User Controller
**File**: `packages/backend/src/controllers/user.controller.ts`

**Changes**:
- Accept `currency` in request body
- Pass `currency` to update profile service

```typescript
const { firstName, lastName, username, bio, jobTitle, location, country, available, nextAvailability, avatar, hourlyRate, currency } = req.body;
```

### Frontend Implementation

#### 1. TypeScript Types
**File**: `packages/frontend/src/types/auth.ts`

**Added**:
```typescript
export type Currency = 'USD' | 'GBP' | 'EUR';

export interface User {
  // ... existing fields
  currency: Currency;
}
```

**File**: `packages/frontend/src/types/user.ts`

**Updated**: `UpdateProfileRequest` to include `currency?: Currency`

#### 2. Currency Utility
**File**: `packages/frontend/src/lib/currency.ts`

**Features**:
- Exchange rates (USD, GBP, EUR)
- Currency symbols ($, £, €)
- Currency names for display
- `convertCurrency()` - Convert between currencies
- `formatCurrency()` - Format with symbol
- `calculateDailyRate()` - Calculate daily from hourly
- `getCurrencyOptions()` - Get dropdown options

**Exchange Rates** (relative to USD):
```typescript
{
  USD: 1,
  GBP: 0.79,
  EUR: 0.92,
}
```

#### 3. Profile Page Updates
**File**: `packages/frontend/src/pages/ProfilePage.tsx`

**Changes**:

1. **Imports**:
```typescript
import { getCurrencyOptions, convertCurrency, formatCurrency, CURRENCY_SYMBOLS } from '@/lib/currency';
import type { Currency } from '@/types/auth';
```

2. **Currency Selector** (Edit Profile):
```typescript
<select
  name="currency"
  value={formData.currency || profile?.currency || 'USD'}
  onChange={(e) => {
    const newCurrency = e.target.value as Currency;
    const oldCurrency = (formData.currency || profile?.currency || 'USD') as Currency;
    const currentRate = formData.hourlyRate || profile?.hourlyRate || 0;

    // Convert the hourly rate when currency changes
    const convertedRate = convertCurrency(currentRate, oldCurrency, newCurrency);

    setFormData(prev => ({
      ...prev,
      currency: newCurrency,
      hourlyRate: convertedRate
    }));
  }}
>
  {getCurrencyOptions().map(option => (
    <option key={option.value} value={option.value}>
      {option.symbol} {option.label}
    </option>
  ))}
</select>
```

3. **Display Updates**:
- Profile header: Shows hourly rate with currency symbol
- Stats card: Shows hourly rate with currency
- Daily rate card: Shows daily rate (hourly × 8) with currency

```typescript
// Instead of hardcoded $
formatCurrency(profile.hourlyRate, profile.currency as Currency || 'USD')
```

### User Flow

1. User opens Edit Profile
2. Selects currency from dropdown (USD, GBP, EUR)
3. **Automatic conversion**: System converts current hourly rate to new currency
4. User sees updated rate immediately
5. Rate is saved with new currency on profile update
6. All displays (header, cards) show correct symbol and amount

### Example Conversion
- User has $100/hr in USD
- Changes to GBP
- System converts: $100 ÷ 1 × 0.79 = £79/hr
- Daily rate: £79 × 8 = £632/day

---

## Feature 2: Recommendation System

### Overview
Users can request professional recommendations from other users through their portfolio projects. Recipients can accept or reject requests. Accepted recommendations are displayed under the work experience section.

### Database Changes

#### Schema Updates
**File**: `packages/backend/prisma/schema.prisma`

**Added Recommendation Model**:
```prisma
model Recommendation {
  id          String    @id @default(uuid())
  message     String
  status      String    @default("PENDING")  // PENDING, ACCEPTED, REJECTED
  senderId    String
  receiverId  String
  portfolioId String
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  sender      User      @relation("RecommendationSender", fields: [senderId], references: [id], onDelete: Cascade)
  receiver    User      @relation("RecommendationReceiver", fields: [receiverId], references: [id], onDelete: Cascade)
  portfolio   Portfolio @relation(fields: [portfolioId], references: [id], onDelete: Cascade)

  @@index([senderId])
  @@index([receiverId])
  @@index([portfolioId])
  @@index([status])
}
```

**Updated User Model**:
```prisma
model User {
  // ... existing fields
  sentRecommendations     Recommendation[] @relation("RecommendationSender")
  receivedRecommendations Recommendation[] @relation("RecommendationReceiver")
}
```

**Updated Portfolio Model**:
```prisma
model Portfolio {
  // ... existing fields
  recommendations Recommendation[]
}
```

### Backend Implementation

#### 1. Recommendation Service
**File**: `packages/backend/src/services/recommendation.service.ts`

**Methods**:
- `createRecommendation(data)` - Create new recommendation request
- `getPortfolioRecommendations(portfolioId)` - Get accepted recommendations for a portfolio
- `getUserRecommendations(userId)` - Get all recommendations for a user
- `updateRecommendationStatus(id, userId, status)` - Accept/reject recommendation
- `deleteRecommendation(id, userId)` - Delete recommendation

**Features**:
- Validates portfolio belongs to receiver
- Only shows ACCEPTED recommendations publicly
- Includes sender details (name, avatar, job title)
- Ordered by most recent

#### 2. Recommendation Controller
**File**: `packages/backend/src/controllers/recommendation.controller.ts`

**Endpoints**:
- `POST /api/recommendations` - Create recommendation (requires auth)
- `GET /api/recommendations/portfolio/:portfolioId` - Get portfolio recommendations (public)
- `GET /api/recommendations/user/:userId` - Get user recommendations (public)
- `PATCH /api/recommendations/:id/status` - Update status (requires auth)
- `DELETE /api/recommendations/:id` - Delete recommendation (requires auth)

#### 3. Routes
**File**: `packages/backend/src/routes/recommendation.routes.ts`

Registered at `/api/recommendations` in `app.ts`

#### 4. User Service Updates
**File**: `packages/backend/src/services/user.service.ts`

**Changes**: Include recommendations in portfolio data

```typescript
portfolios: {
  orderBy: { createdAt: 'desc' },
  take: 6,
  include: {
    recommendations: {
      where: { status: 'ACCEPTED' },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
            jobTitle: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    },
  },
},
```

### Frontend Implementation

#### 1. TypeScript Types
**File**: `packages/frontend/src/types/user.ts`

**Added**:
```typescript
export interface Recommendation {
  id: string;
  message: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  senderId: string;
  receiverId: string;
  portfolioId: string;
  createdAt: string;
  updatedAt: string;
  sender?: User;
  receiver?: User;
}

export interface CreateRecommendationRequest {
  message: string;
  receiverId: string;
  portfolioId: string;
}

export interface UpdateRecommendationRequest {
  status: 'ACCEPTED' | 'REJECTED';
}
```

**Updated**: `PortfolioItem` to include `recommendations?: Recommendation[]`

#### 2. Recommendation API Service
**File**: `packages/frontend/src/services/api/recommendation.service.ts`

**Methods**:
- `createRecommendation(data)` - Send recommendation request
- `getPortfolioRecommendations(portfolioId)` - Fetch portfolio recommendations
- `getUserRecommendations(userId)` - Fetch user recommendations
- `updateRecommendationStatus(id, data)` - Accept/reject
- `deleteRecommendation(id)` - Delete

#### 3. Recommendation Dialog Component
**File**: `packages/frontend/src/components/RecommendationDialog.tsx`

**Features**:
- Modal dialog with blur backdrop
- Project name display
- Message textarea with validation
- Loading states
- Success confirmation (auto-close after 2s)
- Error handling

**Props**:
```typescript
interface RecommendationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  portfolioId: string;
  portfolioOwnerId: string;
  portfolioName: string;
}
```

#### 4. Recommendations Section Component
**File**: `packages/frontend/src/components/RecommendationsSection.tsx`

**Features**:
- Displays all accepted recommendations
- Star icon header
- Quote icon for each recommendation
- Sender avatar and details
- Date formatting
- Responsive cards with hover effects

#### 5. Project Drawer Updates
**File**: `packages/frontend/src/components/ProjectDrawer.tsx`

**Changes**:
1. Added "Request Recommendation" button
2. Button only shows when:
   - Not viewing own profile
   - User is logged in
   - User is not the portfolio owner
3. Opens RecommendationDialog on click

```typescript
{!isOwnProfile && user && user.id !== project.userId && (
  <button onClick={() => setShowRecommendationDialog(true)}>
    <MessageSquare className="w-4 h-4" />
    Request Recommendation
  </button>
)}
```

#### 6. Profile Page Updates
**File**: `packages/frontend/src/pages/ProfilePage.tsx`

**Changes**:
1. Import `RecommendationsSection` component
2. Pass `isOwnProfile` prop to ProjectDrawer
3. Display recommendations after work experience section

```typescript
{/* Recommendations Section */}
{profile && portfolio.length > 0 && (() => {
  const allRecommendations = portfolio
    .flatMap(p => p.recommendations || [])
    .filter(r => r.status === 'ACCEPTED')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return allRecommendations.length > 0 ? (
    <div className="mb-24">
      <RecommendationsSection recommendations={allRecommendations} />
    </div>
  ) : null;
})()}
```

### User Flow

#### Requesting a Recommendation

1. User A visits User B's profile
2. Clicks on a portfolio project to open drawer
3. Sees "Request Recommendation" button
4. Clicks button → Dialog opens
5. Writes personalized message
6. Clicks "Send Request"
7. Success message displays
8. Dialog auto-closes after 2 seconds

#### Receiving/Managing Recommendations

1. User B receives recommendation request (will show in notifications - future feature)
2. Can accept or reject via API endpoint
3. Accepted recommendations appear on profile
4. Can delete unwanted recommendations

#### Viewing Recommendations

1. Recommendations appear under "Work Experience" section
2. Shows accepted recommendations from all portfolio projects
3. Displays:
   - Recommendation message (quoted)
   - Sender's name and avatar
   - Sender's job title
   - Date received
4. Sorted by most recent first

---

## Technical Details

### Data Flow

#### Currency Conversion
```
User selects currency →
calculateConversion(currentRate, oldCurrency, newCurrency) →
Update formData with new rate and currency →
Save to backend →
Display with correct symbol everywhere
```

#### Recommendation Request
```
Click "Request Recommendation" →
Open dialog →
Write message →
POST /api/recommendations →
Validate portfolio ownership →
Create recommendation with PENDING status →
Success response →
Close dialog
```

#### Recommendation Display
```
Load user profile →
Fetch portfolios with recommendations (status = ACCEPTED) →
Flatten all recommendations →
Sort by date →
Display in RecommendationsSection component
```

### Security

1. **Authentication**:
   - Recommendation creation requires auth token
   - Status updates require auth token
   - Only sender or receiver can delete

2. **Authorization**:
   - Can only update recommendations you received
   - Portfolio ownership validated before creating recommendation
   - Public endpoints only show ACCEPTED recommendations

3. **Validation**:
   - Message required
   - RecieverId and PortfolioId required
   - Status must be ACCEPTED or REJECTED
   - Portfolio must belong to receiver

---

## Files Created

### Backend
1. `/packages/backend/src/controllers/recommendation.controller.ts` - Recommendation endpoints
2. `/packages/backend/src/services/recommendation.service.ts` - Recommendation business logic
3. `/packages/backend/src/routes/recommendation.routes.ts` - Recommendation routes

### Frontend
1. `/packages/frontend/src/lib/currency.ts` - Currency utility functions
2. `/packages/frontend/src/services/api/recommendation.service.ts` - Recommendation API client
3. `/packages/frontend/src/components/RecommendationDialog.tsx` - Request dialog component
4. `/packages/frontend/src/components/RecommendationsSection.tsx` - Display component

---

## Files Modified

### Backend
1. `/packages/backend/prisma/schema.prisma` - Added currency + Recommendation model
2. `/packages/backend/src/app.ts` - Registered recommendation routes
3. `/packages/backend/src/controllers/user.controller.ts` - Accept currency in profile update
4. `/packages/backend/src/services/user.service.ts` - Include currency + recommendations in queries

### Frontend
1. `/packages/frontend/src/types/auth.ts` - Added Currency type and currency field to User
2. `/packages/frontend/src/types/user.ts` - Added Recommendation types and updated interfaces
3. `/packages/frontend/src/pages/ProfilePage.tsx` - Added currency selector + recommendations section
4. `/packages/frontend/src/components/ProjectDrawer.tsx` - Added recommendation request button

---

## Testing Checklist

### Currency Selector
- [ ] Select USD → Rate displays with $ symbol
- [ ] Select GBP → Rate converts and displays with £ symbol
- [ ] Select EUR → Rate converts and displays with € symbol
- [ ] Conversion is accurate (uses correct exchange rates)
- [ ] Daily rate updates with currency change
- [ ] Currency persists after page reload
- [ ] Currency saves correctly to database
- [ ] Profile displays show correct symbol on all pages

### Recommendation System

#### Request Flow
- [ ] "Request Recommendation" button shows on other users' portfolio projects
- [ ] Button does NOT show on own portfolio
- [ ] Button does NOT show when not logged in
- [ ] Click button opens dialog
- [ ] Dialog shows correct project name
- [ ] Message validation works (required field)
- [ ] Request sends successfully
- [ ] Success message displays
- [ ] Dialog auto-closes after 2 seconds
- [ ] Error handling works (network errors, validation)

#### Display
- [ ] Accepted recommendations appear under work experience
- [ ] Recommendations from all portfolios are collected
- [ ] Sorted by most recent first
- [ ] Sender name and avatar display correctly
- [ ] Sender job title displays
- [ ] Date displays correctly
- [ ] Quote icon and styling look good
- [ ] No recommendations = section doesn't show
- [ ] Pending/rejected recommendations don't show publicly

#### Backend
- [ ] POST /api/recommendations creates recommendation
- [ ] GET /api/recommendations/portfolio/:id returns accepted only
- [ ] GET /api/recommendations/user/:id returns all for user
- [ ] PATCH /api/recommendations/:id/status updates status
- [ ] DELETE /api/recommendations/:id removes recommendation
- [ ] Portfolio ownership validation works
- [ ] Auth requirements enforced
- [ ] Only receiver can accept/reject
- [ ] Only sender/receiver can delete

---

## Future Enhancements

### Currency
1. **Live Exchange Rates**:
   - Fetch from API (e.g., exchangerate-api.com)
   - Update rates daily
   - Cache for performance

2. **More Currencies**:
   - Add CAD, AUD, JPY, etc.
   - User preference for display currency

3. **Timezone Support**:
   - Auto-detect from location
   - Show availability in user's timezone

### Recommendations
1. **Email Notifications**:
   - Send email when recommendation requested
   - Include direct link to accept/reject
   - Reminder emails for pending requests

2. **In-App Notifications**:
   - Badge count for pending recommendations
   - Notification center/dropdown
   - Mark as read functionality

3. **Recommendation Management Dashboard**:
   - View all sent requests (pending, accepted, rejected)
   - View all received requests
   - Filter and search
   - Bulk actions

4. **Enhanced Display**:
   - Link recommendations to specific portfolios
   - Show portfolio name/image with recommendation
   - Highlight featured recommendations

5. **LinkedIn-style Features**:
   - Recommend specific skills
   - Relationship dropdown (worked together, managed them, etc.)
   - Character limit on messages
   - Template messages

6. **Analytics**:
   - Track recommendation request success rate
   - Show "X recommendations received" badge
   - Display on profile stats

---

## Migration Notes

### For Existing Users

**Currency Field**:
- Default value: "USD"
- All existing users automatically get USD
- No data migration needed
- Users can update via Edit Profile

**Recommendations**:
- New feature, no existing data
- All relationships are new
- No migration scripts needed

### Database Migration
```bash
cd packages/backend
npx prisma db push
```

---

## API Documentation

### Recommendation Endpoints

#### Create Recommendation
```
POST /api/recommendations
Authorization: Bearer {token}

Body:
{
  "message": "John was excellent to work with...",
  "receiverId": "user-uuid",
  "portfolioId": "portfolio-uuid"
}

Response:
{
  "recommendation": {
    "id": "rec-uuid",
    "message": "...",
    "status": "PENDING",
    "senderId": "...",
    "receiverId": "...",
    "portfolioId": "...",
    "createdAt": "...",
    "sender": { ... },
    "receiver": { ... },
    "portfolio": { ... }
  }
}
```

#### Get Portfolio Recommendations
```
GET /api/recommendations/portfolio/:portfolioId

Response:
{
  "recommendations": [
    {
      "id": "...",
      "message": "...",
      "status": "ACCEPTED",
      "sender": { ... },
      "createdAt": "..."
    }
  ]
}
```

#### Update Recommendation Status
```
PATCH /api/recommendations/:id/status
Authorization: Bearer {token}

Body:
{
  "status": "ACCEPTED"  // or "REJECTED"
}

Response:
{
  "recommendation": { ... }
}
```

---

**Implementation Date**: 2025-10-18
**Implemented By**: UI Agent + Backend Integration
**Status**: ✅ Complete - Ready for Testing
**Build Status**: ✅ Backend builds successfully
**Database**: ✅ Schema updated and synced

---

## Next Steps

1. **Testing**: Run through all test cases above
2. **UI Polish**: Review currency selector styling
3. **Email Integration**: Set up email service for recommendations
4. **Notifications**: Add notification system for recommendation requests
5. **Analytics**: Track recommendation request metrics
6. **Documentation**: Update user-facing help docs
