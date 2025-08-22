import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { apiRequest } from "@/lib/queryClient";

interface User {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status: string;
  lastLogin?: string;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (
    username: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem("auth_token");
    const storedUser = localStorage.getItem("auth_user");

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));

        // In demo mode, just use the stored user data
        // No need to verify with backend since it doesn't exist
      } catch (error) {
        // Invalid stored data, clear it
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_user");
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (
    username: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    // Demo authentication for frontend-only mode
    // Valid credentials: admin/admin or demo/demo
    const validCredentials = [
      { username: "admin", password: "admin" },
      { username: "demo", password: "demo" },
      { username: "user", password: "password" }
    ];

    const isValidCredential = validCredentials.some(
      cred => cred.username === username && cred.password === password
    );

    if (isValidCredential) {
      const mockUser = {
        id: 1,
        username: username,
        email: `${username}@example.com`,
        firstName: username.charAt(0).toUpperCase() + username.slice(1),
        lastName: "User",
        role: username === "admin" ? "administrator" : "user",
        status: "active",
        lastLogin: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };

      const mockToken = `demo-token-${Date.now()}`;

      setUser(mockUser);
      setToken(mockToken);

      // Store in localStorage for persistence
      localStorage.setItem("auth_token", mockToken);
      localStorage.setItem("auth_user", JSON.stringify(mockUser));

      return { success: true };
    } else {
      return { 
        success: false, 
        error: "Invalid credentials. Try: admin/admin, demo/demo, or user/password" 
      };
    }
  };

  const logout = () => {
    // Clear local state and storage (no backend call needed in demo mode)
    setUser(null);
    setToken(null);
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
  };

  const refreshUser = async () => {
    // In demo mode, user data is already current
    // No need to refresh from backend since it doesn't exist
    if (!token || !user) return;
    
    // Just update the lastLogin timestamp for demo purposes
    const updatedUser = {
      ...user,
      lastLogin: new Date().toISOString(),
    };
    
    setUser(updatedUser);
    localStorage.setItem("auth_user", JSON.stringify(updatedUser));
  };

  const isAuthenticated = !!user && !!token;

  const value = {
    user,
    token,
    login,
    logout,
    refreshUser,
    isLoading,
    isAuthenticated,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Higher-order component for protected routes
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login page
    window.location.href = "/login";
    return null;
  }

  return <>{children}</>;
}
