import { Request, Response } from 'express';
import { logger } from '../utils/logger.js';

/**
 * Generate skills from bio using AI
 * For now using a smart algorithm, can be replaced with OpenAI API
 */
export const generateSkills = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ 
        success: false,
        message: 'Not authenticated' 
      });
      return;
    }

    const { bio, existingSkills } = req.body;

    if (!bio || bio.trim().length < 20) {
      res.status(400).json({ 
        success: false,
        message: 'Bio must be at least 20 characters to generate skills' 
      });
      return;
    }

    // Smart skill extraction algorithm
    const suggestedSkills = await extractSkillsFromBio(bio, existingSkills || []);

    res.status(200).json({ 
      success: true,
      data: { suggestedSkills } 
    });
  } catch (error) {
    logger.error('Generate skills error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to generate skills' 
    });
  }
};

/**
 * Smart skill extraction from bio
 * This can be replaced with OpenAI API call for production
 */
async function extractSkillsFromBio(bio: string, existingSkills: string[]): Promise<string[]> {
  const bioLower = bio.toLowerCase();
  const existingLower = existingSkills.map(s => s.toLowerCase());
  
  // Comprehensive skill mapping based on context and keywords
  const skillMappings: { keywords: string[], skills: string[] }[] = [
    // Frontend Development
    {
      keywords: ['react', 'frontend', 'front-end', 'ui', 'user interface', 'component'],
      skills: ['React', 'JavaScript', 'TypeScript', 'HTML5', 'CSS3', 'Responsive Design']
    },
    {
      keywords: ['vue', 'vuejs'],
      skills: ['Vue.js', 'JavaScript', 'TypeScript', 'HTML5', 'CSS3']
    },
    {
      keywords: ['angular'],
      skills: ['Angular', 'TypeScript', 'HTML5', 'CSS3', 'RxJS']
    },
    {
      keywords: ['next', 'nextjs', 'next.js'],
      skills: ['Next.js', 'React', 'TypeScript', 'JavaScript', 'SSR']
    },
    
    // Design
    {
      keywords: ['design system', 'component library', 'design token'],
      skills: ['Design Systems', 'UI/UX Design', 'Figma', 'Component Architecture']
    },
    {
      keywords: ['figma'],
      skills: ['Figma', 'UI/UX Design', 'Prototyping', 'Design Systems']
    },
    {
      keywords: ['sketch'],
      skills: ['Sketch', 'UI/UX Design', 'Prototyping']
    },
    {
      keywords: ['adobe xd', 'xd'],
      skills: ['Adobe XD', 'UI/UX Design', 'Prototyping']
    },
    {
      keywords: ['photoshop'],
      skills: ['Photoshop', 'Graphic Design', 'Image Editing']
    },
    {
      keywords: ['ux', 'user experience', 'usability'],
      skills: ['UI/UX Design', 'User Research', 'Wireframing', 'Prototyping']
    },
    {
      keywords: ['ui designer', 'interface design'],
      skills: ['UI/UX Design', 'Visual Design', 'Typography', 'Color Theory']
    },
    
    // Backend
    {
      keywords: ['node', 'nodejs', 'node.js', 'express'],
      skills: ['Node.js', 'Express.js', 'JavaScript', 'TypeScript', 'REST API']
    },
    {
      keywords: ['python', 'django', 'flask'],
      skills: ['Python', 'Django', 'Flask', 'REST API']
    },
    {
      keywords: ['graphql'],
      skills: ['GraphQL', 'API Design', 'TypeScript']
    },
    
    // Database
    {
      keywords: ['database', 'sql', 'mysql', 'postgres'],
      skills: ['PostgreSQL', 'MySQL', 'Database Design', 'SQL']
    },
    {
      keywords: ['mongodb', 'nosql'],
      skills: ['MongoDB', 'NoSQL', 'Database Design']
    },
    
    // DevOps & Cloud
    {
      keywords: ['aws', 'amazon web services', 'cloud'],
      skills: ['AWS', 'Cloud Architecture', 'DevOps']
    },
    {
      keywords: ['docker', 'container'],
      skills: ['Docker', 'DevOps', 'CI/CD']
    },
    {
      keywords: ['kubernetes', 'k8s'],
      skills: ['Kubernetes', 'Docker', 'DevOps', 'Cloud Architecture']
    },
    
    // Mobile
    {
      keywords: ['mobile', 'ios', 'android', 'app development'],
      skills: ['Mobile Development', 'React Native', 'iOS Development', 'Android Development']
    },
    {
      keywords: ['react native', 'react-native'],
      skills: ['React Native', 'Mobile Development', 'JavaScript', 'TypeScript']
    },
    
    // Role-based skills
    {
      keywords: ['full-stack', 'fullstack', 'full stack'],
      skills: ['Full-Stack Development', 'React', 'Node.js', 'Database Design', 'REST API']
    },
    {
      keywords: ['lead', 'leadership', 'team lead', 'manage'],
      skills: ['Team Leadership', 'Project Management', 'Mentoring', 'Agile']
    },
    {
      keywords: ['agile', 'scrum', 'sprint'],
      skills: ['Agile', 'Scrum', 'Project Management']
    },
    
    // Soft skills
    {
      keywords: ['architect', 'architecture', 'scalable', 'system design'],
      skills: ['System Architecture', 'Scalability', 'Technical Leadership', 'Code Review']
    },
    {
      keywords: ['mentor', 'coaching', 'teaching'],
      skills: ['Mentoring', 'Technical Writing', 'Knowledge Sharing']
    }
  ];

  const suggestedSkills = new Set<string>();

  // Find matching skills based on bio context
  skillMappings.forEach(mapping => {
    const hasKeyword = mapping.keywords.some(keyword => bioLower.includes(keyword));
    if (hasKeyword) {
      mapping.skills.forEach(skill => {
        // Only add if not already in existing skills
        if (!existingLower.includes(skill.toLowerCase())) {
          suggestedSkills.add(skill);
        }
      });
    }
  });

  // Convert to array and limit to 8 most relevant
  return Array.from(suggestedSkills).slice(0, 8);
}
