import api from '@/lib/axios';
import type {
  Invitation,
  SendInvitationRequest,
  InvitationResponse,
} from '@/types/invitation';

export const invitationService = {
  /**
   * Send an invitation
   */
  async sendInvitation(data: SendInvitationRequest): Promise<Invitation> {
    const response = await api.post<{ invitation: Invitation }>('/api/invitations', data);
    return response.data.invitation;
  },

  /**
   * Get received invitations
   */
  async getReceivedInvitations(status?: string): Promise<Invitation[]> {
    const response = await api.get<{ invitations: Invitation[] }>(
      '/api/invitations/received',
      { params: { status } }
    );
    return response.data.invitations;
  },

  /**
   * Get sent invitations
   */
  async getSentInvitations(status?: string): Promise<Invitation[]> {
    const response = await api.get<{ invitations: Invitation[] }>(
      '/api/invitations/sent',
      { params: { status } }
    );
    return response.data.invitations;
  },

  /**
   * Get invitation by ID
   */
  async getInvitation(invitationId: string): Promise<Invitation> {
    const response = await api.get<{ invitation: Invitation }>(
      `/api/invitations/${invitationId}`
    );
    return response.data.invitation;
  },

  /**
   * Accept invitation
   */
  async acceptInvitation(invitationId: string): Promise<InvitationResponse> {
    const response = await api.put<InvitationResponse>(
      `/api/invitations/${invitationId}/accept`
    );
    return response.data;
  },

  /**
   * Decline invitation
   */
  async declineInvitation(invitationId: string): Promise<Invitation> {
    const response = await api.put<{ invitation: Invitation }>(
      `/api/invitations/${invitationId}/decline`
    );
    return response.data.invitation;
  },

  /**
   * Cancel invitation (sender only)
   */
  async cancelInvitation(invitationId: string): Promise<void> {
    await api.delete(`/api/invitations/${invitationId}`);
  },

  /**
   * Get team invitations (owner/admin only)
   */
  async getTeamInvitations(teamId: string, status?: string): Promise<Invitation[]> {
    const response = await api.get<{ invitations: Invitation[] }>(
      `/api/invitations/teams/${teamId}`,
      { params: { status } }
    );
    return response.data.invitations;
  },
};
