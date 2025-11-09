import { useState, useEffect } from 'react';
import { invitationService } from '@/services/api/invitation.service';
import { portfolioContributorService } from '@/services/api/portfolioContributor.service';
import type { Invitation } from '@/types/invitation';
import type { PortfolioContributor } from '@/types/user';
import ContributorInvitationCard from '@/components/ContributorInvitationCard';

type TabType = 'received' | 'sent' | 'contributors';

export default function InvitationsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('received');
  const [receivedInvitations, setReceivedInvitations] = useState<Invitation[]>([]);
  const [sentInvitations, setSentInvitations] = useState<Invitation[]>([]);
  const [contributorInvitations, setContributorInvitations] = useState<PortfolioContributor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadInvitations();
  }, []);

  const loadInvitations = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [received, sent, contributors] = await Promise.all([
        invitationService.getReceivedInvitations(),
        invitationService.getSentInvitations(),
        portfolioContributorService.getUserInvitations(),
      ]);

      setReceivedInvitations(received);
      setSentInvitations(sent);
      setContributorInvitations(contributors);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load invitations');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = async (invitationId: string) => {
    try {
      await invitationService.acceptInvitation(invitationId);
      await loadInvitations();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to accept invitation');
    }
  };

  const handleDecline = async (invitationId: string) => {
    try {
      await invitationService.declineInvitation(invitationId);
      await loadInvitations();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to decline invitation');
    }
  };

  const handleCancel = async (invitationId: string) => {
    try {
      await invitationService.cancelInvitation(invitationId);
      await loadInvitations();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to cancel invitation');
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      ACCEPTED: 'bg-green-100 text-green-800',
      DECLINED: 'bg-red-100 text-red-800',
      CANCELLED: 'bg-gray-100 text-gray-800',
      EXPIRED: 'bg-gray-100 text-gray-800',
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${styles[status as keyof typeof styles]}`}>
        {status}
      </span>
    );
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-lg">Loading invitations...</div>
      </div>
    );
  }

  const invitations = activeTab === 'received'
    ? receivedInvitations
    : activeTab === 'sent'
    ? sentInvitations
    : [];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Invitations</h1>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('received')}
                className={`${
                  activeTab === 'received'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Team Invites ({receivedInvitations.length})
              </button>
              <button
                onClick={() => setActiveTab('sent')}
                className={`${
                  activeTab === 'sent'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Sent ({sentInvitations.length})
              </button>
              <button
                onClick={() => setActiveTab('contributors')}
                className={`${
                  activeTab === 'contributors'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Contributors ({contributorInvitations.length})
              </button>
            </nav>
          </div>
        </div>

      {/* Invitations List */}
      {activeTab === 'contributors' ? (
        contributorInvitations.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-lg border shadow">
            <p className="text-muted-foreground">No contributor invitations</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {contributorInvitations.map((invitation) => (
              <ContributorInvitationCard
                key={invitation.id}
                invitation={invitation}
                onStatusUpdate={() => loadInvitations()}
              />
            ))}
          </div>
        )
      ) : invitations.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-lg border shadow">
          <p className="text-muted-foreground">
            {activeTab === 'received'
              ? 'No team invitations received yet'
              : 'No team invitations sent yet'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {invitations.map((invitation) => (
            <div
              key={invitation.id}
              className="bg-card rounded-lg border shadow p-6"
            >
                <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="text-lg font-semibold">
                    {invitation.team?.name}
                  </h3>
                      {getStatusBadge(invitation.status)}
                      <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                        {invitation.role}
                      </span>
                    </div>

                    {activeTab === 'received' && invitation.sender && (
                      <p className="text-sm text-gray-600 mb-2">
                        From: <span className="font-medium">{invitation.sender.firstName} {invitation.sender.lastName}</span>
                        {' '}(@{invitation.sender.username})
                      </p>
                    )}

                    {activeTab === 'sent' && invitation.receiver && (
                      <p className="text-sm text-gray-600 mb-2">
                        To: <span className="font-medium">{invitation.receiver.firstName} {invitation.receiver.lastName}</span>
                        {' '}(@{invitation.receiver.username})
                      </p>
                    )}

                    {invitation.message && (
                      <p className="text-sm text-gray-700 mb-3 italic">
                        "{invitation.message}"
                      </p>
                    )}

                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>Created: {new Date(invitation.createdAt).toLocaleDateString()}</span>
                      <span>Expires: {new Date(invitation.expiresAt).toLocaleDateString()}</span>
                      {isExpired(invitation.expiresAt) && (
                        <span className="text-red-600 font-medium">⚠️ Expired</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="ml-4 flex space-x-2">
                    {activeTab === 'received' && invitation.status === 'PENDING' && !isExpired(invitation.expiresAt) && (
                      <>
                        <button
                          onClick={() => handleAccept(invitation.id)}
                          className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleDecline(invitation.id)}
                          className="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
                        >
                          Decline
                        </button>
                      </>
                    )}

                    {activeTab === 'sent' && invitation.status === 'PENDING' && !isExpired(invitation.expiresAt) && (
                      <button
                        onClick={() => handleCancel(invitation.id)}
                        className="px-3 py-1 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700"
                      >
                        Cancel
                      </button>
                    )}
              </div>
            </div>
          </div>
          ))}
        </div>
      )}
    </div>
  );
}
