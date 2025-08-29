import { useState } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
// Simple table component since we don't have @/components/ui/table
const Table = ({ children, ...props }: any) => <table className="w-full border-collapse" {...props}>{children}</table>;
const TableHeader = ({ children, ...props }: any) => <thead {...props}>{children}</thead>;
const TableBody = ({ children, ...props }: any) => <tbody {...props}>{children}</tbody>;
const TableRow = ({ children, ...props }: any) => <tr className="border-b" {...props}>{children}</tr>;
const TableHead = ({ children, ...props }: any) => <th className="text-left p-2 font-medium" {...props}>{children}</th>;
const TableCell = ({ children, ...props }: any) => <td className="p-2" {...props}>{children}</td>;
import { useToast } from "@/hooks/use-toast";
import { Shield, Settings, Users, MessageSquare, Save, RefreshCw, AlertTriangle, Plus, Trash2, Edit2, X } from "lucide-react";

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
  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState({
    username: "",
    email: "",
    password: "",
    role: "free",
    credits: 1,
  });

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

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (userData: typeof newUser) => {
      await apiRequest("POST", "/api/admin/users", userData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setShowAddUserForm(false);
      setNewUser({ username: "", email: "", password: "", role: "free", credits: 1 });
      toast({
        title: "User Created",
        description: "New user has been created successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create user",
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
      setEditingUser(null);
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

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      await apiRequest("DELETE", `/api/admin/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "User Deleted",
        description: "User has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
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

  const handleCreateUser = () => {
    if (!newUser.username || !newUser.email || !newUser.password) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    createUserMutation.mutate(newUser);
  };

  const handleUpdateUser = (userId: string, updates: Partial<User>) => {
    updateUserMutation.mutate({ id: userId, updates });
  };

  const handleDeleteUser = (userId: string, username: string) => {
    if (window.confirm(`Are you sure you want to delete user "${username}"? This action cannot be undone.`)) {
      deleteUserMutation.mutate(userId);
    }
  };

  const handleUpdateUserCredits = (userId: string, newCredits: number) => {
    updateUserMutation.mutate({
      id: userId,
      updates: { credits: newCredits },
    });
  };

  const startEditUser = (user: User) => {
    setEditingUser({ ...user });
  };

  const saveEditUser = () => {
    if (editingUser) {
      handleUpdateUser(editingUser.id, editingUser);
    }
  };

  const cancelEditUser = () => {
    setEditingUser(null);
  };

  const getConfigValue = (key: string) => {
    const config = Array.isArray(configs) ? configs.find((c: AdminConfig) => c.configKey === key) : undefined;
    return config?.configValue?.prompt || "";
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* ChatGPT Prompt */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <MessageSquare className="w-5 h-5" />
                    <span>ChatGPT Prompt</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="chatgpt-prompt">System Prompt</Label>
                    <Textarea
                      id="chatgpt-prompt"
                      placeholder="Enter ChatGPT system prompt for chapter generation..."
                      value={getConfigValue("chatgpt_prompt")}
                      onChange={(e) => {
                        // Handle real-time updates
                      }}
                      rows={8}
                      className="mt-2"
                      data-testid="chatgpt-prompt-input"
                    />
                  </div>
                  <Button 
                    onClick={() => handleSavePrompt(
                      "chatgpt_prompt", 
                      (document.getElementById("chatgpt-prompt") as HTMLTextAreaElement)?.value || "",
                      "ChatGPT prompt configuration for chapter generation"
                    )}
                    disabled={saveConfigMutation.isPending}
                    data-testid="save-chatgpt-prompt"
                  >
                    {saveConfigMutation.isPending ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Save ChatGPT Prompt
                  </Button>
                </CardContent>
              </Card>

              {/* Claude Prompt */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <MessageSquare className="w-5 h-5" />
                    <span>Claude Prompt</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="claude-prompt">System Prompt</Label>
                    <Textarea
                      id="claude-prompt"
                      placeholder="Enter Claude system prompt for chapter generation..."
                      value={getConfigValue("claude_prompt")}
                      onChange={(e) => {
                        // Handle real-time updates
                      }}
                      rows={8}
                      className="mt-2"
                      data-testid="claude-prompt-input"
                    />
                  </div>
                  <Button 
                    onClick={() => handleSavePrompt(
                      "claude_prompt", 
                      (document.getElementById("claude-prompt") as HTMLTextAreaElement)?.value || "",
                      "Claude prompt configuration for chapter generation"
                    )}
                    disabled={saveConfigMutation.isPending}
                    data-testid="save-claude-prompt"
                  >
                    {saveConfigMutation.isPending ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Save Claude Prompt
                  </Button>
                </CardContent>
              </Card>
            </div>

            {configsLoading && (
              <Alert>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <AlertDescription>Loading configurations...</AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <div className="space-y-6">
            {/* Add User Section */}
            {showAddUserForm && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Add New User</span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setShowAddUserForm(false)}
                      data-testid="close-add-user-form"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="new-username">Username</Label>
                      <Input
                        id="new-username"
                        value={newUser.username}
                        onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                        placeholder="Enter username"
                        data-testid="new-user-username"
                      />
                    </div>
                    <div>
                      <Label htmlFor="new-email">Email</Label>
                      <Input
                        id="new-email"
                        type="email"
                        value={newUser.email}
                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                        placeholder="Enter email"
                        data-testid="new-user-email"
                      />
                    </div>
                    <div>
                      <Label htmlFor="new-password">Password</Label>
                      <Input
                        id="new-password"
                        type="password"
                        value={newUser.password}
                        onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                        placeholder="Enter password"
                        data-testid="new-user-password"
                      />
                    </div>
                    <div>
                      <Label htmlFor="new-role">Role</Label>
                      <Select
                        value={newUser.role}
                        onValueChange={(value) => setNewUser({ ...newUser, role: value })}
                      >
                        <SelectTrigger data-testid="new-user-role">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="free">Free</SelectItem>
                          <SelectItem value="subscribed">Subscribed</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="new-credits">Credits</Label>
                      <Input
                        id="new-credits"
                        type="number"
                        value={newUser.credits}
                        onChange={(e) => setNewUser({ ...newUser, credits: parseInt(e.target.value) || 0 })}
                        placeholder="Enter credits"
                        data-testid="new-user-credits"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2 mt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => setShowAddUserForm(false)}
                      disabled={createUserMutation.isPending}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleCreateUser}
                      disabled={createUserMutation.isPending}
                      data-testid="create-user-button"
                    >
                      {createUserMutation.isPending ? (
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Plus className="w-4 h-4 mr-2" />
                      )}
                      Create User
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* User Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>User Management</span>
                  <Button 
                    onClick={() => setShowAddUserForm(true)}
                    disabled={showAddUserForm}
                    data-testid="add-user-button"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add User
                  </Button>
                </CardTitle>
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
                          <TableCell className="font-medium">
                            {editingUser?.id === user.id ? (
                              <Input
                                value={editingUser.username}
                                onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
                                className="w-full"
                                data-testid={`edit-username-${user.id}`}
                              />
                            ) : (
                              user.username
                            )}
                          </TableCell>
                          <TableCell>
                            {editingUser?.id === user.id ? (
                              <Input
                                value={editingUser.email}
                                onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                                className="w-full"
                                data-testid={`edit-email-${user.id}`}
                              />
                            ) : (
                              user.email
                            )}
                          </TableCell>
                          <TableCell>
                            {editingUser?.id === user.id ? (
                              <Select
                                value={editingUser.role}
                                onValueChange={(value) => setEditingUser({ ...editingUser, role: value })}
                              >
                                <SelectTrigger data-testid={`edit-role-${user.id}`}>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="free">Free</SelectItem>
                                  <SelectItem value="subscribed">Subscribed</SelectItem>
                                  <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              <Badge 
                                className={
                                  user.role === "admin" ? "bg-red-500" :
                                  user.role === "subscribed" ? "bg-green-500" : "bg-blue-500"
                                }
                              >
                                {user.role}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {editingUser?.id === user.id ? (
                              <Input
                                type="number"
                                value={editingUser.credits}
                                onChange={(e) => setEditingUser({ ...editingUser, credits: parseInt(e.target.value) || 0 })}
                                className="w-20"
                                data-testid={`edit-credits-${user.id}`}
                              />
                            ) : (
                              <Input
                                type="number"
                                value={user.credits}
                                onChange={(e) => handleUpdateUserCredits(user.id, parseInt(e.target.value))}
                                className="w-20"
                                disabled={updateUserMutation.isPending}
                                data-testid={`credits-input-${user.id}`}
                              />
                            )}
                          </TableCell>
                          <TableCell>
                            {editingUser?.id === user.id ? (
                              <div className="flex items-center space-x-2">
                                <Switch
                                  checked={editingUser.isActive}
                                  onCheckedChange={(checked) => setEditingUser({ ...editingUser, isActive: checked })}
                                  data-testid={`edit-active-${user.id}`}
                                />
                                <span>{editingUser.isActive ? "Active" : "Inactive"}</span>
                              </div>
                            ) : (
                              <Badge variant={user.isActive ? "default" : "secondary"}>
                                {user.isActive ? "Active" : "Inactive"}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              {editingUser?.id === user.id ? (
                                <>
                                  <Button 
                                    size="sm" 
                                    onClick={saveEditUser}
                                    disabled={updateUserMutation.isPending}
                                    data-testid={`save-user-${user.id}`}
                                  >
                                    {updateUserMutation.isPending ? (
                                      <RefreshCw className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <Save className="w-4 h-4" />
                                    )}
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={cancelEditUser}
                                    disabled={updateUserMutation.isPending}
                                    data-testid={`cancel-edit-${user.id}`}
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => startEditUser(user)}
                                    disabled={updateUserMutation.isPending || editingUser !== null}
                                    data-testid={`edit-user-${user.id}`}
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="destructive"
                                    onClick={() => handleDeleteUser(user.id, user.username)}
                                    disabled={deleteUserMutation.isPending}
                                    data-testid={`delete-user-${user.id}`}
                                  >
                                    {deleteUserMutation.isPending ? (
                                      <RefreshCw className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <Trash2 className="w-4 h-4" />
                                    )}
                                  </Button>
                                </>
                              )}
                            </div>
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