# Sub-Team Categories

## Overview
Sub-teams now have a dedicated `subTeamCategory` field to specify department types like Engineering, Marketing, Design, etc.

## Database Field
```prisma
model Team {
  // ... other fields
  type            String           @default("TEAM")        // Main team type
  subTeamCategory String?                                  // Department category (sub-teams only)
  parentTeamId    String?                                  // For sub-teams
  isMainTeam      Boolean          @default(true)
  // ...
}
```

## Available Categories

### Technical Departments
- **ENGINEERING** - Software engineering, development teams
- **PRODUCT** - Product management, product teams
- **DESIGN** - Design, UX/UI, creative teams

### Business Departments
- **MARKETING** - Marketing, growth, content teams
- **SALES** - Sales, business development teams
- **OPERATIONS** - Operations, infrastructure, logistics teams

### Support Functions
- **HR** - Human resources, recruiting, people teams
- **FINANCE** - Finance, accounting, budgeting teams
- **LEGAL** - Legal, compliance, risk management teams
- **SUPPORT** - Customer support, customer success teams

### Other
- **OTHER** - Any other department type

## Backend Type Definition

```typescript
export type SubTeamCategory =
  | 'ENGINEERING'
  | 'MARKETING'
  | 'DESIGN'
  | 'HR'
  | 'SALES'
  | 'PRODUCT'
  | 'OPERATIONS'
  | 'FINANCE'
  | 'LEGAL'
  | 'SUPPORT'
  | 'OTHER';
```

## Usage Examples

### Creating an Engineering Sub-Team
```typescript
const engineeringTeam = await teamService.createTeam(userId, {
  name: "Engineering Team",
  description: "Our awesome engineering department",
  type: "DEPARTMENT",
  subTeamCategory: "ENGINEERING",
  parentTeamId: "main-team-id"
});
```

### Creating a Marketing Sub-Team
```typescript
const marketingTeam = await teamService.createTeam(userId, {
  name: "Marketing Department",
  description: "Marketing and growth initiatives",
  type: "DEPARTMENT",
  subTeamCategory: "MARKETING",
  parentTeamId: "main-team-id"
});
```

## API Endpoint

### Create Sub-Team with Category
```http
POST /api/teams/:parentTeamId/sub-teams
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Engineering Team",
  "description": "Product development team",
  "type": "DEPARTMENT",
  "subTeamCategory": "ENGINEERING"
}
```

## Frontend Display

### UI Labels
Display user-friendly labels for each category:

```typescript
const SUB_TEAM_CATEGORY_LABELS = {
  ENGINEERING: "Engineering",
  MARKETING: "Marketing",
  DESIGN: "Design",
  HR: "Human Resources",
  SALES: "Sales",
  PRODUCT: "Product",
  OPERATIONS: "Operations",
  FINANCE: "Finance",
  LEGAL: "Legal",
  SUPPORT: "Customer Support",
  OTHER: "Other"
};
```

### Category Icons
Suggested icons for each category:

- ENGINEERING: `<Code />` or `<Terminal />`
- MARKETING: `<Megaphone />` or `<TrendingUp />`
- DESIGN: `<Palette />` or `<Pen Tool />`
- HR: `<Users />` or `<UserCheck />`
- SALES: `<DollarSign />` or `<Target />`
- PRODUCT: `<Package />` or `<Layers />`
- OPERATIONS: `<Settings />` or `<Cog />`
- FINANCE: `<Calculator />` or `<CreditCard />`
- LEGAL: `<Scale />` or `<FileText />`
- SUPPORT: `<Headphones />` or `<MessageCircle />`
- OTHER: `<Folder />` or `<Grid />`

## Category Colors
Suggested color schemes:

```typescript
const CATEGORY_COLORS = {
  ENGINEERING: "blue",      // Tech/Development
  MARKETING: "purple",      // Creative/Growth
  DESIGN: "pink",          // Creative
  HR: "green",             // People
  SALES: "orange",         // Revenue
  PRODUCT: "indigo",       // Strategy
  OPERATIONS: "gray",      // Infrastructure
  FINANCE: "yellow",       // Money
  LEGAL: "red",            // Compliance
  SUPPORT: "teal",         // Customer-facing
  OTHER: "slate"           // Default
};
```

## Validation Rules

1. **Main Teams**: `subTeamCategory` should be `null` or undefined
2. **Sub-Teams**: `subTeamCategory` is optional but recommended
3. **Category + Type**: Sub-teams typically have `type = "DEPARTMENT"` and a specific `subTeamCategory`

### Example Validation
```typescript
// When creating sub-team
if (data.parentTeamId && !data.subTeamCategory) {
  // Warn or prompt user to select category
  console.warn("Sub-team created without category");
}

// Main teams shouldn't have subTeamCategory
if (!data.parentTeamId && data.subTeamCategory) {
  throw new Error("Main teams cannot have sub-team categories");
}
```

## Benefits

1. **Better Organization**: Clear department structure
2. **Easy Filtering**: Filter sub-teams by category
3. **Visual Grouping**: Group similar departments together
4. **Icon/Color Coding**: Consistent visual representation
5. **Analytics**: Track metrics by department type

## Future Enhancements

- **Custom Categories**: Allow companies to define custom categories
- **Category Permissions**: Role-based access per category
- **Category Templates**: Pre-configured settings per category
- **Category Analytics**: Performance metrics by department type
- **Cross-Category Collaboration**: Projects spanning multiple departments

---

**Last Updated**: October 19, 2025
