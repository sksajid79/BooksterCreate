import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { BookOpen, User, Settings, LogOut, CreditCard, Shield, Menu, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function Navigation() {
  const { user, logout, isAuthenticated } = useAuth();
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { href: "/", label: "Home", active: location === "/" },
    { href: "/create-book", label: "Create Book", active: location === "/create-book" },
  ];

  const getUserInitials = (user: any) => {
    if (user?.username) {
      return user.username.slice(0, 2).toUpperCase();
    }
    return "U";
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin": return "bg-red-500";
      case "subscribed": return "bg-green-500";
      default: return "bg-blue-500";
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "admin": return "Admin";
      case "subscribed": return "Pro";
      default: return "Free";
    }
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/">
              <div className="flex items-center cursor-pointer" data-testid="nav-logo">
                <BookOpen className="w-8 h-8 text-purple-600 mr-3" />
                <span className="text-xl font-bold text-gray-900">MyBookStore</span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={item.active ? "default" : "ghost"}
                  className={item.active ? "bg-purple-600 text-white" : ""}
                  data-testid={`nav-${item.label.toLowerCase().replace(" ", "-")}`}
                >
                  {item.label}
                </Button>
              </Link>
            ))}
          </div>

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            {isAuthenticated && user ? (
              <div className="flex items-center space-x-3">
                {/* Credits Display */}
                <div className="hidden sm:flex items-center space-x-2">
                  <CreditCard className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700" data-testid="credits-display">
                    {user.credits} credits
                  </span>
                </div>

                {/* User Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full" data-testid="user-menu-trigger">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-purple-100 text-purple-600 text-sm font-medium">
                          {getUserInitials(user)}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        <div className="flex items-center space-x-2">
                          <p className="font-medium" data-testid="user-menu-username">{user.username}</p>
                          <Badge 
                            className={`${getRoleColor(user.role)} text-white text-xs px-2 py-0.5`}
                            data-testid="user-role-badge"
                          >
                            {getRoleLabel(user.role)}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground" data-testid="user-menu-email">
                          {user.email}
                        </p>
                        <p className="text-xs text-muted-foreground" data-testid="user-menu-credits">
                          {user.credits} credits remaining
                        </p>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem data-testid="user-menu-profile">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                    {user.role === "admin" && (
                      <Link href="/admin">
                        <DropdownMenuItem data-testid="user-menu-admin">
                          <Shield className="mr-2 h-4 w-4" />
                          <span>Admin Panel</span>
                        </DropdownMenuItem>
                      </Link>
                    )}
                    <DropdownMenuItem data-testid="user-menu-settings">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout} data-testid="user-menu-logout">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link href="/auth">
                  <Button variant="ghost" data-testid="nav-sign-in">
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth">
                  <Button className="bg-purple-600 hover:bg-purple-700" data-testid="nav-sign-up">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                data-testid="mobile-menu-toggle"
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200" data-testid="mobile-menu">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={item.active ? "default" : "ghost"}
                    className={`w-full justify-start ${item.active ? "bg-purple-600 text-white" : ""}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                    data-testid={`mobile-nav-${item.label.toLowerCase().replace(" ", "-")}`}
                  >
                    {item.label}
                  </Button>
                </Link>
              ))}
              
              {isAuthenticated && user && (
                <div className="pt-4 border-t border-gray-200 mt-4">
                  <div className="flex items-center space-x-3 px-3 py-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-purple-100 text-purple-600 text-sm font-medium">
                        {getUserInitials(user)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-sm">{user.username}</span>
                        <Badge className={`${getRoleColor(user.role)} text-white text-xs px-2 py-0.5`}>
                          {getRoleLabel(user.role)}
                        </Badge>
                      </div>
                      <span className="text-xs text-gray-500">{user.credits} credits</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => {
                      logout();
                      setIsMobileMenuOpen(false);
                    }}
                    data-testid="mobile-logout"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}