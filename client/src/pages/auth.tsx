import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BookOpen, Mail, Lock, User, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [, setLocation] = useLocation();
  const { login, signup } = useAuth();

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      if (isLogin) {
        await login(formData.email, formData.password);
      } else {
        await signup(formData.username, formData.email, formData.password);
      }
      setLocation("/create-book");
    } catch (err: any) {
      setError(err?.message || "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <BookOpen className="w-12 h-12 text-purple-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">MyBookStore</h1>
          <p className="text-gray-600">
            {isLogin ? "Welcome back" : "Create your account"}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {isLogin ? "Sign in to your account" : "Don't have an account? Sign up"}
          </p>
        </div>

        {/* Auth Card */}
        <Card className="shadow-xl border-0">
          <CardHeader className="space-y-1 pb-4">
            <div className="flex items-center justify-center">
              <Button
                variant="ghost"
                className="text-sm text-purple-600 hover:text-purple-700"
                onClick={() => setIsLogin(!isLogin)}
                data-testid="toggle-auth-mode"
              >
                {isLogin ? "Sign in with Google" : ""}
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive" data-testid="auth-error">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Your email address"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="pl-10 h-12 border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                    required
                    data-testid="input-email"
                  />
                </div>
              </div>

              {/* Username Field (Sign Up Only) */}
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm font-medium text-gray-700">
                    Username
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="username"
                      type="text"
                      placeholder="Choose a username"
                      value={formData.username}
                      onChange={(e) => handleInputChange("username", e.target.value)}
                      className="pl-10 h-12 border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                      required
                      data-testid="input-username"
                    />
                  </div>
                </div>
              )}

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Your Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Your password"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    className="pl-10 pr-12 h-12 border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                    required
                    minLength={6}
                    data-testid="input-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    data-testid="toggle-password-visibility"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 text-gray-400" />
                    ) : (
                      <Eye className="w-4 h-4 text-gray-400" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-12 bg-green-500 hover:bg-green-600 text-white font-medium text-lg"
                disabled={isLoading}
                data-testid="submit-auth-form"
              >
                {isLoading ? "Please wait..." : isLogin ? "SIGN IN" : "SIGN UP"}
              </Button>
            </form>

            {/* Forgot Password Link (Login Only) */}
            {isLogin && (
              <div className="text-center pt-4">
                <Button
                  variant="link"
                  className="text-sm text-purple-600 hover:text-purple-700 p-0 h-auto"
                  data-testid="forgot-password-link"
                >
                  Forgot your password?
                </Button>
              </div>
            )}

            {/* Toggle Between Login/Signup */}
            <div className="text-center pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-600">
                {isLogin ? "Don't have an account?" : "Already have an account?"}
                <Button
                  variant="link"
                  className="text-sm text-purple-600 hover:text-purple-700 p-0 h-auto ml-1"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setError("");
                    setFormData({ username: "", email: "", password: "" });
                  }}
                  data-testid="toggle-auth-mode-link"
                >
                  {isLogin ? "Sign up" : "Sign in"}
                </Button>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Features for new users */}
        {!isLogin && (
          <div className="mt-8 text-center">
            <div className="grid grid-cols-1 gap-4 max-w-sm mx-auto">
              <div className="flex items-center text-sm text-gray-600">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                <span>1 Free Credit to create your first e-book</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                <span>AI-powered chapter generation</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                <span>Multiple export formats (PDF, EPUB, HTML)</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}