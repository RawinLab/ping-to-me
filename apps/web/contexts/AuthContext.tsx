"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { apiRequest, initializeAuth, api, setAccessToken } from "@/lib/api";

interface User {
  id: string;
  email: string;
  name?: string;
  role: string;
  plan: string;
  avatarUrl?: string;
  emailVerified: Date | null;
}

interface OrgMembership {
  orgId: string;
  orgName: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  memberships: OrgMembership[];
  currentOrgId: string | null;
  loading: boolean;
  sessionToken: string | null;
  login: (data: { email: string; password: string }) => Promise<{ requires2FA: boolean }>;
  logout: () => Promise<void>;
  verify2FA: (code: string) => Promise<void>;
  hasRole: (roles: string[]) => boolean;
  hasOrgRole: (orgId: string, roles: string[]) => boolean;
  canAccess: (feature: string) => boolean;
  setCurrentOrg: (orgId: string) => void;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [memberships, setMemberships] = useState<OrgMembership[]>([]);
  const [currentOrgId, setCurrentOrgId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const initRef = useRef(false);
  const router = useRouter();

  useEffect(() => {
    // Prevent double initialization in strict mode
    if (initRef.current) return;
    initRef.current = true;

    const init = async () => {
      // First, try to get access token via refresh
      const isAuthenticated = await initializeAuth();

      if (isAuthenticated) {
        // Only fetch user data if we have a valid token
        await refresh();
      } else {
        setLoading(false);
      }
    };

    init();
  }, []);

  const refresh = async () => {
    try {
      const [userRes, orgsRes] = await Promise.all([
        apiRequest("/auth/me").catch(() => null),
        apiRequest("/organizations").catch(() => []),
      ]);

      if (userRes) {
        setUser(userRes);
      } else {
        setUser(null);
      }

      if (orgsRes && orgsRes.length > 0) {
        const membershipData = orgsRes.map((org: any) => ({
          orgId: org.id,
          orgName: org.name,
          role: org.currentUserRole || "VIEWER",
        }));
        setMemberships(membershipData);

        // Set first org as current if none selected
        if (!currentOrgId && orgsRes.length > 0) {
          setCurrentOrgId(orgsRes[0].id);
        }
      } else {
        setMemberships([]);
      }
    } catch (error) {
      console.error("Failed to fetch user data");
      setUser(null);
      setMemberships([]);
    } finally {
      setLoading(false);
    }
  };

  const hasRole = (roles: string[]): boolean => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  const hasOrgRole = (orgId: string, roles: string[]): boolean => {
    const membership = memberships.find((m) => m.orgId === orgId);
    if (!membership) return false;
    return roles.includes(membership.role);
  };

  const canAccess = (feature: string): boolean => {
    if (!user) return false;

    // Feature access based on plan
    const freePlanFeatures = ["links", "basic_analytics"];
    const proPlanFeatures = [
      ...freePlanFeatures,
      "custom_domains",
      "bio_pages",
      "advanced_analytics",
    ];
    const businessPlanFeatures = [
      ...proPlanFeatures,
      "team",
      "api",
      "audit_logs",
    ];

    switch (user.plan) {
      case "business":
        return businessPlanFeatures.includes(feature);
      case "pro":
        return proPlanFeatures.includes(feature);
      default:
        return freePlanFeatures.includes(feature);
    }
  };

  const setCurrentOrg = (orgId: string) => {
    setCurrentOrgId(orgId);
    localStorage.setItem("currentOrgId", orgId);
  };

  const login = async (data: { email: string; password: string }) => {
    const res = await api.post("/auth/login", data);

    if (res.data.requires2FA) {
      setSessionToken(res.data.sessionToken);
      return { requires2FA: true };
    }

    setUser(res.data.user);

    // Fetch memberships after successful login
    await refresh();

    router.push("/dashboard");
    return { requires2FA: false };
  };

  const verify2FA = async (code: string) => {
    if (!sessionToken) {
      throw new Error("No session token available");
    }

    const res = await api.post("/auth/login/2fa", {
      sessionToken,
      code,
    });

    setUser(res.data.user);
    setSessionToken(null);

    // Fetch memberships after successful 2FA
    await refresh();
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // Ignore errors - logout should always succeed on client side
    }
    setAccessToken(null);
    setUser(null);
    setMemberships([]);
    setCurrentOrgId(null);
    setSessionToken(null);
    // Clear refresh token cookie
    document.cookie =
      "refresh_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    router.push("/login");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        memberships,
        currentOrgId,
        loading,
        sessionToken,
        login,
        logout,
        verify2FA,
        hasRole,
        hasOrgRole,
        canAccess,
        setCurrentOrg,
        refresh,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Helper hook for checking specific permissions
export function usePermission(roles: string[]) {
  const { hasRole } = useAuth();
  return hasRole(roles);
}

// Helper hook for checking org permissions
export function useOrgPermission(orgId: string, roles: string[]) {
  const { hasOrgRole } = useAuth();
  return hasOrgRole(orgId, roles);
}

// Helper hook for feature access
export function useFeatureAccess(feature: string) {
  const { canAccess } = useAuth();
  return canAccess(feature);
}
