import type { User } from './auth';
import type { Team, TeamRole } from './team';

export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED' | 'EXPIRED';

export interface Invitation {
  id: string;
  status: InvitationStatus;
  role: TeamRole;
  message?: string;
  expiresAt: string;
  senderId: string;
  receiverId: string;
  teamId: string;
  createdAt: string;
  updatedAt: string;
  sender?: User;
  receiver?: User;
  team?: Team;
}

export interface SendInvitationRequest {
  receiverId: string;
  teamId: string;
  role: TeamRole;
  message?: string;
}

export interface InvitationResponse {
  invitation: Invitation;
  teamMembership?: {
    id: string;
    userId: string;
    teamId: string;
    role: TeamRole;
    joinedAt: string;
  };
}
