import Navigation from "@/components/navigation";
import HeroSection from "@/components/hero-section";
import BooksterOMatic from "@/components/bookster-o-matic";
import HowItWorks from "@/components/how-it-works";
import TemplateGallery from "@/components/template-gallery";
import PricingSection from "@/components/pricing-section";
import Testimonials from "@/components/testimonials";
import FAQSection from "@/components/faq-section";
import Footer from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowRight, Play, Shield } from "lucide-react";

function CTASection() {
  return (
    <section className="py-20 bg-gradient-to-r from-primary to-pink-500" data-testid="cta-section">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4" data-testid="heading-cta">
          Ready to Create Your First E-book?
        </h2>
        <p className="text-xl text-white/90 mb-8" data-testid="text-cta-description">
          Join thousands of authors who've transformed their knowledge into professional e-books
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/create-book">
            <Button 
              size="lg" 
              className="bg-white text-primary hover:bg-gray-100 transition-colors shadow-lg"
              data-testid="button-cta-start"
            >
              Start Creating Now
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
          <Button variant="ghost" size="lg" className="text-white hover:text-white/80" data-testid="button-cta-demo">
            <Play className="mr-2 w-5 h-5" />
            Watch Demo
          </Button>
        </div>
        <p className="text-white/80 text-sm mt-6" data-testid="text-cta-guarantee">
          <Shield className="inline mr-2 w-4 h-4" />
          14-day money-back guarantee • No contracts • Cancel anytime
        </p>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-background" data-testid="home-page">
      <Navigation />
      <HeroSection />
      <BooksterOMatic />
      <HowItWorks />
      <TemplateGallery />
      <PricingSection />
      <Testimonials />
      <FAQSection />
      <CTASection />
      <Footer />
    </div>
  );
}
