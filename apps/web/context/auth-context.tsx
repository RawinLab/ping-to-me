"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

interface User {
  id: string;
  email: string;
  name?: string;
  role: string;
  image?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const refreshSession = async () => {
    try {
      // Try to refresh token first (if access token expired or missing)
      // Actually, we should just try to fetch 'me'. The api client handles refresh.
      // But we need an endpoint for 'me'. I didn't create one yet in AuthController.
      // I should add /auth/me to AuthController.
      // For now, let's assume /auth/refresh returns user too? No, it returns accessToken.
      // Let's use /auth/refresh to check if we have a valid session.
      // If refresh succeeds, we decode the token or fetch user profile.
      // Let's add /auth/me to AuthController later.
      // For now, I'll decode the token from refresh response if possible, or just rely on the fact that refresh worked.
      // Wait, I need the user object.
      // I'll add a /auth/me endpoint in the backend plan update.
      // For now, I'll implement this assuming /auth/me exists or I can get user from refresh.
      // My refresh endpoint returns { accessToken }.
      // My login endpoint returns { accessToken, user }.

      // Let's try to call a protected endpoint to see if we are logged in.
      // Or better, add /auth/me.
      // I'll add /auth/me to AuthController in the next step.

      const res = await api.post("/auth/refresh");
      if (res.data.accessToken) {
        // We have a token. Now get the user.
        // Since I haven't implemented /auth/me yet, I'll decode the token or fetch a dummy protected route.
        // Actually, I should just implement /auth/me.
        // For now, let's set a placeholder or decode if I can.
        // But I don't want to add jwt-decode lib if I can avoid it.
        // I'll update AuthController to return user in refresh too, or add /auth/me.
        // Let's assume I'll add /auth/me.
        const meRes = await api.get("/auth/me");
        setUser(meRes.data);
      }
    } catch (error) {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshSession();
  }, []);

  const login = async (data: any) => {
    const res = await api.post("/auth/login", data);
    setUser(res.data.user);
    router.push("/dashboard");
  };

  const logout = async () => {
    await api.post("/auth/logout");
    setUser(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider
      value={{ user, isLoading, login, logout, refreshSession }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
