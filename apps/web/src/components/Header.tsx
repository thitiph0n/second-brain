import { Link } from '@tanstack/react-router';
import { ModeToggle } from './mode-toggle';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <nav className="flex items-center space-x-4 lg:space-x-6">
          <Link
            to="/"
            className="text-lg font-semibold transition-colors hover:text-foreground/80"
          >
            Second Brain
          </Link>
        </nav>
        <div className="flex items-center space-x-4">
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}
