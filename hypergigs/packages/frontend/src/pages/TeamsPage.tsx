import { motion } from 'framer-motion';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, MapPin, Briefcase, Search, SlidersHorizontal } from 'lucide-react';
import Navigation from '@/components/Navigation';
import { useState } from 'react';

// Mock data - will be replaced with real API data
const mockTeams = [
  {
    id: 1,
    name: 'Digital Nomads',
    category: 'Design & Development',
    location: 'Remote',
    members: 12,
    description: 'Award-winning digital product studio specializing in UI/UX and full-stack development.',
    avatar: 'DN',
  },
  {
    id: 2,
    name: 'Creative Collective',
    category: 'Creative Agency',
    location: 'New York, US',
    members: 25,
    description: 'Full-service creative agency delivering exceptional brand experiences.',
    avatar: 'CC',
  },
  {
    id: 3,
    name: 'Tech Innovators',
    category: 'Software Development',
    location: 'San Francisco, US',
    members: 18,
    description: 'Building cutting-edge SaaS products and web applications.',
    avatar: 'TI',
  },
  {
    id: 4,
    name: 'Brand Studio',
    category: 'Branding & Marketing',
    location: 'London, UK',
    members: 15,
    description: 'Strategic brand development and marketing campaigns that convert.',
    avatar: 'BS',
  },
  {
    id: 5,
    name: 'Data Wizards',
    category: 'Data Science',
    location: 'Remote',
    members: 8,
    description: 'Data analytics and machine learning solutions for modern businesses.',
    avatar: 'DW',
  },
  {
    id: 6,
    name: 'Mobile First',
    category: 'Mobile Development',
    location: 'Berlin, DE',
    members: 20,
    description: 'iOS and Android app development with focus on user experience.',
    avatar: 'MF',
  },
];

export default function TeamsPage() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <h1 className="text-5xl md:text-6xl font-bold mb-4">
              Discover Top Teams
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl">
              Browse through curated agencies and project teams ready to bring your ideas to life.
            </p>
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-12"
          >
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search teams by name, skill, or location..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="outline" className="md:w-auto">
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                Filters
              </Button>
            </div>
          </motion.div>

          {/* Teams Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockTeams.map((team, index) => (
              <motion.div
                key={team.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <Card className="h-full border-border/40 bg-card/50 backdrop-blur">
                  <CardHeader>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center text-foreground text-lg font-bold border border-border">
                        {team.avatar}
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg">
                          {team.name}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">{team.category}</p>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {team.description}
                    </p>
                    
                    <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>{team.location}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{team.members} members</span>
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter>
                    <Button className="w-full">
                      View Team
                      <Briefcase className="ml-2 w-4 h-4" />
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Load More */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-12 text-center"
          >
            <Button size="lg" variant="outline">
              Load More Teams
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
