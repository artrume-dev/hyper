import { Link } from 'react-router-dom';
import { Github, Twitter, Linkedin, Mail } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-background mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* About Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">HyperGigs</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Connect with talented freelancers and build amazing teams. Find the perfect match for your next project.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold uppercase tracking-wider">Platform</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/freelancers" className="text-muted-foreground hover:text-foreground transition-colors">
                  Find Freelancers
                </Link>
              </li>
              <li>
                <Link to="/teams" className="text-muted-foreground hover:text-foreground transition-colors">
                  Browse Teams
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/profile" className="text-muted-foreground hover:text-foreground transition-colors">
                  My Profile
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold uppercase tracking-wider">Company</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#about" className="text-muted-foreground hover:text-foreground transition-colors">
                  About Us
                </a>
              </li>
              <li>
                <a href="#contact" className="text-muted-foreground hover:text-foreground transition-colors">
                  Contact
                </a>
              </li>
              <li>
                <a href="#privacy" className="text-muted-foreground hover:text-foreground transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#terms" className="text-muted-foreground hover:text-foreground transition-colors">
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>

          {/* Social & Contact */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold uppercase tracking-wider">Connect</h4>
            <div className="flex gap-4">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg bg-muted hover:bg-primary hover:text-primary-foreground transition-colors flex items-center justify-center"
                aria-label="GitHub"
              >
                <Github className="w-5 h-5" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg bg-muted hover:bg-primary hover:text-primary-foreground transition-colors flex items-center justify-center"
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg bg-muted hover:bg-primary hover:text-primary-foreground transition-colors flex items-center justify-center"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-5 h-5" />
              </a>
              <a
                href="mailto:hello@hypergigs.com"
                className="w-10 h-10 rounded-lg bg-muted hover:bg-primary hover:text-primary-foreground transition-colors flex items-center justify-center"
                aria-label="Email"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
            <p className="text-sm text-muted-foreground">
              <a href="mailto:hello@hypergigs.com" className="hover:text-foreground transition-colors">
                hello@hypergigs.com
              </a>
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-border">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <p>© {currentYear} HyperGigs. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#privacy" className="hover:text-foreground transition-colors">
                Privacy
              </a>
              <a href="#terms" className="hover:text-foreground transition-colors">
                Terms
              </a>
              <a href="#cookies" className="hover:text-foreground transition-colors">
                Cookies
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
