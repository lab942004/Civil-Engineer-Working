import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { FileQuestion } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--background))]">
      <div className="text-center space-y-4">
        <FileQuestion className="mx-auto h-16 w-16 text-[hsl(var(--muted-foreground))]" />
        <h1 className="text-4xl font-bold">404</h1>
        <p className="text-[hsl(var(--muted-foreground))]">Page not found</p>
        <Link to="/dashboard">
          <Button>Go to Dashboard</Button>
        </Link>
      </div>
    </div>
  );
}