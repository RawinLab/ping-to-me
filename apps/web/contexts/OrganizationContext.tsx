"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { apiRequest, setCurrentOrganizationId } from "@/lib/api";
import { useAuth } from "./AuthContext";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  description?: string;
  timezone: string;
  dataRetentionDays: number;
  defaultDomainId?: string;
  plan: "FREE" | "PRO" | "ENTERPRISE";
  createdAt: string;
  updatedAt: string;
  _count?: {
    members: number;
    links: number;
  };
}

export interface OrganizationMember {
  userId: string;
  organizationId: string;
  role: "OWNER" | "ADMIN" | "EDITOR" | "VIEWER";
  joinedAt: string;
  lastActiveAt?: string;
  invitedById?: string;
  user: {
    id: string;
    email: string;
    name?: string;
    avatarUrl?: string;
  };
}

interface OrganizationContextType {
  currentOrg: Organization | null;
  organizations: Organization[];
  members: OrganizationMember[];
  currentUserRole: "OWNER" | "ADMIN" | "EDITOR" | "VIEWER" | null;
  isLoading: boolean;
  error: string | null;
  setCurrentOrg: (org: Organization) => void;
  refreshOrganizations: () => Promise<void>;
  refreshMembers: () => Promise<void>;
  createOrganization: (data: {
    name: string;
    slug: string;
  }) => Promise<Organization>;
  updateOrganization: (data: Partial<Organization>) => Promise<Organization>;
  deleteOrganization: () => Promise<void>;
}

const OrganizationContext = createContext<OrganizationContextType | null>(null);

const STORAGE_KEY = "pingtome_current_org_id";

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [currentOrg, setCurrentOrgState] = useState<Organization | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get current user's role in the current organization
  const currentUserRole =
    members.find((m) => m.userId === user?.id)?.role || null;

  // Fetch all organizations
  const refreshOrganizations = useCallback(async () => {
    if (!user) {
      setOrganizations([]);
      setCurrentOrgState(null);
      setCurrentOrganizationId(null);
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      const orgs = await apiRequest("/organizations");
      setOrganizations(orgs);

      // Restore or set current org
      const savedOrgId = localStorage.getItem(STORAGE_KEY);
      const savedOrg = orgs.find((o: Organization) => o.id === savedOrgId);

      if (savedOrg) {
        setCurrentOrgState(savedOrg);
        setCurrentOrganizationId(savedOrg.id);
      } else if (orgs.length > 0) {
        setCurrentOrgState(orgs[0]);
        setCurrentOrganizationId(orgs[0].id);
        localStorage.setItem(STORAGE_KEY, orgs[0].id);
      }
    } catch (err: any) {
      console.error("Failed to fetch organizations:", err);
      setError(err.message || "Failed to fetch organizations");
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Fetch members of current organization
  const refreshMembers = useCallback(async () => {
    if (!currentOrg) {
      setMembers([]);
      return;
    }

    try {
      const membersList = await apiRequest(
        `/organizations/${currentOrg.id}/members`,
      );
      setMembers(membersList);
    } catch (err: any) {
      console.error("Failed to fetch members:", err);
    }
  }, [currentOrg]);

  // Set current organization
  const setCurrentOrg = useCallback((org: Organization) => {
    setCurrentOrgState(org);
    setCurrentOrganizationId(org.id);
    localStorage.setItem(STORAGE_KEY, org.id);
  }, []);

  // Create new organization
  const createOrganization = useCallback(
    async (data: { name: string; slug: string }) => {
      const newOrg = await apiRequest("/organizations", {
        method: "POST",
        body: JSON.stringify(data),
      });
      await refreshOrganizations();
      setCurrentOrg(newOrg);
      return newOrg;
    },
    [refreshOrganizations, setCurrentOrg],
  );

  // Update current organization
  const updateOrganization = useCallback(
    async (data: Partial<Organization>) => {
      if (!currentOrg) throw new Error("No organization selected");

      const updated = await apiRequest(`/organizations/${currentOrg.id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });

      setCurrentOrgState(updated);
      setOrganizations((prev) =>
        prev.map((o) => (o.id === updated.id ? updated : o)),
      );
      return updated;
    },
    [currentOrg],
  );

  // Delete current organization
  const deleteOrganization = useCallback(async () => {
    if (!currentOrg) throw new Error("No organization selected");

    await apiRequest(`/organizations/${currentOrg.id}`, {
      method: "DELETE",
    });

    localStorage.removeItem(STORAGE_KEY);
    await refreshOrganizations();
  }, [currentOrg, refreshOrganizations]);

  // Initialize on mount
  useEffect(() => {
    if (!authLoading) {
      refreshOrganizations();
    }
  }, [authLoading, refreshOrganizations]);

  // Refresh members when current org changes
  useEffect(() => {
    if (currentOrg) {
      refreshMembers();
    }
  }, [currentOrg, refreshMembers]);

  return (
    <OrganizationContext.Provider
      value={{
        currentOrg,
        organizations,
        members,
        currentUserRole,
        isLoading,
        error,
        setCurrentOrg,
        refreshOrganizations,
        refreshMembers,
        createOrganization,
        updateOrganization,
        deleteOrganization,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error(
      "useOrganization must be used within an OrganizationProvider",
    );
  }
  return context;
}

// Helper hook to check if current user can perform actions
export function useOrgPermissions() {
  const { currentUserRole } = useOrganization();

  return {
    isOwner: currentUserRole === "OWNER",
    isAdmin: currentUserRole === "ADMIN",
    isEditor: currentUserRole === "EDITOR",
    isViewer: currentUserRole === "VIEWER",
    isAdminOrAbove: currentUserRole === "OWNER" || currentUserRole === "ADMIN",
    isEditorOrAbove: ["OWNER", "ADMIN", "EDITOR"].includes(
      currentUserRole || "",
    ),
    canInvite: currentUserRole === "OWNER" || currentUserRole === "ADMIN",
    canManageMembers:
      currentUserRole === "OWNER" || currentUserRole === "ADMIN",
    canEditOrg: currentUserRole === "OWNER" || currentUserRole === "ADMIN",
    canDeleteOrg: currentUserRole === "OWNER",
    canTransferOwnership: currentUserRole === "OWNER",
  };
}
