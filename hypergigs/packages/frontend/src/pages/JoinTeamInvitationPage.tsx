import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Building2, Mail, User, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { emailInvitationService, type EmailInvitation } from '@/services/api/emailInvitation.service';

export default function JoinTeamInvitationPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [invitation, setInvitation] = useState<EmailInvitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      validateToken();
    }
  }, [token]);

  const validateToken = async () => {
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const { invitation: validatedInvitation } = await emailInvitationService.validateInvitationToken(token);
      setInvitation(validatedInvitation);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'This invitation is invalid or has expired';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = () => {
    navigate(`/login?invitationToken=${token}`);
  };

  const handleCreateAccount = () => {
    navigate(`/register?invitationToken=${token}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-destructive" />
              </div>
              <div>
                <h1 className="text-2xl font-bold mb-2">Invalid Invitation</h1>
                <p className="text-muted-foreground">{error}</p>
              </div>
              <Button onClick={() => navigate('/')} className="w-full">
                Go to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invitation) {
    return null;
  }

  const expiresAt = new Date(invitation.expiresAt);
  const now = new Date();
  const daysLeft = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Card className="overflow-hidden">
          {/* Gradient Header */}
          <div className="bg-gradient-to-r from-violet-600 to-purple-600 p-8 text-white text-center">
            <h1 className="text-3xl font-bold mb-2">🎉 You're Invited!</h1>
            <p className="text-violet-100">Join {invitation.team.name} on HyperGigs</p>
          </div>

          <CardContent className="p-8">
            {/* Team Info */}
            <div className="flex flex-col items-center mb-8">
              {invitation.team.avatar ? (
                <img
                  src={invitation.team.avatar}
                  alt={invitation.team.name}
                  className="w-24 h-24 rounded-xl object-cover mb-4 shadow-lg"
                />
              ) : (
                <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center mb-4 shadow-lg">
                  <span className="text-white text-4xl font-bold">
                    {invitation.team.name[0]}
                  </span>
                </div>
              )}
              <h2 className="text-2xl font-bold text-center">{invitation.team.name}</h2>
              {invitation.team.description && (
                <p className="text-muted-foreground text-center mt-2 max-w-md">
                  {invitation.team.description}
                </p>
              )}
            </div>

            {/* Invitation Details */}
            <div className="bg-muted/50 rounded-lg p-6 space-y-4 mb-6">
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">Invited by</p>
                  <div className="flex items-center gap-2 mt-1">
                    {invitation.inviter.avatar ? (
                      <img
                        src={invitation.inviter.avatar}
                        alt={`${invitation.inviter.firstName} ${invitation.inviter.lastName}`}
                        className="w-6 h-6 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                        {invitation.inviter.firstName[0]}{invitation.inviter.lastName[0]}
                      </div>
                    )}
                    <span className="font-medium">
                      {invitation.inviter.firstName} {invitation.inviter.lastName}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">Invited email</p>
                  <p className="font-medium mt-1">{invitation.email}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Building2 className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">Role</p>
                  <Badge variant="outline" className="mt-1">
                    {invitation.role === 'ADMIN' ? 'Admin' : 'Member'}
                  </Badge>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">Expires in</p>
                  <p className="font-medium mt-1">
                    {daysLeft > 0 ? `${daysLeft} ${daysLeft === 1 ? 'day' : 'days'}` : 'Less than a day'}
                  </p>
                </div>
              </div>
            </div>

            {/* Personal Message */}
            {invitation.message && (
              <div className="bg-amber-50 dark:bg-amber-950/20 border-l-4 border-amber-400 p-4 mb-6">
                <p className="text-sm font-medium text-amber-900 dark:text-amber-100 mb-1">
                  Personal message:
                </p>
                <p className="text-amber-800 dark:text-amber-200 italic">"{invitation.message}"</p>
              </div>
            )}

            {/* Call to Actions */}
            <div className="space-y-3">
              <p className="text-center text-sm text-muted-foreground mb-4">
                To accept this invitation and join the team:
              </p>
              <Button onClick={handleCreateAccount} size="lg" className="w-full">
                Create Account & Join →
              </Button>
              <Button onClick={handleSignIn} variant="outline" size="lg" className="w-full">
                Already have an account? Sign In
              </Button>
            </div>

            {/* Footer */}
            <p className="text-xs text-center text-muted-foreground mt-6">
              If you didn't expect this invitation, you can safely ignore this page.
            </p>
          </CardContent>
        </Card>

        {/* Branding */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          Powered by HyperGigs
        </p>
      </div>
    </div>
  );
}
