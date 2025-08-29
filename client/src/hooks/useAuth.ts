import React, { useState, useEffect, createContext, useContext } from "react";
import { User } from "@shared/schema";
import { AuthService } from "@/lib/auth";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing authentication on mount
    const initAuth = async () => {
      if (AuthService.isAuthenticated()) {
        try {
          const currentUser = await AuthService.getCurrentUser();
          setUser(currentUser);
        } catch (error) {
          console.error("Failed to restore authentication:", error);
          AuthService.removeToken();
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const { user: loggedInUser } = await AuthService.login({ email, password });
      setUser(loggedInUser);
    } catch (error) {
      throw error;
    }
  };

  const signup = async (username: string, email: string, password: string) => {
    try {
      const { user: newUser } = await AuthService.signup({ username, email, password });
      setUser(newUser);
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    AuthService.logout();
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const updatedUser = await AuthService.getCurrentUser();
      setUser(updatedUser);
    } catch (error) {
      console.error("Failed to refresh user:", error);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    signup,
    logout,
    refreshUser,
  };

  return React.createElement(AuthContext.Provider, { value: value }, children);
}