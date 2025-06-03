import React, { createContext, useContext, useState, useEffect } from "react";
import { User } from "@/types";
import { apiClient } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const getTokenFromStorage = (): string | null => {
    return localStorage.getItem("access_token");
  };

  const removeTokenFromStorage = () => {
    localStorage.removeItem("access_token");
  };

  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = getTokenFromStorage();
      console.log("Token from localStorage:", token ? "exists" : "not found");

      if (token) {
        try {
          const userData = await apiClient.getMe();
          console.log("User data fetched:", userData);
          setUser(userData);
        } catch (error) {
          console.error("Auth check failed:", error);
          removeTokenFromStorage();
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    checkAuthStatus();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const response = await apiClient.login(username, password);
      console.log("Login successful, user:", response.user);
      console.log(
        "Access token received:",
        response.accessToken ? "yes" : "no"
      );

      // Token is already stored in localStorage by apiClient.login()
      const token = getTokenFromStorage();
      console.log(
        "Token in localStorage after login:",
        token ? "found" : "not found"
      );

      setUser(response.user);
      toast({
        title: "Success",
        description: "Logged in successfully",
      });
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Login failed",
        variant: "destructive",
      });
      throw error;
    }
  };

  const logout = async () => {
    try {
      console.log("Logging out...");
      await apiClient.logout();
      setUser(null);
      toast({
        title: "Success",
        description: "Logged out successfully",
      });
    } catch (error) {
      console.error("Logout error:", error);
      // Still clear local state even if logout request fails
      removeTokenFromStorage();
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
