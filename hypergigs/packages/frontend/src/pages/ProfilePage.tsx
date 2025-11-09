import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { userService } from '@/services/api/user.service';
import { recommendationService } from '@/services/api/recommendation.service';
import type {
  UserProfile,
  UpdateProfileRequest,
  UserSkill,
  PortfolioItem,
  WorkExperience,
  AddSkillRequest,
  CreatePortfolioRequest,
  CreateExperienceRequest,
  Recommendation
} from '@/types/user';
import Navigation from '@/components/Navigation';
import ProjectDrawer from '@/components/ProjectDrawer';
import RichTextEditor from '@/components/RichTextEditor';
import RecommendationsSection from '@/components/RecommendationsSection';
import EnhancedRecommendationDialog from '@/components/EnhancedRecommendationDialog';
import PortfolioRatingBox from '@/components/PortfolioRatingBox';
import VerifiedBadge from '@/components/VerifiedBadge';
import ContributorBadge from '@/components/ContributorBadge';
import { CountrySelect } from '@/components/ui/country-select';
import { CitySelect } from '@/components/ui/city-select';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, DollarSign, Briefcase, Calendar, ExternalLink, Plus, X, Edit2, Check, Upload, Image as ImageIcon, Sparkles, Heart } from 'lucide-react';
import { searchSkills } from '@/data/skills';
import { stripHtmlTags } from '@/lib/utils';
import { getCurrencyOptions, convertCurrency, formatCurrency, CURRENCY_SYMBOLS } from '@/lib/currency';
import type { Currency } from '@/types/auth';

// Helper function to render text with line breaks and clickable links
const formatRichText = (text: string) => {
  if (!text) return null;
  
  // URL regex pattern
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  
  // Split by line breaks first
  const lines = text.split('\n');
  
  return lines.map((line, lineIndex) => {
    if (!line.trim()) {
      // Empty line - add spacing
      return <br key={`br-${lineIndex}`} />;
    }
    
    // Split line by URLs
    const parts = line.split(urlRegex);
    const elements = parts.map((part, partIndex) => {
      // Check if part is a URL
      if (urlRegex.test(part)) {
        return (
          <a
            key={`link-${lineIndex}-${partIndex}`}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            {part}
          </a>
        );
      }
      return <span key={`text-${lineIndex}-${partIndex}`}>{part}</span>;
    });
    
    return (
      <span key={`line-${lineIndex}`}>
        {elements}
        {lineIndex < lines.length - 1 && <br />}
      </span>
    );
  });
};

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<UpdateProfileRequest>({});
  
  // Image upload state
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  // @ts-ignore - will be used when backend upload is implemented
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Skills state
  const [skills, setSkills] = useState<UserSkill[]>([]);
  const [newSkill, setNewSkill] = useState<AddSkillRequest>({ skillName: '' });
  const [showSkillForm, setShowSkillForm] = useState(false);
  const [skillSuggestions, setSkillSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isGeneratingSkills, setIsGeneratingSkills] = useState(false);
  const skillInputRef = useRef<HTMLInputElement>(null);
  
  // Portfolio state
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [showPortfolioForm, setShowPortfolioForm] = useState(false);
  const [portfolioForm, setPortfolioForm] = useState<CreatePortfolioRequest>({
    name: '',
    description: '',
    companyName: '',
    role: '',
    workUrls: '',
    mediaFiles: [],
    createdWith: []
  });
  const [portfolioImagePreviews, setPortfolioImagePreviews] = useState<string[]>([]);
  const [currentToolInput, setCurrentToolInput] = useState('');
  const portfolioFileInputRef = useRef<HTMLInputElement>(null);
  const MAX_PORTFOLIO_IMAGES = 4;
  const MAX_IMAGE_SIZE = 500 * 1024; // 500KB
  
  // Portfolio edit state
  const [editingPortfolioId, setEditingPortfolioId] = useState<string | null>(null);
  const [editPortfolioForm, setEditPortfolioForm] = useState<CreatePortfolioRequest>({
    name: '',
    description: '',
    companyName: '',
    role: '',
    workUrls: '',
    mediaFiles: [],
    createdWith: []
  });
  const [editPortfolioImagePreviews, setEditPortfolioImagePreviews] = useState<string[]>([]);
  const [editCurrentToolInput, setEditCurrentToolInput] = useState('');
  const editPortfolioFileInputRef = useRef<HTMLInputElement>(null);
  
  // Project drawer state
  const [selectedProject, setSelectedProject] = useState<PortfolioItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Recommendations state
  const [allRecommendations, setAllRecommendations] = useState<Recommendation[]>([]);

  // Give recommendation dialog state
  const [showGiveRecommendation, setShowGiveRecommendation] = useState(false);

  // Experience state
  const [experience, setExperience] = useState<WorkExperience[]>([]);
  const [showExperienceForm, setShowExperienceForm] = useState(false);
  const [experienceForm, setExperienceForm] = useState<CreateExperienceRequest>({
    title: '',
    company: '',
    description: '',
    startDate: '',
    endDate: '',
    present: false
  });

  const isOwnProfile = !username || username === currentUser?.username;

  useEffect(() => {
    loadProfile();
  }, [username]);

  // Handle escape key and prevent background scroll for edit drawer
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isEditing) {
        setIsEditing(false);
        setError(null);
      }
    };

    if (isEditing) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isEditing]);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // If no username in URL, fetch current user's profile
      // Otherwise fetch by username
      let data: UserProfile;
      if (username) {
        data = await userService.getUserProfileByUsername(username);
      } else if (currentUser?.id) {
        data = await userService.getUserProfile(currentUser.id);
      } else {
        navigate('/login');
        return;
      }
      setProfile(data);
      setSkills(data.skills || []);
      setExperience(data.workExperiences || []);

      // Fetch all recommendations for this user
      let allRecs: Recommendation[] = [];
      try {
        const recs = await recommendationService.getUserRecommendations(data.id);
        allRecs = recs;

        // Only show accepted GIVEN recommendations that were received
        // EXCLUDE simple likes (message === "Liked this work")
        // EXCLUDE REQUEST type (only show actual recommendations)
        const acceptedRecs = recs.filter(
          (r) =>
            r.receiverId === data.id &&
            r.status === 'ACCEPTED' &&
            r.type === 'GIVEN' && // Only show GIVEN type recommendations
            r.message !== 'Liked this work' // Exclude likes from display
        );
        setAllRecommendations(acceptedRecs);
      } catch (error) {
        console.error('Failed to load recommendations:', error);
        setAllRecommendations([]);
      }

      // Process portfolios with like counts and verified status
      const portfoliosWithMetadata = (data.portfolios || []).map((p) => {
        const portfolioRecs = allRecs.filter((r) => r.portfolioId === p.id);

        // Count likes (simple "Liked this work" messages from GIVEN type)
        const likes = portfolioRecs.filter(
          (r) => r.type === 'GIVEN' && r.message === 'Liked this work'
        );
        const likeCount = likes.length;

        // Check if user has liked
        const userHasLiked = currentUser ? likes.some((r) => r.senderId === currentUser.id) : false;

        // Check for verified reference (REQUEST type that was ACCEPTED)
        const hasVerifiedReference = portfolioRecs.some(
          (r) => r.type === 'REQUEST' && r.status === 'ACCEPTED'
        );

        return {
          ...p,
          likeCount,
          userHasLiked,
          hasVerifiedReference,
        };
      });

      setPortfolio(portfoliosWithMetadata);

      setFormData({
        firstName: data.firstName,
        lastName: data.lastName,
        bio: data.bio || '',
        jobTitle: data.jobTitle || '',
        location: data.location || '',
        country: data.country || '',
        hourlyRate: data.hourlyRate || 0,
        currency: data.currency || 'USD',
        available: data.available,
        nextAvailability: data.nextAvailability || '',
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setError(null);

      // Include avatar preview (base64) if available
      const updateData = {
        ...formData,
        ...(avatarPreview && { avatar: avatarPreview })
      };

      console.log('Sending update data:', updateData);
      console.log('Job title in formData:', formData.jobTitle);

      const updatedUser = await userService.updateProfile(updateData);
      
      // Reload the full profile to get all data
      await loadProfile();
      setIsEditing(false);
      setAvatarPreview(null);
      
      // Update auth store if editing own profile
      if (isOwnProfile && currentUser) {
        useAuthStore.setState({ user: updatedUser });
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile');
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? 0 : parseFloat(value) || 0) : value,
    }));
  };

  // Image upload handlers
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePortfolioImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handlePortfolioImageFiles(Array.from(files));
    }
  };

  const handlePortfolioImageDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
      handlePortfolioImageFiles(imageFiles);
    }
  };

  const handlePortfolioImageFiles = async (files: File[]) => {
    // Check max images limit
    const remainingSlots = MAX_PORTFOLIO_IMAGES - portfolioImagePreviews.length;
    if (remainingSlots <= 0) {
      alert(`Maximum ${MAX_PORTFOLIO_IMAGES} images allowed`);
      return;
    }

    const filesToProcess = files.slice(0, remainingSlots);
    const newPreviews: string[] = [];

    for (const file of filesToProcess) {
      // Check file size
      if (file.size > MAX_IMAGE_SIZE) {
        alert(`Image ${file.name} is too large. Max size is 500KB`);
        continue;
      }

      // Convert to base64
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
      newPreviews.push(base64);
    }

    setPortfolioImagePreviews(prev => [...prev, ...newPreviews]);
  };

  const removePortfolioImage = (index: number) => {
    setPortfolioImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  // Skills handlers
  const handleSkillInputChange = (value: string) => {
    setNewSkill({ skillName: value });
    
    if (value.length >= 2) {
      const suggestions = searchSkills(value, 8);
      setSkillSuggestions(suggestions);
      setShowSuggestions(suggestions.length > 0);
    } else {
      setSkillSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSelectSkill = (skillName: string) => {
    setNewSkill({ skillName });
    setShowSuggestions(false);
    setSkillSuggestions([]);
  };

  const handleGenerateSkills = async () => {
    if (!profile?.bio || profile.bio.trim().length < 10) {
      setError('Please add a bio first to generate AI skills');
      return;
    }

    setIsGeneratingSkills(true);
    setError(null);
    
    try {
      // Call AI API to generate contextual skills
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${API_URL}/api/ai/generate-skills`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          bio: profile.bio,
          existingSkills: skills.map(s => s.skill.name)
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate skills');
      }

      const data = await response.json();
      const suggestedSkills = data.data?.suggestedSkills || [];

      if (suggestedSkills.length === 0) {
        setError('No new relevant skills found. Try adding more details to your bio.');
        return;
      }

      // Add skills one by one
      let addedCount = 0;
      for (const skillName of suggestedSkills) {
        try {
          const skill = await userService.addSkill({ skillName });
          setSkills(prev => [...prev, skill]);
          addedCount++;
        } catch (err) {
          // Skip if skill already exists or error
          console.log(`Skipped adding ${skillName}:`, err);
        }
        }
        
        if (addedCount > 0) {
          // Show success message in green
          const successMsg = `✨ Added ${addedCount} skill${addedCount > 1 ? 's' : ''} from your bio!`;
          setError(successMsg);
        } else {
          setError('Skills already exist or could not be added.');
        }
    } catch (err: any) {
      setError(err.message || 'Failed to generate skills');
    } finally {
      setIsGeneratingSkills(false);
    }
  };

  const handleAddSkill = async () => {
    if (!newSkill.skillName.trim()) return;
    
    try {
      const skill = await userService.addSkill(newSkill);
      setSkills([...skills, skill]);
      setNewSkill({ skillName: '' });
      setShowSkillForm(false);
      setShowSuggestions(false);
      setSkillSuggestions([]);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add skill');
    }
  };

  const handleRemoveSkill = async (userSkillId: string) => {
    try {
      await userService.removeSkill(userSkillId);
      setSkills(skills.filter(s => s.id !== userSkillId));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to remove skill');
    }
  };

  // Portfolio handlers
  const handleAddPortfolio = async () => {
    if (!portfolioForm.name.trim()) return;

    try {
      // Include portfolio images (base64) if available
      const portfolioData = {
        ...portfolioForm,
        mediaFiles: portfolioImagePreviews
      };

      const item = await userService.addPortfolioItem(portfolioData);
      setPortfolio([...portfolio, item]);
      setPortfolioForm({
        name: '',
        description: '',
        companyName: '',
        role: '',
        workUrls: '',
        mediaFiles: [],
        createdWith: []
      });
      setPortfolioImagePreviews([]);
      setCurrentToolInput('');
      setShowPortfolioForm(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add portfolio item');
    }
  };

  const handleDeletePortfolio = async (portfolioId: string) => {
    try {
      await userService.deletePortfolioItem(portfolioId);
      setPortfolio(portfolio.filter(p => p.id !== portfolioId));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete portfolio item');
    }
  };

  const handleEditPortfolio = (item: PortfolioItem) => {
    setEditingPortfolioId(item.id);
    setEditPortfolioForm({
      name: item.name,
      description: item.description || '',
      companyName: item.companyName || '',
      role: item.role || '',
      workUrls: item.workUrls || '',
      mediaFiles: item.mediaFiles || [],
      createdWith: item.createdWith || []
    });
    setEditPortfolioImagePreviews(item.mediaFiles || []);
    setEditCurrentToolInput('');
    // Close add form if open
    setShowPortfolioForm(false);
  };

  const handleUpdatePortfolio = async (portfolioId: string) => {
    if (!editPortfolioForm.name.trim()) return;
    
    try {
      const portfolioData = {
        ...editPortfolioForm,
        mediaFiles: editPortfolioImagePreviews
      };
      
      const updated = await userService.updatePortfolioItem(portfolioId, portfolioData);
      setPortfolio(portfolio.map(p => p.id === portfolioId ? updated : p));
      setEditingPortfolioId(null);
      setEditPortfolioForm({
        name: '',
        description: '',
        companyName: '',
        role: '',
        workUrls: '',
        mediaFiles: []
      });
      setEditPortfolioImagePreviews([]);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update portfolio item');
    }
  };

  const handleCancelEditPortfolio = () => {
    setEditingPortfolioId(null);
    setEditPortfolioForm({
      name: '',
      description: '',
      companyName: '',
      role: '',
      workUrls: '',
      mediaFiles: [],
      createdWith: []
    });
    setEditPortfolioImagePreviews([]);
    setEditCurrentToolInput('');
  };

  const handleEditPortfolioImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleEditPortfolioImageFiles(Array.from(files));
    }
  };

  const handleEditPortfolioImageDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
      handleEditPortfolioImageFiles(imageFiles);
    }
  };

  const handleEditPortfolioImageFiles = async (files: File[]) => {
    // Check max images limit
    const remainingSlots = MAX_PORTFOLIO_IMAGES - editPortfolioImagePreviews.length;
    if (remainingSlots <= 0) {
      alert(`Maximum ${MAX_PORTFOLIO_IMAGES} images allowed`);
      return;
    }

    const filesToProcess = files.slice(0, remainingSlots);
    const newPreviews: string[] = [];

    for (const file of filesToProcess) {
      // Check file size
      if (file.size > MAX_IMAGE_SIZE) {
        alert(`Image ${file.name} is too large. Max size is 500KB`);
        continue;
      }

      // Convert to base64
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
      newPreviews.push(base64);
    }

    setEditPortfolioImagePreviews(prev => [...prev, ...newPreviews]);
  };

  const removeEditPortfolioImage = (index: number) => {
    setEditPortfolioImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  // Tool management helpers
  const handleAddTool = (toolName: string) => {
    if (toolName.trim() && !portfolioForm.createdWith?.includes(toolName.trim())) {
      setPortfolioForm({
        ...portfolioForm,
        createdWith: [...(portfolioForm.createdWith || []), toolName.trim()]
      });
      setCurrentToolInput('');
    }
  };

  const handleRemoveTool = (index: number) => {
    setPortfolioForm({
      ...portfolioForm,
      createdWith: portfolioForm.createdWith?.filter((_, i) => i !== index) || []
    });
  };

  const handleAddEditTool = (toolName: string) => {
    if (toolName.trim() && !editPortfolioForm.createdWith?.includes(toolName.trim())) {
      setEditPortfolioForm({
        ...editPortfolioForm,
        createdWith: [...(editPortfolioForm.createdWith || []), toolName.trim()]
      });
      setEditCurrentToolInput('');
    }
  };

  const handleRemoveEditTool = (index: number) => {
    setEditPortfolioForm({
      ...editPortfolioForm,
      createdWith: editPortfolioForm.createdWith?.filter((_, i) => i !== index) || []
    });
  };

  // Experience handlers
  const handleAddExperience = async () => {
    if (!experienceForm.title.trim() || !experienceForm.company.trim() || !experienceForm.startDate) return;
    
    try {
      const exp = await userService.addExperience(experienceForm);
      setExperience([...experience, exp]);
      setExperienceForm({
        title: '',
        company: '',
        description: '',
        startDate: '',
        endDate: '',
        present: false
      });
      setShowExperienceForm(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add experience');
    }
  };

  const handleDeleteExperience = async (experienceId: string) => {
    try {
      await userService.deleteExperience(experienceId);
      setExperience(experience.filter(e => e.id !== experienceId));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete experience');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-lg">Loading profile...</div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-lg text-red-600">Profile not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section - Clean header with user info */}
      <div className="pt-32 pb-16 px-4 sm:px-6 lg:px-4">
        <div className="max-w-7xl  mx-auto">
          
          {error && (
            <div className={`mb-8 p-4 rounded-lg ${
              error.startsWith('✨') 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              <p className={`text-sm ${
                error.startsWith('✨') 
                  ? 'text-green-700' 
                  : 'text-red-700'
              }`}>{error}</p>
            </div>
          )}

          {/* Profile Header */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr,400px] gap-8 mb-16">
            {/* Left: Intro */}
            <div className="space-y-4">
              <div className="flex items-center gap-8">
                <div className="flex items-center gap-4">
                  <h1 className="text-[64px] font-bold tracking-tight leading-none">
                    {profile.firstName} {profile.lastName}
                  </h1>
                  <VerifiedBadge show={profile.hasVerifiedBadge} size="lg" />
                </div>
                <div className="flex items-center gap-3">
                  {isOwnProfile && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                      <span className="text-sm font-medium">Edit Profile</span>
                    </button>
                  )}
           
                </div>
              </div>


              <div className="text-2xl text-foreground font-medium">
                {profile.jobTitle && (
                  <div className="mb-4">
                    <p className="text-xl text-foreground font-medium">{profile.jobTitle}</p>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <span className="uppercase tracking-wider">{profile.role}</span>
                <span>|</span>
                <span className="uppercase tracking-wider">@{profile.username}</span>
              </div>           

              <div className="flex items-center gap-8 pt-4">
                {/* Profile Photo - Small, clean */}
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center overflow-hidden">
                  {profile.avatar ? (
                    <img src={profile.avatar} alt={`${profile.firstName} ${profile.lastName}`} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm font-bold text-gray-600">
                      {profile.firstName[0]}{profile.lastName[0]}
                    </span>
                  )}
                </div>
                
                {profile.location && (
                  <div className="flex items-center gap-2 text-foreground">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm">{profile.location}</span>
                  </div>
                )}
                {profile.hourlyRate && profile.hourlyRate > 0 && (
                  <div className="flex items-center gap-2 text-foreground">
                    <DollarSign className="w-4 h-4" />
                    <span className="text-sm">{formatCurrency(profile.hourlyRate, profile.currency as Currency || 'USD')}/hr</span>
                  </div>
                )}
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                  profile.available 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {profile.available ? 'Available for work' : 'Unavailable'}
                </div>
                {!profile.available && profile.nextAvailability && (
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>
                      Available from {new Date(profile.nextAvailability).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                )}



                  {!isOwnProfile && currentUser && (
                    <button
                      onClick={() => setShowGiveRecommendation(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-white border border-primary text-primary rounded-lg hover:bg-primary/5 transition-colors font-medium"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span className="text-sm font-medium">Give Recommendation</span>
                    </button>
                  )}
              </div>

              {/* Bio Section */}
              {profile.bio && !isEditing && (
                <div
                  className="mt-8 pb-8 text-lg text-muted-foreground max-w-2xl leading-relaxed prose prose-lg border-t pt-6"
                  dangerouslySetInnerHTML={{ __html: profile.bio }}
                />
              )}

   {/* Stats Grid - Awwwards Style */}
   <div className="max-w-2xl">
              <div className="border border-border rounded-2xl overflow-hidden">
                {/* Header */}
                <div className="grid grid-cols-3 border-b border-border bg-gray-50">
                  <div className="px-4 py-3 text-center border-r border-border">
                    <span className="text-xs font-semibold uppercase tracking-wider">Projects</span>
                  </div>
                  <div className="px-4 py-3 text-center border-r border-border">
                    <span className="text-xs font-semibold uppercase tracking-wider">Ref</span>
                  </div>
                  <div className="px-4 py-3 text-center">
                    <span className="text-xs font-semibold uppercase tracking-wider">Rating</span>
                  </div>
                </div>
                
                {/* Values */}
                <div className="grid grid-cols-3 bg-white">
                  <div className="px-4 py-3 text-center border-r border-border">
                    <span className="text-4xl font-bold">{portfolio.length || 0}</span>
                  </div>
                  <div className="px-4 py-3 text-center border-r border-border">
                    <span className="text-4xl font-bold">{profile.hourlyRate && profile.hourlyRate > 0 ? formatCurrency(profile.hourlyRate, profile.currency as Currency || 'USD') : '0'}</span>

                  </div>
                  <div className="px-4 py-3 text-center">
                    <span className="text-4xl font-bold">0</span>
                  </div>
                </div>
              </div>

</div>



            </div>

            {/* Right: Stats Card */}
            <div className="space-y-8">
              <div className="pb-8">
              {/* Daily Rate */}
              {profile.hourlyRate && profile.hourlyRate > 0 && (
                <div className="text-center p-6 border border-border rounded-2xl bg-white">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Daily Rate</p>
                  <p className="text-3xl font-bold">{formatCurrency(profile.hourlyRate * 8, profile.currency as Currency || 'USD')}</p>
                </div>
              )}
              </div>



  {/* Skills Section */}
          <div className="mb-24 pt-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold">Skills</h2>
              <div className="flex gap-2">
                {isOwnProfile && profile?.bio && (
                  <button
                    onClick={handleGenerateSkills}
                    disabled={isGeneratingSkills}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span className="text-sm">{isGeneratingSkills ? 'Generating...' : 'AI Generate'}</span>
                  </button>
                )}
                {isOwnProfile && !showSkillForm && (
                  <button
                    onClick={() => setShowSkillForm(true)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            {showSkillForm && (
              <div className="mb-8 p-6 bg-white rounded-2xl border border-border">
                <div className="flex gap-4 relative">
                  <div className="flex-1 relative">
                    <input
                      ref={skillInputRef}
                      type="text"
                      value={newSkill.skillName}
                      onChange={(e) => handleSkillInputChange(e.target.value)}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                      onFocus={() => newSkill.skillName.length >= 2 && setShowSuggestions(true)}
                      placeholder="Type skill name (e.g., React, TypeScript, Design)"
                      className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    
                    {/* Autocomplete Dropdown */}
                    {showSuggestions && skillSuggestions.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {skillSuggestions.map((suggestion, index) => (
                          <button
                            key={index}
                            onClick={() => handleSelectSkill(suggestion)}
                            className="w-full px-4 py-2 text-left hover:bg-gray-100 transition-colors text-sm"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <button
                    onClick={handleAddSkill}
                    className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => {
                      setShowSkillForm(false);
                      setShowSuggestions(false);
                      setNewSkill({ skillName: '' });
                    }}
                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
                
                <p className="mt-3 text-xs text-muted-foreground">
                  💡 Tip: Type at least 2 characters to see skill suggestions
                </p>
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              {skills.length > 0 ? (
                skills.map((userSkill) => (
                  <div
                    key={userSkill.id}
                    className="group px-4 py-2 bg-white rounded-lg border border-border hover:border-primary transition-colors flex items-center gap-2"
                  >
                    <span className="text-sm font-medium">{userSkill.skill.name}</span>
                    {isOwnProfile && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveSkill(userSkill.id);
                        }}
                        className="ml-2 p-1 opacity-0 group-hover:opacity-100 hover:bg-red-100 rounded transition-all"
                        title="Remove skill"
                      >
                        <X className="w-3 h-3 text-red-600" />
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground">No skills added yet</p>
              )}
            </div>
          </div>






            </div>
          </div>

          {/* Edit Profile Drawer */}
          <AnimatePresence>
            {isEditing && (
              <>
                {/* Backdrop */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                  onClick={() => {
                    setIsEditing(false);
                    setError(null);
                  }}
                />

                {/* Drawer Panel */}
                <motion.div
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                  className="fixed right-0 top-0 h-full w-full max-w-7xl bg-background border-l border-border shadow-2xl z-50 overflow-hidden"
                >
                  {/* Header with Close Button */}
                  <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border px-6 py-4 flex items-center justify-between">
                    <h2 className="text-2xl font-bold">Edit Profile</h2>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setError(null);
                      }}
                      className="flex-shrink-0 p-2 rounded-lg hover:bg-muted transition-colors"
                      aria-label="Close drawer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Scrollable Content */}
                  <div className="h-[calc(100vh-73px)] overflow-y-auto">
                    <div className="p-6">
                      <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName || ''}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName || ''}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                {/* Profile Photo Upload */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Profile Photo
                  </label>
                  <div
                    className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer"
                    onDrop={handleAvatarDrop}
                    onDragOver={(e) => e.preventDefault()}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {avatarPreview || profile?.avatar ? (
                      <div className="space-y-4">
                        <img
                          src={avatarPreview || profile?.avatar}
                          alt="Profile preview"
                          className="w-32 h-32 rounded-full mx-auto object-cover"
                        />
                        <p className="text-sm text-muted-foreground">
                          Click or drag to change photo
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-xs text-muted-foreground">
                          PNG, JPG up to 5MB
                        </p>
                      </div>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Job Title
                  </label>
                  <input
                    type="text"
                    name="jobTitle"
                    value={formData.jobTitle || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="e.g., Full Stack Developer, UX Designer"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Bio
                  </label>
                  <RichTextEditor
                    content={formData.bio || ''}
                    onChange={(html) => setFormData((prev) => ({ ...prev, bio: html }))}
                    placeholder="Tell us about yourself..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Country
                    </label>
                    <CountrySelect
                      value={formData.country || ''}
                      onChange={(value) => {
                        setFormData(prev => ({
                          ...prev,
                          country: value,
                          location: value !== prev.country ? '' : prev.location // Clear city if country changes
                        }))
                      }}
                      placeholder="Select country"
                      className="h-[52px]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      City
                    </label>
                    <CitySelect
                      countryCode={formData.country || ''}
                      value={formData.location || ''}
                      onChange={(value) => setFormData(prev => ({ ...prev, location: value }))}
                      placeholder="Select city"
                      className="h-[52px]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Currency
                    </label>
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
                      className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      {getCurrencyOptions().map(option => (
                        <option key={option.value} value={option.value}>
                          {option.symbol} {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Hourly Rate ({CURRENCY_SYMBOLS[formData.currency as Currency || profile?.currency as Currency || 'USD']})
                    </label>
                    <input
                      type="number"
                      name="hourlyRate"
                      value={formData.hourlyRate || ''}
                      onChange={handleChange}
                      min="0"
                      step="1"
                      placeholder="Enter your hourly rate"
                      className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Availability
                  </label>
                  <select
                    name="available"
                    value={formData.available ? 'true' : 'false'}
                    onChange={(e) => setFormData(prev => ({ ...prev, available: e.target.value === 'true' }))}
                    className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="true">Available for work</option>
                    <option value="false">Not available</option>
                  </select>
                </div>

                {/* Next Availability Date - only show if not available */}
                {formData.available === false && (
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Next Available Date
                    </label>
                    <input
                      type="date"
                      name="nextAvailability"
                      value={formData.nextAvailability ? new Date(formData.nextAvailability).toISOString().split('T')[0] : ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, nextAvailability: e.target.value }))}
                      className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                )}

                        <div className="flex gap-3 pt-4">
                          <button
                            type="submit"
                            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
                          >
                            <Check className="w-4 h-4" />
                            Save Changes
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setIsEditing(false);
                              setError(null);
                            }}
                            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>


          {/* Portfolio Section */}
          <div className="mb-24">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold">Portfolio</h2>
              {isOwnProfile && !showPortfolioForm && (
                <button
                  onClick={() => setShowPortfolioForm(true)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
              )}
            </div>

            {showPortfolioForm && (
              <div className="mb-8 p-6 bg-white rounded-2xl border border-border">
                <div className="space-y-4">
                  <input
                    type="text"
                    value={portfolioForm.name}
                    onChange={(e) => setPortfolioForm({ ...portfolioForm, name: e.target.value })}
                    placeholder="Project name"
                    className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <RichTextEditor
                    content={portfolioForm.description || ''}
                    onChange={(html) => setPortfolioForm({ ...portfolioForm, description: html })}
                    placeholder="Description"
                  />
                  <input
                    type="text"
                    value={portfolioForm.companyName}
                    onChange={(e) => setPortfolioForm({ ...portfolioForm, companyName: e.target.value })}
                    placeholder="Company name (optional)"
                    className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <input
                    type="text"
                    value={portfolioForm.role}
                    onChange={(e) => setPortfolioForm({ ...portfolioForm, role: e.target.value })}
                    placeholder="Your role (optional)"
                    className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <input
                    type="url"
                    value={portfolioForm.workUrls}
                    onChange={(e) => setPortfolioForm({ ...portfolioForm, workUrls: e.target.value })}
                    placeholder="Project URL (optional)"
                    className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  />

                  {/* Created With - Tools/Methods */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Created with (tools, methods, etc.)
                    </label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={currentToolInput}
                        onChange={(e) => setCurrentToolInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddTool(currentToolInput);
                          }
                        }}
                        placeholder="e.g., React, Figma, TypeScript"
                        className="flex-1 px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddTool(currentToolInput)}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                      >
                        Add
                      </button>
                    </div>
                    {portfolioForm.createdWith && portfolioForm.createdWith.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {portfolioForm.createdWith.map((tool, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full text-sm"
                          >
                            {tool}
                            <button
                              type="button"
                              onClick={() => handleRemoveTool(index)}
                              className="ml-1 hover:text-red-600"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Portfolio Images Upload */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Project Images ({portfolioImagePreviews.length}/{MAX_PORTFOLIO_IMAGES})
                    </label>
                    
                    {/* Show existing images */}
                    {portfolioImagePreviews.length > 0 && (
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        {portfolioImagePreviews.map((preview, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={preview}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-32 object-cover rounded-lg"
                            />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removePortfolioImage(index);
                              }}
                              className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Upload area - only show if under limit */}
                    {portfolioImagePreviews.length < MAX_PORTFOLIO_IMAGES && (
                      <div
                        className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer"
                        onDrop={handlePortfolioImageDrop}
                        onDragOver={(e) => e.preventDefault()}
                        onClick={() => portfolioFileInputRef.current?.click()}
                      >
                        <div className="space-y-2">
                          <ImageIcon className="w-10 h-10 mx-auto text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">
                            Click to upload or drag and drop
                          </p>
                          <p className="text-xs text-muted-foreground">
                            PNG, JPG up to 500KB each (max {MAX_PORTFOLIO_IMAGES} images)
                          </p>
                        </div>
                      </div>
                    )}
                    <input
                      ref={portfolioFileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePortfolioImageChange}
                      className="hidden"
                    />
                  </div>
                  
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={handleAddPortfolio}
                      className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                    >
                      Add Project
                    </button>
                    <button
                      onClick={() => setShowPortfolioForm(false)}
                      className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {portfolio.length > 0 ? (
                portfolio.map((item) => (
                  <div
                    key={item.id}
                    className="group relative bg-white rounded-2xl border border-border overflow-hidden hover:border-primary transition-all hover:shadow-lg"
                  >
                    {editingPortfolioId === item.id ? (
                      /* Edit Mode */
                      <div className="p-6">
                        <div className="space-y-4">
                          <input
                            type="text"
                            value={editPortfolioForm.name}
                            onChange={(e) => setEditPortfolioForm({ ...editPortfolioForm, name: e.target.value })}
                            placeholder="Project name"
                            className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                          <RichTextEditor
                            content={editPortfolioForm.description || ''}
                            onChange={(html) => setEditPortfolioForm({ ...editPortfolioForm, description: html })}
                            placeholder="Description"
                          />
                          <input
                            type="text"
                            value={editPortfolioForm.companyName}
                            onChange={(e) => setEditPortfolioForm({ ...editPortfolioForm, companyName: e.target.value })}
                            placeholder="Company name"
                            className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                          <input
                            type="text"
                            value={editPortfolioForm.role}
                            onChange={(e) => setEditPortfolioForm({ ...editPortfolioForm, role: e.target.value })}
                            placeholder="Your role"
                            className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                          <input
                            type="url"
                            value={editPortfolioForm.workUrls}
                            onChange={(e) => setEditPortfolioForm({ ...editPortfolioForm, workUrls: e.target.value })}
                            placeholder="Project URL"
                            className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                          />

                          {/* Created With - Tools/Methods */}
                          <div>
                            <label className="block text-sm font-medium mb-2">
                              Created with (tools, methods, etc.)
                            </label>
                            <div className="flex gap-2 mb-2">
                              <input
                                type="text"
                                value={editCurrentToolInput}
                                onChange={(e) => setEditCurrentToolInput(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleAddEditTool(editCurrentToolInput);
                                  }
                                }}
                                placeholder="e.g., React, Figma, TypeScript"
                                className="flex-1 px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                              />
                              <button
                                type="button"
                                onClick={() => handleAddEditTool(editCurrentToolInput)}
                                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                              >
                                Add
                              </button>
                            </div>
                            {editPortfolioForm.createdWith && editPortfolioForm.createdWith.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {editPortfolioForm.createdWith.map((tool, index) => (
                                  <span
                                    key={index}
                                    className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full text-sm"
                                  >
                                    {tool}
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveEditTool(index)}
                                      className="ml-1 hover:text-red-600"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Edit Portfolio Images */}
                          <div>
                            <label className="block text-sm font-medium mb-2">
                              Project Images ({editPortfolioImagePreviews.length}/{MAX_PORTFOLIO_IMAGES})
                            </label>
                            
                            {/* Show existing images */}
                            {editPortfolioImagePreviews.length > 0 && (
                              <div className="grid grid-cols-2 gap-2 mb-2">
                                {editPortfolioImagePreviews.map((preview, index) => (
                                  <div key={index} className="relative group">
                                    <img
                                      src={preview}
                                      alt={`Preview ${index + 1}`}
                                      className="w-full h-24 object-cover rounded-lg"
                                    />
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        removeEditPortfolioImage(index);
                                      }}
                                      className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            {/* Upload area */}
                            {editPortfolioImagePreviews.length < MAX_PORTFOLIO_IMAGES && (
                              <div
                                className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary transition-colors cursor-pointer"
                                onDrop={handleEditPortfolioImageDrop}
                                onDragOver={(e) => e.preventDefault()}
                                onClick={() => editPortfolioFileInputRef.current?.click()}
                              >
                                <div className="space-y-2">
                                  <ImageIcon className="w-8 h-8 mx-auto text-muted-foreground" />
                                  <p className="text-xs text-muted-foreground">Click to upload (max {MAX_PORTFOLIO_IMAGES})</p>
                                </div>
                              </div>
                            )}
                            <input
                              ref={editPortfolioFileInputRef}
                              type="file"
                              accept="image/*"
                              multiple
                              onChange={handleEditPortfolioImageChange}
                              className="hidden"
                            />
                          </div>
                          
                          <div className="flex gap-2 pt-2">
                            <button
                              onClick={() => handleUpdatePortfolio(item.id)}
                              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm"
                            >
                              Save
                            </button>
                            <button
                              onClick={handleCancelEditPortfolio}
                              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Display Mode */
                      <>
                        <div 
                          onClick={() => {
                            setSelectedProject(item);
                            setIsDrawerOpen(true);
                          }}
                          className="cursor-pointer"
                        >
                          {item.mediaFiles && item.mediaFiles.length > 0 && (
                            <div className="aspect-[4/3] bg-gray-100 overflow-hidden relative">
                              <img
                                src={item.mediaFiles[0]}
                                alt={item.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              {item.mediaFiles.length > 1 && (
                                <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 text-white text-xs rounded">
                                  {item.mediaFiles.length} photos
                                </div>
                              )}
                            </div>
                          )}
                          <div className="p-6">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <h3 className="text-xl font-bold flex-1">{item.name}</h3>
                              {item.hasVerifiedReference && (
                                <div className="flex-shrink-0">
                                  <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 border border-blue-200 rounded-full">
                                    <Check className="w-3 h-3 text-blue-600" />
                                    <span className="text-xs font-medium text-blue-700">Verified</span>
                                  </div>
                                </div>
                              )}
                            </div>
                            {item.companyName && (
                              <p className="text-sm text-muted-foreground mb-2">
                                {item.companyName} {item.role && `• ${item.role}`}
                              </p>
                            )}
                            {item.description && (
                              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                                {stripHtmlTags(item.description)}
                              </p>
                            )}
                            {item.createdWith && item.createdWith.length > 0 && (
                              <div className="mb-4">
                                <p className="text-xs font-medium text-muted-foreground mb-2">Created with:</p>
                                <div className="flex flex-wrap gap-1">
                                  {item.createdWith.map((tool, index) => (
                                    <span
                                      key={index}
                                      className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                                    >
                                      {tool}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            {item.contributors && item.contributors.length > 0 && (
                              <div className="mb-4">
                                <ContributorBadge contributors={item.contributors} maxVisible={2} />
                              </div>
                            )}
                            <div className="flex items-center justify-between">
                              {item.workUrls && (
                                <a
                                  href={item.workUrls.startsWith('http') ? item.workUrls : `https://${item.workUrls}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-sm text-primary hover:underline flex items-center gap-1"
                                >
                                  View Project
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                              {isOwnProfile && (
                                <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                                  <button
                                    onClick={() => handleEditPortfolio(item)}
                                    className="p-2 opacity-0 group-hover:opacity-100 hover:bg-blue-50 rounded-lg transition-all"
                                    title="Edit project"
                                  >
                                    <Edit2 className="w-4 h-4 text-blue-600" />
                                  </button>
                                  <button
                                    onClick={() => handleDeletePortfolio(item.id)}
                                    className="p-2 opacity-0 group-hover:opacity-100 hover:bg-red-50 rounded-lg transition-all"
                                    title="Delete project"
                                  >
                                    <X className="w-4 h-4 text-red-600" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Like Button and Count - Show for all users */}
                        <div className="px-6 pb-6 pt-4 border-t border-border flex items-center justify-between">
                          {!isOwnProfile && profile ? (
                            <PortfolioRatingBox
                              portfolioId={item.id}
                              portfolioOwnerId={profile.id}
                              existingLikes={item.likeCount || 0}
                              userHasLiked={item.userHasLiked || false}
                              onSuccess={loadProfile}
                            />
                          ) : (
                            <div className="flex items-center gap-2">
                              {item.likeCount && item.likeCount > 0 ? (
                                <span className="text-sm text-muted-foreground flex items-center gap-1">
                                  <Heart className="w-4 h-4 fill-red-400 text-red-400" />
                                  {item.likeCount} {item.likeCount === 1 ? 'like' : 'likes'}
                                </span>
                              ) : (
                                <span className="text-sm text-muted-foreground">No likes yet</span>
                              )}
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground col-span-full">No portfolio items yet</p>
              )}
            </div>
          </div>

          {/* Work Experience Section */}
          <div className="mb-24">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold">Work Experience</h2>
              {isOwnProfile && !showExperienceForm && (
                <button
                  onClick={() => setShowExperienceForm(true)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
              )}
            </div>

            {showExperienceForm && (
              <div className="mb-8 p-6 bg-white rounded-2xl border border-border">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      value={experienceForm.title}
                      onChange={(e) => setExperienceForm({ ...experienceForm, title: e.target.value })}
                      placeholder="Job title"
                      className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <input
                      type="text"
                      value={experienceForm.company}
                      onChange={(e) => setExperienceForm({ ...experienceForm, company: e.target.value })}
                      placeholder="Company"
                      className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="date"
                      value={experienceForm.startDate}
                      onChange={(e) => setExperienceForm({ ...experienceForm, startDate: e.target.value })}
                      placeholder="Start date"
                      className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <input
                      type="date"
                      value={experienceForm.endDate}
                      onChange={(e) => setExperienceForm({ ...experienceForm, endDate: e.target.value })}
                      disabled={experienceForm.present}
                      placeholder="End date"
                      className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                    />
                  </div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={experienceForm.present}
                      onChange={(e) => setExperienceForm({ ...experienceForm, present: e.target.checked, endDate: e.target.checked ? '' : experienceForm.endDate })}
                      className="rounded border-border"
                    />
                    <span className="text-sm">I currently work here</span>
                  </label>
                  <div>
                    <textarea
                      value={experienceForm.description}
                      onChange={(e) => setExperienceForm({ ...experienceForm, description: e.target.value })}
                      placeholder="Description - You can use multiple paragraphs, bullet points (•), and include URLs"
                      rows={6}
                      className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Tip: Press Enter for new lines. URLs will be automatically linked.
                    </p>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={handleAddExperience}
                      className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                    >
                      Add Experience
                    </button>
                    <button
                      onClick={() => setShowExperienceForm(false)}
                      className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-6">
              {experience.length > 0 ? (
                experience.map((exp) => (
                  <div
                    key={exp.id}
                    className="group relative pl-8 border-l-2 border-border hover:border-primary transition-colors"
                  >
                    <div className="absolute left-[-9px] top-2 w-4 h-4 bg-primary rounded-full border-4 border-background" />
                    <div className="pb-8">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-xl font-bold">{exp.title}</h3>
                          <p className="text-lg text-muted-foreground flex items-center gap-2">
                            <Briefcase className="w-4 h-4" />
                            {exp.company}
                          </p>
                        </div>
                        {isOwnProfile && (
                          <button
                            onClick={() => handleDeleteExperience(exp.id)}
                            className="p-2 opacity-0 group-hover:opacity-100 hover:bg-gray-100 rounded-lg transition-all"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(exp.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                          {' - '}
                          {exp.present ? 'Present' : new Date(exp.endDate || '').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      {exp.description && (
                        <div className="text-muted-foreground whitespace-pre-wrap w-[60%]">
                          {formatRichText(exp.description)}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground">No work experience added yet</p>
              )}
            </div>
          </div>

          {/* Recommendations Section - Shows all accepted recommendations */}
          {profile && allRecommendations.length > 0 && (
            <div className="mb-24">
              <RecommendationsSection recommendations={allRecommendations} />
            </div>
          )}
        </div>
      </div>

      {/* Project Detail Drawer */}
      <ProjectDrawer
        project={selectedProject}
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedProject(null);
        }}
        isOwnProfile={currentUser?.id === profile?.id}
      />

      {/* Give Recommendation Dialog */}
      {profile && (
        <EnhancedRecommendationDialog
          isOpen={showGiveRecommendation}
          onClose={() => setShowGiveRecommendation(false)}
          receiverId={profile.id}
          receiverName={`${profile.firstName} ${profile.lastName}`}
          defaultType="GIVEN"
        />
      )}
    </div>
  );
}
