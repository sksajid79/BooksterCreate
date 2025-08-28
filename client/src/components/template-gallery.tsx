import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function TemplateGallery() {
  const templates = [
    {
      src: "https://images.unsplash.com/photo-1589998059171-988d887df646?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=400",
      alt: "Modern business e-book cover template with professional design"
    },
    {
      src: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=400",
      alt: "Creative self-help book cover with motivational design elements"
    },
    {
      src: "https://images.unsplash.com/photo-1512820790803-83ca734da794?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=400",
      alt: "Educational book cover with clean academic styling"
    },
    {
      src: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=400",
      alt: "Wellness and lifestyle book cover with calming color palette"
    },
    {
      src: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=400",
      alt: "Finance and investment guide cover with professional appearance"
    },
    {
      src: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=400",
      alt: "Leadership and personal development book cover design"
    },
    {
      src: "https://images.unsplash.com/photo-1532012197267-da84d127e765?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=400",
      alt: "Innovation and startup guide with modern tech aesthetic"
    },
    {
      src: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=400",
      alt: "Business strategy book with minimalist design approach"
    }
  ];

  return (
    <section className="py-20 bg-muted/30" data-testid="template-gallery-section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4" data-testid="heading-templates">Professional Cover Templates</h2>
          <p className="text-xl text-muted-foreground" data-testid="text-sixteen-styles">Choose from 16 beautiful cover styles designed by professionals</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6" data-testid="template-grid">
          {templates.map((template, index) => (
            <img 
              key={index}
              src={template.src} 
              alt={template.alt} 
              className="rounded-lg shadow-md hover:shadow-xl transition-shadow cursor-pointer transform hover:scale-105 transition-transform w-full h-auto aspect-[3/4] object-cover"
              data-testid={`template-${index}`}
            />
          ))}
        </div>

        <div className="text-center mt-12">
          <Button size="lg" data-testid="button-view-all-templates">
            View All Templates
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </div>
    </section>
  );
}
