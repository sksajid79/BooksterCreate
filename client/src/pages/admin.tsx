import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import Navigation from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
// Simple table component since we don't have @/components/ui/table
const Table = ({ children, ...props }: any) => <table className="w-full border-collapse" {...props}>{children}</table>;
const TableHeader = ({ children, ...props }: any) => <thead {...props}>{children}</thead>;
const TableBody = ({ children, ...props }: any) => <tbody {...props}>{children}</tbody>;
const TableRow = ({ children, ...props }: any) => <tr className="border-b" {...props}>{children}</tr>;
const TableHead = ({ children, ...props }: any) => <th className="text-left p-2 font-medium" {...props}>{children}</th>;
const TableCell = ({ children, ...props }: any) => <td className="p-2" {...props}>{children}</td>;
import { useToast } from "@/hooks/use-toast";
import { Shield, Settings, Users, MessageSquare, Save, RefreshCw, AlertTriangle } from "lucide-react";

interface AdminConfig {
  id: string;
  configKey: string;
  configValue: any;
  description: string;
  createdAt: string;
  updatedAt: string;
}

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  credits: number;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function AdminPanel() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("prompts");
  const [bookOutlineValue, setBookOutlineValue] = useState("");
  const [chapterGenerationValue, setChapterGenerationValue] = useState("");

  // Redirect if not admin
  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-4xl mx-auto p-6">
          <Card>
            <CardContent className="p-8 text-center">
              <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
              <p className="text-muted-foreground">You need admin privileges to access this page.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Fetch admin configs
  const { data: configs, isLoading: configsLoading } = useQuery({
    queryKey: ["/api/admin/configs"],
    enabled: isAuthenticated && user?.role === "admin",
  });

  // Fetch book outline prompt
  const { data: bookOutlinePrompt, isLoading: outlineLoading } = useQuery({
    queryKey: ["/api/admin/prompts/book_outline"],
    enabled: isAuthenticated && user?.role === "admin",
  });

  // Fetch chapter generation prompt
  const { data: chapterPrompt, isLoading: chapterLoading } = useQuery({
    queryKey: ["/api/admin/prompts/chapter_generation"],
    enabled: isAuthenticated && user?.role === "admin",
  });

  // Update state when data is loaded
  useEffect(() => {
    if (bookOutlinePrompt?.configValue?.prompt) {
      setBookOutlineValue(bookOutlinePrompt.configValue.prompt);
    }
  }, [bookOutlinePrompt]);

  useEffect(() => {
    if (chapterPrompt?.configValue?.prompt) {
      setChapterGenerationValue(chapterPrompt.configValue.prompt);
    }
  }, [chapterPrompt]);

  // Fetch users
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ["/api/admin/users"],
    enabled: isAuthenticated && user?.role === "admin",
  });

  // Save config mutation
  const saveConfigMutation = useMutation({
    mutationFn: async (configData: { configKey: string; configValue: any; description: string }) => {
      await apiRequest("POST", "/api/admin/configs", configData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/configs"] });
      toast({
        title: "Configuration Saved",
        description: "AI prompt configuration has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save configuration",
        variant: "destructive",
      });
    },
  });

  // Update prompt mutation
  const updatePromptMutation = useMutation({
    mutationFn: async ({ promptType, prompt, description }: { promptType: string; prompt: string; description: string }) => {
      await apiRequest("PUT", `/api/admin/prompts/${promptType}`, { prompt, description });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/prompts/${variables.promptType}`] });
      toast({
        title: "Prompt Updated",
        description: "AI prompt has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update prompt",
        variant: "destructive",
      });
    },
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<User> }) => {
      await apiRequest("PUT", `/api/admin/users/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "User Updated",
        description: "User information has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update user",
        variant: "destructive",
      });
    },
  });

  const handleSavePrompt = (configKey: string, prompt: string, description: string) => {
    saveConfigMutation.mutate({
      configKey,
      configValue: { prompt },
      description,
    });
  };

  const handleUpdateUserCredits = (userId: string, newCredits: number) => {
    updateUserMutation.mutate({
      id: userId,
      updates: { credits: newCredits },
    });
  };

  const getConfigValue = (key: string) => {
    const config = Array.isArray(configs) ? configs.find((c: AdminConfig) => c.configKey === key) : undefined;
    return config?.configValue?.prompt || "";
  };

  const getPromptValue = (promptData: any) => {
    if (!promptData) return "";
    return promptData.configValue?.prompt || "";
  };

  const handleUpdatePrompt = (promptType: string) => {
    const description = promptType === 'book_outline' 
      ? 'AI prompt for generating comprehensive book outlines with structured chapters'
      : 'AI prompt for generating detailed individual chapter content with proper formatting';
    
    const promptValue = promptType === 'book_outline' ? bookOutlineValue : chapterGenerationValue;
    
    updatePromptMutation.mutate({
      promptType,
      prompt: promptValue,
      description
    });
  };

  const tabs = [
    { id: "prompts", label: "AI Prompts", icon: MessageSquare },
    { id: "users", label: "User Management", icon: Users },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <Shield className="w-8 h-8 text-red-500" />
            <h1 className="text-3xl font-bold">Admin Panel</h1>
          </div>
          <p className="text-muted-foreground">
            Manage AI prompts, users, and system configuration
          </p>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-muted p-1 rounded-lg mb-6">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "default" : "ghost"}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center space-x-2"
              data-testid={`tab-${tab.id}`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </Button>
          ))}
        </div>

        {/* AI Prompts Tab */}
        {activeTab === "prompts" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              {/* Book Outline Generation Prompt */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <MessageSquare className="w-5 h-5" />
                    <span>📚 Book Outline Generation Prompt</span>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-2">
                    Creates comprehensive book outlines with structured chapters and logical flow
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
                    <h4 className="text-sm font-semibold mb-2">Available Template Variables:</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                      <code className="bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded">{"{title}"}</code>
                      <code className="bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded">{"{targetAudience}"}</code>
                      <code className="bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded">{"{description}"}</code>
                      <code className="bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded">{"{toneStyle}"}</code>
                      <code className="bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded">{"{mission}"}</code>
                      <code className="bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded">{"{numberOfChapters}"}</code>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="book-outline-prompt">Book Outline System Prompt</Label>
                    <Textarea
                      id="book-outline-prompt"
                      placeholder="Enter system prompt for book outline generation..."
                      value={bookOutlineValue}
                      onChange={(e) => setBookOutlineValue(e.target.value)}
                      rows={12}
                      className="mt-2 font-mono text-sm"
                      data-testid="book-outline-prompt-input"
                    />
                  </div>
                  
                  <Button 
                    onClick={() => handleUpdatePrompt("book_outline")}
                    disabled={updatePromptMutation.isPending || outlineLoading}
                    data-testid="save-book-outline-prompt"
                    className="w-full"
                  >
                    {updatePromptMutation.isPending ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Save Book Outline Prompt
                  </Button>
                </CardContent>
              </Card>

              {/* Chapter Content Generation Prompt */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <MessageSquare className="w-5 h-5" />
                    <span>📝 Chapter Content Generation Prompt</span>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-2">
                    Generates detailed individual chapter content with proper structure and engaging insights
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg">
                    <h4 className="text-sm font-semibold mb-2">Available Template Variables:</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                      <code className="bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded">{"{title}"}</code>
                      <code className="bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded">{"{targetAudience}"}</code>
                      <code className="bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded">{"{description}"}</code>
                      <code className="bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded">{"{toneStyle}"}</code>
                      <code className="bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded">{"{mission}"}</code>
                      <code className="bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded">{"{chapterNumber}"}</code>
                      <code className="bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded">{"{chapterTitle}"}</code>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="chapter-generation-prompt">Chapter Generation System Prompt</Label>
                    <Textarea
                      id="chapter-generation-prompt"
                      placeholder="Enter system prompt for chapter content generation..."
                      value={chapterGenerationValue}
                      onChange={(e) => setChapterGenerationValue(e.target.value)}
                      rows={12}
                      className="mt-2 font-mono text-sm"
                      data-testid="chapter-generation-prompt-input"
                    />
                  </div>
                  
                  <Button 
                    onClick={() => handleUpdatePrompt("chapter_generation")}
                    disabled={updatePromptMutation.isPending || chapterLoading}
                    data-testid="save-chapter-generation-prompt"
                    className="w-full"
                  >
                    {updatePromptMutation.isPending ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Save Chapter Generation Prompt
                  </Button>
                </CardContent>
              </Card>
            </div>

            {(outlineLoading || chapterLoading) && (
              <Alert>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <AlertDescription>Loading AI prompts...</AlertDescription>
              </Alert>
            )}

            {/* Prompt Usage Guide */}
            <Card>
              <CardHeader>
                <CardTitle>💡 Prompt Customization Guide</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Template Variables</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Variables are automatically replaced with user input</li>
                      <li>• Use curly braces: <code>{"{variableName}"}</code></li>
                      <li>• Variables maintain exact capitalization</li>
                      <li>• Missing variables become empty strings</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Best Practices</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Keep prompts specific and actionable</li>
                      <li>• Include output format requirements</li>
                      <li>• Test prompts with different book types</li>
                      <li>• Changes take effect immediately</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <Alert>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <AlertDescription>Loading users...</AlertDescription>
                  </Alert>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Username</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Credits</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Array.isArray(users) && users.map((user: User) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.username}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge 
                              className={
                                user.role === "admin" ? "bg-red-500" :
                                user.role === "subscribed" ? "bg-green-500" : "bg-blue-500"
                              }
                            >
                              {user.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={user.credits}
                              onChange={(e) => handleUpdateUserCredits(user.id, parseInt(e.target.value))}
                              className="w-20"
                              disabled={updateUserMutation.isPending}
                              data-testid={`credits-input-${user.id}`}
                            />
                          </TableCell>
                          <TableCell>
                            <Badge variant={user.isActive ? "default" : "secondary"}>
                              {user.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button 
                              size="sm" 
                              variant="outline"
                              disabled={updateUserMutation.isPending}
                              data-testid={`edit-user-${user.id}`}
                            >
                              Edit
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>System Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <Alert>
                  <Settings className="h-4 w-4" />
                  <AlertDescription>
                    System settings management coming soon. This will include credit pricing, 
                    subscription tiers, and platform configuration options.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}