import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Shield } from "lucide-react";

export default function PricingSection() {
  const plans = [
    {
      name: "Lite",
      description: "For getting started with e-books",
      price: "$29.99",
      period: "/month",
      features: [
        "36 AI Credits/year (+8 bonus)",
        "AI e-book and cover generation",
        "Basic template + 3 cover styles",
        "Multiple export formats",
        "Publishing to Amazon KDP"
      ],
      buttonText: "Easy Start",
      buttonVariant: "secondary" as const,
      popular: false
    },
    {
      name: "Pro",
      description: "For serious authors",
      price: "$59.99",
      period: "/month",
      features: [
        "48 AI Credits/year (+10 bonus)",
        "6 Templates + 16 cover styles",
        "Priority support",
        "AI Book Funnel Growth Engine",
        "Marketing campaign generation",
        "Complete funnel analytics"
      ],
      buttonText: "Get Pro",
      buttonVariant: "default" as const,
      popular: true
    },
    {
      name: "Agency",
      description: "For businesses and agencies",
      price: "$249.00",
      period: "/month",
      features: [
        "240 AI Credits/year (+48 bonus)",
        "Everything in Pro",
        "Custom marketplace store",
        "White-label options",
        "Dedicated support",
        "Connect to custom domain"
      ],
      buttonText: "Get Agency",
      buttonVariant: "secondary" as const,
      popular: false
    }
  ];

  return (
    <section id="pricing" className="py-20" data-testid="pricing-section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4" data-testid="heading-pricing">Choose Your Plan</h2>
          <p className="text-xl text-muted-foreground mb-8" data-testid="text-start-creating">Start creating professional e-books today</p>
          <div className="inline-flex bg-muted rounded-lg p-1" data-testid="billing-toggle">
            <Button variant="secondary" size="sm" className="bg-background text-foreground">Monthly</Button>
            <Button variant="ghost" size="sm" className="text-muted-foreground">Annual (Save 20%)</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <div key={plan.name} className={plan.popular ? "gradient-border relative" : ""} data-testid={`plan-${plan.name.toLowerCase()}`}>
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-gradient-to-r from-primary to-pink-500 text-white" data-testid="badge-most-popular">
                    Most Popular
                  </Badge>
                </div>
              )}
              <Card className={`h-full shadow-lg hover:shadow-xl transition-shadow ${plan.popular ? 'gradient-border-inner' : ''}`}>
                <CardHeader>
                  <CardTitle className="text-center">
                    <div>
                      <h3 className="text-2xl font-bold mb-2" data-testid={`plan-name-${plan.name.toLowerCase()}`}>{plan.name}</h3>
                      <p className="text-muted-foreground mb-4" data-testid={`plan-description-${plan.name.toLowerCase()}`}>{plan.description}</p>
                      <div className="text-4xl font-bold mb-2" data-testid={`plan-price-${plan.name.toLowerCase()}`}>
                        {plan.price}
                        <span className="text-lg font-normal text-muted-foreground">{plan.period}</span>
                      </div>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-4 mb-8" data-testid={`plan-features-${plan.name.toLowerCase()}`}>
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center" data-testid={`feature-${plan.name.toLowerCase()}-${featureIndex}`}>
                        <Check className="text-primary mr-3 w-5 h-5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    variant={plan.buttonVariant} 
                    className={`w-full ${plan.popular ? 'bg-gradient-to-r from-primary to-pink-500 text-white hover:opacity-90' : ''}`}
                    data-testid={`button-${plan.name.toLowerCase()}`}
                  >
                    {plan.buttonText}
                  </Button>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-4" data-testid="text-guarantee">
            <Shield className="inline mr-2 w-5 h-5 text-primary" />
            14-day money-back guarantee • Cancel anytime • Unused credits roll over
          </p>
        </div>
      </div>
    </section>
  );
}
