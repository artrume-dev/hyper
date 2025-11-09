import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-foreground mb-6">
          Welcome to Hypergigs
        </h1>
        <p className="text-muted-foreground mb-8">
          A modern freelance platform for digital teams
        </p>
        
        <div className="flex gap-4">
          <Button>Get Started</Button>
          <Button variant="outline">Learn More</Button>
          <Button variant="ghost">Contact</Button>
        </div>
      </div>
    </div>
  );
}
