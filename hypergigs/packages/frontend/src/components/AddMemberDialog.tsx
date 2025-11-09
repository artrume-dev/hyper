import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  emailInvitationService,
  type SuggestedMember,
} from '@/services/api/emailInvitation.service';
import {
  Loader2,
  UserPlus,
  Mail,
  Sparkles,
  CheckCircle2,
  MapPin,
  Briefcase,
} from 'lucide-react';

interface AddMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamId: string;
  teamName: string;
  onSuccess?: () => void;
}

const inviteSchema = z.object({
  identifier: z.string().min(1, 'Please enter an email or username'),
  role: z.enum(['MEMBER', 'ADMIN']),
  message: z.string().max(500, 'Message must be 500 characters or less').optional(),
});

type InviteFormData = z.infer<typeof inviteSchema>;

export default function AddMemberDialog({
  open,
  onOpenChange,
  teamId,
  teamName,
  onSuccess,
}: AddMemberDialogProps) {
  const [activeTab, setActiveTab] = useState<'suggestions' | 'invite'>('suggestions');
  const [suggestions, setSuggestions] = useState<SuggestedMember[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [invitingUserId, setInvitingUserId] = useState<string | null>(null);
  const [isInviting, setIsInviting] = useState(false);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      identifier: '',
      role: 'MEMBER',
      message: '',
    },
  });

  const selectedRole = watch('role');
  const message = watch('message');
  const identifier = watch('identifier');

  useEffect(() => {
    if (open) {
      reset();
      loadSuggestions();
    }
  }, [open, reset]);

  const loadSuggestions = async () => {
    setLoadingSuggestions(true);
    try {
      const { suggestions: loadedSuggestions } = await emailInvitationService.getSuggestedMembers(
        teamId,
        10
      );
      setSuggestions(loadedSuggestions);
    } catch (err: any) {
      console.error('Failed to load suggestions:', err);
      // Don't show error toast - suggestions are optional
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleAddSuggestedUser = async (user: SuggestedMember['user'], role: 'MEMBER' | 'ADMIN' = 'MEMBER') => {
    setInvitingUserId(user.id);
    try {
      const response = await emailInvitationService.inviteMember(teamId, {
        identifier: user.username,
        role,
      });

      if (response.type === 'direct') {
        toast({
          title: 'Member added!',
          description: `${user.firstName} ${user.lastName} has been added to ${teamName} (same company)`,
        });
      } else if (response.type === 'internal_invitation') {
        toast({
          title: 'Invitation sent!',
          description: `${user.firstName} ${user.lastName} will be notified to join ${teamName}. Pending their acceptance.`,
          duration: 5000,
        });
      } else {
        toast({
          title: 'Invitation sent!',
          description: `Email invitation sent to ${user.firstName} ${user.lastName}. Pending their acceptance.`,
          duration: 5000,
        });
      }

      // Remove from suggestions
      setSuggestions(suggestions.filter((s) => s.user.id !== user.id));

      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      toast({
        title: 'Failed to invite member',
        description: err.response?.data?.error || 'An error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setInvitingUserId(null);
    }
  };

  const onSubmitInvite = async (data: InviteFormData) => {
    setIsInviting(true);
    try {
      const response = await emailInvitationService.inviteMember(teamId, {
        identifier: data.identifier,
        role: data.role,
        message: data.message,
      });

      if (response.type === 'direct') {
        toast({
          title: 'Member added!',
          description: response.message,
        });
      } else if (response.type === 'internal_invitation') {
        toast({
          title: 'Invitation sent!',
          description: 'User will be notified to join the team. Pending their acceptance.',
          duration: 5000,
        });
      } else if (response.type === 'email_invitation') {
        toast({
          title: 'Invitation sent!',
          description: 'Email invitation sent. Pending their acceptance.',
          duration: 5000,
        });
      }

      if (onSuccess) {
        onSuccess();
      }

      onOpenChange(false);
      reset();
    } catch (err: any) {
      toast({
        title: 'Failed to invite',
        description: err.response?.data?.error || 'An error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsInviting(false);
    }
  };

  const isEmail = identifier && identifier.includes('@');
  const characterCount = message?.length || 0;
  const characterLimit = 500;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Member to {teamName}</DialogTitle>
          <DialogDescription>
            Choose from suggested members or invite by email/username
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="suggestions" className="gap-2">
              <Sparkles className="w-4 h-4" />
              Suggested Members
              {suggestions.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {suggestions.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="invite" className="gap-2">
              <UserPlus className="w-4 h-4" />
              Invite
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Suggested Members */}
          <TabsContent value="suggestions" className="flex-1 overflow-y-auto mt-4 space-y-3">
            {loadingSuggestions ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center space-y-3">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                  <p className="text-sm text-muted-foreground">Finding best matches...</p>
                </div>
              </div>
            ) : suggestions.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center space-y-3">
                  <div className="w-16 h-16 rounded-full bg-muted mx-auto flex items-center justify-center">
                    <UserPlus className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">No suggestions available</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Try inviting members directly using the Invite tab
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                <div className="space-y-3">
                  {suggestions.map((suggestion) => (
                    <motion.div
                      key={suggestion.user.id}
                      layout
                      initial={{ opacity: 1, scale: 1 }}
                      exit={{
                        opacity: 0,
                        scale: 0.95,
                        height: 0,
                        marginBottom: 0,
                        transition: { duration: 0.3, ease: 'easeOut' }
                      }}
                    >
                      <Card className="overflow-hidden">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            {/* Avatar */}
                            <div className="flex-shrink-0">
                              {suggestion.user.avatar ? (
                                <img
                                  src={suggestion.user.avatar}
                                  alt={suggestion.user.username}
                                  className="w-14 h-14 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center text-white font-semibold text-lg">
                                  {suggestion.user.firstName[0]}{suggestion.user.lastName[0]}
                                </div>
                              )}
                            </div>

                            {/* User Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-base truncate">
                                    {suggestion.user.firstName} {suggestion.user.lastName}
                                  </h4>
                                  <p className="text-sm text-muted-foreground">
                                    @{suggestion.user.username}
                                  </p>
                                </div>
                                <Badge variant="secondary" className="flex items-center gap-1 flex-shrink-0">
                                  <Sparkles className="w-3 h-3" />
                                  {suggestion.score} pts
                                </Badge>
                              </div>

                              {/* Job Title & Location */}
                              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mb-2">
                                {suggestion.user.jobTitle && (
                                  <div className="flex items-center gap-1">
                                    <Briefcase className="w-3 h-3" />
                                    <span>{suggestion.user.jobTitle}</span>
                                  </div>
                                )}
                                {suggestion.user.location && (
                                  <div className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    <span>{suggestion.user.location}</span>
                                  </div>
                                )}
                              </div>

                              {/* Match Reason */}
                              <div className="bg-muted/50 rounded px-2 py-1 mb-3">
                                <p className="text-xs text-muted-foreground">
                                  <span className="font-medium">Match:</span> {suggestion.matchReason}
                                </p>
                              </div>

                              {/* Actions */}
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleAddSuggestedUser(suggestion.user, 'MEMBER')}
                                  disabled={invitingUserId === suggestion.user.id}
                                  className="flex-1"
                                >
                                  {invitingUserId === suggestion.user.id ? (
                                    <>
                                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                      Inviting...
                                    </>
                                  ) : (
                                    <>
                                      <UserPlus className="w-3 h-3 mr-1" />
                                      Invite as Member
                                    </>
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleAddSuggestedUser(suggestion.user, 'ADMIN')}
                                  disabled={invitingUserId === suggestion.user.id}
                                >
                                  Invite as Admin
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </AnimatePresence>
            )}
          </TabsContent>

          {/* Tab 2: Invite by Email/Username */}
          <TabsContent value="invite" className="flex-1 overflow-y-auto mt-4">
            <form onSubmit={handleSubmit(onSubmitInvite)} className="space-y-6">
              {/* Email or Username Input */}
              <div className="space-y-2">
                <Label htmlFor="identifier">
                  Email or Username <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="identifier"
                    {...register('identifier')}
                    type="text"
                    placeholder="user@company.com or username"
                    disabled={isInviting}
                    className="pr-10"
                  />
                  {isEmail ? (
                    <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  ) : (
                    <UserPlus className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  )}
                </div>
                {identifier && (
                  <p className="text-xs text-muted-foreground">
                    {isEmail
                      ? '✓ Will send email invitation to this address'
                      : '✓ Will add existing user to team'}
                  </p>
                )}
                {errors.identifier && (
                  <p className="text-sm text-destructive" role="alert">
                    {errors.identifier.message}
                  </p>
                )}
              </div>

              {/* Role Selection */}
              <div className="space-y-2">
                <Label htmlFor="role">
                  Role <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={selectedRole}
                  onValueChange={(value: 'MEMBER' | 'ADMIN') =>
                    setValue('role', value, { shouldValidate: true })
                  }
                  disabled={isInviting}
                >
                  <SelectTrigger id="role" className="w-full">
                    <SelectValue placeholder="Choose a role..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MEMBER">Member - Can view and collaborate</SelectItem>
                    <SelectItem value="ADMIN">Admin - Can manage team and members</SelectItem>
                  </SelectContent>
                </Select>
                {errors.role && (
                  <p className="text-sm text-destructive" role="alert">
                    {errors.role.message}
                  </p>
                )}
              </div>

              {/* Optional Message */}
              <div className="space-y-2">
                <Label htmlFor="message">
                  Personal Message <span className="text-muted-foreground">(Optional)</span>
                </Label>
                <Textarea
                  id="message"
                  {...register('message')}
                  placeholder="Add a personal message to your invitation..."
                  className="min-h-[100px] resize-none"
                  disabled={isInviting}
                  maxLength={characterLimit}
                />
                <div className="flex items-center justify-between">
                  {errors.message && (
                    <p className="text-sm text-destructive" role="alert">
                      {errors.message.message}
                    </p>
                  )}
                  <p
                    className={`text-xs ml-auto ${
                      characterCount > characterLimit
                        ? 'text-destructive'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {characterCount}/{characterLimit}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isInviting}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isInviting} className="flex-1">
                  {isInviting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Inviting...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Send Invitation
                    </>
                  )}
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
