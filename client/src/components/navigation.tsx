import { useState } from "react";
import { Book, Menu, X } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMenuOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border" data-testid="navigation">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-2" data-testid="logo">
            <Book className="text-primary text-2xl" />
            <span className="text-xl font-bold">MyBookStore</span>
          </div>
          
          <div className="hidden md:flex items-center space-x-8">
            <button 
              onClick={() => scrollToSection('features')} 
              className="text-muted-foreground hover:text-foreground transition-colors"
              data-testid="nav-features"
            >
              Features
            </button>
            <button 
              onClick={() => scrollToSection('pricing')} 
              className="text-muted-foreground hover:text-foreground transition-colors"
              data-testid="nav-pricing"
            >
              Pricing
            </button>
            <button 
              onClick={() => scrollToSection('testimonials')} 
              className="text-muted-foreground hover:text-foreground transition-colors"
              data-testid="nav-testimonials"
            >
              Reviews
            </button>
            <button 
              onClick={() => scrollToSection('faq')} 
              className="text-muted-foreground hover:text-foreground transition-colors"
              data-testid="nav-faq"
            >
              FAQ
            </button>
          </div>
          
          <div className="hidden md:flex items-center space-x-4">
            <Button variant="ghost" data-testid="button-signin">Sign In</Button>
            <Link href="/create-book">
              <Button data-testid="button-start-creating">Start Creating</Button>
            </Link>
          </div>

          <button 
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            data-testid="button-menu-toggle"
          >
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border" data-testid="mobile-menu">
            <div className="flex flex-col space-y-4">
              <button onClick={() => scrollToSection('features')} className="text-left text-muted-foreground hover:text-foreground transition-colors">Features</button>
              <button onClick={() => scrollToSection('pricing')} className="text-left text-muted-foreground hover:text-foreground transition-colors">Pricing</button>
              <button onClick={() => scrollToSection('testimonials')} className="text-left text-muted-foreground hover:text-foreground transition-colors">Reviews</button>
              <button onClick={() => scrollToSection('faq')} className="text-left text-muted-foreground hover:text-foreground transition-colors">FAQ</button>
              <div className="flex flex-col space-y-2 pt-4">
                <Button variant="ghost" className="justify-start">Sign In</Button>
                <Link href="/create-book" className="w-full">
                  <Button className="justify-start w-full">Start Creating</Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
