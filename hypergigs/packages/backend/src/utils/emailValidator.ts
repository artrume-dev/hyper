import { prisma } from '../lib/prisma.js';

/**
 * List of free email providers that should be blocked for team invitations
 */
const FREE_EMAIL_PROVIDERS = [
  'gmail.com',
  'yahoo.com',
  'outlook.com',
  'hotmail.com',
  'live.com',
  'aol.com',
  'icloud.com',
  'protonmail.com',
  'mail.com',
  'zoho.com',
  'yandex.com',
];

/**
 * Validate if email is a company email (not a free provider)
 */
export function isCompanyEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase();

  if (!domain) {
    return false;
  }

  return !FREE_EMAIL_PROVIDERS.includes(domain);
}

/**
 * Validate if email matches the team owner's email domain
 * This ensures only users from the same company can be invited
 */
export async function validateCompanyEmail(
  email: string,
  teamId: string
): Promise<{
  valid: boolean;
  error?: string;
  ownerDomain?: string;
}> {
  // Get team owner's email
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      owner: {
        select: {
          email: true,
        },
      },
    },
  });

  if (!team) {
    return {
      valid: false,
      error: 'Team not found',
    };
  }

  const inviteeEmailDomain = email.split('@')[1]?.toLowerCase();
  const ownerEmailDomain = team.owner.email.split('@')[1]?.toLowerCase();

  if (!inviteeEmailDomain) {
    return {
      valid: false,
      error: 'Invalid email format',
    };
  }

  // Check if it's a free email provider
  if (FREE_EMAIL_PROVIDERS.includes(inviteeEmailDomain)) {
    return {
      valid: false,
      error: 'Please use your company email address, not a free email provider',
      ownerDomain: ownerEmailDomain,
    };
  }

  // Check if domain matches team owner's domain
  if (inviteeEmailDomain !== ownerEmailDomain) {
    return {
      valid: false,
      error: `Only @${ownerEmailDomain} email addresses can be invited to this team`,
      ownerDomain: ownerEmailDomain,
    };
  }

  return {
    valid: true,
    ownerDomain: ownerEmailDomain,
  };
}

/**
 * Extract domain from email
 */
export function extractEmailDomain(email: string): string | null {
  const domain = email.split('@')[1];
  return domain ? domain.toLowerCase() : null;
}

/**
 * Check if email format is valid
 */
export function isValidEmailFormat(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
