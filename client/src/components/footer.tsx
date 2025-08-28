import { Book } from "lucide-react";

export default function Footer() {
  const footerSections = [
    {
      title: "Product",
      links: [
        { name: "Features", href: "#features" },
        { name: "Pricing", href: "#pricing" },
        { name: "Templates", href: "#templates" },
        { name: "API", href: "#api" }
      ]
    },
    {
      title: "Resources",
      links: [
        { name: "Help Center", href: "#help" },
        { name: "Blog", href: "#blog" },
        { name: "Tutorials", href: "#tutorials" },
        { name: "Community", href: "#community" }
      ]
    },
    {
      title: "Company",
      links: [
        { name: "About", href: "#about" },
        { name: "Privacy", href: "#privacy" },
        { name: "Terms", href: "#terms" },
        { name: "Contact", href: "#contact" }
      ]
    }
  ];

  return (
    <footer className="bg-foreground text-background py-16" data-testid="footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div data-testid="footer-brand">
            <div className="flex items-center space-x-2 mb-4">
              <Book className="text-primary text-2xl" />
              <span className="text-xl font-bold">Bookster.cc</span>
            </div>
            <p className="text-background/60 mb-4" data-testid="footer-description">
              Transform your knowledge into captivating e-books in minutes with AI-powered creation.
            </p>
            <div className="flex space-x-4" data-testid="social-links">
              <div className="text-background/60 hover:text-background cursor-pointer transition-colors">Twitter</div>
              <div className="text-background/60 hover:text-background cursor-pointer transition-colors">LinkedIn</div>
              <div className="text-background/60 hover:text-background cursor-pointer transition-colors">Facebook</div>
            </div>
          </div>
          
          {footerSections.map((section, index) => (
            <div key={section.title} data-testid={`footer-section-${index}`}>
              <h4 className="font-semibold mb-4" data-testid={`footer-title-${index}`}>{section.title}</h4>
              <ul className="space-y-2 text-background/60">
                {section.links.map((link, linkIndex) => (
                  <li key={link.name}>
                    <a 
                      href={link.href} 
                      className="hover:text-background transition-colors"
                      data-testid={`footer-link-${index}-${linkIndex}`}
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        
        <div className="border-t border-background/20 mt-12 pt-8 text-center text-background/60" data-testid="footer-copyright">
          <p>&copy; 2024 Bookster.cc. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
