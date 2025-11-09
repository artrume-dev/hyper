import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { teamService } from '@/services/api/team.service';
import { invitationService } from '@/services/api/invitation.service';
import type { TeamWithRole } from '@/types/team';
import { Loader2, Users } from 'lucide-react';

interface InvitationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipientId: string;
  recipientName: string;
}

const invitationSchema = z.object({
  teamId: z.string().min(1, 'Please select a team'),
  message: z.string().max(500, 'Message must be 500 characters or less').optional(),
});

type InvitationFormData = z.infer<typeof invitationSchema>;

export default function InvitationDialog({
  open,
  onOpenChange,
  recipientId,
  recipientName,
}: InvitationDialogProps) {
  const [teams, setTeams] = useState<TeamWithRole[]>([]);
  const [isLoadingTeams, setIsLoadingTeams] = useState(false);
  const [teamsError, setTeamsError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<InvitationFormData>({
    resolver: zodResolver(invitationSchema),
    defaultValues: {
      teamId: '',
      message: '',
    },
  });

  const selectedTeamId = watch('teamId');
  const message = watch('message');

  // Fetch user's teams where they are OWNER or ADMIN
  useEffect(() => {
    if (open) {
      loadTeams();
    } else {
      // Reset form when dialog closes
      reset();
      setTeamsError(null);
    }
  }, [open, reset]);

  const loadTeams = async () => {
    setIsLoadingTeams(true);
    setTeamsError(null);
    try {
      const allTeams = await teamService.getMyTeams();
      // Filter teams where user is OWNER or ADMIN
      const eligibleTeams = allTeams.filter(
        (team) => team.role === 'OWNER' || team.role === 'ADMIN'
      );
      setTeams(eligibleTeams);

      if (eligibleTeams.length === 0) {
        setTeamsError(
          'You need to be a team owner or admin to send invitations. Create a team first.'
        );
      }
    } catch (err: any) {
      setTeamsError(
        err.response?.data?.message || 'Failed to load teams. Please try again.'
      );
    } finally {
      setIsLoadingTeams(false);
    }
  };

  const onSubmit = async (data: InvitationFormData) => {
    setIsSending(true);
    try {
      await invitationService.sendInvitation({
        receiverId: recipientId,
        teamId: data.teamId,
        message: data.message,
        role: 'MEMBER', // Default role for new invitations
      });

      toast({
        title: 'Invitation sent!',
        description: `Successfully sent invitation to ${recipientName}.`,
      });

      // Close dialog and reset form
      onOpenChange(false);
      reset();
    } catch (err: any) {
      toast({
        title: 'Failed to send invitation',
        description: err.response?.data?.message || 'An error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  const characterCount = message?.length || 0;
  const characterLimit = 500;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Invite {recipientName} to your team</DialogTitle>
          <DialogDescription>
            Send an invitation to collaborate with {recipientName} on one of your teams.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Team Selection */}
          <div className="space-y-2">
            <Label htmlFor="teamId">
              Select Team <span className="text-destructive">*</span>
            </Label>
            {isLoadingTeams ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Loading teams...
              </div>
            ) : teamsError ? (
              <div className="p-4 bg-muted border border-border rounded-md space-y-3">
                <p className="text-sm text-muted-foreground">{teamsError}</p>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    onOpenChange(false);
                    navigate('/teams/create');
                  }}
                >
                  Create Team
                </Button>
              </div>
            ) : teams.length === 0 ? (
              <div className="p-4 bg-muted border border-border rounded-md space-y-3">
                <p className="text-sm text-muted-foreground">
                  No eligible teams found. You need to be a team owner or admin to send invitations.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    onOpenChange(false);
                    navigate('/teams/create');
                  }}
                >
                  Create Team
                </Button>
              </div>
            ) : (
              <>
                <Select
                  value={selectedTeamId}
                  onValueChange={(value: string) => setValue('teamId', value, { shouldValidate: true })}
                  disabled={isSending}
                >
                  <SelectTrigger id="teamId" className="w-full">
                    <SelectValue placeholder="Choose a team..." />
                  </SelectTrigger>
                  <SelectContent>
                    {teams.map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          <span>{team.name}</span>
                          <span className="text-xs text-muted-foreground">
                            ({team.type})
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.teamId && (
                  <p className="text-sm text-destructive" role="alert">
                    {errors.teamId.message}
                  </p>
                )}
              </>
            )}
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">
              Message <span className="text-muted-foreground">(Optional)</span>
            </Label>
            <Textarea
              id="message"
              {...register('message')}
              placeholder="Add a personal message to your invitation..."
              className="min-h-[100px] resize-none"
              disabled={isSending}
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
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSending || teams.length === 0 || isLoadingTeams}
            >
              {isSending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send Invitation'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
