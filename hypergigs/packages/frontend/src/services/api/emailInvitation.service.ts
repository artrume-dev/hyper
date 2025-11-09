import api from '@/lib/axios';

export interface EmailInvitation {
  id: string;
  email: string;
  teamId: string;
  role: string;
  message?: string;
  invitedBy: string;
  token: string;
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'CANCELLED';
  expiresAt: string;
  createdAt: string;
  team: {
    id: string;
    name: string;
    slug: string;
    avatar?: string;
    description?: string;
    type: string;
  };
  inviter: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
}

export interface SendEmailInvitationData {
  email: string;
  role: 'ADMIN' | 'MEMBER';
  message?: string;
}

export interface InviteMemberData {
  identifier: string; // Email or username
  role?: 'ADMIN' | 'MEMBER';
  message?: string;
}

export interface InviteMemberResponse {
  type: 'direct' | 'email_invitation' | 'internal_invitation';
  message: string;
  member?: any;
  invitation?: {
    id: string;
    email?: string;
    role: string;
    status: string;
    expiresAt: string;
  };
}

export interface SuggestedMember {
  user: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    bio?: string;
    jobTitle?: string;
    location?: string;
    available: boolean;
  };
  score: number;
  matchReason: string;
}

class EmailInvitationService {
  /**
   * Validate invitation token
   */
  async validateInvitationToken(token: string): Promise<{ invitation: EmailInvitation }> {
    const response = await api.get(`/api/email-invitations/validate/${token}`);
    return response.data;
  }

  /**
   * Accept invitation (after user logs in)
   */
  async acceptInvitation(token: string): Promise<{ message: string; team: any }> {
    const response = await api.post(`/api/email-invitations/accept/${token}`);
    return response.data;
  }

  /**
   * Send email invitation
   */
  async sendEmailInvitation(
    teamId: string,
    data: SendEmailInvitationData
  ): Promise<{ message: string; invitation: EmailInvitation }> {
    const response = await api.post(`/api/email-invitations/teams/${teamId}`, data);
    return response.data;
  }

  /**
   * Cancel invitation
   */
  async cancelInvitation(invitationId: string): Promise<{ message: string }> {
    const response = await api.delete(`/api/email-invitations/${invitationId}`);
    return response.data;
  }

  /**
   * Get all pending invitations for a team
   */
  async getTeamInvitations(teamId: string): Promise<{ invitations: EmailInvitation[] }> {
    const response = await api.get(`/api/email-invitations/teams/${teamId}`);
    return response.data;
  }

  /**
   * Check if email has pending invitation
   */
  async checkExistingInvitation(teamId: string, email: string): Promise<{ exists: boolean }> {
    const response = await api.get(`/api/email-invitations/teams/${teamId}/check`, {
      params: { email },
    });
    return response.data;
  }

  /**
   * Invite member with auto-detection (email or username)
   */
  async inviteMember(teamId: string, data: InviteMemberData): Promise<InviteMemberResponse> {
    const response = await api.post(`/api/teams/${teamId}/invite`, data);
    return response.data;
  }

  /**
   * Get suggested members for a team
   */
  async getSuggestedMembers(teamId: string, limit = 10): Promise<{ suggestions: SuggestedMember[] }> {
    const response = await api.get(`/api/teams/${teamId}/suggested-members`, {
      params: { limit },
    });
    return response.data;
  }
}

export const emailInvitationService = new EmailInvitationService();
