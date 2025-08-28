import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";

export default function Testimonials() {
  const testimonials = [
    {
      name: "Mark Drolsbaugh",
      role: "Published Author",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150",
      quote: "I've written six books since 1997 but wanted to create bonus products without taking forever. Bookster absolutely nailed my writing style!",
      rating: 5
    },
    {
      name: "Sarah Chen",
      role: "Business Coach",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150",
      quote: "Game-changer for my coaching business! Created 3 lead magnets in one week. My email list grew by 300% in one month.",
      rating: 5
    },
    {
      name: "David Rodriguez",
      role: "Startup Founder",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150",
      quote: "Finally published my startup guide! The AI understood my voice perfectly. Already got 3 new clients from the book.",
      rating: 5
    },
    {
      name: "Emily Watson",
      role: "Marketing Consultant",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b131?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150",
      quote: "Incredible tool! Turned my blog posts into a professional e-book in 20 minutes. The cover design is stunning too.",
      rating: 5
    }
  ];

  return (
    <section id="testimonials" className="py-20 bg-muted/30" data-testid="testimonials-section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4" data-testid="heading-testimonials">Loved by Authors Worldwide</h2>
          <p className="text-xl text-muted-foreground" data-testid="text-testimonials-description">See what published authors are saying about Bookster</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8" data-testid="testimonials-grid">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="shadow-lg" data-testid={`testimonial-${index}`}>
              <CardContent className="p-6">
                <img 
                  src={testimonial.avatar} 
                  alt={`Professional headshot of ${testimonial.name}, ${testimonial.role.toLowerCase()}`}
                  className="w-16 h-16 rounded-full mx-auto mb-4 object-cover"
                  data-testid={`avatar-${index}`}
                />
                <div className="text-center mb-4">
                  <div className="flex justify-center mb-2" data-testid={`rating-${index}`}>
                    {[...Array(testimonial.rating)].map((_, starIndex) => (
                      <Star key={starIndex} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mb-4" data-testid={`quote-${index}`}>
                    "{testimonial.quote}"
                  </p>
                  <div className="text-sm font-semibold" data-testid={`name-${index}`}>{testimonial.name}</div>
                  <div className="text-xs text-muted-foreground" data-testid={`role-${index}`}>{testimonial.role}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
