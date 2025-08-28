export default function HowItWorks() {
  const steps = [
    {
      number: 1,
      title: "Input Your Content",
      description: "Upload PDFs, paste text, share website links, or simply describe your book idea. Our AI processes any format.",
      image: "https://images.unsplash.com/photo-1551836022-deb4988cc6c0?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=300",
      alt: "Professional workspace with laptop and notebooks for content creation"
    },
    {
      number: 2,
      title: "AI Creates Your Book",
      description: "Our advanced AI writes your complete e-book with professional formatting, engaging content, and a stunning cover design.",
      image: "https://images.unsplash.com/photo-1555949963-aa79dcee981c?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=300",
      alt: "Digital illustration representing AI technology and automated book creation"
    },
    {
      number: 3,
      title: "Publish & Share",
      description: "One-click publishing to Amazon KDP, Google Books, or our marketplace. Start selling and sharing your knowledge instantly.",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=300",
      alt: "Happy business person celebrating success with published books and positive reviews"
    }
  ];

  return (
    <section id="features" className="py-20" data-testid="how-it-works-section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4" data-testid="heading-how-it-works">How MyBookStore Works</h2>
          <p className="text-xl text-muted-foreground" data-testid="text-three-steps">From idea to published e-book in just 3 simple steps</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {steps.map((step) => (
            <div key={step.number} className="text-center" data-testid={`step-${step.number}`}>
              <div className="w-20 h-20 bg-gradient-to-r from-primary to-pink-500 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6" data-testid={`step-number-${step.number}`}>
                {step.number}
              </div>
              <h3 className="text-2xl font-semibold mb-4" data-testid={`step-title-${step.number}`}>{step.title}</h3>
              <p className="text-muted-foreground mb-6" data-testid={`step-description-${step.number}`}>{step.description}</p>
              <img 
                src={step.image} 
                alt={step.alt} 
                className="rounded-lg shadow-lg w-full h-auto"
                data-testid={`step-image-${step.number}`}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
