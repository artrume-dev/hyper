import { useState, useEffect } from 'react';
import { recommendationService } from '@/services/api/recommendation.service';
import { useAuthStore } from '@/stores/authStore';
import type { Recommendation } from '@/types/user';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import {
  MessageSquare,
  Send,
  CheckCircle,
  XCircle,
  X,
  Clock,
  Briefcase,
  FolderKanban,
  Users,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function RecommendationsPage() {
  const { user } = useAuthStore();
  const [receivedRequests, setReceivedRequests] = useState<Recommendation[]>([]);
  const [sentRequests, setSentRequests] = useState<Recommendation[]>([]);
  const [givenRecs, setGivenRecs] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Fulfill recommendation dialog state
  const [fulfillDialogOpen, setFulfillDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<Recommendation | null>(null);
  const [recommendationText, setRecommendationText] = useState('');

  useEffect(() => {
    loadRecommendations();
  }, []);

  const loadRecommendations = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      const allRecs = await recommendationService.getUserRecommendations(user.id);

      // Split into categories
      const received = allRecs.filter(
        (rec) => rec.receiverId === user.id && rec.type === 'REQUEST'
      );
      const sent = allRecs.filter(
        (rec) => rec.senderId === user.id && rec.type === 'REQUEST'
      );
      const given = allRecs.filter(
        (rec) => rec.senderId === user.id && rec.type === 'GIVEN'
      );

      setReceivedRequests(received);
      setSentRequests(sent);
      setGivenRecs(given);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to load recommendations',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = async (request: Recommendation) => {
    // Open dialog to write the recommendation
    setSelectedRequest(request);
    setRecommendationText('');
    setFulfillDialogOpen(true);
  };

  const handleFulfillRequest = async () => {
    if (!selectedRequest || !recommendationText.trim()) {
      toast({
        title: 'Error',
        description: 'Please write a recommendation',
        variant: 'destructive',
      });
      return;
    }

    try {
      setProcessingId(selectedRequest.id);

      // Create a new GIVEN recommendation (the actual recommendation)
      await recommendationService.createRecommendation({
        message: recommendationText,
        receiverId: selectedRequest.senderId, // Send to the person who requested
        type: 'GIVEN',
        portfolioId: selectedRequest.portfolioId || undefined,
        projectId: selectedRequest.projectId || undefined,
        teamId: selectedRequest.teamId || undefined,
      });

      // Mark the request as accepted
      await recommendationService.updateRecommendationStatus(selectedRequest.id, { status: 'ACCEPTED' });

      toast({
        title: 'Success',
        description: 'Recommendation sent successfully',
      });

      setFulfillDialogOpen(false);
      setSelectedRequest(null);
      setRecommendationText('');
      await loadRecommendations();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to send recommendation',
        variant: 'destructive',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string) => {
    try {
      setProcessingId(id);
      await recommendationService.updateRecommendationStatus(id, { status: 'REJECTED' });
      toast({
        title: 'Success',
        description: 'Recommendation rejected',
      });
      await loadRecommendations();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to reject recommendation',
        variant: 'destructive',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const getContextBadge = (rec: Recommendation) => {
    if (rec.portfolio) {
      return (
        <Badge variant="secondary" className="gap-1">
          <FolderKanban className="w-3 h-3" />
          {rec.portfolio.name}
        </Badge>
      );
    }
    if (rec.project) {
      return (
        <Badge variant="secondary" className="gap-1">
          <Briefcase className="w-3 h-3" />
          {rec.project.title}
        </Badge>
      );
    }
    if (rec.team) {
      return (
        <Badge variant="secondary" className="gap-1">
          <Users className="w-3 h-3" />
          {rec.team.name}
        </Badge>
      );
    }
    return null;
  };

  const RecCard = ({ rec, showActions = false }: { rec: Recommendation; showActions?: boolean }) => {
    const otherUser = rec.senderId === user?.id ? rec.receiver : rec.sender;
    const isPending = rec.status === 'PENDING';

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 rounded-lg border border-border hover:border-primary/50 transition-all"
      >
        <div className="flex items-start gap-4">
          <Avatar className="w-12 h-12">
            <AvatarImage src={otherUser?.avatar} alt={otherUser?.firstName} />
            <AvatarFallback>
              {otherUser?.firstName?.[0]}
              {otherUser?.lastName?.[0]}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <h4 className="font-semibold">
                  {otherUser?.firstName} {otherUser?.lastName}
                </h4>
                <p className="text-sm text-muted-foreground">@{otherUser?.username}</p>
              </div>
              <div className="flex items-center gap-2">
                {getContextBadge(rec)}
                <Badge
                  variant={
                    rec.status === 'ACCEPTED'
                      ? 'default'
                      : rec.status === 'PENDING'
                      ? 'secondary'
                      : 'destructive'
                  }
                  className="gap-1"
                >
                  {rec.status === 'ACCEPTED' && <CheckCircle className="w-3 h-3" />}
                  {rec.status === 'PENDING' && <Clock className="w-3 h-3" />}
                  {rec.status === 'REJECTED' && <XCircle className="w-3 h-3" />}
                  {rec.status}
                </Badge>
              </div>
            </div>

            <p className="text-sm bg-muted p-3 rounded-md mb-3">{rec.message}</p>

            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {new Date(rec.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>

              {showActions && isPending && (
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleReject(rec.id)}
                    disabled={processingId === rec.id}
                    className="gap-1"
                  >
                    {processingId === rec.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <XCircle className="w-4 h-4" />
                    )}
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleAccept(rec)}
                    disabled={processingId === rec.id}
                    className="gap-1"
                  >
                    {processingId === rec.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4" />
                    )}
                    Write Recommendation
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Recommendations</h1>
        <p className="text-muted-foreground">
          Manage recommendation requests and view recommendations you've given
        </p>
      </div>

      <Tabs defaultValue="requests" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="requests" className="gap-2">
            <MessageSquare className="w-4 h-4" />
            Requests
            {receivedRequests.filter((r) => r.status === 'PENDING').length > 0 && (
              <Badge variant="destructive" className="ml-1">
                {receivedRequests.filter((r) => r.status === 'PENDING').length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="given" className="gap-2">
            <Send className="w-4 h-4" />
            Given
          </TabsTrigger>
        </TabsList>

        {/* Requests Tab */}
        <TabsContent value="requests" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Recommendation Requests
              </CardTitle>
              <CardDescription>
                Requests from others asking you to write a recommendation
              </CardDescription>
            </CardHeader>
            <CardContent>
              {receivedRequests.length > 0 ? (
                <div className="space-y-4">
                  {receivedRequests.map((rec) => (
                    <RecCard key={rec.id} rec={rec} showActions={true} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                  <h3 className="font-semibold mb-1">No requests yet</h3>
                  <p className="text-sm text-muted-foreground">
                    When someone requests a recommendation from you, it will appear here
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sent Requests */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="w-5 h-5" />
                Requests You Sent
              </CardTitle>
              <CardDescription>
                Recommendation requests you've sent to others
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sentRequests.length > 0 ? (
                <div className="space-y-4">
                  {sentRequests.map((rec) => (
                    <RecCard key={rec.id} rec={rec} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Send className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                  <h3 className="font-semibold mb-1">No requests sent</h3>
                  <p className="text-sm text-muted-foreground">
                    Visit a user's profile to request a recommendation
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Given Tab */}
        <TabsContent value="given" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Recommendations Given
              </CardTitle>
              <CardDescription>
                Recommendations you've written for others
              </CardDescription>
            </CardHeader>
            <CardContent>
              {givenRecs.length > 0 ? (
                <div className="space-y-4">
                  {givenRecs.map((rec) => (
                    <RecCard key={rec.id} rec={rec} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <CheckCircle className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                  <h3 className="font-semibold mb-1">No recommendations given yet</h3>
                  <p className="text-sm text-muted-foreground">
                    Visit a user's profile to give them a recommendation
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Fulfill Recommendation Dialog */}
      {fulfillDialogOpen && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-background rounded-lg shadow-lg max-w-2xl w-full mx-4 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Write Recommendation</h2>
              <button
                onClick={() => {
                  setFulfillDialogOpen(false);
                  setSelectedRequest(null);
                  setRecommendationText('');
                }}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4 p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Request from:</p>
              <p className="font-semibold">
                {selectedRequest.sender?.firstName} {selectedRequest.sender?.lastName}
              </p>
              <p className="text-sm text-muted-foreground mt-2">Their message:</p>
              <p className="text-sm mt-1 italic">"{selectedRequest.message}"</p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Your Recommendation <span className="text-red-500">*</span>
              </label>
              <textarea
                value={recommendationText}
                onChange={(e) => setRecommendationText(e.target.value)}
                placeholder="Write your recommendation for this person..."
                className="w-full min-h-[150px] p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={processingId === selectedRequest.id}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Describe their contributions and strengths
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setFulfillDialogOpen(false);
                  setSelectedRequest(null);
                  setRecommendationText('');
                }}
                disabled={processingId === selectedRequest.id}
              >
                Cancel
              </Button>
              <Button
                onClick={handleFulfillRequest}
                disabled={!recommendationText.trim() || processingId === selectedRequest.id}
                className="gap-2"
              >
                {processingId === selectedRequest.id ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Recommendation
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
