import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { userService } from '@/services/api/user.service';
import type { 
  UserProfile, 
  UpdateProfileRequest, 
  UserSkill, 
  PortfolioItem, 
  WorkExperience,
  AddSkillRequest,
  CreatePortfolioRequest,
  CreateExperienceRequest
} from '@/types/user';
import Navigation from '@/components/Navigation';
import { MapPin, DollarSign, Briefcase, Calendar, ExternalLink, Plus, X, Edit2, Check, Upload, Image as ImageIcon, Sparkles } from 'lucide-react';
import { searchSkills } from '@/data/skills';

export default function ProfilePage() {
  const { userId } = useParams<{ userId: string }>();
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
    mediaFile: ''
  });
  const [portfolioImagePreview, setPortfolioImagePreview] = useState<string | null>(null);
  // @ts-ignore - will be used when backend upload is implemented
  const [portfolioImageFile, setPortfolioImageFile] = useState<File | null>(null);
  const portfolioFileInputRef = useRef<HTMLInputElement>(null);
  
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

  const isOwnProfile = !userId || userId === currentUser?.id;

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const profileId = userId || currentUser?.id;
      if (!profileId) {
        navigate('/login');
        return;
      }

      const data = await userService.getUserProfile(profileId);
      setProfile(data);
      setSkills(data.skills || []);
      setPortfolio(data.portfolios || []);
      setExperience(data.workExperiences || []);
      
      setFormData({
        firstName: data.firstName,
        lastName: data.lastName,
        bio: data.bio || '',
        location: data.location || '',
        hourlyRate: data.hourlyRate || 0,
        available: data.available,
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
    const file = e.target.files?.[0];
    if (file) {
      setPortfolioImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPortfolioImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePortfolioImageDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setPortfolioImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPortfolioImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
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
      const response = await fetch('/api/ai/generate-skills', {
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
      // Include portfolio image preview (base64) if available
      const portfolioData = {
        ...portfolioForm,
        ...(portfolioImagePreview && { mediaFile: portfolioImagePreview })
      };
      
      const item = await userService.addPortfolioItem(portfolioData);
      setPortfolio([...portfolio, item]);
      setPortfolioForm({ 
        name: '', 
        description: '', 
        companyName: '', 
        role: '', 
        workUrls: '', 
        mediaFile: '' 
      });
      setPortfolioImagePreview(null);
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
      <div className="pt-24 pb-16 px-8">
        <div className="max-w-[1400px] mx-auto">
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
          <div className="grid grid-cols-1 lg:grid-cols-[1fr,320px] gap-16 mb-16">
            {/* Left: Intro */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <h1 className="text-[64px] font-bold tracking-tight leading-none">
                  {profile.firstName} {profile.lastName}
                </h1>
                {isOwnProfile && !isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                )}
              </div>
              
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <span className="uppercase tracking-wider">{profile.role}</span>
                <span>•</span>
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
                    <span className="text-sm">${profile.hourlyRate}/hr</span>
                  </div>
                )}
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                  profile.available 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {profile.available ? 'Available for work' : 'Unavailable'}
                </div>
              </div>

              {profile.bio && !isEditing && (
                <p className="mt-8 text-lg text-muted-foreground max-w-2xl leading-relaxed">
                  {profile.bio}
                </p>
              )}
            </div>

            {/* Right: Stats Card */}
            <div className="space-y-8">
              {/* Stats Grid - Awwwards Style */}
              <div className="border border-border rounded-2xl overflow-hidden">
                {/* Header */}
                <div className="grid grid-cols-4 border-b border-border bg-gray-50">
                  <div className="px-4 py-3 text-center border-r border-border">
                    <span className="text-xs font-semibold uppercase tracking-wider">Works</span>
                  </div>
                  <div className="px-4 py-3 text-center border-r border-border">
                    <span className="text-xs font-semibold uppercase tracking-wider">SOTM</span>
                  </div>
                  <div className="px-4 py-3 text-center border-r border-border">
                    <span className="text-xs font-semibold uppercase tracking-wider">SOTD</span>
                  </div>
                  <div className="px-4 py-3 text-center">
                    <span className="text-xs font-semibold uppercase tracking-wider">HM</span>
                  </div>
                </div>
                
                {/* Values */}
                <div className="grid grid-cols-4 bg-white">
                  <div className="px-4 py-6 text-center border-r border-border">
                    <span className="text-4xl font-bold">{portfolio.length || 0}</span>
                  </div>
                  <div className="px-4 py-6 text-center border-r border-border">
                    <span className="text-4xl font-bold">0</span>
                  </div>
                  <div className="px-4 py-6 text-center border-r border-border">
                    <span className="text-4xl font-bold">0</span>
                  </div>
                  <div className="px-4 py-6 text-center">
                    <span className="text-4xl font-bold">0</span>
                  </div>
                </div>
              </div>

              {/* Daily Rate */}
              {profile.hourlyRate && profile.hourlyRate > 0 && (
                <div className="text-center p-6 border border-border rounded-2xl bg-white">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Daily Rate</p>
                  <p className="text-3xl font-bold">${(profile.hourlyRate * 8).toFixed(0)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Edit Profile Form */}
          {isEditing && (
            <div className="mb-16 p-8 bg-white rounded-2xl border border-border">
              <h2 className="text-2xl font-bold mb-8">Edit Profile</h2>
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
                    Bio
                  </label>
                  <textarea
                    name="bio"
                    rows={4}
                    value={formData.bio || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    placeholder="Tell us about yourself..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Location
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location || ''}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="City, Country"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Hourly Rate ($)
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
          )}

          {/* Skills Section */}
          <div className="mb-24">
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
                  <textarea
                    value={portfolioForm.description}
                    onChange={(e) => setPortfolioForm({ ...portfolioForm, description: e.target.value })}
                    placeholder="Description"
                    rows={3}
                    className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
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
                  
                  {/* Portfolio Image Upload */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Project Image
                    </label>
                    <div
                      className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer"
                      onDrop={handlePortfolioImageDrop}
                      onDragOver={(e) => e.preventDefault()}
                      onClick={() => portfolioFileInputRef.current?.click()}
                    >
                      {portfolioImagePreview ? (
                        <div className="space-y-3">
                          <img
                            src={portfolioImagePreview}
                            alt="Portfolio preview"
                            className="w-full h-48 mx-auto object-cover rounded-lg"
                          />
                          <p className="text-sm text-muted-foreground">
                            Click or drag to change image
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <ImageIcon className="w-10 h-10 mx-auto text-muted-foreground" />
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
                      ref={portfolioFileInputRef}
                      type="file"
                      accept="image/*"
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
                    {item.mediaFile && (
                      <div className="aspect-[4/3] bg-gray-100 overflow-hidden">
                        <img
                          src={item.mediaFile}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <div className="p-6">
                      <h3 className="text-xl font-bold mb-2">{item.name}</h3>
                      {item.companyName && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {item.companyName} {item.role && `• ${item.role}`}
                        </p>
                      )}
                      {item.description && (
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                          {item.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between">
                        {item.workUrls && (
                          <a
                            href={item.workUrls}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline flex items-center gap-1"
                          >
                            View Project
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                        {isOwnProfile && (
                          <button
                            onClick={() => handleDeletePortfolio(item.id)}
                            className="p-2 opacity-0 group-hover:opacity-100 hover:bg-gray-100 rounded-lg transition-all"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
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
                  <textarea
                    value={experienceForm.description}
                    onChange={(e) => setExperienceForm({ ...experienceForm, description: e.target.value })}
                    placeholder="Description (optional)"
                    rows={3}
                    className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  />
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
                        <p className="text-muted-foreground">{exp.description}</p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground">No work experience added yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
