import { useState, useEffect } from 'react';
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
import { MapPin, DollarSign, Briefcase, Calendar, ExternalLink, Plus, X, Edit2, Check } from 'lucide-react';

export default function ProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<UpdateProfileRequest>({});
  
  // Skills state
  const [skills, setSkills] = useState<UserSkill[]>([]);
  const [newSkill, setNewSkill] = useState<AddSkillRequest>({ skillName: '' });
  const [showSkillForm, setShowSkillForm] = useState(false);
  
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
      const updatedUser = await userService.updateProfile(formData);
      
      // Reload the full profile to get all data
      await loadProfile();
      setIsEditing(false);
      
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
      [name]: type === 'number' ? parseFloat(value) : value,
    }));
  };

  // Skills handlers
  const handleAddSkill = async () => {
    if (!newSkill.skillName.trim()) return;
    
    try {
      const skill = await userService.addSkill(newSkill);
      setSkills([...skills, skill]);
      setNewSkill({ skillName: '' });
      setShowSkillForm(false);
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
      const item = await userService.addPortfolioItem(portfolioForm);
      setPortfolio([...portfolio, item]);
      setPortfolioForm({ 
        name: '', 
        description: '', 
        companyName: '', 
        role: '', 
        workUrls: '', 
        mediaFile: '' 
      });
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
            <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Profile Header */}
          <div className="flex items-start justify-between mb-16">
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
                {profile.location && (
                  <div className="flex items-center gap-2 text-foreground">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm">{profile.location}</span>
                  </div>
                )}
                {profile.hourlyRate && (
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
                      value={formData.hourlyRate || 0}
                      onChange={handleChange}
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
              {isOwnProfile && !showSkillForm && (
                <button
                  onClick={() => setShowSkillForm(true)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
              )}
            </div>

            {showSkillForm && (
              <div className="mb-8 p-6 bg-white rounded-2xl border border-border">
                <div className="flex gap-4">
                  <input
                    type="text"
                    value={newSkill.skillName}
                    onChange={(e) => setNewSkill({ skillName: e.target.value })}
                    placeholder="Skill name (e.g., React, TypeScript, Design)"
                    className="flex-1 px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button
                    onClick={handleAddSkill}
                    className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => setShowSkillForm(false)}
                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
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
                        onClick={() => handleRemoveSkill(userSkill.id)}
                        className="ml-2 p-1 opacity-0 group-hover:opacity-100 hover:bg-gray-100 rounded transition-all"
                      >
                        <X className="w-3 h-3" />
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
                  <input
                    type="url"
                    value={portfolioForm.mediaFile}
                    onChange={(e) => setPortfolioForm({ ...portfolioForm, mediaFile: e.target.value })}
                    placeholder="Image/Media URL (optional)"
                    className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  />
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
