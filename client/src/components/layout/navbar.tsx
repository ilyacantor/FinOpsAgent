import { Link } from "wouter";
import logoImage from "@assets/image_1760627197455.png";

export function Navbar() {
  return (
    <nav className="bg-[hsl(220,25%,8%)] border-b border-cyan-500/20 px-6 py-3">
      <div className="flex items-center">
        <Link href="/" className="flex items-center hover:opacity-80 transition-opacity" data-testid="navbar-logo-link">
          <img 
            src={logoImage} 
            alt="autonomOS" 
            className="h-8"
          />
        </Link>
      </div>
    </nav>
  );
}
