import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { Wand2, Play, ArrowRight } from "lucide-react";

export default function HeroSection() {
  const scrollToMyBookStoreMatic = () => {
    const element = document.getElementById('mybookstore-o-matic');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8" data-testid="hero-section">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-6 bg-primary/10 text-primary border-primary/20" data-testid="badge-ai-powered">
            <Wand2 className="w-4 h-4 mr-2" />
            AI-Powered E-book Creation
          </Badge>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6" data-testid="heading-main">
            Create, Publish & Sell<br />
            <span className="bg-gradient-to-r from-primary to-pink-500 bg-clip-text text-transparent">
              Captivating E-books
            </span><br />
            in Minutes, Not Months
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8" data-testid="text-description">
            Transform your knowledge into professional e-books instantly. AI-powered creation for entrepreneurs, coaches, and creators. No writing experience required.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/create-book">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-primary to-pink-500 text-white hover:opacity-90 transition-opacity shadow-lg"
                data-testid="button-start-creating"
              >
                Start Creating Now
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Button variant="ghost" size="lg" data-testid="button-watch-demo">
              <Play className="mr-2 w-5 h-5" />
              Watch Demo
            </Button>
          </div>
        </div>

        {/* Book Mockups */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16" data-testid="book-mockups">
          <div className="floating" style={{ animationDelay: '0s' }}>
            <img 
              src="https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=800" 
              alt="Professional business strategy e-book cover" 
              className="rounded-xl shadow-2xl w-full h-auto transform hover:scale-105 transition-transform duration-300"
              data-testid="img-book-mockup-1"
            />
          </div>
          <div className="floating" style={{ animationDelay: '1s' }}>
            <img 
              src="https://images.unsplash.com/photo-1481627834876-b7833e8f5570?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=800" 
              alt="Vibrant self-help book cover with inspiring design" 
              className="rounded-xl shadow-2xl w-full h-auto transform hover:scale-105 transition-transform duration-300"
              data-testid="img-book-mockup-2"
            />
          </div>
          <div className="floating" style={{ animationDelay: '2s' }}>
            <img 
              src="https://images.unsplash.com/photo-1532012197267-da84d127e765?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=800" 
              alt="Modern technology book cover with AI and digital theme" 
              className="rounded-xl shadow-2xl w-full h-auto transform hover:scale-105 transition-transform duration-300"
              data-testid="img-book-mockup-3"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center" data-testid="stats-section">
          <div data-testid="stat-authors">
            <div className="text-3xl font-bold text-primary mb-2">500+</div>
            <div className="text-muted-foreground">Authors</div>
          </div>
          <div data-testid="stat-books">
            <div className="text-3xl font-bold text-primary mb-2">1000+</div>
            <div className="text-muted-foreground">Books Created</div>
          </div>
          <div data-testid="stat-rating">
            <div className="text-3xl font-bold text-primary mb-2">4.9/5</div>
            <div className="text-muted-foreground">Rating</div>
          </div>
        </div>
      </div>
    </section>
  );
}
