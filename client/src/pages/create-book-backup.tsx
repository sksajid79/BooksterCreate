import { useState } from "react";
import { Link } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Book, ArrowLeft, Sparkles, PenTool, Upload, FileText, ChevronRight, Edit, Bold, Italic, Underline, Link2, List, AlignLeft, GripVertical, RefreshCw, Trash2, CheckCircle, ChevronUp, ChevronDown } from "lucide-react";

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

interface Chapter {
  id: string;
  title: string;
  content: string;
  isExpanded: boolean;
}

interface BookFormData {
  method: CreationMethod;
  author: string;
  title: string;
  subtitle: string;
  description: string;
  targetAudience: string;
  toneStyle: string;
  mission: string;
  language: string;
  htmlDescription: string;
  keywords: string[];
  supportingContent: File | null;
  chapters: Chapter[];
}

export default function CreateBook() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isGeneratingChapters, setIsGeneratingChapters] = useState(false);
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<BookFormData>({
    method: null,
    author: "Sak Rahmi",
    title: "",
    subtitle: "",
    description: "",
    targetAudience: "",
    toneStyle: "",
    mission: "",
    language: "English (EN)",
    htmlDescription: "",
    keywords: [],
    supportingContent: null,
    chapters: []
  });

  const progressPercentage = (currentStep / STEPS.length) * 100;

  const generateChaptersMutation = useMutation({
    mutationFn: async (bookDetails: any) => {
      const response = await fetch('/api/chapters/generate', {
        method: 'POST',
        body: JSON.stringify(bookDetails),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('Failed to generate chapters');
      }
      return response.json();
    },
    onSuccess: (data) => {
      setFormData(prev => ({ ...prev, chapters: data.chapters }));
      setIsGeneratingChapters(false);
    },
    onError: (error) => {
      console.error('Failed to generate chapters:', error);
      setIsGeneratingChapters(false);
    }
  });

  const regenerateChapterMutation = useMutation({
    mutationFn: async ({ chapterTitle, bookDetails }: { chapterTitle: string, bookDetails: any }) => {
      const response = await fetch('/api/chapters/regenerate', {
        method: 'POST',
        body: JSON.stringify({ chapterTitle, bookDetails }),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('Failed to regenerate chapter');
      }
      return response.json();
    },
    onSuccess: (data, variables) => {
      setFormData(prev => ({
        ...prev,
        chapters: prev.chapters.map(chapter =>
          chapter.title === variables.chapterTitle
            ? { ...chapter, content: data.content }
            : chapter
        )
      }));
    }
  });

  const handleNext = async () => {
    if (currentStep === 2 && formData.chapters.length === 0) {
      // Generate chapters when moving from Details to Chapters step
      setIsGeneratingChapters(true);
      const bookDetails = {
        title: formData.title,
        subtitle: formData.subtitle,
        description: formData.description,
        targetAudience: formData.targetAudience,
        toneStyle: formData.toneStyle,
        mission: formData.mission,
        author: formData.author
      };
      generateChaptersMutation.mutate(bookDetails);
    }
    
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

  const handleKeywordAdd = (keyword: string) => {
    if (keyword.trim() && !formData.keywords.includes(keyword.trim())) {
      setFormData(prev => ({ 
        ...prev, 
        keywords: [...prev.keywords, keyword.trim()] 
      }));
    }
  };

  const handleKeywordRemove = (index: number) => {
    setFormData(prev => ({ 
      ...prev, 
      keywords: prev.keywords.filter((_, i) => i !== index) 
    }));
  };

  const toggleChapter = (chapterId: string) => {
    setFormData(prev => ({
      ...prev,
      chapters: prev.chapters.map(chapter =>
        chapter.id === chapterId
          ? { ...chapter, isExpanded: !chapter.isExpanded }
          : chapter
      )
    }));
  };

  const regenerateChapter = (chapterId: string) => {
    const chapter = formData.chapters.find(ch => ch.id === chapterId);
    if (chapter) {
      const bookDetails = {
        title: formData.title,
        subtitle: formData.subtitle,
        description: formData.description,
        targetAudience: formData.targetAudience,
        toneStyle: formData.toneStyle,
        mission: formData.mission,
        author: formData.author
      };
      regenerateChapterMutation.mutate({ chapterTitle: chapter.title, bookDetails });
    }
  };

  const deleteChapter = (chapterId: string) => {
    setFormData(prev => ({
      ...prev,
      chapters: prev.chapters.filter(chapter => chapter.id !== chapterId)
    }));
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
                <span className="text-xl font-bold">MyBookStore</span>
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
            <Card>
              <CardContent className="p-8">
                <div className="space-y-8">
                  {/* Selected Author */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4" data-testid="heading-selected-author">Selected Author</h3>
                    <div className="flex items-center space-x-4 p-4 border border-border rounded-lg bg-card">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-primary font-medium text-lg">S</span>
                      </div>
                      <div className="flex-1">
                        <div className="font-medium" data-testid="author-name">{formData.author}</div>
                        <div className="text-sm text-muted-foreground">Style: Professional</div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Tone: Professional
                      </div>
                    </div>
                  </div>

                  {/* Book Title */}
                  <div>
                    <Label htmlFor="book-title" className="text-base font-medium">Book Title</Label>
                    <Input
                      id="book-title"
                      placeholder="Teen Parenting Simplified"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      className="mt-2"
                      data-testid="input-book-title"
                    />
                  </div>

                  {/* Book Subtitle */}
                  <div>
                    <Label htmlFor="book-subtitle" className="text-base font-medium">Book Subtitle (Optional)</Label>
                    <Input
                      id="book-subtitle"
                      placeholder="A Practical Guide to Raising Happy, Healthy Teens with Confidence and Compassion"
                      value={formData.subtitle}
                      onChange={(e) => setFormData(prev => ({ ...prev, subtitle: e.target.value }))}
                      className="mt-2"
                      data-testid="input-book-subtitle"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <Label htmlFor="book-description" className="text-base font-medium">Description</Label>
                    <Textarea
                      id="book-description"
                      placeholder="This book provides actionable advice and expert insights to help parents navigate the challenges of raising teenagers. From communication strategies to emotional support, it equips parents with the tools they need to foster strong, positive relationships with their teens."
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      className="mt-2 min-h-24"
                      data-testid="textarea-book-description"
                    />
                  </div>

                  {/* Target Audience */}
                  <div>
                    <Label htmlFor="target-audience" className="text-base font-medium">Target Audience</Label>
                    <Textarea
                      id="target-audience"
                      placeholder="Parents of teenagers, guardians, and caregivers seeking guidance on adolescent development and effective parenting techniques"
                      value={formData.targetAudience}
                      onChange={(e) => setFormData(prev => ({ ...prev, targetAudience: e.target.value }))}
                      className="mt-2 min-h-20"
                      data-testid="textarea-target-audience"
                    />
                  </div>

                  {/* Tone & Style */}
                  <div>
                    <Label htmlFor="tone-style" className="text-base font-medium">Tone & Style (Optional)</Label>
                    <Textarea
                      id="tone-style"
                      placeholder="Professional, empathetic, and informative"
                      value={formData.toneStyle}
                      onChange={(e) => setFormData(prev => ({ ...prev, toneStyle: e.target.value }))}
                      className="mt-2 min-h-16"
                      data-testid="textarea-tone-style"
                    />
                  </div>

                  {/* Mission */}
                  <div>
                    <Label htmlFor="mission" className="text-base font-medium">Mission (Optional)</Label>
                    <Textarea
                      id="mission"
                      placeholder="To empower parents with the knowledge and skills needed to raise well-adjusted, confident teenagers in today's complex world"
                      value={formData.mission}
                      onChange={(e) => setFormData(prev => ({ ...prev, mission: e.target.value }))}
                      className="mt-2 min-h-16"
                      data-testid="textarea-mission"
                    />
                  </div>

                  {/* Language */}
                  <div>
                    <Label htmlFor="language" className="text-base font-medium">Language</Label>
                    <Select value={formData.language} onValueChange={(value) => setFormData(prev => ({ ...prev, language: value }))}>
                      <SelectTrigger className="mt-2" data-testid="select-language">
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="English (EN)">English (EN)</SelectItem>
                        <SelectItem value="Spanish (ES)">Spanish (ES)</SelectItem>
                        <SelectItem value="French (FR)">French (FR)</SelectItem>
                        <SelectItem value="German (DE)">German (DE)</SelectItem>
                        <SelectItem value="Italian (IT)">Italian (IT)</SelectItem>
                        <SelectItem value="Portuguese (PT)">Portuguese (PT)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* HTML Book Description */}
                  <div>
                    <Label className="text-base font-medium">HTML Book Description (Optional)</Label>
                    <div className="mt-2">
                      {/* Rich Text Editor Toolbar */}
                      <div className="border border-border rounded-t-lg bg-muted/30 p-2 flex items-center space-x-2" data-testid="rich-text-toolbar">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Bold className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Italic className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Underline className="h-4 w-4" />
                        </Button>
                        <div className="w-px h-6 bg-border"></div>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Link2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <List className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <AlignLeft className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      {/* Rich Text Content Area */}
                      <div className="border border-t-0 border-border rounded-b-lg p-4 min-h-48 bg-background" data-testid="rich-text-content">
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold">Teen Parenting Simplified: A Practical Guide to Raising Happy, Healthy Teens with Confidence and Compassion</h3>
                          
                          <p className="text-muted-foreground">
                            Are you struggling to connect with your teenager? Do you feel overwhelmed by the challenges of parenting during these formative years? <em>Teen Parenting Simplified</em> is your go-to resource for navigating the ups and downs of adolescence with ease and confidence.
                          </p>
                          
                          <p>In this comprehensive guide, Sak Rahmi offers practical advice, real-life examples, and expert strategies to help you:</p>
                          
                          <ul className="list-disc ml-6 space-y-1">
                            <li>Improve communication and build trust with your teen</li>
                            <li>Handle conflicts and emotional outbursts effectively</li>
                            <li>Support your teen's mental and emotional well-being</li>
                            <li>Set boundaries while fostering independence</li>
                            <li>Prepare your teen for adulthood with life skills and resilience</li>
                          </ul>
                          
                          <p>
                            Whether you're a new parent to a teenager or looking to strengthen your existing relationship, this book provides the tools you need to create a loving, supportive home environment. <strong>Start your journey to confident teen parenting today!</strong>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Keywords */}
                  <div>
                    <Label className="text-base font-medium">Keywords (Optional)</Label>
                    <div className="mt-2 grid grid-cols-2 gap-3" data-testid="keywords-grid">
                      {[
                        "teen parenting guide",
                        "raising teenagers book",
                        "parenting teens with confidence",
                        "teen communication strategies",
                        "adolescent emotional support",
                        "positive parenting techniques",
                        "teen mental health guide"
                      ].map((keyword, index) => (
                        <div key={index} className="flex items-center space-x-2 p-2 bg-muted rounded-lg">
                          <span className="text-sm flex-1">{keyword}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                            onClick={() => handleKeywordRemove(index)}
                            data-testid={`button-remove-keyword-${index}`}
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Next Step Button */}
                  <div className="pt-6">
                    <Button 
                      className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                      onClick={handleNext}
                      disabled={!formData.title || !formData.description}
                      data-testid="button-next-step"
                    >
                      Next Step
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 3: Chapters */}
        {currentStep === 3 && (
          <div className="space-y-8" data-testid="step-chapters">
            {isGeneratingChapters || generateChaptersMutation.isPending ? (
              <div className="text-center py-16" data-testid="generating-chapters">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <RefreshCw className="w-8 h-8 text-primary animate-spin" />
                </div>
                <h2 className="text-2xl font-semibold mb-4">Generating Chapters</h2>
                <p className="text-muted-foreground">
                  Claude is creating personalized chapters for your book. This may take a moment...
                </p>
              </div>
            ) : formData.chapters.length > 0 ? (
              <>
                {/* Success Alert */}
                <Alert className="bg-green-50 border-green-200 text-green-800" data-testid="alert-chapters-generated">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription>
                    <span className="font-medium">All chapters generated successfully!</span> Please review and revise the generated content and{" "}
                    <button className="underline hover:no-underline" data-testid="link-scroll-continue">
                      scroll down to continue
                    </button>
                    .
                  </AlertDescription>
                </Alert>

            {/* Chapters List */}
            <div className="space-y-4" data-testid="chapters-list">
              {formData.chapters.map((chapter, index) => (
                <Card key={chapter.id} className="border border-border" data-testid={`chapter-${chapter.id}`}>
                  <div className="flex items-center justify-between p-4 border-b border-border">
                    <div className="flex items-center space-x-3">
                      <div className="cursor-move" data-testid={`chapter-drag-${chapter.id}`}>
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-foreground" data-testid={`chapter-title-${chapter.id}`}>
                          {chapter.title}
                        </h3>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleChapter(chapter.id)}
                        className="text-primary hover:text-primary/80"
                        data-testid={`button-toggle-${chapter.id}`}
                      >
                        {chapter.isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => regenerateChapter(chapter.id)}
                        className="text-primary hover:text-primary/80"
                        disabled={regenerateChapterMutation.isPending}
                        data-testid={`button-regenerate-${chapter.id}`}
                      >
                        <RefreshCw className={`h-4 w-4 ${regenerateChapterMutation.isPending ? 'animate-spin' : ''}`} />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteChapter(chapter.id)}
                        className="text-destructive hover:text-destructive/80"
                        data-testid={`button-delete-${chapter.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {chapter.isExpanded && (
                    <CardContent className="p-6">
                      <div className="prose prose-sm max-w-none" data-testid={`chapter-content-${chapter.id}`}>
                        {chapter.content.split('\n\n').map((paragraph, paragraphIndex) => {
                          if (paragraph.trim().startsWith('The ') && paragraph.trim().includes('Changes')) {
                            return (
                              <h4 key={paragraphIndex} className="text-lg font-semibold mt-6 mb-3 text-foreground">
                                {paragraph.trim()}
                              </h4>
                            );
                          }
                          return (
                            <p key={paragraphIndex} className="text-muted-foreground leading-relaxed mb-4">
                              {paragraph.trim()}
                            </p>
                          );
                        })}
                      </div>
                      
                      <div className="flex items-center justify-between pt-4 mt-6 border-t border-border">
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleChapter(chapter.id)}
                            className="text-muted-foreground hover:text-foreground"
                            data-testid={`button-collapse-${chapter.id}`}
                          >
                            <ChevronUp className="h-4 w-4 mr-1" />
                            Collapse
                          </Button>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleChapter(chapter.id)}
                            className="text-muted-foreground hover:text-foreground"
                            data-testid={`button-expand-${chapter.id}`}
                          >
                            <ChevronDown className="h-4 w-4 mr-1" />
                            Expand
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center pt-8 border-t border-border" data-testid="chapters-navigation">
              <Button 
                variant="outline" 
                onClick={handleBack}
                data-testid="button-back-chapters"
              >
                <ArrowLeft className="mr-2 w-4 h-4" />
                Back
              </Button>
              
              <Button
                onClick={handleNext}
                disabled={formData.chapters.length === 0}
                data-testid="button-continue-chapters"
              >
                Continue to Template
                <ChevronRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Coming Soon Steps */}
        {currentStep > 3 && (
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