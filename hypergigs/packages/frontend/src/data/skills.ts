// Pre-compiled list of digital skills
export const DIGITAL_SKILLS = [
  // Programming Languages
  'JavaScript', 'TypeScript', 'Python', 'Java', 'C#', 'C++', 'Ruby', 'PHP', 'Go', 'Rust', 'Swift', 'Kotlin', 'Scala',
  
  // Frontend
  'React', 'Vue.js', 'Angular', 'Next.js', 'Nuxt.js', 'Svelte', 'HTML5', 'CSS3', 'Sass', 'Tailwind CSS', 'Bootstrap',
  'Material-UI', 'Styled Components', 'Redux', 'MobX', 'Zustand', 'Webpack', 'Vite', 'jQuery',
  
  // Backend
  'Node.js', 'Express.js', 'Django', 'Flask', 'FastAPI', 'Spring Boot', 'Ruby on Rails', 'Laravel', 'ASP.NET',
  'Nest.js', 'GraphQL', 'REST API', 'gRPC', 'Microservices', 'Socket.io', 'WebSockets',
  
  // Database
  'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'SQLite', 'Oracle', 'SQL Server', 'Cassandra', 'DynamoDB',
  'Elasticsearch', 'Firebase', 'Supabase', 'Prisma', 'TypeORM', 'Sequelize', 'Mongoose',
  
  // Cloud & DevOps
  'AWS', 'Azure', 'Google Cloud', 'Docker', 'Kubernetes', 'CI/CD', 'Jenkins', 'GitHub Actions', 'GitLab CI',
  'Terraform', 'Ansible', 'Linux', 'Nginx', 'Apache', 'Vercel', 'Netlify', 'Railway', 'Heroku',
  
  // Mobile
  'React Native', 'Flutter', 'iOS Development', 'Android Development', 'Ionic', 'Xamarin',
  
  // Design
  'UI/UX Design', 'Figma', 'Adobe XD', 'Sketch', 'Photoshop', 'Illustrator', 'InDesign', 'After Effects',
  'Blender', 'Cinema 4D', 'Prototyping', 'Wireframing', 'User Research', 'Design Systems',
  
  // Data & AI
  'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch', 'Data Analysis', 'Data Science',
  'Pandas', 'NumPy', 'Scikit-learn', 'Natural Language Processing', 'Computer Vision', 'AI/ML',
  
  // Testing
  'Jest', 'Mocha', 'Cypress', 'Selenium', 'Puppeteer', 'Playwright', 'Unit Testing', 'Integration Testing',
  'E2E Testing', 'Test Automation', 'TDD', 'BDD',
  
  // Tools & Others
  'Git', 'GitHub', 'GitLab', 'Bitbucket', 'Jira', 'Confluence', 'Agile', 'Scrum', 'Kanban',
  'Product Management', 'Project Management', 'Technical Writing', 'SEO', 'Analytics',
  'Google Analytics', 'Mixpanel', 'Amplitude', 'A/B Testing', 'WordPress', 'Shopify', 'Webflow',
  
  // Blockchain & Web3
  'Blockchain', 'Ethereum', 'Solidity', 'Smart Contracts', 'Web3.js', 'Ethers.js', 'NFT', 'DeFi',
  
  // Marketing & Business
  'Digital Marketing', 'Content Marketing', 'Social Media Marketing', 'Email Marketing', 'Growth Hacking',
  'Conversion Optimization', 'SEM', 'PPC', 'Facebook Ads', 'Google Ads', 'LinkedIn Marketing',
  
  // Security
  'Cybersecurity', 'Penetration Testing', 'Security Auditing', 'OWASP', 'OAuth', 'JWT', 'Encryption',
  
  // Other Technical
  'WebAssembly', 'PWA', 'Service Workers', 'WebGL', 'Three.js', 'D3.js', 'Chart.js', 'Video Editing',
  'Audio Engineering', 'Game Development', 'Unity', 'Unreal Engine', 'AR/VR', '3D Modeling'
];

// Function to filter skills based on search query
export function searchSkills(query: string, limit: number = 10): string[] {
  // If query is empty, return all skills up to limit
  if (!query) {
    return DIGITAL_SKILLS.slice(0, limit);
  }
  
  // If query is too short, return empty
  if (query.length < 2) return [];
  
  const lowerQuery = query.toLowerCase();
  return DIGITAL_SKILLS
    .filter(skill => skill.toLowerCase().includes(lowerQuery))
    .slice(0, limit);
}
