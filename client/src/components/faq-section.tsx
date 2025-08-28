import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Plus, Minus } from "lucide-react";

export default function FAQSection() {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  const faqs = [
    {
      question: "Which languages does Bookster support?",
      answer: "Currently, we support English and German languages for Bookster. However, as our AI models are multilingual, you can create books in any language. The AI will generate content and the cover based on the language of your input material."
    },
    {
      question: "How long does it take to create an ebook?",
      answer: "With Bookster, you can create a complete professional e-book in minutes, not months. Our AI processes your content and generates a full manuscript with cover design typically within 5-15 minutes, depending on the length and complexity."
    },
    {
      question: "Can I download the ebook and use it anywhere?",
      answer: "Absolutely! You can export your e-book in multiple formats including PDF, EPUB, MOBI, and DOCX. These files are optimized for publishing platforms like Amazon KDP, Google Books, and more. You own full rights to your content."
    },
    {
      question: "How are credits and edits counted?",
      answer: "1 AI Credit is valid for 1 complete AI-generated book including cover. Minor edits and exports don't consume additional credits. Major regeneration of content will use a new credit. Unused credits roll over as long as you maintain an active subscription."
    },
    {
      question: "What if I don't like the first draft?",
      answer: "You can easily edit and refine your content using our built-in editor. For major changes, you can regenerate sections or the entire book. We also offer a 14-day money-back guarantee if you're not satisfied with the results."
    },
    {
      question: "Are there intellectual property concerns when publishing with Bookster?",
      answer: "You retain full ownership and copyright of all content created with Bookster. The AI-generated content is unique to your input and prompts. We include built-in tools to help protect your intellectual property and establish your copyright."
    }
  ];

  const toggleFAQ = (index: number) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  return (
    <section id="faq" className="py-20" data-testid="faq-section">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4" data-testid="heading-faq">Frequently Asked Questions</h2>
          <p className="text-xl text-muted-foreground" data-testid="text-faq-description">Everything you need to know about Bookster</p>
        </div>

        <div className="space-y-4" data-testid="faq-list">
          {faqs.map((faq, index) => (
            <Card key={index} className="border border-border" data-testid={`faq-item-${index}`}>
              <button 
                className="w-full px-6 py-4 text-left font-semibold flex justify-between items-center hover:bg-muted/30 transition-colors"
                onClick={() => toggleFAQ(index)}
                data-testid={`faq-question-${index}`}
              >
                <span>{faq.question}</span>
                {openFAQ === index ? (
                  <Minus className="text-primary w-5 h-5 flex-shrink-0" data-testid={`faq-icon-minus-${index}`} />
                ) : (
                  <Plus className="text-primary w-5 h-5 flex-shrink-0" data-testid={`faq-icon-plus-${index}`} />
                )}
              </button>
              {openFAQ === index && (
                <div className="px-6 pb-4 text-muted-foreground" data-testid={`faq-answer-${index}`}>
                  {faq.answer}
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
