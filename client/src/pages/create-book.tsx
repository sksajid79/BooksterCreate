import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Book, ArrowLeft, Sparkles, PenTool, Upload, FileText, ChevronRight } from "lucide-react";

// Step definitions
const STEPS = [
  { id: 1, name: "Method", key: "method" },
  { id: 2, name: "Details", key: "details" },
  { id: 3, name: "Chapters", key: "chapters" },
  { id: 4, name: "Template", key: "template" },
  { id: 5, name: "Cover", key: "cover" },
  { id: 6, name: "Result", key: "result" },
  { id: 7, name: "Publish", key: "publish" },
  { id: 8, name: "Marketing", key: "marketing" }
];

type CreationMethod = "ai" | "manual" | null;

interface BookFormData {
  method: CreationMethod;
  title: string;
  description: string;
  supportingContent: File | null;
  author: string;
}

export default function CreateBook() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<BookFormData>({
    method: null,
    title: "",
    description: "",
    supportingContent: null,
    author: ""
  });

  const progressPercentage = (currentStep / STEPS.length) * 100;

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleMethodSelect = (method: CreationMethod) => {
    setFormData(prev => ({ ...prev, method }));
    handleNext();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setFormData(prev => ({ ...prev, supportingContent: file }));
  };

  return (
    <div className="min-h-screen bg-background" data-testid="create-book-page">
      {/* Header */}
      <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-2" data-testid="logo">
                <Book className="text-primary text-2xl" />
                <span className="text-xl font-bold">Bookster.cc</span>
              </Link>
              <div className="hidden sm:flex items-center space-x-2 text-sm text-muted-foreground">
                <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
                <ChevronRight className="w-4 h-4" />
                <span>Create Your Book</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="bg-primary/10 text-primary" data-testid="credits-balance">
                Credits Balance: 2
              </Badge>
              <Badge variant="outline" data-testid="user-status">
                Available credits for creating books
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-muted/30 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="mb-4">
            <Progress value={progressPercentage} className="h-2" data-testid="progress-bar" />
          </div>
          <div className="flex justify-between items-center">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex flex-col items-center" data-testid={`step-indicator-${step.key}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  step.id === currentStep 
                    ? 'bg-primary text-primary-foreground' 
                    : step.id < currentStep 
                      ? 'bg-primary/20 text-primary' 
                      : 'bg-muted text-muted-foreground'
                }`}>
                  {step.id}
                </div>
                <span className={`text-xs mt-1 ${
                  step.id === currentStep ? 'text-primary font-medium' : 'text-muted-foreground'
                }`}>
                  {step.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Step 1: Method Selection */}
        {currentStep === 1 && (
          <div className="space-y-8" data-testid="step-method">
            <div className="text-center">
              <h1 className="text-3xl font-bold mb-4" data-testid="heading-create-book">Create Your Book</h1>
              <p className="text-xl text-muted-foreground mb-8" data-testid="text-description">
                Follow these steps to create and publish your professional book with our guided workflow.
              </p>
            </div>

            <div className="text-center mb-8">
              <h2 className="text-xl font-semibold mb-2" data-testid="heading-pseudonym">🎭 Pseudonym Selection</h2>
              <p className="text-muted-foreground mb-4">Choose the pen name for your book</p>
              
              <div className="max-w-md mx-auto">
                <div className="flex items-center space-x-2 p-3 border border-border rounded-lg bg-card">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-primary font-medium">S</span>
                  </div>
                  <div className="text-left">
                    <div className="font-medium" data-testid="author-name">Silk Starset</div>
                    <div className="text-sm text-muted-foreground">Professional</div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-center mb-8" data-testid="heading-choose-method">
                Choose Your Book Creation Method
              </h3>
              <p className="text-center text-muted-foreground mb-8" data-testid="text-method-description">
                Select from the 3 fast to create your book and choose an author pen name.
              </p>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* AI Generated Book */}
                <Card 
                  className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-primary/50"
                  onClick={() => handleMethodSelect("ai")}
                  data-testid="card-ai-method"
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Sparkles className="w-6 h-6 text-primary" />
                        <h4 className="text-lg font-semibold">AI Generated Book</h4>
                      </div>
                      <Badge className="bg-orange-100 text-orange-700 border-orange-300" data-testid="badge-popular">
                        Popular
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      Let AI create your entire book from a simple description.
                    </p>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center space-x-2">
                        <div className="w-1 h-1 bg-primary rounded-full"></div>
                        <span>Full content generated using advanced AI</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-1 h-1 bg-primary rounded-full"></div>
                        <span>The language of your prompt and content content determines the language of the generated eBook. 49% language supported.</span>
                      </div>
                    </div>
                    
                    <div className="mt-6 p-4 bg-muted rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">Credits Balance</span>
                        <span className="text-primary font-bold">2</span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">Available credits for creating books</p>
                      
                      <div className="mb-4">
                        <div className="flex items-center justify-between text-sm">
                          <span>Low on Credits?</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          You have less than 3 credits left. To get more credits, check out our pricing page.
                        </p>
                      </div>
                      
                      <Button className="w-full" size="sm" data-testid="button-get-more-credits">
                        Get More Credits
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Manual Creation */}
                <Card 
                  className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-primary/50"
                  onClick={() => handleMethodSelect("manual")}
                  data-testid="card-manual-method"
                >
                  <CardHeader>
                    <div className="flex items-center space-x-2">
                      <PenTool className="w-6 h-6 text-primary" />
                      <h4 className="text-lg font-semibold">Manual Creation</h4>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      Write and design your book manually with full control.
                    </p>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center space-x-2">
                        <div className="w-1 h-1 bg-primary rounded-full"></div>
                        <span>Full creative control</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-1 h-1 bg-primary rounded-full"></div>
                        <span>Intuitive chapter structure</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-1 h-1 bg-primary rounded-full"></div>
                        <span>AI-powered cover</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-1 h-1 bg-primary rounded-full"></div>
                        <span>Manual cover upload</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-1 h-1 bg-primary rounded-full"></div>
                        <span>Full Publishing Features</span>
                      </div>
                    </div>
                    
                    <Button className="w-full mt-6" variant="outline" data-testid="button-start-creating-book">
                      Start Creating Book
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Details */}
        {currentStep === 2 && (
          <div className="space-y-8" data-testid="step-details">
            <div className="text-center">
              <h1 className="text-3xl font-bold mb-4">Book Details</h1>
              <p className="text-xl text-muted-foreground">
                Describe your book idea and upload any supporting content
              </p>
            </div>

            <Card>
              <CardContent className="p-8">
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="book-title" className="text-base font-medium">Book Title</Label>
                    <Input
                      id="book-title"
                      placeholder="Enter your book title"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      className="mt-2"
                      data-testid="input-book-title"
                    />
                  </div>

                  <div>
                    <Label htmlFor="book-description" className="text-base font-medium">Describe your book idea</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Tell us about your book topic, who you want to reach, your target audience, or any specific content you want to include.
                    </p>
                    <Textarea
                      id="book-description"
                      placeholder="Describe your book topic, who you want to reach, your target audience, or any specific content you want to include."
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      className="mt-2 min-h-32"
                      data-testid="textarea-book-description"
                    />
                  </div>

                  <div>
                    <Label className="text-base font-medium">Upload supporting content (optional)</Label>
                    <div className="mt-2 border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-muted-foreground/50 transition-colors">
                      <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <input
                        type="file"
                        id="supporting-content"
                        className="hidden"
                        onChange={handleFileUpload}
                        accept=".pdf,.doc,.docx,.txt"
                        data-testid="input-file-upload"
                      />
                      <label htmlFor="supporting-content" className="cursor-pointer">
                        <Button variant="outline" className="mb-2" data-testid="button-choose-file">
                          Choose File
                        </Button>
                        <p className="text-sm text-muted-foreground">
                          Or drag and drop a file here
                        </p>
                      </label>
                      {formData.supportingContent && (
                        <p className="mt-2 text-sm text-primary" data-testid="text-uploaded-file">
                          Uploaded: {formData.supportingContent.name}
                        </p>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Upload a document or PDF which contains content you already have on your subject. The AI will use this to create your book.
                    </p>
                  </div>

                  <div>
                    <Label className="text-base font-medium">Based on text or url you can publish content related content...</Label>
                    <div className="mt-4 p-4 bg-primary/5 rounded-lg">
                      <Button 
                        className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                        onClick={handleNext}
                        disabled={!formData.title || !formData.description}
                        data-testid="button-start-generating-book"
                      >
                        <Sparkles className="mr-2 w-5 h-5" />
                        Start Generating Book (1x Credit)
                      </Button>
                    </div>
                    
                    <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-2">
                        <div className="w-1 h-1 bg-muted-foreground rounded-full"></div>
                        <span>AI generated, fast, inspiring, medicine, coffee, content</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-1 h-1 bg-muted-foreground rounded-full"></div>
                        <span>Choose your topic using AI framework</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-1 h-1 bg-muted-foreground rounded-full"></div>
                        <span>Design and create beautiful covers</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-1 h-1 bg-muted-foreground rounded-full"></div>
                        <span>Professional formatting</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Coming Soon Steps */}
        {currentStep > 2 && (
          <div className="text-center py-16" data-testid="coming-soon">
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <FileText className="w-12 h-12 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-4">Step {currentStep}: {STEPS[currentStep - 1].name}</h2>
            <p className="text-muted-foreground mb-8">This step is coming soon!</p>
            <div className="flex justify-center space-x-4">
              <Button variant="outline" onClick={handleBack} data-testid="button-back">
                <ArrowLeft className="mr-2 w-4 h-4" />
                Back
              </Button>
              <Button onClick={handleNext} disabled={currentStep >= STEPS.length} data-testid="button-continue">
                Continue
                <ChevronRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Navigation */}
        {currentStep <= 2 && (
          <div className="flex justify-between items-center pt-8 border-t border-border" data-testid="navigation-buttons">
            <Button 
              variant="outline" 
              onClick={handleBack}
              disabled={currentStep === 1}
              data-testid="button-back"
            >
              <ArrowLeft className="mr-2 w-4 h-4" />
              Back
            </Button>
            
            {currentStep === 1 && (
              <p className="text-sm text-muted-foreground" data-testid="text-select-method">
                Select a creation method to continue
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}