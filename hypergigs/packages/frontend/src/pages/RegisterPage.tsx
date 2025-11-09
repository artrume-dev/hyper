import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { Linkedin, Mail, Building2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CountrySelect } from '@/components/ui/country-select';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { emailInvitationService, type EmailInvitation } from '@/services/api/emailInvitation.service';

const registerSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must not exceed 20 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens'),
  role: z.enum(['FREELANCER', 'AGENCY', 'STARTUP']),
  country: z.string().optional(),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const invitationToken = searchParams.get('invitationToken');
  const { register, error, isLoading, clearError } = useAuthStore();
  const [invitation, setInvitation] = useState<EmailInvitation | null>(null);
  const [loadingInvitation, setLoadingInvitation] = useState(false);

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

  // Load invitation if token is present
  useEffect(() => {
    if (invitationToken) {
      loadInvitation();
    }
  }, [invitationToken]);

  const loadInvitation = async () => {
    if (!invitationToken) return;

    setLoadingInvitation(true);
    try {
      const { invitation: loadedInvitation } = await emailInvitationService.validateInvitationToken(invitationToken);
      setInvitation(loadedInvitation);

      // Pre-fill email from invitation
      form.setValue('email', loadedInvitation.email);
    } catch (err: any) {
      console.error('Failed to load invitation:', err);
      // Invalid token - redirect to join page which will show error
      navigate(`/join/${invitationToken}`, { replace: true });
    } finally {
      setLoadingInvitation(false);
    }
  };

  const onSubmit = async (data: RegisterFormValues) => {
    clearError();
    try {
      // Include invitation token if present
      const registerData = {
        ...data,
        ...(invitationToken && { invitationToken }),
      };

      await register(registerData);

      // If there was an invitation, redirect to the team page
      if (invitation?.team?.slug) {
        navigate(`/teams/${invitation.team.slug}`, { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      // Error is handled in the store and will show field-specific errors
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    clearError();
    try {
      const { authService } = await import('@/services/api/auth.service');

      const response = await authService.oauthGoogle({
        credential: credentialResponse.credential,
        role: form.getValues('role') || 'FREELANCER',
        country: form.getValues('country'),
      });

      // Store token
      localStorage.setItem('auth_token', response.token);

      // Check if profile is complete (has first/last name and username)
      if (!response.user.firstName || !response.user.lastName || !response.user.username) {
        // Redirect to complete profile page
        navigate('/complete-profile', { replace: true });
      } else {
        // Profile complete, go to dashboard
        navigate('/dashboard', { replace: true });
      }
    } catch (err: any) {
      console.error('Google OAuth error:', err);
      const errorMessage = err.response?.data?.error || 'Google sign-in failed';
      // Set error using form or show alert
      alert(errorMessage);
    }
  };

  const handleLinkedInAuth = () => {
    // LinkedIn OAuth will be implemented with proper library
    alert('LinkedIn sign-in coming soon!');
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Left Column - Form (40%) */}
      <div className="w-full lg:w-2/5 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">Join HyperGigs</h1>
            <p className="mt-2 text-sm text-gray-600">
              Create your account to get started
            </p>
          </div>

          {/* Invitation Banner */}
          {loadingInvitation ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <span className="text-sm text-blue-800">Loading invitation...</span>
              </div>
            </div>
          ) : invitation ? (
            <div className="bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  {invitation.team.avatar ? (
                    <img
                      src={invitation.team.avatar}
                      alt={invitation.team.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-white" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-violet-900">
                    You're joining <span className="font-bold">{invitation.team.name}</span>
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Mail className="w-3.5 h-3.5 text-violet-600" />
                    <p className="text-xs text-violet-700">
                      Invited by {invitation.inviter.firstName} {invitation.inviter.lastName}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {/* OAuth Buttons */}
          <div className="space-y-3">
            <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => console.error('Google Login Failed')}
                theme="outline"
                size="large"
                text="signup_with"
                width="100%"
              />
            </GoogleOAuthProvider>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleLinkedInAuth}
            >
              <Linkedin className="mr-2 h-4 w-4" />
              Sign up with LinkedIn
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-gray-50 px-2 text-gray-500">Or continue with email</span>
            </div>
          </div>

          {/* General Error Display */}
          {error && (
            <div className="rounded-md bg-red-50 p-4 border border-red-200">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="johndoe" {...field} />
                    </FormControl>
                    <FormDescription>
                      3-20 characters, alphanumeric with - and _ allowed
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email address</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="john@example.com"
                        {...field}
                        disabled={!!invitation}
                      />
                    </FormControl>
                    {invitation && (
                      <FormDescription>
                        Pre-filled from invitation
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormDescription>Minimum 6 characters</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>I am a...</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="FREELANCER">Freelancer</SelectItem>
                        <SelectItem value="AGENCY">Agency</SelectItem>
                        <SelectItem value="STARTUP">Startup</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country</FormLabel>
                    <FormControl>
                      <CountrySelect
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Select your country"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Creating account...' : 'Create account'}
              </Button>
            </form>
          </Form>

          <div className="text-center space-y-2">
            <p className="text-xs text-gray-500">
              By signing up, you agree to our{' '}
              <a href="#" className="text-blue-600 hover:text-blue-500 underline">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="#" className="text-blue-600 hover:text-blue-500 underline">
                Privacy Policy
              </a>
            </p>
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right Column - Info (60%) */}
      <div className="hidden lg:flex lg:w-3/5 bg-gradient-to-br from-blue-600 to-purple-700 p-12 items-center justify-center">
        <div className="max-w-2xl text-white space-y-8">
          <div>
            <h2 className="text-4xl font-bold mb-4">Welcome to HyperGigs</h2>
            <p className="text-xl text-blue-100">
              The ultimate platform for freelancers, agencies, and startups to collaborate and grow
            </p>
          </div>

          <div className="space-y-6">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Build Your Dream Team
                </CardTitle>
                <CardDescription className="text-blue-100">
                  Connect with talented freelancers and agencies worldwide. Create teams that match your project needs perfectly.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Grow Your Career
                </CardTitle>
                <CardDescription className="text-blue-100">
                  Showcase your skills, build your portfolio, and get discovered by companies looking for your expertise.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Secure & Reliable
                </CardTitle>
                <CardDescription className="text-blue-100">
                  Your data is protected with enterprise-grade security. Focus on what matters - building great products.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          <div className="flex items-center gap-8 pt-8">
            <div className="text-center">
              <div className="text-3xl font-bold">10K+</div>
              <div className="text-sm text-blue-100">Active Users</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">5K+</div>
              <div className="text-sm text-blue-100">Projects Completed</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">95%</div>
              <div className="text-sm text-blue-100">Satisfaction Rate</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
