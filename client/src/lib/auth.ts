import { User, LoginData, SignupData } from "@shared/schema";

// Auth utility functions for the frontend
export class AuthService {
  private static TOKEN_KEY = "auth_token";
  private static USER_KEY = "user_data";

  static getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  static setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  static removeToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  static getUser(): User | null {
    const userData = localStorage.getItem(this.USER_KEY);
    return userData ? JSON.parse(userData) : null;
  }

  static setUser(user: User): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  static isAuthenticated(): boolean {
    return !!this.getToken();
  }

  static isAdmin(): boolean {
    const user = this.getUser();
    return user?.role === "admin";
  }

  static getAuthHeaders(): Record<string, string> {
    const token = this.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  static async login(credentials: LoginData): Promise<{ user: User; token: string }> {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Login failed");
    }

    const data = await response.json();
    this.setToken(data.token);
    this.setUser(data.user);
    return data;
  }

  static async signup(userData: SignupData): Promise<{ user: User; token: string }> {
    const response = await fetch("/api/auth/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Signup failed");
    }

    const data = await response.json();
    this.setToken(data.token);
    this.setUser(data.user);
    return data;
  }

  static async logout(): Promise<void> {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: this.getAuthHeaders(),
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      this.removeToken();
      window.location.href = "/";
    }
  }

  static async getCurrentUser(): Promise<User> {
    const response = await fetch("/api/auth/me", {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      if (response.status === 401) {
        this.removeToken();
        throw new Error("Session expired");
      }
      throw new Error("Failed to get user data");
    }

    const user = await response.json();
    this.setUser(user);
    return user;
  }

  static async refreshUserData(): Promise<User | null> {
    try {
      const user = await this.getCurrentUser();
      return user;
    } catch (error) {
      console.error("Failed to refresh user data:", error);
      return null;
    }
  }
}