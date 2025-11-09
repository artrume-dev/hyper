import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, Users, Briefcase, Zap, Shield, Globe, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navigation from '@/components/Navigation';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden ">
        {/* Gradient Background */}
        <div className="absolute inset-0" />
        
        <div className="max-w-7xl mx-auto relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center px-4 py-2 rounded-full border border-primary/20 bg-primary/5 mb-8"
            >
              <Zap className="w-4 h-4 mr-2 text-primary" />
              <span className="text-sm font-medium">The Future of Team Collaboration</span>
            </motion.div>

            <h1 className="text-5xl md:text-7xl font-medium mb-6 leading-tight">
              Build exceptional teams, 
              <br />
              <span className="text-primary font-thin">
                create amazing work
              </span>
            </h1>

            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Connect with top-tier freelancers and agencies. Form dynamic teams. 
              Deliver outstanding projects together.
            </p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12"
            >
              <div className="relative w-full sm:w-auto">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  className="h-12 pr-32 w-full sm:w-80"
                />
                <Button className="absolute right-1 top-1 h-10">
                  Get Started
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex items-center justify-center gap-8 text-sm text-muted-foreground"
            >
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span>Secure & Verified</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4" />
                <span>Top Rated</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                <span>Global Network</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Featured Stats */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20"
          >
            {[
              { number: '10K+', label: 'Active Freelancers', icon: Users },
              { number: '2K+', label: 'Teams Formed', icon: Briefcase },
              { number: '50K+', label: 'Projects Completed', icon: Zap },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 + index * 0.1 }}
              >
                <Card className="border-border/40 bg-card/50 backdrop-blur">
                  <CardContent className="p-6 text-center">
                    <stat.icon className="w-8 h-8 mx-auto mb-3 text-primary" />
                    <div className="text-3xl font-bold mb-1">{stat.number}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              How Hypergigs Works
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Simple, powerful, and designed for collaboration
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Create Your Profile',
                description: 'Showcase your skills, experience, and what makes you unique. Build a compelling profile that stands out.',
              },
              {
                step: '02',
                title: 'Connect & Collaborate',
                description: 'Join teams, invite talent, or start your own project. Build your dream team with verified professionals.',
              },
              {
                step: '03',
                title: 'Deliver Excellence',
                description: 'Work together seamlessly with built-in tools. Track progress, communicate, and deliver outstanding results.',
              },
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
              >
                <Card className="h-full border-border/40 bg-card/50 backdrop-blur hover:border-primary/40 transition-colors">
                  <CardContent className="p-8">
                    <div className="text-5xl font-bold text-primary/20 mb-4">
                      {item.step}
                    </div>
                    <h3 className="text-2xl font-bold mb-3">{item.title}</h3>
                    <p className="text-muted-foreground">{item.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to build something amazing?
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join thousands of freelancers and teams already collaborating on Hypergigs
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/teams">
                <Button size="lg" className="w-full sm:w-auto">
                  Browse Teams
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
              <Link to="/freelancers">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  Find Freelancers
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>


    </div>
  );
}
