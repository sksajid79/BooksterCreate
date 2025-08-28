import { useState } from "react";
import { Link } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Book, ArrowLeft, Sparkles, PenTool, Upload, FileText, ChevronRight, Edit, Bold, Italic, Underline, Link2, List, AlignLeft, GripVertical, RefreshCw, Trash2, CheckCircle, ChevronUp, ChevronDown, Check, Star, Palette, Briefcase, GraduationCap, Image, Replace, Download, Eye, BookOpen, Code, Smartphone } from "lucide-react";

// Step definitions
const STEPS = [
  { id: 1, name: "Method", key: "method" },
  { id: 2, name: "Details", key: "details" },
  { id: 3, name: "Chapters", key: "chapters" },
  { id: 4, name: "Template", key: "template" },
  { id: 5, name: "Cover", key: "cover" },
  { id: 6, name: "Export", key: "export" },
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
  selectedTemplate: string;
  coverImage: File | null;
  coverImageUrl: string | null;
}

export default function CreateBook() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isGeneratingChapters, setIsGeneratingChapters] = useState(false);
  const [currentBookId, setCurrentBookId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
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
    chapters: [],
    selectedTemplate: "original",
    coverImage: null,
    coverImageUrl: null
  });

  const progressPercentage = (currentStep / STEPS.length) * 100;

  // Book creation and persistence mutations
  const createBookMutation = useMutation({
    mutationFn: async (bookData: any) => {
      const response = await fetch('/api/books', {
        method: 'POST',
        body: JSON.stringify(bookData),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('Failed to create book');
      }
      return response.json();
    },
    onSuccess: (book) => {
      setCurrentBookId(book.id);
    }
  });

  const updateBookMutation = useMutation({
    mutationFn: async ({ bookId, updates }: { bookId: string, updates: any }) => {
      const response = await fetch(`/api/books/${bookId}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('Failed to update book');
      }
      return response.json();
    }
  });

  const saveProgressMutation = useMutation({
    mutationFn: async ({ bookId, stepName, stepData }: { bookId: string, stepName: string, stepData: any }) => {
      const response = await fetch(`/api/books/${bookId}/progress`, {
        method: 'POST',
        body: JSON.stringify({
          stepName,
          stepData,
          isCompleted: true,
          completedAt: new Date().toISOString()
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('Failed to save progress');
      }
      return response.json();
    }
  });

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

  // Auto-save function
  const saveCurrentStep = async () => {
    if (!currentBookId) return;
    
    setIsSaving(true);
    try {
      const stepName = STEPS[currentStep - 1]?.key;
      let stepData = {};
      
      switch (stepName) {
        case 'method':
          stepData = { method: formData.method };
          break;
        case 'details':
          stepData = {
            title: formData.title,
            subtitle: formData.subtitle,
            author: formData.author,
            description: formData.description,
            targetAudience: formData.targetAudience,
            toneStyle: formData.toneStyle,
            mission: formData.mission,
            language: formData.language,
            htmlDescription: formData.htmlDescription,
            keywords: formData.keywords
          };
          break;
        case 'chapters':
          stepData = { chapters: formData.chapters };
          break;
        case 'template':
          stepData = { selectedTemplate: formData.selectedTemplate };
          break;
        case 'cover':
          stepData = { coverImageUrl: formData.coverImageUrl };
          break;
      }
      
      await saveProgressMutation.mutateAsync({
        bookId: currentBookId,
        stepName,
        stepData
      });
      
      // Also update the main book record
      await updateBookMutation.mutateAsync({
        bookId: currentBookId,
        updates: {
          currentStep,
          ...stepData
        }
      });
    } catch (error) {
      console.error('Failed to save progress:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleNext = async () => {
    // Save current step progress before moving to next
    if (currentBookId) {
      await saveCurrentStep();
    }
    
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

  const handleMethodSelect = async (method: CreationMethod) => {
    setFormData(prev => ({ ...prev, method }));
    
    // Create new book record when method is selected
    if (!currentBookId) {
      try {
        const bookData = {
          userId: "temp-user-id", // In a real app, this would come from auth
          creationMethod: method === "ai" ? "ai-generated" : "manual",
          currentStep: 1,
          status: "draft"
        };
        
        await createBookMutation.mutateAsync(bookData);
      } catch (error) {
        console.error('Failed to create book:', error);
      }
    }
    
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

  const handleTemplateSelect = (templateId: string) => {
    setFormData(prev => ({ ...prev, selectedTemplate: templateId }));
  };

  const handleCoverImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Create URL for preview
      const imageUrl = URL.createObjectURL(file);
      setFormData(prev => ({ 
        ...prev, 
        coverImage: file,
        coverImageUrl: imageUrl
      }));
    }
  };

  const handleReplaceCover = () => {
    // Clear current cover
    if (formData.coverImageUrl) {
      URL.revokeObjectURL(formData.coverImageUrl);
    }
    setFormData(prev => ({ 
      ...prev, 
      coverImage: null,
      coverImageUrl: null
    }));
  };

  // Export mutations
  const exportMutation = useMutation({
    mutationFn: async ({ format }: { format: string }) => {
      const exportData = {
        title: formData.title,
        subtitle: formData.subtitle,
        author: formData.author,
        description: formData.description,
        chapters: formData.chapters,
        selectedTemplate: formData.selectedTemplate,
        coverImageUrl: formData.coverImageUrl,
        language: formData.language
      };

      const response = await fetch(`/api/export/${format}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(exportData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Export failed');
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Show success message and trigger download
      alert(`${data.format} export completed! File: ${data.fileName}`);
      
      // Trigger download
      const link = document.createElement('a');
      link.href = data.downloadUrl;
      link.download = data.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },
    onError: (error) => {
      alert(`Export failed: ${error.message}`);
    }
  });

  const handleExport = (format: string) => {
    exportMutation.mutate({ format });
  };

  // Template definitions
  const templates = [
    {
      id: "original",
      name: "Original Design",
      description: "Use the original Bookster.cc layout",
      icon: FileText,
      isPremium: false,
      preview: {
        backgroundColor: "#ffffff",
        textColor: "#1f2937",
        fontSize: "16px",
        fontFamily: "serif",
        lineHeight: "1.6",
        marginBottom: "1rem"
      }
    },
    {
      id: "modern",
      name: "Modern",
      description: "Clean and minimalist design with contemporary spacing",
      icon: Sparkles,
      isPremium: true,
      preview: {
        backgroundColor: "#f8fafc",
        textColor: "#0f172a",
        fontSize: "17px",
        fontFamily: "sans-serif",
        lineHeight: "1.7",
        marginBottom: "1.5rem"
      }
    },
    {
      id: "creative",
      name: "Creative",
      description: "Playful design with artistic flourishes",
      icon: Palette,
      isPremium: true,
      preview: {
        backgroundColor: "#fef3c7",
        textColor: "#92400e",
        fontSize: "16px",
        fontFamily: "serif",
        lineHeight: "1.8",
        marginBottom: "1.25rem"
      }
    },
    {
      id: "classic",
      name: "Classic",
      description: "A timeless, professional layout with elegant typography",
      icon: Book,
      isPremium: true,
      preview: {
        backgroundColor: "#fefefe",
        textColor: "#374151",
        fontSize: "15px",
        fontFamily: "serif",
        lineHeight: "1.65",
        marginBottom: "1rem"
      }
    },
    {
      id: "business",
      name: "Business",
      description: "Professional template for business books",
      icon: Briefcase,
      isPremium: true,
      preview: {
        backgroundColor: "#f1f5f9",
        textColor: "#1e293b",
        fontSize: "16px",
        fontFamily: "sans-serif",
        lineHeight: "1.6",
        marginBottom: "1.2rem"
      }
    },
    {
      id: "academic",
      name: "Academic",
      description: "Formal layout ideal for technical and academic works",
      icon: GraduationCap,
      isPremium: true,
      preview: {
        backgroundColor: "#ffffff",
        textColor: "#111827",
        fontSize: "14px",
        fontFamily: "serif",
        lineHeight: "1.75",
        marginBottom: "1rem"
      }
    }
  ];

  // Get template style based on selected template
  const getTemplateStyle = () => {
    const template = templates.find(t => t.id === formData.selectedTemplate);
    return template ? template.preview : templates[0].preview; // Default to original
  };

  const templateStyle = getTemplateStyle();

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
            <div className="flex items-center justify-between mb-2">
              <Progress value={progressPercentage} className="h-2 flex-1" data-testid="progress-bar" />
              {(isSaving || createBookMutation.isPending || updateBookMutation.isPending) && (
                <div className="ml-4 flex items-center text-sm text-muted-foreground">
                  <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full mr-2"></div>
                  Saving...
                </div>
              )}
              {currentBookId && !isSaving && !createBookMutation.isPending && !updateBookMutation.isPending && (
                <div className="ml-4 flex items-center text-sm text-green-600">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Saved
                </div>
              )}
            </div>
          </div>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
            {STEPS.map((step, index) => (
              <div
                key={step.id}
                className={`flex flex-col items-center text-center ${
                  step.id === currentStep
                    ? "text-primary"
                    : step.id < currentStep
                    ? "text-green-600"
                    : "text-muted-foreground"
                }`}
                data-testid={`step-${step.id}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium mb-2 ${
                    step.id === currentStep
                      ? "bg-primary text-primary-foreground"
                      : step.id < currentStep
                      ? "bg-green-600 text-white"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {step.id < currentStep ? "✓" : step.id}
                </div>
                <span className="text-xs font-medium">{step.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Step 1: Method Selection */}
        {currentStep === 1 && (
          <div className="space-y-8" data-testid="step-method">
            <div className="text-center">
              <h1 className="text-3xl font-bold mb-4">Choose Your Creation Method</h1>
              <p className="text-xl text-muted-foreground">
                Select how you'd like to create your e-book
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <Card
                className={`cursor-pointer transition-all hover:shadow-lg border-2 ${
                  formData.method === "ai" ? "border-primary bg-primary/5" : "border-border"
                }`}
                onClick={() => handleMethodSelect("ai")}
                data-testid="method-ai"
              >
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Sparkles className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-4">AI Generated Book</h3>
                  <p className="text-muted-foreground mb-6">
                    Let our AI create a complete book for you based on your topic and preferences. Perfect for getting started quickly.
                  </p>
                  <div className="space-y-2 text-sm text-left">
                    <div className="flex items-center space-x-2">
                      <div className="w-1 h-1 bg-primary rounded-full"></div>
                      <span>Automated content generation</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-1 h-1 bg-primary rounded-full"></div>
                      <span>Professional structure and flow</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-1 h-1 bg-primary rounded-full"></div>
                      <span>Ready in minutes</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card
                className={`cursor-pointer transition-all hover:shadow-lg border-2 ${
                  formData.method === "manual" ? "border-primary bg-primary/5" : "border-border"
                }`}
                onClick={() => handleMethodSelect("manual")}
                data-testid="method-manual"
              >
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <PenTool className="w-8 h-8 text-orange-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-4">Manual Creation</h3>
                  <p className="text-muted-foreground mb-6">
                    Write your book manually with our guided tools and templates. Full creative control over every word.
                  </p>
                  <div className="space-y-2 text-sm text-left">
                    <div className="flex items-center space-x-2">
                      <div className="w-1 h-1 bg-orange-600 rounded-full"></div>
                      <span>Complete creative control</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-1 h-1 bg-orange-600 rounded-full"></div>
                      <span>Chapter-by-chapter writing</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-1 h-1 bg-orange-600 rounded-full"></div>
                      <span>Professional templates</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
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
                          <div 
                            className="prose prose-sm max-w-none" 
                            data-testid={`chapter-content-${chapter.id}`}
                            style={{
                              backgroundColor: templateStyle.backgroundColor,
                              color: templateStyle.textColor,
                              fontSize: templateStyle.fontSize,
                              fontFamily: templateStyle.fontFamily,
                              lineHeight: templateStyle.lineHeight,
                              padding: "1.5rem",
                              borderRadius: "0.5rem",
                              border: "1px solid #e5e7eb"
                            }}
                          >
                            {chapter.content.split('\n\n').map((paragraph, paragraphIndex) => {
                              if (paragraph.trim().startsWith('The ') && paragraph.trim().includes('Changes')) {
                                return (
                                  <h4 key={paragraphIndex} className="font-bold text-xl mt-6 mb-3" style={{ color: templateStyle.textColor }}>
                                    {paragraph.trim()}
                                  </h4>
                                );
                              }
                              return (
                                <p 
                                  key={paragraphIndex} 
                                  className="leading-relaxed" 
                                  style={{ 
                                    marginBottom: templateStyle.marginBottom,
                                    color: templateStyle.textColor,
                                    opacity: 0.9
                                  }}
                                >
                                  {paragraph.trim()}
                                </p>
                              );
                            })}
                            <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-center opacity-75">
                              Template: {templates.find(t => t.id === formData.selectedTemplate)?.name || "Original Design"}
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
              </>
            ) : (
              <div className="text-center py-16" data-testid="no-chapters">
                <div className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FileText className="w-8 h-8 text-muted-foreground" />
                </div>
                <h2 className="text-2xl font-semibold mb-4">No Chapters Generated</h2>
                <p className="text-muted-foreground mb-6">
                  Go back to the Details step to ensure all required information is filled out.
                </p>
                <Button variant="outline" onClick={handleBack}>
                  <ArrowLeft className="mr-2 w-4 h-4" />
                  Back to Details
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Step 4: Template */}
        {currentStep === 4 && (
          <div className="space-y-8" data-testid="step-template">
            <div className="text-center">
              <h1 className="text-3xl font-bold mb-4">Choose Your Template</h1>
              <p className="text-xl text-muted-foreground">
                Select a design template for your book
              </p>
            </div>

            {/* Premium Banner */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 rounded-lg text-center">
              <div className="flex items-center justify-center space-x-2">
                <Star className="w-5 h-5" />
                <span className="font-medium">Unlock Premium Design Pack</span>
              </div>
            </div>

            {/* Template Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map((template) => {
                const IconComponent = template.icon;
                const isSelected = formData.selectedTemplate === template.id;
                
                return (
                  <Card
                    key={template.id}
                    className={`cursor-pointer transition-all hover:shadow-lg border-2 ${
                      isSelected ? "border-primary bg-primary/5" : "border-border"
                    } ${template.isPremium ? "relative" : ""}`}
                    onClick={() => handleTemplateSelect(template.id)}
                    data-testid={`template-${template.id}`}
                  >
                    {template.isPremium && (
                      <div className="absolute top-3 right-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-2 py-1 rounded text-xs font-medium">
                        Premium
                      </div>
                    )}
                    
                    <CardContent className="p-6">
                      <div className="text-center mb-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                          <IconComponent className="w-6 h-6 text-primary" />
                        </div>
                        <h3 className="font-semibold text-lg mb-2 flex items-center justify-center space-x-2">
                          <span>{template.name}</span>
                          {isSelected && <Check className="w-4 h-4 text-green-600" />}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          {template.description}
                        </p>
                      </div>

                      {/* Template Preview */}
                      <div className="border border-border rounded-lg p-4 mb-4">
                        <div 
                          className="text-center space-y-2"
                          style={{
                            backgroundColor: template.preview.backgroundColor,
                            color: template.preview.textColor,
                            fontSize: template.preview.fontSize,
                            fontFamily: template.preview.fontFamily,
                            lineHeight: template.preview.lineHeight,
                            padding: "1rem",
                            borderRadius: "0.5rem"
                          }}
                        >
                          <h4 className="font-bold text-lg">Understanding Teen Development</h4>
                          <p className="text-sm" style={{ marginBottom: template.preview.marginBottom }}>
                            Raising a teenager can feel like navigating uncharted territory. The rapid physical, emotional, and cognitive changes they undergo often leave parents bewildered...
                          </p>
                          <p className="text-xs opacity-75">Sample chapter content</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Selected Template Summary */}
            {formData.selectedTemplate && (
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                      <div>
                        <h3 className="font-semibold text-green-800">
                          Template Selected: {templates.find(t => t.id === formData.selectedTemplate)?.name}
                        </h3>
                        <p className="text-sm text-green-700">
                          {templates.find(t => t.id === formData.selectedTemplate)?.description}
                        </p>
                      </div>
                    </div>
                    {formData.chapters.length > 0 && (
                      <Button 
                        variant="outline" 
                        onClick={() => setCurrentStep(3)}
                        className="bg-white"
                        data-testid="button-preview-template"
                      >
                        Preview in Chapters
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Navigation */}
            <div className="flex justify-between items-center pt-8 border-t border-border" data-testid="template-navigation">
              <Button 
                variant="outline" 
                onClick={handleBack}
                data-testid="button-back-template"
              >
                <ArrowLeft className="mr-2 w-4 h-4" />
                Back to Chapters
              </Button>
              
              <Button
                onClick={handleNext}
                disabled={!formData.selectedTemplate}
                data-testid="button-continue-template"
              >
                Continue to Cover Design
                <ChevronRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 5: Cover Design */}
        {currentStep === 5 && (
          <div className="space-y-8" data-testid="step-cover">
            <div className="text-center">
              <h1 className="text-3xl font-bold mb-4">Book Cover Design</h1>
              <p className="text-xl text-muted-foreground">
                Upload or design your book cover
              </p>
            </div>

            {!formData.coverImageUrl ? (
              <div className="space-y-6">
                {/* Upload Section */}
                <Card>
                  <CardContent className="p-8">
                    <div className="text-center">
                      <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Image className="w-12 h-12 text-primary" />
                      </div>
                      <h3 className="text-xl font-semibold mb-4">Upload Cover Image</h3>
                      <p className="text-muted-foreground mb-6">
                        Upload your own cover design or use our AI-generated suggestions
                      </p>
                      
                      <div className="flex flex-col items-center space-y-4">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleCoverImageUpload}
                          className="hidden"
                          id="cover-upload"
                          data-testid="input-cover-upload"
                        />
                        <label
                          htmlFor="cover-upload"
                          className="cursor-pointer inline-flex items-center space-x-2 bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-3 rounded-lg font-medium transition-colors"
                          data-testid="button-upload-cover"
                        >
                          <Upload className="w-5 h-5" />
                          <span>Choose Cover Image</span>
                        </label>
                        <p className="text-sm text-muted-foreground">
                          Supported formats: JPG, PNG, GIF (max 10MB)
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Alternative Options */}
                <div className="grid md:grid-cols-2 gap-6">
                  <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                    <CardContent className="p-6 text-center">
                      <Sparkles className="w-12 h-12 text-primary mx-auto mb-4" />
                      <h3 className="font-semibold mb-2">AI Generated Cover</h3>
                      <p className="text-sm text-muted-foreground">
                        Let our AI create a professional cover based on your book details
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                    <CardContent className="p-6 text-center">
                      <Palette className="w-12 h-12 text-primary mx-auto mb-4" />
                      <h3 className="font-semibold mb-2">Design Templates</h3>
                      <p className="text-sm text-muted-foreground">
                        Choose from our collection of professional templates
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Cover Preview */}
                <Card>
                  <CardContent className="p-8">
                    <div className="flex items-start justify-between mb-6">
                      <h3 className="text-lg font-semibold">Generated Cover Image</h3>
                      <Button
                        variant="outline"
                        onClick={handleReplaceCover}
                        className="flex items-center space-x-2"
                        data-testid="button-replace-cover"
                      >
                        <Replace className="w-4 h-4" />
                        <span>Replace Cover</span>
                      </Button>
                    </div>
                    
                    <div className="flex justify-center">
                      <div className="relative">
                        <img
                          src={formData.coverImageUrl}
                          alt="Book Cover Preview"
                          className="max-w-sm max-h-96 object-contain rounded-lg shadow-lg"
                          data-testid="cover-preview-image"
                        />
                        <div className="absolute inset-0 rounded-lg border-2 border-primary/20"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Cover Details */}
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                      <div>
                        <h3 className="font-semibold text-green-800">Cover Image Ready</h3>
                        <p className="text-sm text-green-700">
                          Your cover image has been uploaded and is ready for export
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between items-center pt-8 border-t border-border" data-testid="cover-navigation">
              <Button 
                variant="outline" 
                onClick={handleBack}
                data-testid="button-back-cover"
              >
                <ArrowLeft className="mr-2 w-4 h-4" />
                Back to Template
              </Button>
              
              <Button
                onClick={handleNext}
                disabled={!formData.coverImageUrl}
                data-testid="button-continue-cover"
              >
                Continue to Export
                <ChevronRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 6: Export */}
        {currentStep === 6 && (
          <div className="space-y-8" data-testid="step-export">
            <div className="text-center">
              <h1 className="text-3xl font-bold mb-4">Book Preview</h1>
              <p className="text-xl text-muted-foreground">
                Preview and export your completed e-book
              </p>
            </div>

            {/* Interactive Flipbook Preview */}
            <Card>
              <CardContent className="p-8">
                <h3 className="text-lg font-semibold mb-4">Interactive Flipbook Preview</h3>
                <p className="text-muted-foreground mb-6">
                  Preview your book in an interactive flipbook format. See how readers will experience your content with realistic page-turning effects.
                </p>
                
                <Button 
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                  data-testid="button-open-flipbook"
                >
                  <BookOpen className="w-5 h-5 mr-2" />
                  Open Flipbook Preview
                </Button>
              </CardContent>
            </Card>

            {/* Manuscript Export */}
            <div>
              <h3 className="text-xl font-semibold mb-6">Manuscript Export</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* DOCX Format */}
                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <Edit className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                    <h4 className="font-semibold text-center mb-2">DOCX Format</h4>
                    <p className="text-sm text-muted-foreground text-center mb-4">
                      Best for publishing platforms like Amazon KDP and Google Books. Allows for easy editing and formatting adjustments in Microsoft Word.
                    </p>
                    <Button 
                      className="w-full bg-primary hover:bg-primary/90"
                      onClick={() => handleExport('docx')}
                      disabled={exportMutation.isPending}
                      data-testid="button-export-docx"
                    >
                      {exportMutation.isPending && exportMutation.variables?.format === 'docx' ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Exporting...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4 mr-2" />
                          Export as DOCX
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                {/* PDF Format */}
                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <FileText className="w-12 h-12 text-red-600 mx-auto mb-4" />
                    <h4 className="font-semibold text-center mb-2">PDF Format</h4>
                    <p className="text-sm text-muted-foreground text-center mb-4">
                      Perfect for print-ready documents and digital distribution. Maintains exact formatting across all devices and platforms.
                    </p>
                    <Button 
                      className="w-full bg-primary hover:bg-primary/90"
                      onClick={() => handleExport('pdf')}
                      disabled={exportMutation.isPending}
                      data-testid="button-export-pdf"
                    >
                      {exportMutation.isPending && exportMutation.variables?.format === 'pdf' ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Exporting...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4 mr-2" />
                          Export as PDF
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                {/* EPUB Format */}
                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <Smartphone className="w-12 h-12 text-green-600 mx-auto mb-4" />
                    <h4 className="font-semibold text-center mb-2">EPUB Format</h4>
                    <p className="text-sm text-muted-foreground text-center mb-4">
                      Perfect for e-readers like Kindle, Kobo, and Apple Books. Reflowable format that adapts to different screen sizes.
                    </p>
                    <Button 
                      className="w-full bg-primary hover:bg-primary/90"
                      onClick={() => handleExport('epub')}
                      disabled={exportMutation.isPending}
                      data-testid="button-export-epub"
                    >
                      {exportMutation.isPending && exportMutation.variables?.format === 'epub' ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Exporting...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4 mr-2" />
                          Export as EPUB
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                {/* Advanced Formats */}
                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <Code className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                    <h4 className="font-semibold text-center mb-2">Advanced Formats</h4>
                    <p className="text-sm text-muted-foreground text-center mb-4">
                      For developers and advanced users. Export in raw formats for custom processing.
                    </p>
                    <div className="space-y-2">
                      <Button 
                        variant="outline" 
                        className="w-full text-xs"
                        onClick={() => handleExport('markdown')}
                        disabled={exportMutation.isPending}
                        data-testid="button-export-markdown"
                      >
                        <Download className="w-3 h-3 mr-1" />
                        Export as Markdown
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full text-xs"
                        onClick={() => handleExport('html')}
                        disabled={exportMutation.isPending}
                        data-testid="button-export-html"
                      >
                        <Download className="w-3 h-3 mr-1" />
                        Export as HTML
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Export Status */}
            {exportMutation.isPending && (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
                    <div>
                      <h3 className="font-semibold text-blue-800">
                        Generating {exportMutation.variables?.format?.toUpperCase()} Export...
                      </h3>
                      <p className="text-sm text-blue-700">
                        Please wait while we prepare your book for download
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Cover Export */}
            <div>
              <h3 className="text-xl font-semibold mb-6">Cover Export</h3>
              <Card>
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row items-start gap-6">
                    {/* Cover Preview */}
                    <div className="flex-shrink-0">
                      {formData.coverImageUrl ? (
                        <img
                          src={formData.coverImageUrl}
                          alt="Book Cover"
                          className="w-32 h-48 object-cover rounded-lg shadow-md"
                          data-testid="cover-export-preview"
                        />
                      ) : (
                        <div className="w-32 h-48 bg-muted/20 rounded-lg flex items-center justify-center">
                          <p className="text-xs text-muted-foreground text-center">No cover image</p>
                        </div>
                      )}
                    </div>

                    {/* Cover Export Options */}
                    <div className="flex-grow">
                      <h4 className="font-semibold mb-2">Cover Image</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        Download your book cover in high resolution for use in marketing materials, online stores or on-demand platforms.
                      </p>
                      
                      <div className="flex flex-wrap gap-3">
                        <Button 
                          className="bg-primary hover:bg-primary/90"
                          disabled={!formData.coverImageUrl}
                          data-testid="button-download-cover-jpg"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download Cover (JPG)
                        </Button>
                        <Button 
                          variant="outline"
                          disabled={!formData.coverImageUrl}
                          data-testid="button-download-cover-png"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          PNG
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center pt-8 border-t border-border" data-testid="export-navigation">
              <Button 
                variant="outline" 
                onClick={handleBack}
                data-testid="button-back-export"
              >
                <ArrowLeft className="mr-2 w-4 h-4" />
                Back to Cover
              </Button>
              
              <Button
                onClick={handleNext}
                data-testid="button-continue-export"
              >
                Continue to Publish
                <ChevronRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Coming Soon Steps */}
        {currentStep > 6 && (
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