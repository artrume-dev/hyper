# Team Types & AI-Powered Matching Implementation

**HyperGigs Platform Documentation**
**Last Updated:** 2025-01-09
**Version:** 1.0

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current Implementation](#current-implementation)
3. [Team Type Definitions](#team-type-definitions)
4. [Hierarchical Structure](#hierarchical-structure)
5. [Existing AI Features](#existing-ai-features)
6. [AI Matching Benefits](#ai-matching-benefits)
7. [Future AI Enhancements](#future-ai-enhancements)
8. [Implementation Roadmap](#implementation-roadmap)
9. [Technical Architecture](#technical-architecture)
10. [Recommendations](#recommendations)

---

## Executive Summary

HyperGigs implements a sophisticated team categorization system with **4 primary team types** and **11 department categories** that power intelligent job and talent matching through AI-driven algorithms.

### Key Features

✅ **Team Types:** COMPANY, ORGANIZATION, TEAM, DEPARTMENT
✅ **Sub-Categories:** 11 specialized departments (Engineering, Marketing, Design, etc.)
✅ **AI-Powered:** Smart member suggestions using keyword extraction and scoring
✅ **Hierarchical:** Parent-child team relationships (one level deep)
✅ **Indexed & Searchable:** Efficient filtering and discovery

### Business Value

- **Better Job Matching:** Context-aware candidate recommendations
- **Smart Talent Discovery:** Department-specific skill matching
- **Organizational Structure:** Clear hierarchy and department management
- **Future-Ready:** Foundation for advanced AI/ML features

---

## Current Implementation

### Database Schema

**Location:** `packages/backend/prisma/schema.prisma` (line 69)

```prisma
model Team {
  id              String    @id @default(uuid())
  name            String
  slug            String    @unique
  type            String    @default("TEAM")
  subTeamCategory String?   // ENGINEERING, MARKETING, etc.
  parentTeamId    String?   // For hierarchical structure
  isMainTeam      Boolean   @default(true)
  description     String?
  avatar          String?
  city            String?

  // Relations
  members         TeamMember[]
  jobPostings     JobPosting[]
  parentTeam      Team?      @relation("TeamHierarchy", fields: [parentTeamId], references: [id])
  subTeams        Team[]     @relation("TeamHierarchy")

  @@index([type])
  @@index([parentTeamId])
  createdAt       DateTime   @default(now())
  updatedAt       DateTime   @updatedAt
}
```

### Type Definitions

**Location:** `packages/frontend/src/types/team.ts` (line 1)

```typescript
export type TeamType = 'COMPANY' | 'ORGANIZATION' | 'TEAM' | 'DEPARTMENT';

export type SubTeamCategory =
  | 'ENGINEERING'    // Tech/Development
  | 'MARKETING'      // Growth/Content
  | 'DESIGN'         // UX/UI/Creative
  | 'HR'             // Human Resources
  | 'SALES'          // Business Development
  | 'PRODUCT'        // Product Management
  | 'OPERATIONS'     // Infrastructure/Logistics
  | 'FINANCE'        // Accounting/Budget
  | 'LEGAL'          // Compliance/Contracts
  | 'SUPPORT'        // Customer Success
  | 'OTHER';         // Miscellaneous
```

### Migration History

The platform evolved from specific types to generic ones:

| Old Type  | New Type     | Rationale                    |
|-----------|--------------|------------------------------|
| PROJECT   | TEAM         | More generic, clearer        |
| AGENCY    | ORGANIZATION | Broader scope                |
| STARTUP   | COMPANY      | Professional terminology     |
| *(new)*   | DEPARTMENT   | Sub-team specialization      |

---

## Team Type Definitions

### 1. COMPANY 🏢

**Purpose:** Represents businesses, startups, and commercial entities

**Characteristics:**
- Typically posts jobs
- Can have multiple departments
- Hierarchical structure
- Business-focused

**Icon:** `<Building2 />`

**Use Cases:**
- Tech startups
- SMBs (Small/Medium Businesses)
- Enterprises
- Product companies

**Example:**
```
TechCorp (COMPANY)
├── Engineering (DEPARTMENT - ENGINEERING)
├── Marketing (DEPARTMENT - MARKETING)
└── Design (DEPARTMENT - DESIGN)
```

---

### 2. ORGANIZATION 🗂️

**Purpose:** Represents agencies, NGOs, and institutions

**Characteristics:**
- Project-based or service-oriented
- Client-focused
- Flexible structure
- Multiple simultaneous projects

**Icon:** `<Folder />`

**Use Cases:**
- Digital agencies
- Consulting firms
- Non-profits
- Research institutions

**Example:**
```
Creative Agency (ORGANIZATION)
├── Client Projects (DEPARTMENT - OTHER)
├── Design Team (DEPARTMENT - DESIGN)
└── Marketing Team (DEPARTMENT - MARKETING)
```

---

### 3. TEAM 👥

**Purpose:** Represents project teams and working groups

**Characteristics:**
- Smaller collaborative units
- Task or project-focused
- Informal structure
- Temporary or long-term

**Icon:** `<Users />`

**Use Cases:**
- Open source projects
- Collaborative initiatives
- Study groups
- Side projects

**Example:**
```
Mobile App Project (TEAM)
└── [No sub-teams typically]
```

---

### 4. DEPARTMENT 💼

**Purpose:** Represents functional sub-units within organizations

**Characteristics:**
- Child of main team
- Specialized focus area
- Specific skill requirements
- Part of larger structure

**Icon:** `<Briefcase />`

**Use Cases:**
- Engineering department in a company
- Marketing team in an agency
- HR department
- Sales team

**Note:** Departments are always sub-teams and cannot have their own sub-teams.

---

## Hierarchical Structure

### Parent-Child Relationships

**Rules:**
1. **Sub-teams can only be created under main teams**
   - Parent must have `isMainTeam = true`
   - Child gets `isMainTeam = false`

2. **Maximum depth: 1 level**
   - ❌ Main Team → Sub-Team → Sub-Sub-Team
   - ✅ Main Team → Sub-Team

3. **Permission requirement:**
   - Only OWNER or ADMIN of parent can create sub-teams

4. **Cascade deletion:**
   - Deleting parent deletes all sub-teams

**Location:** `packages/backend/src/services/team.service.ts` (lines 76-101)

```typescript
async createSubTeam(userId: string, data: CreateSubTeamRequest): Promise<Team> {
  // Verify parent team exists and is a main team
  const parentTeam = await prisma.team.findUnique({
    where: { id: data.parentTeamId },
  });

  if (!parentTeam) {
    throw new Error('Parent team not found');
  }

  if (!parentTeam.isMainTeam) {
    throw new Error('Sub-teams can only be created under main teams');
  }

  // Verify user has OWNER or ADMIN role
  const membership = await prisma.teamMember.findFirst({
    where: {
      teamId: data.parentTeamId,
      userId: userId,
      role: { in: ['OWNER', 'ADMIN'] },
    },
  });

  if (!membership) {
    throw new Error('You must be an owner or admin to create sub-teams');
  }

  // Create sub-team
  const subTeam = await prisma.team.create({
    data: {
      name: data.name,
      slug: generateSlug(data.name),
      type: 'DEPARTMENT',
      subTeamCategory: data.subTeamCategory,
      description: data.description,
      parentTeamId: data.parentTeamId,
      isMainTeam: false,
    },
  });

  return subTeam;
}
```

### Sub-Team Categories

Each sub-team is tagged with a specific functional category:

```typescript
const CATEGORY_DESCRIPTIONS = {
  ENGINEERING: 'Software development, DevOps, QA, and technical operations',
  MARKETING: 'Growth, content, SEO, campaigns, and digital marketing',
  DESIGN: 'UI/UX design, creative direction, and visual identity',
  HR: 'Human resources, recruitment, and talent management',
  SALES: 'Business development, account management, and revenue',
  PRODUCT: 'Product management, strategy, and roadmap planning',
  OPERATIONS: 'Infrastructure, logistics, and operational excellence',
  FINANCE: 'Accounting, budgeting, and financial planning',
  LEGAL: 'Compliance, contracts, and legal affairs',
  SUPPORT: 'Customer success, technical support, and service',
  OTHER: 'Miscellaneous or cross-functional teams'
};
```

---

## Existing AI Features

### 1. Smart Member Suggestions

**Location:** `packages/backend/src/services/team.service.ts` (lines 749-881)

The platform already uses team type and sub-team category for intelligent member recommendations.

#### Algorithm Overview

```typescript
async getSuggestedMembers(
  teamId: string,
  userId: string,
  limit = 10
): Promise<SuggestedMember[]> {
  // 1. Extract team context
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: { members: true }
  });

  // 2. Generate keywords from team metadata
  const teamKeywords = extractTeamKeywords({
    name: team.name,
    description: team.description,
    type: team.type,              // ← Uses team type!
    subTeamCategory: team.subTeamCategory  // ← Uses department!
  });

  // 3. Get candidate pool
  const users = await prisma.user.findMany({
    where: {
      id: { notIn: existingMemberIds },
      role: { in: ['FREELANCER', 'TEAM_MEMBER'] }
    },
    include: {
      skills: { include: { skill: true } },
      workExperience: true
    }
  });

  // 4. Score each candidate
  const scoredUsers = users.map(user => {
    const score = calculateMatchScore(
      teamKeywords,
      user,
      team.city
    );

    return {
      user,
      score,
      matchReason: generateMatchReason(teamKeywords, user)
    };
  });

  // 5. Return top matches
  return scoredUsers
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
```

#### Scoring System

```typescript
function calculateMatchScore(
  teamKeywords: string[],
  user: UserProfile,
  teamLocation?: string
): number {
  let score = 0;

  // Skill matching (+10 points per match)
  user.skills?.forEach(userSkill => {
    if (teamKeywords.some(kw =>
      userSkill.skill.name.toLowerCase().includes(kw.toLowerCase())
    )) {
      score += 10;
    }
  });

  // Work experience matching (+8 points per match)
  user.workExperience?.forEach(exp => {
    const expText = `${exp.jobTitle} ${exp.description}`.toLowerCase();
    teamKeywords.forEach(kw => {
      if (expText.includes(kw.toLowerCase())) {
        score += 8;
      }
    });
  });

  // Job title matching (+5 points)
  if (user.jobTitle) {
    teamKeywords.forEach(kw => {
      if (user.jobTitle.toLowerCase().includes(kw.toLowerCase())) {
        score += 5;
      }
    });
  }

  // Bio matching (+5 points)
  if (user.bio) {
    teamKeywords.forEach(kw => {
      if (user.bio.toLowerCase().includes(kw.toLowerCase())) {
        score += 5;
      }
    });
  }

  // Location matching (+3 points)
  if (teamLocation && user.location) {
    if (user.location.toLowerCase().includes(teamLocation.toLowerCase())) {
      score += 3;
    }
  }

  return score;
}
```

---

### 2. Keyword Extraction System

**Location:** `packages/backend/src/utils/keywordExtractor.ts`

Maps team types and departments to relevant skill keywords:

```typescript
const TEAM_TYPE_KEYWORDS: Record<SubTeamCategory, string[]> = {
  ENGINEERING: [
    'developer', 'engineer', 'software', 'code', 'programming',
    'frontend', 'backend', 'fullstack', 'devops', 'qa',
    'javascript', 'typescript', 'python', 'java', 'react',
    'node', 'api', 'database', 'cloud', 'docker', 'kubernetes'
  ],

  MARKETING: [
    'marketing', 'digital', 'content', 'seo', 'campaigns',
    'social media', 'analytics', 'growth', 'advertising',
    'brand', 'copywriting', 'email', 'strategy', 'metrics'
  ],

  DESIGN: [
    'designer', 'ui', 'ux', 'creative', 'visual', 'figma',
    'sketch', 'adobe', 'prototype', 'wireframe', 'branding',
    'illustration', 'animation', 'typography', 'interaction'
  ],

  HR: [
    'hr', 'recruitment', 'hiring', 'talent', 'people',
    'onboarding', 'culture', 'benefits', 'compensation',
    'employee', 'retention', 'training', 'development'
  ],

  SALES: [
    'sales', 'business development', 'account', 'revenue',
    'pipeline', 'crm', 'negotiation', 'closing', 'lead',
    'prospecting', 'client', 'relationship', 'quota'
  ],

  PRODUCT: [
    'product manager', 'roadmap', 'strategy', 'features',
    'requirements', 'stakeholder', 'agile', 'scrum',
    'user stories', 'metrics', 'analysis', 'prioritization'
  ],

  OPERATIONS: [
    'operations', 'logistics', 'supply chain', 'process',
    'efficiency', 'infrastructure', 'facilities', 'vendor',
    'project management', 'coordination', 'optimization'
  ],

  FINANCE: [
    'finance', 'accounting', 'budget', 'financial',
    'bookkeeping', 'payroll', 'reporting', 'analysis',
    'forecasting', 'audit', 'tax', 'compliance'
  ],

  LEGAL: [
    'legal', 'lawyer', 'attorney', 'contracts', 'compliance',
    'intellectual property', 'regulation', 'negotiation',
    'risk', 'governance', 'privacy', 'gdpr'
  ],

  SUPPORT: [
    'support', 'customer success', 'help desk', 'service',
    'ticket', 'troubleshooting', 'documentation', 'training',
    'satisfaction', 'retention', 'onboarding', 'technical'
  ],

  OTHER: []
};

export function extractTeamKeywords(team: {
  name?: string;
  description?: string;
  type?: string;
  subTeamCategory?: string;
}): string[] {
  const keywords: Set<string> = new Set();

  // Add category-specific keywords
  if (team.subTeamCategory && TEAM_TYPE_KEYWORDS[team.subTeamCategory]) {
    TEAM_TYPE_KEYWORDS[team.subTeamCategory].forEach(kw => keywords.add(kw));
  }

  // Extract from team name
  if (team.name) {
    const nameWords = team.name.toLowerCase().split(/\s+/);
    nameWords.forEach(word => {
      if (word.length > 3) keywords.add(word);
    });
  }

  // Extract from description (limit to important words)
  if (team.description) {
    const descWords = team.description
      .toLowerCase()
      .split(/\s+/)
      .filter(w => w.length > 4);

    descWords.slice(0, 10).forEach(word => keywords.add(word));
  }

  return Array.from(keywords);
}
```

---

### 3. Job Posting Context

Jobs are linked to both teams and sub-teams:

```typescript
// Job can be company-wide
const companyJob = {
  title: "Chief Technology Officer",
  teamId: "company-id",
  subTeamId: null  // Company-wide role
};

// Or department-specific
const departmentJob = {
  title: "Senior React Developer",
  teamId: "company-id",
  subTeamId: "engineering-dept-id"  // Engineering team only
};
```

**Benefits:**
- Better job discovery (filter by department)
- Contextual candidate matching
- Clear organizational structure

---

## AI Matching Benefits

### How Team Types Enhance Matching

#### 1. Context-Aware Skill Weighting

Different team types value different skills:

```typescript
const SKILL_WEIGHTS_BY_TYPE = {
  COMPANY: {
    technical: 0.7,
    leadership: 0.9,    // Companies value leadership
    business: 0.8,
    creative: 0.6
  },

  ORGANIZATION: {
    technical: 0.6,
    leadership: 0.7,
    business: 0.7,
    creative: 0.9       // Agencies value creativity
  },

  TEAM: {
    technical: 0.9,     // Project teams value technical
    leadership: 0.6,
    business: 0.5,
    creative: 0.7
  }
};
```

#### 2. Department-Specific Matching

When a job is posted by the **Engineering** department:
- ✅ Prioritize candidates with technical skills
- ✅ Weight programming languages highly
- ✅ Match software development experience
- ❌ De-prioritize marketing or sales skills

#### 3. Organizational Intelligence

```typescript
// Example: Matching for a COMPANY with Engineering dept
const matchScore = {
  teamTypeMatch: 0.2,      // Candidate fits company culture
  departmentMatch: 0.3,    // Has engineering skills
  experienceLevel: 0.2,    // Seniority aligns
  skillMatch: 0.2,         // Direct skill overlap
  locationMatch: 0.1       // Geographic preference
};

// Total score: 0-100 points
```

---

## Future AI Enhancements

### Phase 1: Enhanced Metadata (Quick Wins)

#### 1.1 Industry Tags

**Database Schema:**
```prisma
model Team {
  // ... existing fields
  industry String?  // 'FinTech', 'HealthTech', 'SaaS', etc.
  @@index([industry])
}
```

**UI Implementation:**
```typescript
const INDUSTRIES = [
  'FinTech', 'HealthTech', 'EdTech', 'E-commerce',
  'SaaS', 'Media', 'Gaming', 'AI/ML', 'Web3',
  'Consulting', 'Agency', 'Non-Profit', 'Other'
];

// Team creation form
<Select name="industry">
  {INDUSTRIES.map(industry => (
    <SelectItem key={industry} value={industry}>
      {industry}
    </SelectItem>
  ))}
</Select>
```

**Impact:**
- Better job-candidate matching by industry experience
- Vertical-specific talent pools
- Industry trend analysis

---

#### 1.2 Technology Stack

**Database Schema:**
```prisma
model Team {
  // ... existing fields
  techStack Json?  // { languages: [], frameworks: [], tools: [] }
}
```

**Example Data:**
```json
{
  "languages": ["TypeScript", "Python", "Go"],
  "frameworks": ["React", "Node.js", "FastAPI"],
  "tools": ["GitHub", "Docker", "AWS"],
  "databases": ["PostgreSQL", "Redis"]
}
```

**Impact:**
- Direct skill-to-technology matching
- Identify skill gaps automatically
- Tech stack recommendations

---

#### 1.3 Work Style Preferences

**Database Schema:**
```prisma
model Team {
  // ... existing fields
  workStyle String?    // 'remote', 'hybrid', 'onsite'
  pace String?         // 'fast', 'moderate', 'relaxed'
  teamSize String?     // 'startup', 'scaleup', 'enterprise'
  values Json?         // ['innovation', 'work-life-balance', ...]
}
```

**Impact:**
- Cultural fit matching
- Work-life balance alignment
- Reduce turnover through better matches

---

### Phase 2: AI-Powered Matching (Medium Effort)

#### 2.1 Embedding-Based Similarity

**Implementation:**
```typescript
import { OpenAI } from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function generateTeamEmbedding(team: Team): Promise<number[]> {
  const teamDescription = `
    Type: ${team.type}
    Industry: ${team.industry}
    Department: ${team.subTeamCategory || 'N/A'}
    Description: ${team.description}
    Name: ${team.name}
    Tech Stack: ${JSON.stringify(team.techStack)}
  `;

  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: teamDescription,
  });

  return response.data[0].embedding;
}

async function findSimilarTeams(
  teamId: string,
  limit = 10
): Promise<Team[]> {
  const team = await getTeam(teamId);
  const teamEmbedding = await generateTeamEmbedding(team);

  // Use vector database (e.g., Pinecone) for similarity search
  const similar = await vectorDB.query({
    vector: teamEmbedding,
    topK: limit,
    includeMetadata: true
  });

  return similar.matches.map(m => m.metadata.team);
}
```

**Benefits:**
- Semantic understanding beyond keywords
- Find teams with similar culture/focus
- Cross-type recommendations

---

#### 2.2 Dynamic Skill Weighting

**Implementation:**
```typescript
function calculateWeightedScore(
  candidate: UserProfile,
  job: JobPosting,
  team: Team
): number {
  const weights = SKILL_WEIGHTS_BY_TYPE[team.type];
  let score = 0;

  // Technical skills
  const techScore = matchTechnicalSkills(candidate, job);
  score += techScore * weights.technical;

  // Leadership experience
  const leadershipScore = matchLeadership(candidate, job);
  score += leadershipScore * weights.leadership;

  // Business acumen
  const businessScore = matchBusinessSkills(candidate, job);
  score += businessScore * weights.business;

  // Creative abilities
  const creativeScore = matchCreativeSkills(candidate, job);
  score += creativeScore * weights.creative;

  // Department-specific bonus
  if (team.subTeamCategory) {
    const deptScore = matchDepartmentSkills(candidate, team.subTeamCategory);
    score += deptScore * 0.3;
  }

  return Math.min(score, 100);
}
```

---

#### 2.3 Predictive Job Recommendations

**ML Model Training:**
```typescript
interface TrainingData {
  features: {
    teamType: TeamType;
    department: SubTeamCategory;
    industry: string;
    candidateSkills: string[];
    candidateExperience: number;
    jobRequirements: string[];
    salaryRange: [number, number];
    location: string;
  };
  label: {
    applied: boolean;
    hired: boolean;
    successful: boolean;  // 90+ day retention
  };
}

// Train model on historical data
async function trainJobMatchingModel(trainingData: TrainingData[]) {
  // Use TensorFlow.js or external ML service
  const model = await tf.sequential({
    layers: [
      tf.layers.dense({ units: 128, activation: 'relu', inputShape: [features.length] }),
      tf.layers.dropout({ rate: 0.2 }),
      tf.layers.dense({ units: 64, activation: 'relu' }),
      tf.layers.dense({ units: 1, activation: 'sigmoid' })
    ]
  });

  model.compile({
    optimizer: 'adam',
    loss: 'binaryCrossentropy',
    metrics: ['accuracy']
  });

  await model.fit(trainingData);
  return model;
}

// Predict job-candidate fit
async function predictJobFit(
  candidate: UserProfile,
  job: JobPosting
): Promise<number> {
  const features = extractFeatures(candidate, job);
  const prediction = await model.predict(features);
  return prediction * 100;  // 0-100 score
}
```

---

### Phase 3: Advanced Analytics (High Effort)

#### 3.1 Team Success Prediction

**Metrics to Track:**
```typescript
interface TeamMetrics {
  growthRate: number;           // Member growth over time
  projectCompletion: number;    // % of projects completed
  memberRetention: number;      // % retained after 6 months
  hiringSuccess: number;        // % successful hires
  collaborationScore: number;   // Based on interactions
  revenuePerMember: number;     // For companies
}

async function predictTeamSuccess(team: Team): Promise<SuccessPrediction> {
  const historicalData = await getTeamHistory(team.id);
  const similarTeams = await findSimilarTeams(team.id);

  const prediction = ml.predict({
    teamType: team.type,
    memberCount: team.members.length,
    departmentCount: team.subTeams.length,
    industry: team.industry,
    averageExperience: calculateAvgExperience(team.members),
    benchmarkData: similarTeams.map(t => t.metrics)
  });

  return {
    successProbability: prediction.score,
    recommendations: prediction.suggestions,
    benchmarks: prediction.benchmarks
  };
}
```

---

#### 3.2 Talent Pipeline Intelligence

**Automated Sourcing:**
```typescript
async function buildTalentPipeline(
  team: Team,
  department: SubTeamCategory,
  roleName: string
): Promise<TalentPipeline> {
  // 1. Analyze current team composition
  const currentSkills = analyzeTeamSkills(team);
  const skillGaps = identifySkillGaps(currentSkills, department);

  // 2. Market analysis
  const marketTrends = await analyzeMarketTrends(team.industry, department);
  const salaryBenchmarks = await getSalaryBenchmarks(roleName, team.city);

  // 3. Candidate sourcing
  const candidates = await prisma.user.findMany({
    where: {
      role: 'FREELANCER',
      skills: {
        some: {
          skill: {
            name: { in: skillGaps.required }
          }
        }
      },
      hourlyRate: {
        gte: salaryBenchmarks.min,
        lte: salaryBenchmarks.max
      }
    }
  });

  // 4. Score and rank
  const scoredCandidates = candidates.map(c => ({
    candidate: c,
    fitScore: calculateFitScore(c, team, department),
    availabilityScore: c.available ? 100 : 50,
    salaryMatch: calculateSalaryMatch(c.hourlyRate, salaryBenchmarks)
  }));

  return {
    skillGaps,
    marketTrends,
    salaryBenchmarks,
    topCandidates: scoredCandidates.sort((a, b) => b.fitScore - a.fitScore),
    hiringForecast: predictHiringTimeline(department, marketTrends)
  };
}
```

---

#### 3.3 Cultural Fit Analysis

**NLP-Based Matching:**
```typescript
async function analyzeCulturalFit(
  candidate: UserProfile,
  team: Team
): Promise<CulturalFitScore> {
  // Extract team culture from description and values
  const teamCulture = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{
      role: "system",
      content: "Extract cultural values and work style from team description"
    }, {
      role: "user",
      content: `Team: ${team.name}\nType: ${team.type}\nDescription: ${team.description}\nValues: ${JSON.stringify(team.values)}`
    }]
  });

  // Extract candidate preferences from bio and experience
  const candidateCulture = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{
      role: "system",
      content: "Extract work preferences and cultural fit indicators"
    }, {
      role: "user",
      content: `Bio: ${candidate.bio}\nExperience: ${JSON.stringify(candidate.workExperience)}`
    }]
  });

  // Calculate alignment
  const alignment = calculateCulturalAlignment(
    teamCulture.choices[0].message.content,
    candidateCulture.choices[0].message.content
  );

  return {
    score: alignment.score,
    strengths: alignment.matches,
    concerns: alignment.mismatches,
    recommendation: alignment.score > 70 ? 'Strong Fit' : 'Review Required'
  };
}
```

---

## Implementation Roadmap

### Quick Wins (1-2 Weeks)

**Priority:** High
**Effort:** Low
**Impact:** Medium

#### Tasks:
1. **Add Industry Filter**
   - [ ] Add `industry` field to Team model
   - [ ] Update team creation form
   - [ ] Add industry filter to search page
   - [ ] Index industry field for performance

2. **Enhanced Keyword Matching**
   - [ ] Expand keyword dictionary for each department
   - [ ] Add industry-specific keywords
   - [ ] Weight keywords by importance

3. **Analytics Dashboard**
   - [ ] Show team type distribution
   - [ ] Track growth by type
   - [ ] Popular departments chart

**Expected Outcomes:**
- 10-15% improvement in match accuracy
- Better job discovery
- Data-driven insights

---

### Medium-Term (1-2 Months)

**Priority:** High
**Effort:** Medium
**Impact:** High

#### Tasks:
1. **Technology Stack Field**
   - [ ] Add `techStack` JSON field to Team model
   - [ ] Create tech stack input component
   - [ ] Implement direct skill-to-tech matching
   - [ ] Add tech stack filters

2. **AI Job Recommendations**
   - [ ] Build personalized job feed endpoint
   - [ ] Implement scoring algorithm
   - [ ] Create recommendation UI
   - [ ] Add email notifications for top matches

3. **Department Suggestions**
   - [ ] Analyze team size vs department count
   - [ ] Build recommendation engine
   - [ ] Create "Suggested Departments" UI
   - [ ] Industry best practices database

4. **Work Style Preferences**
   - [ ] Add work style fields
   - [ ] Update team creation form
   - [ ] Implement cultural fit matching
   - [ ] Add to search filters

**Expected Outcomes:**
- 25-30% improvement in match accuracy
- Personalized user experience
- Increased engagement

---

### Long-Term (3-6 Months)

**Priority:** Medium
**Effort:** High
**Impact:** Very High

#### Tasks:
1. **Embedding-Based Similarity**
   - [ ] Set up vector database (Pinecone/Weaviate)
   - [ ] Implement embedding generation
   - [ ] Build similarity search
   - [ ] A/B test vs keyword matching

2. **Predictive ML Model**
   - [ ] Collect training data
   - [ ] Train job-candidate fit model
   - [ ] Deploy model to production
   - [ ] Monitor accuracy and retrain

3. **Talent Pipeline Intelligence**
   - [ ] Build market analysis system
   - [ ] Implement automated sourcing
   - [ ] Create pipeline dashboard
   - [ ] Add forecasting features

4. **Team Success Metrics**
   - [ ] Define success KPIs
   - [ ] Collect historical data
   - [ ] Build prediction model
   - [ ] Create benchmarking dashboard

**Expected Outcomes:**
- 40-50% improvement in match accuracy
- Predictive hiring capabilities
- Market intelligence insights
- Competitive advantage

---

## Technical Architecture

### Current System

```
┌─────────────────────────────────────────────────────┐
│                   Frontend Layer                     │
├─────────────────────────────────────────────────────┤
│  • Team Creation Form (type selection)              │
│  • Team Browse Page (type filtering)                │
│  • Job Posting Form (team + department)             │
│  • Search & Discovery                               │
└─────────────────┬───────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────┐
│                   API Layer                          │
├─────────────────────────────────────────────────────┤
│  • Team Service (CRUD + hierarchy)                  │
│  • Job Service (posting + matching)                 │
│  • User Service (profile + skills)                  │
│  • Invitation Service (collaboration)               │
└─────────────────┬───────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────┐
│                 AI/ML Layer                          │
├─────────────────────────────────────────────────────┤
│  • Keyword Extractor (team type → keywords)         │
│  • Match Scorer (candidate → team scoring)          │
│  • Member Suggester (AI recommendations)            │
└─────────────────┬───────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────┐
│                  Data Layer                          │
├─────────────────────────────────────────────────────┤
│  • PostgreSQL (primary data)                        │
│  • Indexed: type, subTeamCategory, industry         │
│  • Relations: parent-child, members, jobs           │
└─────────────────────────────────────────────────────┘
```

### Enhanced System (Future)

```
┌─────────────────────────────────────────────────────┐
│                   Frontend Layer                     │
│  + Industry filters                                  │
│  + Tech stack input                                  │
│  + Personalized job feed                            │
│  + AI recommendations UI                            │
└─────────────────┬───────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────┐
│                   API Layer                          │
│  + Recommendation endpoints                         │
│  + Analytics endpoints                              │
│  + Prediction APIs                                  │
└─────────────────┬───────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────┐
│              Enhanced AI/ML Layer                    │
├─────────────────────────────────────────────────────┤
│  • Embedding Generator (OpenAI)                     │
│  • ML Model (TensorFlow.js)                         │
│  • NLP Analyzer (GPT-4)                             │
│  • Recommendation Engine                            │
│  • Predictive Analytics                             │
└─────────────────┬───────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────┐
│               Enhanced Data Layer                    │
├─────────────────────────────────────────────────────┤
│  • PostgreSQL (primary + new fields)                │
│  • Vector Database (Pinecone) for embeddings        │
│  • Redis (caching + real-time scoring)              │
│  • Analytics Database (time-series data)            │
└─────────────────────────────────────────────────────┘
```

---

## Recommendations

### For Product Team

1. **Prioritize Industry Tags** - Highest ROI, lowest effort
2. **Build Analytics Dashboard** - Data-driven decisions
3. **A/B Test Matching Algorithms** - Measure improvement
4. **Collect User Feedback** - Validate recommendations
5. **Start ML Data Collection Now** - Enable future features

### For Engineering Team

1. **Add Database Indexes** - Optimize queries on type/category
2. **Implement Caching** - Redis for frequent matches
3. **Set Up Vector DB** - Prepare for embeddings
4. **API Rate Limiting** - Protect ML endpoints
5. **Monitoring & Logging** - Track algorithm performance

### For Data Team

1. **Define Success Metrics** - What makes a good match?
2. **Collect Training Data** - Applications, hires, retention
3. **Build Data Pipeline** - ETL for analytics
4. **Create Benchmarks** - Industry standards
5. **A/B Testing Framework** - Experiment infrastructure

---

## Conclusion

HyperGigs' team type system provides a **solid foundation** for AI-powered job and talent matching. The current implementation already leverages team metadata for intelligent recommendations, and there's significant potential to enhance it further.

### Key Takeaways

✅ **Well-Designed:** Clean separation of team types and departments
✅ **AI-Ready:** Active keyword extraction and scoring system
✅ **Scalable:** Hierarchical structure supports growth
✅ **Extensible:** Easy to add new metadata fields

### Next Steps

1. **Phase 1 (Quick Wins):** Add industry tags and tech stack
2. **Phase 2 (AI Features):** Implement embeddings and ML models
3. **Phase 3 (Advanced):** Predictive analytics and market intelligence

The combination of team type, sub-team category, and future enhancements will create a **best-in-class talent marketplace** with unparalleled matching accuracy.

---

**Document Version:** 1.0
**Last Updated:** 2025-01-09
**Maintained By:** Product & Engineering Teams
**Contact:** [engineering@hypergigs.com](mailto:engineering@hypergigs.com)
