# Profile Page Enhancements - Task Breakdown

## Overview
Complete the missing features for the Profile Page to ensure a fully functional user profile experience before moving to Phase 2.

**Total Estimated Time:** 8-10 days  
**Priority:** P0 (Critical - blocks Phase 2)  
**Base Branch:** `feature/redesign-profile-awwwards-style`

---

## Task Execution Order

### ✅ Logical Implementation Sequence:

1. **Task 1.6.1** - Fix Skill Removal (QUICK WIN - 2 hours)
2. **Task 1.6.2** - Fix Hourly Rate Save/Display (QUICK WIN - 2 hours)
3. **Task 1.6.7** - Clean URL with Username (INFRASTRUCTURE - 4 hours)
4. **Task 1.6.3** - Portfolio Edit Functionality (CORE - 1 day)
5. **Task 1.6.4** - Multiple Portfolio Images (CORE - 1.5 days)
6. **Task 1.6.5** - Project Detail Page (FEATURE - 2 days)
7. **Task 1.6.6** - Project View Modal (FEATURE - 1 day)
8. **Task 1.6.8** - Global Footer (UI - 0.5 day)

**Rationale:**
- Start with quick wins to build momentum
- Fix infrastructure (URLs) before building new features
- Portfolio features build on each other sequentially
- Footer is independent and can be done last

---

## Task 1.6.1: Fix Skill Removal

**Branch:** `fix/skill-removal`  
**Estimated Time:** 2 hours  
**Priority:** P0

### Problem
The skill removal "X" button is not working when clicked.

### Implementation

#### Frontend Changes
**File:** `packages/frontend/src/pages/ProfilePage.tsx`

```typescript
// Verify handleRemoveSkill function is correctly implemented
const handleRemoveSkill = async (userSkillId: string) => {
  try {
    await userService.removeSkill(userSkillId);
    setSkills(skills.filter(s => s.id !== userSkillId));
  } catch (err: any) {
    setError(err.response?.data?.message || 'Failed to remove skill');
  }
};

// Ensure the X button has correct click handler
{isOwnProfile && (
  <button
    onClick={(e) => {
      e.stopPropagation();
      handleRemoveSkill(userSkill.id);
    }}
    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded transition-all"
  >
    <X className="w-3 h-3 text-red-600" />
  </button>
)}
```

#### Backend Verification
**File:** `packages/backend/src/services/user.service.ts`

Ensure `removeSkill` method exists and works correctly:
```typescript
async removeSkill(userId: string, userSkillId: string) {
  // Verify ownership
  const skill = await prisma.userSkill.findUnique({
    where: { id: userSkillId }
  });
  
  if (!skill || skill.userId !== userId) {
    throw new Error('Unauthorized or skill not found');
  }
  
  await prisma.userSkill.delete({
    where: { id: userSkillId }
  });
  
  return { success: true };
}
```

### Acceptance Criteria
- [ ] Clicking X removes skill from UI
- [ ] Skill is deleted from database
- [ ] Error handling works
- [ ] UI updates immediately

---

## Task 1.6.2: Fix Hourly Rate Save/Display

**Branch:** `fix/hourly-rate-persistence`  
**Estimated Time:** 2 hours  
**Priority:** P0

### Problem
Hourly rate data is not saving or displaying after being added.

### Implementation

#### Frontend Changes
**File:** `packages/frontend/src/pages/ProfilePage.tsx`

```typescript
// Ensure hourlyRate is properly handled in form
const handleChange = (
  e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
) => {
  const { name, value, type } = e.target;
  setFormData((prev) => ({
    ...prev,
    [name]: type === 'number' ? (value === '' ? 0 : parseFloat(value)) : value,
  }));
};

// Display daily rate calculation
{profile.hourlyRate && profile.hourlyRate > 0 && (
  <div className="text-center p-6 border border-border rounded-2xl bg-white">
    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
      Daily Rate
    </p>
    <p className="text-3xl font-bold">${(profile.hourlyRate * 8).toFixed(0)}</p>
    <p className="text-xs text-muted-foreground mt-1">${profile.hourlyRate}/hour</p>
  </div>
)}
```

#### Backend Changes
**File:** `packages/backend/src/services/user.service.ts`

```typescript
async updateProfile(userId: string, data: UpdateProfileData) {
  return await prisma.user.update({
    where: { id: userId },
    data: {
      ...data,
      hourlyRate: data.hourlyRate ? parseFloat(data.hourlyRate.toString()) : undefined
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      username: true,
      bio: true,
      location: true,
      hourlyRate: true, // Make sure this is included
      available: true,
      avatar: true,
      updatedAt: true
    }
  });
}
```

#### Type Updates
**File:** `packages/frontend/src/types/user.ts`

```typescript
export interface UserProfile {
  // ... other fields
  hourlyRate?: number;
  available?: boolean;
}

export interface UpdateProfileRequest {
  // ... other fields
  hourlyRate?: number;
  available?: boolean;
}
```

### Acceptance Criteria
- [ ] Hourly rate saves to database
- [ ] Hourly rate displays on profile
- [ ] Daily rate calculates correctly (hourlyRate * 8)
- [ ] Zero/empty values handled properly

---

## Task 1.6.3: Portfolio Edit Functionality

**Branch:** `feature/portfolio-edit`  
**Estimated Time:** 1 day  
**Priority:** P0

### Implementation

#### Frontend Changes
**File:** `packages/frontend/src/pages/ProfilePage.tsx`

```typescript
// Add edit state for portfolio
const [editingPortfolio, setEditingPortfolio] = useState<string | null>(null);
const [portfolioEditForm, setPortfolioEditForm] = useState<CreatePortfolioRequest | null>(null);

// Edit portfolio handler
const handleEditPortfolio = (item: PortfolioItem) => {
  setEditingPortfolio(item.id);
  setPortfolioEditForm({
    name: item.name,
    description: item.description || '',
    companyName: item.companyName || '',
    role: item.role || '',
    workUrls: item.workUrls || '',
    mediaFile: item.mediaFile || ''
  });
  setPortfolioImagePreview(item.mediaFile || null);
};

// Update portfolio handler
const handleUpdatePortfolio = async (portfolioId: string) => {
  if (!portfolioEditForm?.name.trim()) return;
  
  try {
    const portfolioData = {
      ...portfolioEditForm,
      ...(portfolioImagePreview && portfolioImagePreview !== portfolioEditForm.mediaFile && { 
        mediaFile: portfolioImagePreview 
      })
    };
    
    const updated = await userService.updatePortfolioItem(portfolioId, portfolioData);
    setPortfolio(portfolio.map(p => p.id === portfolioId ? updated : p));
    setEditingPortfolio(null);
    setPortfolioEditForm(null);
    setPortfolioImagePreview(null);
  } catch (err: any) {
    setError(err.response?.data?.message || 'Failed to update portfolio item');
  }
};

// Portfolio card with edit button
<div className="group relative bg-white rounded-2xl border border-border overflow-hidden hover:border-primary transition-all hover:shadow-lg">
  {isOwnProfile && (
    <button
      onClick={() => handleEditPortfolio(item)}
      className="absolute top-4 right-4 z-10 p-2 bg-white/90 backdrop-blur-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-100"
    >
      <Edit2 className="w-4 h-4" />
    </button>
  )}
  {/* rest of card */}
</div>

// Edit form (conditional rendering)
{editingPortfolio === item.id ? (
  <div className="p-6 space-y-4">
    {/* Same form fields as add portfolio */}
  </div>
) : (
  <div className="p-6">
    {/* Display mode */}
  </div>
)}
```

#### Backend Changes
**File:** `packages/backend/src/services/user.service.ts`

```typescript
async updatePortfolioItem(
  userId: string, 
  portfolioId: string, 
  data: UpdatePortfolioData
) {
  // Verify ownership
  const portfolio = await prisma.portfolioItem.findUnique({
    where: { id: portfolioId }
  });
  
  if (!portfolio || portfolio.userId !== userId) {
    throw new Error('Unauthorized or portfolio not found');
  }
  
  return await prisma.portfolioItem.update({
    where: { id: portfolioId },
    data: {
      name: data.name,
      description: data.description,
      companyName: data.companyName,
      role: data.role,
      workUrls: data.workUrls,
      ...(data.mediaFile && { mediaFile: data.mediaFile })
    }
  });
}
```

**File:** `packages/backend/src/routes/user.routes.ts`

```typescript
router.put('/me/portfolio/:portfolioId', authenticate, userController.updatePortfolio);
```

### Acceptance Criteria
- [ ] Pencil icon appears on hover (logged-in user only)
- [ ] Clicking pencil shows edit form inline
- [ ] All fields editable
- [ ] Image can be updated
- [ ] Cancel button reverts changes
- [ ] Save updates database and UI

---

## Task 1.6.4: Multiple Portfolio Images (Max 4, 500KB limit)

**Branch:** `feature/portfolio-multiple-images`  
**Estimated Time:** 1.5 days  
**Priority:** P1

### Database Schema Update
**File:** `packages/backend/prisma/schema.prisma`

```prisma
model PortfolioItem {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  name        String
  description String?
  companyName String?
  role        String?
  workUrls    String?
  mediaFiles  String[] // Changed from mediaFile to mediaFiles array
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([userId])
}
```

**Migration:**
```bash
npx prisma migrate dev --name portfolio_multiple_images
```

### Implementation

#### Frontend Changes
**File:** `packages/frontend/src/pages/ProfilePage.tsx`

```typescript
// Update portfolio form state
const [portfolioForm, setPortfolioForm] = useState<CreatePortfolioRequest>({
  name: '',
  description: '',
  companyName: '',
  role: '',
  workUrls: '',
  mediaFiles: [] // Changed from mediaFile
});

const [portfolioImagePreviews, setPortfolioImagePreviews] = useState<string[]>([]);
const MAX_IMAGES = 4;
const MAX_FILE_SIZE = 500 * 1024; // 500KB in bytes

// Handle multiple image upload
const handlePortfolioImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const files = Array.from(e.target.files || []);
  
  if (portfolioImagePreviews.length + files.length > MAX_IMAGES) {
    setError(`Maximum ${MAX_IMAGES} images allowed`);
    return;
  }
  
  files.forEach(file => {
    if (file.size > MAX_FILE_SIZE) {
      setError(`Image ${file.name} exceeds 500KB limit`);
      return;
    }
    
    if (!file.type.startsWith('image/')) {
      setError(`${file.name} is not an image`);
      return;
    }
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setPortfolioImagePreviews(prev => [...prev, reader.result as string]);
    };
    reader.readAsDataURL(file);
  });
};

// Remove image from preview
const handleRemovePortfolioImage = (index: number) => {
  setPortfolioImagePreviews(prev => prev.filter((_, i) => i !== index));
};

// Image upload UI
<div className="space-y-4">
  <label className="block text-sm font-medium mb-2">
    Project Images (Max 4, 500KB each)
  </label>
  
  {/* Image previews */}
  <div className="grid grid-cols-2 gap-4">
    {portfolioImagePreviews.map((preview, index) => (
      <div key={index} className="relative group">
        <img 
          src={preview} 
          alt={`Preview ${index + 1}`} 
          className="w-full h-32 object-cover rounded-lg"
        />
        <button
          onClick={() => handleRemovePortfolioImage(index)}
          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    ))}
    
    {/* Upload button - only show if less than 4 images */}
    {portfolioImagePreviews.length < MAX_IMAGES && (
      <div
        className="border-2 border-dashed border-border rounded-lg p-4 flex items-center justify-center cursor-pointer hover:border-primary transition-colors"
        onClick={() => portfolioFileInputRef.current?.click()}
      >
        <div className="text-center">
          <ImageIcon className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">
            Add Image ({portfolioImagePreviews.length}/{MAX_IMAGES})
          </p>
        </div>
      </div>
    )}
  </div>
  
  <input
    ref={portfolioFileInputRef}
    type="file"
    accept="image/*"
    multiple
    onChange={handlePortfolioImagesChange}
    className="hidden"
  />
  
  <p className="text-xs text-muted-foreground">
    💡 Max 4 images, 500KB each. Supported formats: JPG, PNG, WebP
  </p>
</div>

// Portfolio card carousel for multiple images
<div className="relative">
  {item.mediaFiles && item.mediaFiles.length > 0 && (
    <div className="relative aspect-video bg-gray-100 rounded-t-2xl overflow-hidden">
      <img 
        src={item.mediaFiles[currentImageIndex]} 
        alt={item.name} 
        className="w-full h-full object-cover"
      />
      
      {item.mediaFiles.length > 1 && (
        <>
          <button
            onClick={() => setCurrentImageIndex((prev) => 
              prev === 0 ? item.mediaFiles.length - 1 : prev - 1
            )}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentImageIndex((prev) => 
              prev === item.mediaFiles.length - 1 ? 0 : prev + 1
            )}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          
          {/* Image indicators */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {item.mediaFiles.map((_, index) => (
              <div
                key={index}
                className={`w-1.5 h-1.5 rounded-full ${
                  index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )}
</div>
```

#### Backend Changes
**File:** `packages/backend/src/services/user.service.ts`

```typescript
async addPortfolioItem(userId: string, data: CreatePortfolioData) {
  // Validate images
  if (data.mediaFiles && data.mediaFiles.length > 4) {
    throw new Error('Maximum 4 images allowed');
  }
  
  return await prisma.portfolioItem.create({
    data: {
      userId,
      name: data.name,
      description: data.description,
      companyName: data.companyName,
      role: data.role,
      workUrls: data.workUrls,
      mediaFiles: data.mediaFiles || []
    }
  });
}
```

### Acceptance Criteria
- [ ] Users can upload up to 4 images per project
- [ ] Images over 500KB are rejected with error
- [ ] Image carousel works on portfolio cards
- [ ] Image indicators show current position
- [ ] Can remove individual images before saving
- [ ] Images save as array in database

---

## Task 1.6.5: Project Detail Page

**Branch:** `feature/project-detail-page`  
**Estimated Time:** 2 days  
**Priority:** P1

### Implementation

#### New Page Component
**File:** `packages/frontend/src/pages/ProjectDetailPage.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import { userService } from '@/services/api/user.service';
import { ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';

export default function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<any>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProject();
  }, [projectId]);

  const loadProject = async () => {
    try {
      setIsLoading(true);
      const data = await userService.getPortfolioItem(projectId!);
      setProject(data);
    } catch (err) {
      console.error('Failed to load project', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (!project) return <div>Project not found</div>;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="pt-24 pb-16 px-8">
        <div className="max-w-6xl mx-auto">
          {/* Back button */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Profile
          </button>

          {/* Project header */}
          <div className="mb-12">
            <h1 className="text-5xl font-bold mb-4">{project.name}</h1>
            <div className="flex items-center gap-6 text-muted-foreground">
              {project.companyName && (
                <span className="uppercase tracking-wider">{project.companyName}</span>
              )}
              {project.role && (
                <>
                  <span>•</span>
                  <span className="uppercase tracking-wider">{project.role}</span>
                </>
              )}
            </div>
          </div>

          {/* Image gallery */}
          {project.mediaFiles && project.mediaFiles.length > 0 && (
            <div className="mb-12">
              <div className="relative aspect-video bg-gray-100 rounded-2xl overflow-hidden mb-4">
                <img
                  src={project.mediaFiles[currentImageIndex]}
                  alt={project.name}
                  className="w-full h-full object-cover"
                />
                
                {project.mediaFiles.length > 1 && (
                  <>
                    <button
                      onClick={() => setCurrentImageIndex(prev => 
                        prev === 0 ? project.mediaFiles.length - 1 : prev - 1
                      )}
                      className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                      onClick={() => setCurrentImageIndex(prev => 
                        prev === project.mediaFiles.length - 1 ? 0 : prev + 1
                      )}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnail strip */}
              {project.mediaFiles.length > 1 && (
                <div className="flex gap-4 overflow-x-auto pb-2">
                  {project.mediaFiles.map((image: string, index: number) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden border-2 transition-all ${
                        index === currentImageIndex 
                          ? 'border-primary' 
                          : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={image}
                        alt={`${project.name} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Project description */}
          {project.description && (
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-4">About this project</h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {project.description}
              </p>
            </div>
          )}

          {/* External link */}
          {project.workUrls && (
            <div className="pt-8 border-t border-border">
              <a
                href={project.workUrls}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                <ExternalLink className="w-5 h-5" />
                View Live Project
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

#### Backend Endpoint
**File:** `packages/backend/src/services/user.service.ts`

```typescript
async getPortfolioItem(portfolioId: string) {
  const portfolio = await prisma.portfolioItem.findUnique({
    where: { id: portfolioId },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          username: true,
          avatar: true
        }
      }
    }
  });
  
  if (!portfolio) {
    throw new Error('Portfolio item not found');
  }
  
  return portfolio;
}
```

**File:** `packages/backend/src/routes/user.routes.ts`

```typescript
router.get('/portfolio/:portfolioId', userController.getPortfolioItem);
```

#### Routing
**File:** `packages/frontend/src/App.tsx`

```typescript
<Route path="/projects/:projectId" element={<ProjectDetailPage />} />
```

#### Profile Page Link Update
**File:** `packages/frontend/src/pages/ProfilePage.tsx`

```typescript
<Link to={`/projects/${item.id}`} className="...">
  {/* Portfolio card content */}
</Link>
```

### Acceptance Criteria
- [ ] Dedicated page for each project
- [ ] Full-size image gallery with navigation
- [ ] Thumbnail strip for quick navigation
- [ ] Complete project details displayed
- [ ] External link button (if URL exists)
- [ ] Responsive design
- [ ] Back navigation works

---

## Task 1.6.6: Project View Modal (No External URL)

**Branch:** `feature/project-view-modal`  
**Estimated Time:** 1 day  
**Priority:** P1

### Implementation

#### Modal Component
**File:** `packages/frontend/src/components/ProjectViewModal.tsx`

```typescript
import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface ProjectViewModalProps {
  project: {
    id: string;
    name: string;
    description?: string;
    mediaFiles?: string[];
    companyName?: string;
    role?: string;
  };
  isOpen: boolean;
  onClose: () => void;
}

export const ProjectViewModal: React.FC<ProjectViewModalProps> = ({
  project,
  isOpen,
  onClose
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative max-w-6xl w-full max-h-[90vh] bg-white rounded-2xl overflow-hidden">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-[1.5fr,1fr] max-h-[90vh]">
          {/* Image section */}
          <div className="relative bg-gray-900 flex items-center justify-center">
            {project.mediaFiles && project.mediaFiles.length > 0 && (
              <>
                <img
                  src={project.mediaFiles[currentImageIndex]}
                  alt={project.name}
                  className="max-h-[90vh] w-full object-contain"
                />
                
                {project.mediaFiles.length > 1 && (
                  <>
                    <button
                      onClick={() => setCurrentImageIndex(prev => 
                        prev === 0 ? project.mediaFiles!.length - 1 : prev - 1
                      )}
                      className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                      onClick={() => setCurrentImageIndex(prev => 
                        prev === project.mediaFiles!.length - 1 ? 0 : prev + 1
                      )}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>

                    {/* Image counter */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/50 text-white text-sm rounded-full">
                      {currentImageIndex + 1} / {project.mediaFiles.length}
                    </div>
                  </>
                )}
              </>
            )}
          </div>

          {/* Info section */}
          <div className="p-8 overflow-y-auto">
            <h2 className="text-3xl font-bold mb-4">{project.name}</h2>
            
            {(project.companyName || project.role) && (
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
                {project.companyName && (
                  <span className="uppercase tracking-wider">{project.companyName}</span>
                )}
                {project.role && (
                  <>
                    {project.companyName && <span>•</span>}
                    <span className="uppercase tracking-wider">{project.role}</span>
                  </>
                )}
              </div>
            )}

            {project.description && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Description</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {project.description}
                </p>
              </div>
            )}

            {/* Thumbnail strip */}
            {project.mediaFiles && project.mediaFiles.length > 1 && (
              <div className="mt-6 pt-6 border-t border-border">
                <h3 className="text-sm font-semibold mb-3">All Images</h3>
                <div className="grid grid-cols-4 gap-2">
                  {project.mediaFiles.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                        index === currentImageIndex 
                          ? 'border-primary' 
                          : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={image}
                        alt={`${project.name} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
```

#### Profile Page Integration
**File:** `packages/frontend/src/pages/ProfilePage.tsx`

```typescript
import { ProjectViewModal } from '@/components/ProjectViewModal';

// Add state
const [selectedProject, setSelectedProject] = useState<PortfolioItem | null>(null);

// Handle card click
const handleProjectClick = (item: PortfolioItem) => {
  if (item.workUrls) {
    // If has external URL, navigate to detail page
    navigate(`/projects/${item.id}`);
  } else {
    // If no external URL, open modal
    setSelectedProject(item);
  }
};

// Portfolio card
<div
  onClick={() => handleProjectClick(item)}
  className="cursor-pointer group relative bg-white rounded-2xl border border-border overflow-hidden hover:border-primary transition-all hover:shadow-lg"
>
  {/* Card content */}
</div>

{/* Modal */}
<ProjectViewModal
  project={selectedProject}
  isOpen={!!selectedProject}
  onClose={() => setSelectedProject(null)}
/>
```

### Acceptance Criteria
- [ ] Projects with external URL go to detail page
- [ ] Projects without URL open modal
- [ ] Modal shows all images with navigation
- [ ] Modal shows full project details
- [ ] Modal is responsive
- [ ] ESC key closes modal
- [ ] Click outside closes modal

---

## Task 1.6.7: Clean URL with Username

**Branch:** `feature/username-profile-urls`  
**Estimated Time:** 4 hours  
**Priority:** P0

### Implementation

#### Backend Route Updates
**File:** `packages/backend/src/routes/user.routes.ts`

```typescript
// Change from ID-based to username-based
router.get('/profile/:username', userController.getUserProfileByUsername);
router.get('/:userId', userController.getUserProfile); // Keep for backward compatibility
```

**File:** `packages/backend/src/services/user.service.ts`

```typescript
async getUserByUsername(username: string) {
  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      username: true,
      role: true,
      avatar: true,
      bio: true,
      location: true,
      hourlyRate: true,
      available: true,
      createdAt: true,
      skills: {
        include: {
          skill: true
        }
      },
      portfolios: {
        orderBy: { createdAt: 'desc' }
      },
      workExperiences: {
        orderBy: { startDate: 'desc' }
      }
    }
  });

  if (!user) {
    throw new Error('User not found');
  }

  return user;
}
```

#### Frontend Route Updates
**File:** `packages/frontend/src/App.tsx`

```typescript
// Update route to use username
<Route path="/profile/:username" element={<ProfilePage />} />
<Route path="/profile" element={<ProfilePage />} /> {/* Own profile */}
```

**File:** `packages/frontend/src/pages/ProfilePage.tsx`

```typescript
export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  
  // Determine if viewing own profile
  const isOwnProfile = !username || username === currentUser?.username;

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      let data;
      if (username) {
        // Load by username
        data = await userService.getUserByUsername(username);
      } else {
        // Load own profile
        const profileId = currentUser?.id;
        if (!profileId) {
          navigate('/login');
          return;
        }
        data = await userService.getUserProfile(profileId);
      }
      
      setProfile(data);
      // ... rest of the logic
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };
  
  // ... rest of component
}
```

#### Navigation Updates
Update all profile links across the app:

```typescript
// Instead of:
<Link to={`/profile/${user.id}`}>View Profile</Link>

// Use:
<Link to={`/profile/${user.username}`}>View Profile</Link>
```

### Acceptance Criteria
- [ ] Profile URLs use username: `/profile/johndoe`
- [ ] Own profile accessible via `/profile`
- [ ] Username lookups work correctly
- [ ] Old ID-based URLs still work (backward compatibility)
- [ ] All profile links updated across app
- [ ] 404 for non-existent usernames

---

## Task 1.6.8: Global Footer Component

**Branch:** `feature/global-footer`  
**Estimated Time:** 0.5 day  
**Priority:** P2

### Implementation

#### Footer Component
**File:** `packages/frontend/src/components/Footer.tsx`

```typescript
import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-background">
      <div className="max-w-[1400px] mx-auto px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold">HyperGigs</h3>
            <p className="text-sm text-muted-foreground">
              Connect with talented freelancers and build amazing teams.
            </p>
          </div>

          {/* Product */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold uppercase tracking-wider">Product</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/browse" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Browse Freelancers
                </Link>
              </li>
              <li>
                <Link to="/teams" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Find Teams
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  How it Works
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold uppercase tracking-wider">Company</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/blog" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link to="/careers" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Careers
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold uppercase tracking-wider">Legal</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {currentYear} HyperGigs. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <a 
              href="https://twitter.com/hypergigs" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Twitter
            </a>
            <a 
              href="https://linkedin.com/company/hypergigs" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              LinkedIn
            </a>
            <a 
              href="https://github.com/hypergigs" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
```

#### Add to Layout
**File:** `packages/frontend/src/App.tsx`

```typescript
import { Footer } from '@/components/Footer';

function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        <div className="flex-1">
          <Routes>
            {/* All routes */}
          </Routes>
        </div>
        <Footer />
      </div>
    </Router>
  );
}
```

### Acceptance Criteria
- [ ] Footer appears on all pages
- [ ] Responsive design
- [ ] Links work correctly
- [ ] Social media links open in new tab
- [ ] Year updates automatically
- [ ] Consistent with app theme

---

## Implementation Timeline

### Week 1
- **Day 1 (2 hours):** Task 1.6.1 - Fix Skill Removal
- **Day 1-2 (2 hours):** Task 1.6.2 - Fix Hourly Rate
- **Day 2-3 (4 hours):** Task 1.6.7 - Username URLs
- **Day 3-4 (1 day):** Task 1.6.3 - Portfolio Edit

### Week 2
- **Day 1-2 (1.5 days):** Task 1.6.4 - Multiple Images
- **Day 3-5 (2 days):** Task 1.6.5 - Project Detail Page

### Week 3
- **Day 1-2 (1 day):** Task 1.6.6 - Project View Modal
- **Day 2-3 (0.5 day):** Task 1.6.8 - Global Footer
- **Day 3-5:** Testing, bug fixes, documentation

---

## Testing Checklist

### Unit Tests
- [ ] Skill removal service
- [ ] Portfolio CRUD operations
- [ ] Image upload validation
- [ ] Username lookup service

### Integration Tests
- [ ] Profile update flow
- [ ] Portfolio creation with multiple images
- [ ] Project detail page data loading
- [ ] URL routing with usernames

### E2E Tests
- [ ] Complete profile edit flow
- [ ] Portfolio management workflow
- [ ] Project viewing (detail page + modal)
- [ ] Footer navigation

### Manual Testing
- [ ] Image size validation
- [ ] Multiple image upload UX
- [ ] Modal interactions
- [ ] URL sharing with usernames
- [ ] Mobile responsiveness

---

## Documentation Updates Required

1. **API Documentation**
   - New portfolio endpoints
   - Username-based profile lookup
   - Image upload specifications

2. **User Guide**
   - Portfolio management instructions
   - Image requirements and limits
   - Profile URL structure

3. **Developer Guide**
   - Footer component usage
   - Modal component patterns
   - Image handling best practices

---

## Branch Strategy

```
feature/redesign-profile-awwwards-style (base)
├── fix/skill-removal
├── fix/hourly-rate-persistence
├── feature/username-profile-urls
├── feature/portfolio-edit
├── feature/portfolio-multiple-images
├── feature/project-detail-page
├── feature/project-view-modal
└── feature/global-footer
```

**Merge Order:**
1. Fix branches first (skill removal, hourly rate)
2. Username URLs (infrastructure)
3. Portfolio features (edit, multiple images)
4. View features (detail page, modal)
5. Footer (independent)

---

## Success Metrics

- [ ] All 8 tasks completed
- [ ] Zero critical bugs
- [ ] Test coverage >85%
- [ ] All documentation updated
- [ ] Performance benchmarks met:
  - Image upload <2s
  - Page load <2s
  - Modal open <100ms
  
---

**Ready to Proceed:** Once this document is approved, we can start with Task 1.6.1!
