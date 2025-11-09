# Job Board & Hiring System - Phase 2
## Complete Implementation & AI Innovation Guide

**Feature:** Job Postings & Applications
**Phase:** 2 - Jobs & Hiring
**Priority:** P0 (Critical for platform value)
**Status:** ✅ 75% Complete
**Last Updated:** November 2025

---

## Overview

The Job Board system enables teams to post job opportunities, freelancers to discover and apply for positions, and incorporates AI-powered matching and recommendations to improve hiring outcomes.

### Core Value Proposition
- **For Teams**: Easy job posting, applicant tracking, and talent discovery
- **For Freelancers**: Curated job recommendations, simple application process
- **For Platform**: Monetization through featured/sponsored listings

---

## ✅ What's Been Completed

### 1. Database Schema (100% Complete)

**JobPosting Model:**
```prisma
model JobPosting {
  id           String           @id @default(uuid())
  title        String
  description  String           // Rich text (HTML)
  location     String?
  type         String           @default("FULL_TIME") // FULL_TIME, PART_TIME, CONTRACT, FREELANCE
  status       String           @default("ACTIVE")     // ACTIVE, CLOSED, DRAFT
  isFeatured   Boolean          @default(false)        // Featured jobs appear at top
  isSponsored  Boolean          @default(false)        // Sponsored jobs interspersed
  minSalary    Int?
  maxSalary    Int?
  currency     String?          @default("USD")
  teamId       String
  subTeamId    String?          // Link to specific department
  createdBy    String
  createdAt    DateTime         @default(now())
  updatedAt    DateTime         @updatedAt

  team         Team             @relation("TeamJobPostings", fields: [teamId], references: [id], onDelete: Cascade)
  subTeam      Team?            @relation("SubTeamJobPostings", fields: [subTeamId], references: [id], onDelete: SetNull)
  creator      User             @relation(fields: [createdBy], references: [id])
  applications JobApplication[]

  @@index([teamId])
  @@index([subTeamId])
  @@index([createdBy])
  @@index([status])
  @@index([teamId, status])
  @@index([subTeamId, status])
  @@index([status, isFeatured])   // For efficient featured job queries
  @@index([status, isSponsored])  // For efficient sponsored job queries
}

model JobApplication {
  id           String      @id @default(uuid())
  jobId        String
  userId       String
  status       String      @default("PENDING") // PENDING, REVIEWING, ACCEPTED, REJECTED
  coverLetter  String?
  createdAt    DateTime    @default(now())
  updatedAt    DateTime    @updatedAt

  job          JobPosting  @relation(fields: [jobId], references: [id], onDelete: Cascade)
  user         User        @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, jobId])  // Prevent duplicate applications
  @@index([jobId])
  @@index([userId])
  @@index([status])
}
```

**Key Features:**
- ✅ Hierarchical job posting (team → sub-team/department)
- ✅ Rich text job descriptions
- ✅ Salary range with multi-currency support
- ✅ Featured/Sponsored job flagging for monetization
- ✅ Comprehensive indexing for performance
- ✅ Application tracking with status workflow

---

### 2. Backend API (85% Complete)

**Implemented Endpoints:**

#### Job Management
- ✅ `POST /api/jobs/:teamId` - Create job posting
- ✅ `GET /api/jobs` - List/search active jobs with filters
- ✅ `GET /api/jobs/:jobId` - Get job details
- ✅ `PUT /api/jobs/:jobId` - Update job posting
- ✅ `DELETE /api/jobs/:jobId` - Delete job posting
- ✅ `GET /api/teams/:teamId/jobs` - Get team's job postings

#### Job Applications
- ✅ `POST /api/jobs/:jobId/apply` - Submit job application
- ✅ `GET /api/jobs/:jobId/applications` - Get job applications (team view)
- ✅ `GET /api/applications/my-applications` - Get user's applications
- ✅ `PUT /api/applications/:applicationId/status` - Update application status
- ⏳ `GET /api/applications/:applicationId` - Get application details (TODO)

**Service Methods (backend/src/services/job.service.ts):**
```typescript
export class JobService {
  // Job CRUD
  async createJob(teamId: string, userId: string, data: CreateJobData)
  async getJobById(jobId: string)
  async updateJob(jobId: string, userId: string, data: UpdateJobData)
  async deleteJob(jobId: string, userId: string)

  // Job Listing & Search
  async getActiveJobs(filters: JobSearchFilters, pagination: Pagination)
  async getTeamJobs(teamId: string, includeSubTeams: boolean)

  // Applications
  async applyToJob(jobId: string, userId: string, coverLetter?: string)
  async getJobApplications(jobId: string, userId: string)
  async updateApplicationStatus(applicationId: string, userId: string, status: string)
  async getUserApplications(userId: string)
}
```

**Key Features:**
- ✅ Role-based authorization (only team owners/admins can manage jobs)
- ✅ Rich text description support
- ✅ Department-specific job postings
- ✅ Application duplicate prevention
- ✅ Status workflow (PENDING → REVIEWING → ACCEPTED/REJECTED)

---

### 3. Frontend UI (70% Complete)

**Implemented Pages:**

#### Job Board Page (`/jobs`) ✅
- ✅ Two-column layout (narrow job list + slim sidebar)
- ✅ Date-grouped job sections (Today, Yesterday, Last Week, Older)
- ✅ Featured jobs highlighted at top of each group (yellow/gold gradient)
- ✅ Sponsored jobs interspersed every 5 regular jobs (blue gradient)
- ✅ Job card with key details (title, location, salary, type, badges)
- ✅ Click to view job details
- ✅ Sidebar with "Featured Companies" and "Post a Job" CTA

**Job Board Features:**
```typescript
// Date categorization
const categorizeJobsByDate = (jobs: JobPosting[]) => {
  return {
    today: jobs.filter(job => isToday(new Date(job.createdAt))),
    yesterday: jobs.filter(job => isYesterday(new Date(job.createdAt))),
    lastWeek: jobs.filter(job => isWithinLastWeek(job.createdAt)),
    older: jobs.filter(job => olderThanWeek(job.createdAt))
  };
};

// Featured/Sponsored sorting
const sortedJobs = regularJobs.sort((a, b) => {
  if (a.isFeatured && !b.isFeatured) return -1;
  if (!a.isFeatured && b.isFeatured) return 1;
  return new Date(b.createdAt) - new Date(a.createdAt);
});

// Sponsored insertion (every 5 jobs)
const insertSponsoredJobs = (regular, sponsored) => {
  // Intersperse sponsored jobs every 5 positions
};
```

#### Job Detail Page (`/jobs/:jobId`) ⏳ PARTIAL
- ✅ Job title, location, salary, type display
- ✅ Rich text description rendering
- ✅ Team/company information
- ⏳ Apply button and application dialog (TODO)
- ⏳ Similar jobs recommendations (TODO)
- ⏳ Share job functionality (TODO)

#### Job Posting Dialog (Team View) ✅
- ✅ Rich text editor for job description
- ✅ Job type selector (Full-time, Part-time, Contract, Freelance)
- ✅ Job status (Active, Draft, Closed)
- ✅ Location input
- ✅ Salary range with currency selector
- ✅ Department/sub-team selector
- ✅ **Featured Job toggle** (yellow star icon, premium feature)
- ✅ **Sponsored Job toggle** (blue lightning icon, premium feature)
- ✅ Create and Edit modes
- ✅ Form validation with Zod

#### Job Card Component ✅
- ✅ Variant system (default, featured, sponsored)
- ✅ Featured styling: Yellow/gold gradient + border + star badge
- ✅ Sponsored styling: Blue gradient + border + lightning badge
- ✅ Status badges (Active, Closed, Draft)
- ✅ Type badges (Full-time, Part-time, etc.)
- ✅ Salary formatting with currency
- ✅ Department/sub-team link
- ✅ Time ago display
- ✅ Edit/Delete actions for job owners

**Component Files:**
- ✅ `/components/JobPostingCard.tsx` - Job listing card
- ✅ `/components/JobPostingDialog.tsx` - Create/edit job form
- ✅ `/components/ui/switch.tsx` - Toggle switch for featured/sponsored
- ✅ `/pages/JobBoardPage.tsx` - Job listings with filtering
- ⏳ `/pages/JobDetailPage.tsx` - Individual job view (partial)
- ⏳ `/components/ApplicationDialog.tsx` - Job application form (TODO)

---

### 4. TypeScript Types (100% Complete)

**Job Types (`/types/job.ts`):**
```typescript
export type JobType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'FREELANCE';
export type JobStatus = 'ACTIVE' | 'CLOSED' | 'DRAFT';
export type ApplicationStatus = 'PENDING' | 'REVIEWING' | 'ACCEPTED' | 'REJECTED';

export interface JobPosting {
  id: string;
  title: string;
  description: string;
  location?: string;
  type: JobType;
  status: JobStatus;
  isFeatured?: boolean;    // Premium feature
  isSponsored?: boolean;   // Premium feature
  minSalary?: number;
  maxSalary?: number;
  currency: string;
  teamId: string;
  subTeamId?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  team: {
    id: string;
    name: string;
    avatar?: string;
  };
  subTeam?: {
    id: string;
    name: string;
  };
  creator: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface CreateJobRequest {
  title: string;
  description: string;
  location?: string;
  type: JobType;
  status?: JobStatus;
  isFeatured?: boolean;
  isSponsored?: boolean;
  minSalary?: number;
  maxSalary?: number;
  currency?: string;
  subTeamId?: string;
}

export interface UpdateJobRequest {
  title?: string;
  description?: string;
  location?: string;
  type?: JobType;
  status?: JobStatus;
  isFeatured?: boolean;
  isSponsored?: boolean;
  minSalary?: number;
  maxSalary?: number;
  currency?: string;
  subTeamId?: string;
}

export interface JobSearchFilters {
  type?: JobType;
  location?: string;
  minSalary?: number;
  maxSalary?: number;
  teamId?: string;
  subTeamId?: string;
}
```

---

## 🚧 What Needs to Be Done

### Priority 1: Core Application Flow (Critical)

#### 1.1 Application Dialog Component ⏳
**File:** `/components/ApplicationDialog.tsx`

**Requirements:**
- [ ] Cover letter text area (optional but recommended)
- [ ] Attach resume/portfolio (file upload or link to profile)
- [ ] Confirmation that profile is complete
- [ ] One-click apply using profile data
- [ ] Success/error handling
- [ ] Prevent duplicate applications (show "Already Applied" state)

**Mockup:**
```typescript
interface ApplicationDialogProps {
  job: JobPosting;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const ApplicationDialog = ({ job, open, onOpenChange, onSuccess }) => {
  const [coverLetter, setCoverLetter] = useState('');
  const { user } = useAuthStore();

  // Check if already applied
  // Validate profile completeness
  // Submit application

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Cover letter textarea */}
      {/* Profile completeness check */}
      {/* Submit button */}
    </Dialog>
  );
};
```

#### 1.2 Job Detail Page Enhancement ⏳
**File:** `/pages/JobDetailPage.tsx`

**Missing Features:**
- [ ] Apply button (opens ApplicationDialog)
- [ ] Application status display (if user already applied)
- [ ] Similar jobs section (3-5 related jobs)
- [ ] Share job functionality (copy link, social media)
- [ ] Save/bookmark job for later
- [ ] Report job functionality

#### 1.3 Application Management UI (Team View) ⏳
**File:** `/pages/TeamJobsPage.tsx` or integrate into `/pages/TeamDetailPage.tsx`

**Requirements:**
- [ ] List of team's job postings
- [ ] Application count per job
- [ ] Click to view applicants
- [ ] Applicant list with:
  - [ ] Profile preview
  - [ ] Application status
  - [ ] Cover letter
  - [ ] Actions: Accept, Reject, Mark as Reviewing
- [ ] Filter by status, job, date
- [ ] Sort by application date, status

---

### Priority 2: Search & Filtering (High)

#### 2.1 Advanced Job Search ⏳
**Location:** Job Board Page

**Missing Filters:**
- [ ] Job type multi-select (Full-time, Part-time, Contract, Freelance)
- [ ] Location search/filter
- [ ] Salary range slider
- [ ] Remote jobs toggle
- [ ] Posted date filter (Last 24h, Last week, Last month)
- [ ] Team/company filter
- [ ] Clear all filters button

**Search Bar:**
- [ ] Keyword search (title, description, skills)
- [ ] Auto-complete suggestions
- [ ] Search history

#### 2.2 Saved Searches ⏳
- [ ] Save filter combinations
- [ ] Email alerts for saved searches
- [ ] Manage saved searches page

---

### Priority 3: User Experience Enhancements (Medium)

#### 3.1 My Applications Page ⏳
**File:** `/pages/MyApplicationsPage.tsx`

**Features:**
- [ ] List all user's job applications
- [ ] Group by status (Pending, Under Review, Accepted, Rejected)
- [ ] Application timeline
- [ ] Withdraw application option
- [ ] Edit cover letter (if still pending)

#### 3.2 Saved Jobs ⏳
**File:** `/pages/SavedJobsPage.tsx`

**Features:**
- [ ] Bookmark/save jobs for later
- [ ] Remove from saved
- [ ] Apply from saved jobs
- [ ] Organize into collections/folders

#### 3.3 Job Alerts ⏳
**Features:**
- [ ] Email notifications for new jobs matching criteria
- [ ] In-app notifications
- [ ] Configure alert frequency (instant, daily, weekly)
- [ ] Manage alert settings

---

### Priority 4: Analytics & Insights (Medium)

#### 4.1 Team Job Analytics Dashboard ⏳
**Features:**
- [ ] Application conversion rates
- [ ] Time to hire metrics
- [ ] Source of applicants
- [ ] Most viewed jobs
- [ ] Application drop-off points

#### 4.2 Freelancer Job Insights ⏳
**Features:**
- [ ] Profile views from job applications
- [ ] Application success rate
- [ ] Suggested profile improvements
- [ ] Competitive salary insights

---

## 🤖 AI Innovation Opportunities

### 1. AI-Powered Job Matching (High Impact) 🚀

**Objective:** Automatically match freelancers with relevant jobs using AI

**Implementation:**

#### 1.1 Skill & Experience Matching
```typescript
interface JobMatchingService {
  async getRecommendedJobs(userId: string, limit = 10): Promise<JobPosting[]> {
    const user = await getUserWithSkillsAndExperience(userId);
    const jobs = await getActiveJobs();

    // AI matching algorithm
    const scoredJobs = jobs.map(job => ({
      job,
      score: calculateMatchScore(user, job)
    }));

    return scoredJobs
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.job);
  }

  calculateMatchScore(user: User, job: JobPosting): number {
    let score = 0;

    // Skills match (40% weight)
    const skillMatch = calculateSkillOverlap(user.skills, extractSkillsFromJob(job));
    score += skillMatch * 0.4;

    // Experience level (20% weight)
    const expMatch = matchExperienceLevel(user.experience, job.description);
    score += expMatch * 0.2;

    // Location preference (15% weight)
    const locationMatch = matchLocation(user.location, job.location);
    score += locationMatch * 0.15;

    // Salary expectation (15% weight)
    const salaryMatch = matchSalaryRange(user.hourlyRate, job.minSalary, job.maxSalary);
    score += salaryMatch * 0.15;

    // Historical success (10% weight)
    const historyMatch = analyzeUserSuccessInSimilarRoles(user, job);
    score += historyMatch * 0.1;

    return score;
  }
}
```

**AI Features:**
- [ ] **Keyword extraction** from job descriptions using NLP
- [ ] **Skill inference** (e.g., "React developer" → React, JavaScript, TypeScript, CSS)
- [ ] **Seniority detection** (Junior, Mid, Senior) from description
- [ ] **Company culture match** based on team description and user preferences
- [ ] **Learning recommendations** (suggest skills to learn for better matches)
- [ ] **RAG-powered company intelligence** (see detailed section below)

**UI Integration:**
- [ ] "Recommended for You" section on job board
- [ ] Match percentage badge on job cards
- [ ] "Why this job matches you" explanation
- [ ] "Improve your match" suggestions
- [ ] Company culture insights expandable section
- [ ] "What employees say" highlights from reviews

---

### 1.1 RAG-Powered Company Intelligence 🔍 (High Impact Extension)

**Objective:** Provide deep company culture and role insights using Retrieval-Augmented Generation

**What it does:**
- Scrapes and analyzes company data from multiple sources
- Generates culture fit scores based on employee reviews and company content
- Provides insider insights on role expectations and company dynamics
- Offers personalized advice on interview preparation and expectations

**Implementation:**

#### Backend Architecture
```typescript
interface CompanyIntelligenceService {
  // RAG Pipeline
  async scrapeCompanyData(teamId: string): Promise<CompanyData> {
    const sources = {
      companyWebsite: await scrapeWebsite(team.website),
      glassdoorReviews: await scrapeGlassdoor(team.name),
      companyNews: await fetchNews(team.name),
      linkedinIntel: await fetchLinkedInData(team.linkedinUrl),
      teamProfile: await getTeamProfile(teamId) // Internal platform data
    };

    return aggregateCompanyData(sources);
  }

  // Vector Database Storage
  async indexCompanyData(teamId: string, data: CompanyData): Promise<void> {
    // Chunk data into meaningful segments
    const chunks = chunkCompanyData(data);

    // Generate embeddings using OpenAI/Cohere
    const embeddings = await generateEmbeddings(chunks);

    // Store in vector DB (Pinecone, Weaviate, or PostgreSQL pgvector)
    await vectorDB.upsert({
      namespace: `company_${teamId}`,
      vectors: embeddings.map((emb, idx) => ({
        id: `chunk_${idx}`,
        values: emb,
        metadata: {
          source: chunks[idx].source,
          content: chunks[idx].text,
          timestamp: new Date()
        }
      }))
    });
  }

  // RAG Query
  async getCompanyInsights(teamId: string, query: string): Promise<CompanyInsights> {
    // Generate query embedding
    const queryEmbedding = await generateEmbedding(query);

    // Retrieve relevant context from vector DB
    const relevantChunks = await vectorDB.query({
      namespace: `company_${teamId}`,
      vector: queryEmbedding,
      topK: 5,
      includeMetadata: true
    });

    // Build RAG prompt with context
    const context = relevantChunks.matches
      .map(match => match.metadata.content)
      .join('\n\n');

    const prompt = `Based on the following company information:

${context}

${query}

Provide specific, actionable insights based only on the information provided.`;

    // Call LLM with context
    const response = await callLLM(prompt);

    return {
      answer: response,
      sources: relevantChunks.matches.map(m => ({
        source: m.metadata.source,
        relevance: m.score
      })),
      confidence: calculateConfidence(relevantChunks)
    };
  }

  // Culture Fit Analysis
  async analyzeCultureFit(userId: string, teamId: string): Promise<CultureFitScore> {
    const user = await getUserProfile(userId);
    const companyData = await getCompanyData(teamId);

    // Extract culture signals from company data
    const cultureSignals = {
      workStyle: extractWorkStyle(companyData), // Remote, hybrid, office
      values: extractCoreValues(companyData),
      pace: detectWorkPace(companyData), // Fast-paced, balanced, deliberate
      communication: analyzeCommunicationStyle(companyData),
      growthOpportunities: extractGrowthSignals(companyData),
      workLifeBalance: analyzeWorkLifeBalance(companyData)
    };

    // Match with user preferences
    const fit = {
      overall: calculateOverallFit(user.preferences, cultureSignals),
      workStyle: matchWorkStyle(user.preferences.workStyle, cultureSignals.workStyle),
      values: matchValues(user.values, cultureSignals.values),
      pace: matchPace(user.preferences.pace, cultureSignals.pace),
      growth: matchGrowth(user.careerGoals, cultureSignals.growthOpportunities)
    };

    return {
      score: fit.overall,
      breakdown: fit,
      insights: generateInsights(fit, cultureSignals),
      redFlags: identifyRedFlags(companyData),
      greenFlags: identifyGreenFlags(companyData)
    };
  }
}
```

#### Data Sources Configuration (MVP)
```typescript
const RAG_DATA_SOURCES = {
  // Primary sources (scrape automatically)
  companyWebsite: {
    pages: ['about', 'careers', 'blog', 'team', 'values'],
    updateFrequency: '7d', // Refresh weekly
    priority: 'high'
  },

  // Glassdoor reviews (last 12 months)
  glassdoorReviews: {
    endpoint: 'https://www.glassdoor.com/api/reviews',
    filters: {
      timeRange: '12m',
      rating: 'all',
      employmentStatus: 'current,former'
    },
    extractFields: ['pros', 'cons', 'advice', 'rating', 'workLifeBalance'],
    updateFrequency: '24h', // Daily refresh
    priority: 'high'
  },

  // Recent news and press releases
  companyNews: {
    sources: ['Google News API', 'Company RSS feed', 'Tech news sites'],
    timeRange: '6m',
    categories: ['company updates', 'funding', 'product launches', 'culture'],
    updateFrequency: '24h',
    priority: 'medium'
  },

  // LinkedIn intelligence
  linkedinIntel: {
    data: [
      'Employee posts and updates',
      'Company page updates',
      'Employee growth trends',
      'Common career paths'
    ],
    updateFrequency: '7d',
    priority: 'medium'
  },

  // Internal platform data (highest quality)
  platformData: {
    data: [
      'Team description and mission',
      'Posted jobs and requirements',
      'Team member profiles and skills',
      'Project portfolio',
      'Hire success rate'
    ],
    updateFrequency: 'real-time',
    priority: 'highest'
  }
};
```

#### Scraping Implementation
```typescript
interface CompanyScraper {
  async scrapeCompanyWebsite(url: string): Promise<WebsiteData> {
    const pages = await Promise.all([
      scrapePage(`${url}/about`),
      scrapePage(`${url}/careers`),
      scrapePage(`${url}/blog`),
      scrapePage(`${url}/team`)
    ]);

    return {
      mission: extractMission(pages.about),
      values: extractValues(pages.about),
      benefits: extractBenefits(pages.careers),
      culture: extractCultureSignals(pages),
      recentUpdates: extractBlogPosts(pages.blog, { limit: 10 })
    };
  }

  async scrapeGlassdoor(companyName: string): Promise<ReviewData> {
    // Use Glassdoor API or web scraping with rate limiting
    const reviews = await fetchGlassdoorReviews(companyName, {
      limit: 100,
      sortBy: 'recent',
      timeRange: '12m'
    });

    return {
      averageRating: calculateAverage(reviews.map(r => r.rating)),
      sentiment: analyzeSentiment(reviews),
      commonThemes: extractThemes(reviews),
      pros: aggregatePros(reviews),
      cons: aggregateCons(reviews),
      workLifeBalanceScore: calculateWorkLifeBalance(reviews),
      careerOpportunitiesScore: calculateCareerOpportunities(reviews),
      managementScore: calculateManagementScore(reviews)
    };
  }

  async fetchCompanyNews(companyName: string): Promise<NewsData> {
    // Use Google News API or news aggregator
    const news = await fetchNews({
      query: companyName,
      timeRange: '6m',
      sources: ['tech_news', 'business_news', 'company_blog']
    });

    return {
      recentAnnouncements: filterAnnouncements(news),
      fundingNews: filterFunding(news),
      productLaunches: filterProductNews(news),
      culturalEvents: filterCultureNews(news),
      sentiment: analyzeNewsSentiment(news)
    };
  }
}
```

#### Culture Analysis Engine
```typescript
interface CultureAnalyzer {
  extractWorkStyle(data: CompanyData): WorkStyle {
    const signals = {
      remoteFriendly: detectRemoteSignals(data),
      flexibility: detectFlexibility(data),
      officePresence: detectOfficeRequirements(data)
    };

    return categorizeWorkStyle(signals);
  }

  extractCoreValues(data: CompanyData): CoreValues {
    // NLP extraction from about page, reviews, job descriptions
    const valueMentions = extractValueMentions(data);

    return {
      innovation: valueMentions.innovation?.frequency || 0,
      collaboration: valueMentions.collaboration?.frequency || 0,
      customerFocus: valueMentions.customerFocus?.frequency || 0,
      diversity: valueMentions.diversity?.frequency || 0,
      workLifeBalance: valueMentions.workLifeBalance?.frequency || 0,
      growth: valueMentions.growth?.frequency || 0
    };
  }

  detectWorkPace(data: CompanyData): WorkPace {
    const indicators = {
      deadline: countMentions(data, ['deadline', 'urgent', 'fast-paced']),
      balanced: countMentions(data, ['balanced', 'sustainable', 'thoughtful']),
      deliberate: countMentions(data, ['quality', 'thorough', 'careful'])
    };

    return categorizePace(indicators);
  }

  identifyRedFlags(data: CompanyData): RedFlag[] {
    const flags = [];

    // High turnover indicators
    if (data.glassdoor.averageRating < 3.0) {
      flags.push({
        type: 'low_rating',
        severity: 'high',
        description: 'Glassdoor rating below 3.0',
        evidence: `Average rating: ${data.glassdoor.averageRating}`
      });
    }

    // Work-life balance concerns
    if (data.glassdoor.workLifeBalanceScore < 2.5) {
      flags.push({
        type: 'work_life_balance',
        severity: 'medium',
        description: 'Employees report poor work-life balance',
        evidence: extractWorkLifeQuotes(data.glassdoor.reviews)
      });
    }

    // Management issues
    if (data.glassdoor.managementScore < 2.5) {
      flags.push({
        type: 'management',
        severity: 'medium',
        description: 'Frequent complaints about management',
        evidence: extractManagementQuotes(data.glassdoor.reviews)
      });
    }

    // Frequent "cons" themes
    const commonCons = extractTopCons(data.glassdoor.reviews, 5);
    if (commonCons.some(con => con.frequency > 0.3)) {
      flags.push({
        type: 'recurring_issues',
        severity: 'medium',
        description: 'Recurring employee concerns',
        evidence: commonCons
      });
    }

    return flags;
  }

  identifyGreenFlags(data: CompanyData): GreenFlag[] {
    const flags = [];

    // High ratings
    if (data.glassdoor.averageRating >= 4.0) {
      flags.push({
        type: 'high_rating',
        description: 'Strong employee satisfaction',
        evidence: `Average rating: ${data.glassdoor.averageRating}`
      });
    }

    // Career growth
    if (data.glassdoor.careerOpportunitiesScore >= 4.0) {
      flags.push({
        type: 'career_growth',
        description: 'Excellent career development opportunities',
        evidence: extractGrowthQuotes(data.glassdoor.reviews)
      });
    }

    // Positive culture mentions
    const positiveCulture = detectPositiveCulture(data);
    if (positiveCulture.score > 0.7) {
      flags.push({
        type: 'positive_culture',
        description: 'Strong, positive company culture',
        evidence: positiveCulture.examples
      });
    }

    return flags;
  }
}
```

#### Frontend UI Components
```typescript
// Company Insights Card
const CompanyInsightsCard = ({ teamId, userId }) => {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInsights();
  }, [teamId, userId]);

  const loadInsights = async () => {
    const data = await companyIntelligence.analyzeCultureFit(userId, teamId);
    setInsights(data);
    setLoading(false);
  };

  if (loading) return <Skeleton />;

  return (
    <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          <CardTitle>Company Intelligence</CardTitle>
        </div>
        <CardDescription>AI-powered insights from employee reviews and company data</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Culture Fit Score */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Culture Fit</span>
            <Badge variant={insights.score > 80 ? 'success' : 'default'}>
              {insights.score}% match
            </Badge>
          </div>
          <Progress value={insights.score} className="h-2" />
        </div>

        {/* Breakdown */}
        <div className="grid grid-cols-2 gap-3">
          <ScoreItem label="Work Style" score={insights.breakdown.workStyle} />
          <ScoreItem label="Values" score={insights.breakdown.values} />
          <ScoreItem label="Pace" score={insights.breakdown.pace} />
          <ScoreItem label="Growth" score={insights.breakdown.growth} />
        </div>

        {/* Green Flags */}
        {insights.greenFlags.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-1">
              <CheckCircle className="w-4 h-4 text-green-600" />
              What's Great
            </h4>
            <ul className="space-y-1">
              {insights.greenFlags.map((flag, idx) => (
                <li key={idx} className="text-sm text-muted-foreground">
                  • {flag.description}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Red Flags */}
        {insights.redFlags.length > 0 && (
          <Alert variant="warning">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Things to Consider</AlertTitle>
            <AlertDescription>
              <ul className="space-y-1 mt-2">
                {insights.redFlags.map((flag, idx) => (
                  <li key={idx} className="text-sm">• {flag.description}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Employee Highlights */}
        <div>
          <h4 className="text-sm font-semibold mb-2">What Employees Say</h4>
          <div className="space-y-2">
            <Quote text={insights.topPro} type="pro" />
            <Quote text={insights.topCon} type="con" />
          </div>
        </div>

        {/* Ask AI Button */}
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setShowAIChat(true)}
        >
          <MessageSquare className="w-4 h-4 mr-2" />
          Ask AI about this company
        </Button>
      </CardContent>
    </Card>
  );
};
```

**Data Sources (MVP):**
```typescript
const ragSources = {
  // Scrape automatically
  companyWebsite: 'About page, careers page, blog, team page',

  // API integration
  glassdoorReviews: 'Recent employee reviews (last 12 months)',

  // News aggregation
  companyNews: 'Recent press releases and news coverage (6 months)',

  // Social intelligence
  linkedinIntel: 'Employee posts and company updates',

  // Platform data (highest quality)
  internalData: 'Team profile, job history, member skills, project portfolio'
};
```

**Privacy & Ethics:**
- [ ] Only use publicly available data
- [ ] Clearly label AI-generated insights
- [ ] Allow companies to verify and correct information
- [ ] Respect robots.txt and rate limits
- [ ] Anonymize individual review quotes
- [ ] GDPR compliance for data storage

**Technical Requirements:**
- Vector database (Pinecone, Weaviate, or PostgreSQL pgvector)
- LLM API (OpenAI GPT-4, Anthropic Claude, or open-source)
- Web scraping (Puppeteer, Playwright, or ScrapingBee API)
- Embeddings API (OpenAI, Cohere, or sentence-transformers)
- Background job queue (Bull/BullMQ) for scraping tasks
- Cache layer (Redis) for frequently accessed insights

---

### 2. AI Job Description Generator (Medium Impact) 🎯

**Objective:** Help teams write better job descriptions using AI

**Implementation:**

```typescript
interface JobDescriptionAI {
  async generateJobDescription(input: {
    jobTitle: string;
    requiredSkills: string[];
    experienceLevel: 'junior' | 'mid' | 'senior';
    jobType: JobType;
    teamDescription?: string;
  }): Promise<string> {
    const prompt = `Generate a compelling job description for:
    - Title: ${input.jobTitle}
    - Skills: ${input.requiredSkills.join(', ')}
    - Level: ${input.experienceLevel}
    - Type: ${input.jobType}

    Include: responsibilities, requirements, nice-to-haves, and benefits.
    Make it engaging and inclusive.`;

    // Call AI API (OpenAI, Claude, etc.)
    const description = await callAI(prompt);

    return formatAsHTML(description);
  }

  async improveJobDescription(current: string): Promise<{
    improved: string;
    suggestions: string[];
  }> {
    // Analyze and suggest improvements
    // Check for bias, clarity, inclusiveness
    // Suggest missing information
  }

  async extractSkillsFromDescription(description: string): Promise<string[]> {
    // Use NLP to extract required skills
  }
}
```

**UI Features:**
- [ ] "Generate with AI" button in job posting dialog
- [ ] "Improve description" suggestions
- [ ] Real-time bias detection (gender, age, etc.)
- [ ] Readability score
- [ ] Keyword optimization for SEO

---

### 3. AI Cover Letter Assistant (Medium Impact) ✍️

**Objective:** Help freelancers write personalized cover letters

**Implementation:**

```typescript
interface CoverLetterAI {
  async generateCoverLetter(input: {
    job: JobPosting;
    userProfile: User;
    tone?: 'professional' | 'casual' | 'enthusiastic';
  }): Promise<string> {
    const prompt = `Write a personalized cover letter for:

    Job: ${input.job.title} at ${input.job.team.name}
    Requirements: ${extractKeyRequirements(input.job.description)}

    Applicant background:
    - Skills: ${input.userProfile.skills.join(', ')}
    - Experience: ${input.userProfile.bio}
    - Portfolio: ${input.userProfile.portfolio}

    Tone: ${input.tone || 'professional'}
    Length: 200-300 words

    Highlight relevant experience and enthusiasm for the role.`;

    return await callAI(prompt);
  }

  async suggestImprovements(coverLetter: string, job: JobPosting): Promise<string[]> {
    // Analyze cover letter
    // Suggest improvements based on job requirements
  }
}
```

**UI Features:**
- [ ] "Draft with AI" button in application dialog
- [ ] Tone selector (Professional, Enthusiastic, Casual)
- [ ] Real-time suggestions as user types
- [ ] Highlight matched keywords from job description
- [ ] Length recommendation

---

### 4. Smart Application Screening (High Impact) 🎓

**Objective:** Help teams quickly identify best candidates using AI

**Implementation:**

```typescript
interface ApplicationScreening {
  async scoreApplication(application: JobApplication): Promise<{
    score: number;
    reasoning: string;
    strengths: string[];
    concerns: string[];
    recommendation: 'strong_yes' | 'yes' | 'maybe' | 'no';
  }> {
    const job = await getJob(application.jobId);
    const applicant = await getUser(application.userId);

    // AI analysis
    const analysis = await analyzeMatch({
      jobRequirements: extractRequirements(job.description),
      applicantSkills: applicant.skills,
      applicantExperience: applicant.portfolio,
      coverLetter: application.coverLetter
    });

    return {
      score: analysis.matchScore,
      reasoning: analysis.explanation,
      strengths: analysis.matchedQualifications,
      concerns: analysis.gaps,
      recommendation: categorizeScore(analysis.matchScore)
    };
  }

  async rankApplications(jobId: string): Promise<RankedApplication[]> {
    const applications = await getApplications(jobId);

    const scored = await Promise.all(
      applications.map(async app => ({
        application: app,
        score: await scoreApplication(app)
      }))
    );

    return scored.sort((a, b) => b.score.score - a.score.score);
  }
}
```

**UI Features:**
- [ ] AI match score badge on each application
- [ ] Automatic ranking (Top Candidates, Good Fit, Maybe, Not a Fit)
- [ ] Highlight key qualifications in applicant profile
- [ ] "Why this candidate?" AI explanation
- [ ] Blind screening option (hide demographic info)

---

### 5. Salary Insights & Recommendations (Medium Impact) 💰

**Objective:** Provide data-driven salary recommendations

**Implementation:**

```typescript
interface SalaryInsights {
  async getSalaryRecommendation(input: {
    jobTitle: string;
    skills: string[];
    location: string;
    experienceLevel: string;
  }): Promise<{
    median: number;
    min: number;
    max: number;
    percentile25: number;
    percentile75: number;
    currency: string;
    dataPoints: number;
    insights: string[];
  }> {
    // Aggregate from platform data + external APIs
    const platformData = await getInternalSalaryData(input);
    const marketData = await fetchMarketData(input); // External API

    return combineSalaryInsights(platformData, marketData);
  }

  async analyzeSalaryCompetitiveness(job: JobPosting): Promise<{
    competitive: 'very_high' | 'high' | 'average' | 'low' | 'very_low';
    insights: string[];
    suggestions: string[];
  }> {
    // Compare job salary to market rates
  }
}
```

**UI Features:**
- [ ] Salary range suggestion when creating job
- [ ] "Your salary is X% above/below market rate" indicator
- [ ] Salary trends graph
- [ ] Location-adjusted salary calculator
- [ ] Anonymous salary data contribution

---

### 6. Predictive Hiring Analytics (Advanced) 📊

**Objective:** Predict hiring success and optimize job postings

**Implementation:**

```typescript
interface PredictiveAnalytics {
  async predictApplicationRate(job: CreateJobRequest): Promise<{
    estimatedApplications: number;
    timeToFill: number; // days
    qualityScore: number;
    suggestions: string[];
  }> {
    // ML model trained on historical data
    // Analyze title, description, salary, requirements
  }

  async optimizeJobPosting(job: JobPosting): Promise<{
    currentScore: number;
    optimizedVersion: Partial<JobPosting>;
    improvements: Array<{
      field: string;
      current: string;
      suggested: string;
      impact: number;
    }>;
  }> {
    // Suggest improvements to increase quality applications
  }

  async predictSuccessfulHire(application: JobApplication): Promise<{
    likelihood: number; // 0-1
    reasoning: string;
    factors: Array<{ factor: string; weight: number }>;
  }> {
    // Predict if hire will be successful based on historical data
  }
}
```

---

## 🎨 UI/UX Enhancements

### 1. Job Board Improvements
- [ ] Infinite scroll pagination
- [ ] Skeleton loading states
- [ ] Job card hover animations
- [ ] Quick preview modal (view job without leaving page)
- [ ] Keyboard navigation support
- [ ] Dark mode optimizations

### 2. Mobile Optimization
- [ ] Responsive job cards (stack on mobile)
- [ ] Mobile-friendly filters (drawer instead of sidebar)
- [ ] Swipe gestures (save, apply, skip)
- [ ] Mobile application flow optimization

### 3. Accessibility
- [ ] Screen reader optimizations
- [ ] ARIA labels for all interactive elements
- [ ] Keyboard shortcuts
- [ ] High contrast mode support

---

## 📊 Success Metrics

### For Teams
- Time to first qualified application
- Application quality score
- Cost per hire
- Featured job conversion rate

### For Freelancers
- Jobs matched vs jobs viewed
- Application success rate
- Time to job offer
- Salary satisfaction score

### For Platform
- Monthly active job postings
- Application submission rate
- Featured/Sponsored listing revenue
- User engagement (time on job board)

---

## 🔐 Security & Privacy

### Application Privacy
- [ ] Applicant data accessible only to job poster
- [ ] Anonymize applications option (blind hiring)
- [ ] GDPR compliance (data deletion requests)
- [ ] Application data encryption at rest

### Anti-Spam Measures
- [ ] Rate limiting on applications (prevent spam applications)
- [ ] Job posting moderation queue
- [ ] Report job/application functionality
- [ ] Automated content filtering

---

## 🚀 Future Enhancements (Phase 3+)

### 1. Video Applications
- [ ] Record video introduction
- [ ] AI-powered video analysis (communication skills, enthusiasm)
- [ ] Asynchronous video interviews

### 2. Skills Testing
- [ ] Integrated coding challenges
- [ ] Design portfolio reviews
- [ ] Skills assessment scores

### 3. Contract Management
- [ ] Job offer → contract generation
- [ ] Digital signatures
- [ ] Milestone-based payments
- [ ] Time tracking integration

### 4. Team Collaboration
- [ ] Collaborative hiring (multiple reviewers)
- [ ] Interview scheduling
- [ ] Candidate feedback forms
- [ ] Hiring pipeline visualization

---

## 📝 Technical Debt & Optimizations

### Backend
- [ ] Implement job posting cache (Redis)
- [ ] Optimize search queries (Elasticsearch)
- [ ] Add job posting draft auto-save
- [ ] Bulk application actions API

### Frontend
- [ ] Implement virtual scrolling for large job lists
- [ ] Add progressive image loading
- [ ] Optimize re-renders (React.memo, useMemo)
- [ ] Bundle size optimization

### Database
- [ ] Add full-text search indexes
- [ ] Archive old job postings (>90 days closed)
- [ ] Application data retention policy

---

## 📚 Documentation Needed

- [ ] API documentation (Swagger/OpenAPI)
- [ ] Job posting best practices guide
- [ ] Application review guidelines
- [ ] AI feature usage tutorials
- [ ] FAQ for teams and freelancers

---

## 🎯 Immediate Next Steps

### Week 1: Complete Core Application Flow
1. Build ApplicationDialog component
2. Complete Job Detail Page (apply button integration)
3. Implement application status management
4. Test end-to-end application flow

### Week 2: Search & Filtering
1. Add advanced filters to job board
2. Implement saved searches
3. Build My Applications page
4. Add saved jobs functionality

### Week 3: AI Integration - Phase 1
1. Implement AI job matching (recommended jobs)
2. Add job description generator
3. Build cover letter assistant
4. Deploy and test AI features

### Week 4: Analytics & Polish
1. Team job analytics dashboard
2. Freelancer insights page
3. Mobile optimization
4. Performance tuning

---

**Status Summary:**
- ✅ Database & Schema: 100%
- ✅ Backend API: 85%
- ⏳ Frontend UI: 70%
- ⏳ Application Flow: 40%
- ⏳ Search & Filters: 30%
- 🚀 AI Features: 0% (high potential)

**Overall Progress: 75% Complete**

---

**Next Review Date:** End of Week 1
**Owner:** Product & Engineering Team
**AI Innovation Priority:** HIGH - Significant competitive advantage
