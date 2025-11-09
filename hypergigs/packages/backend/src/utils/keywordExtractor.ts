/**
 * Keyword extraction utility for smart member suggestions
 * Extracts relevant keywords from team information to match against user profiles
 */

// Common words to exclude from keyword extraction
const STOP_WORDS = new Set([
  'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
  'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
  'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
  'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what',
  'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me',
  'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know', 'take',
  'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see', 'other',
]);

// Keywords associated with different team types
const TEAM_TYPE_KEYWORDS: Record<string, string[]> = {
  ENGINEERING: ['developer', 'engineer', 'software', 'code', 'programming', 'technical', 'backend', 'frontend', 'fullstack', 'devops', 'architect'],
  MARKETING: ['marketing', 'digital', 'content', 'social media', 'seo', 'campaigns', 'brand', 'growth', 'advertising', 'analytics'],
  DESIGN: ['designer', 'ui', 'ux', 'creative', 'visual', 'graphics', 'figma', 'photoshop', 'branding', 'illustration'],
  HR: ['hr', 'human resources', 'recruitment', 'hiring', 'talent', 'people', 'culture', 'recruiting', 'onboarding'],
  SALES: ['sales', 'business development', 'account', 'client', 'revenue', 'deals', 'b2b', 'b2c', 'crm', 'pipeline'],
  PRODUCT: ['product', 'roadmap', 'strategy', 'features', 'requirements', 'user stories', 'agile', 'scrum'],
  OPERATIONS: ['operations', 'process', 'efficiency', 'logistics', 'supply chain', 'coordination', 'management'],
  FINANCE: ['finance', 'accounting', 'financial', 'budget', 'accounting', 'controller', 'cfo', 'bookkeeping'],
  LEGAL: ['legal', 'attorney', 'lawyer', 'compliance', 'contracts', 'regulations', 'intellectual property'],
  SUPPORT: ['support', 'customer service', 'help desk', 'technical support', 'customer success', 'troubleshooting'],
};

/**
 * Extract keywords from text
 */
export function extractKeywordsFromText(text: string): string[] {
  if (!text) return [];

  // Convert to lowercase and remove special characters
  const cleaned = text.toLowerCase().replace(/[^\w\s]/g, ' ');

  // Split into words
  const words = cleaned.split(/\s+/).filter(word => word.length > 2);

  // Remove stop words and duplicates
  const keywords = [...new Set(words.filter(word => !STOP_WORDS.has(word)))];

  return keywords;
}

/**
 * Extract keywords from team information
 */
export function extractTeamKeywords(team: {
  description?: string;
  name?: string;
  type: string;
  subTeamCategory?: string;
}): string[] {
  const keywords: Set<string> = new Set();

  // Add keywords from team name
  if (team.name) {
    const nameKeywords = extractKeywordsFromText(team.name);
    nameKeywords.forEach(kw => keywords.add(kw));
  }

  // Add keywords from team description
  if (team.description) {
    const descKeywords = extractKeywordsFromText(team.description);
    descKeywords.forEach(kw => keywords.add(kw));
  }

  // Add type-specific keywords
  if (team.type && team.type in TEAM_TYPE_KEYWORDS) {
    const typeKeywords = TEAM_TYPE_KEYWORDS[team.type as keyof typeof TEAM_TYPE_KEYWORDS];
    typeKeywords.forEach(kw => keywords.add(kw.toLowerCase()));
  }

  // Add keywords based on sub-team category
  if (team.subTeamCategory) {
    const categoryKeywords = TEAM_TYPE_KEYWORDS[team.subTeamCategory] || [];
    categoryKeywords.forEach(kw => keywords.add(kw.toLowerCase()));
  }

  return Array.from(keywords);
}

/**
 * Calculate match score between team keywords and user profile
 */
export function calculateMatchScore(
  teamKeywords: string[],
  user: {
    bio?: string;
    jobTitle?: string;
    skills?: Array<{ skill: { name: string } }>;
    workExperiences?: Array<{ role: string; description?: string }>;
    location?: string;
    country?: string;
  },
  teamLocation?: { city?: string; country?: string }
): number {
  let score = 0;
  const matches: string[] = [];

  // Score for skill matches (+10 points each)
  if (user.skills) {
    user.skills.forEach(userSkill => {
      const skillName = userSkill.skill.name.toLowerCase();
      if (teamKeywords.some(kw => skillName.includes(kw) || kw.includes(skillName))) {
        score += 10;
        matches.push(`skill: ${userSkill.skill.name}`);
      }
    });
  }

  // Score for job title match (+5 points)
  if (user.jobTitle) {
    const jobTitleLower = user.jobTitle.toLowerCase();
    if (teamKeywords.some(kw => jobTitleLower.includes(kw) || kw.includes(jobTitleLower))) {
      score += 5;
      matches.push(`jobTitle: ${user.jobTitle}`);
    }
  }

  // Score for bio match (+5 points)
  if (user.bio) {
    const bioLower = user.bio.toLowerCase();
    const matchingKeywords = teamKeywords.filter(kw => bioLower.includes(kw));
    if (matchingKeywords.length > 0) {
      score += 5;
      matches.push(`bio: ${matchingKeywords.slice(0, 3).join(', ')}`);
    }
  }

  // Score for work experience match (+8 points)
  if (user.workExperiences && user.workExperiences.length > 0) {
    user.workExperiences.forEach(exp => {
      const roleLower = exp.role.toLowerCase();
      const descLower = exp.description?.toLowerCase() || '';

      if (teamKeywords.some(kw => roleLower.includes(kw) || kw.includes(roleLower))) {
        score += 8;
        matches.push(`experience: ${exp.role}`);
      } else if (teamKeywords.some(kw => descLower.includes(kw))) {
        score += 4;
      }
    });
  }

  // Score for location match (+3 points)
  if (teamLocation?.city && user.location) {
    const userLocationLower = user.location.toLowerCase();
    const teamCityLower = teamLocation.city.toLowerCase();

    if (userLocationLower.includes(teamCityLower) || teamCityLower.includes(userLocationLower)) {
      score += 3;
      matches.push('location: same city');
    }
  }

  return score;
}

/**
 * Generate match reason text for UI display
 */
export function generateMatchReason(
  teamKeywords: string[],
  user: {
    bio?: string;
    jobTitle?: string;
    skills?: Array<{ skill: { name: string } }>;
    workExperiences?: Array<{ role: string }>;
  }
): string {
  const reasons: string[] = [];

  // Check skill matches
  if (user.skills) {
    const matchingSkills = user.skills.filter(userSkill =>
      teamKeywords.some(kw =>
        userSkill.skill.name.toLowerCase().includes(kw) ||
        kw.includes(userSkill.skill.name.toLowerCase())
      )
    );

    if (matchingSkills.length > 0) {
      const skillNames = matchingSkills.slice(0, 3).map(s => s.skill.name);
      reasons.push(`Skills: ${skillNames.join(', ')}`);
    }
  }

  // Check job title match
  if (user.jobTitle) {
    const jobTitleLower = user.jobTitle.toLowerCase();
    if (teamKeywords.some(kw => jobTitleLower.includes(kw) || kw.includes(jobTitleLower))) {
      reasons.push(`Role: ${user.jobTitle}`);
    }
  }

  // Check experience match
  if (user.workExperiences && user.workExperiences.length > 0) {
    const matchingExp = user.workExperiences.find(exp =>
      teamKeywords.some(kw =>
        exp.role.toLowerCase().includes(kw) ||
        kw.includes(exp.role.toLowerCase())
      )
    );

    if (matchingExp && !reasons.some(r => r.includes(matchingExp.role))) {
      reasons.push(`Experience: ${matchingExp.role}`);
    }
  }

  return reasons.length > 0 ? reasons.join(' • ') : 'Profile match';
}
