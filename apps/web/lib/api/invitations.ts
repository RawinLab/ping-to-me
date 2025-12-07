import { apiRequest } from "../api";

export interface Invitation {
  id: string;
  organizationId: string;
  email: string;
  role: "OWNER" | "ADMIN" | "EDITOR" | "VIEWER";
  token: string;
  personalMessage?: string;
  expiresAt: string;
  acceptedAt?: string;
  declinedAt?: string;
  createdAt: string;
  invitedBy: {
    id: string;
    name?: string;
    email: string;
  };
  organization: {
    id: string;
    name: string;
    slug: string;
    logo?: string;
  };
}

export interface CreateInvitationData {
  email: string;
  role: "ADMIN" | "EDITOR" | "VIEWER";
  personalMessage?: string;
}

export interface AcceptInvitationData {
  name?: string;
  password?: string; // For new users only
}

export interface BulkInvitationData {
  emails: string[];
  role: "ADMIN" | "EDITOR" | "VIEWER";
  personalMessage?: string;
}

export interface InvitationFilters {
  status?: "pending" | "accepted" | "declined" | "expired";
  limit?: number;
  offset?: number;
}

// Protected endpoints (require authentication)

/**
 * Create a new invitation
 */
export async function createInvitation(
  orgId: string,
  data: CreateInvitationData,
): Promise<Invitation> {
  return apiRequest(`/organizations/${orgId}/invitations`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * List invitations for an organization
 */
export async function listInvitations(
  orgId: string,
  filters?: InvitationFilters,
): Promise<{ invitations: Invitation[]; total: number }> {
  const params = new URLSearchParams();
  if (filters?.status) params.set("status", filters.status);
  if (filters?.limit) params.set("limit", filters.limit.toString());
  if (filters?.offset) params.set("offset", filters.offset.toString());

  const query = params.toString() ? `?${params.toString()}` : "";
  return apiRequest(`/organizations/${orgId}/invitations${query}`);
}

/**
 * Resend an invitation (generates new token)
 */
export async function resendInvitation(
  orgId: string,
  invitationId: string,
): Promise<Invitation> {
  return apiRequest(
    `/organizations/${orgId}/invitations/${invitationId}/resend`,
    {
      method: "POST",
    },
  );
}

/**
 * Cancel a pending invitation
 */
export async function cancelInvitation(
  orgId: string,
  invitationId: string,
): Promise<void> {
  return apiRequest(`/organizations/${orgId}/invitations/${invitationId}`, {
    method: "DELETE",
  });
}

/**
 * Bulk invite multiple users
 */
export async function bulkInvite(
  orgId: string,
  data: BulkInvitationData,
): Promise<{
  successful: string[];
  failed: { email: string; reason: string }[];
}> {
  return apiRequest(`/organizations/${orgId}/invitations/bulk`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// Public endpoints (no authentication required)

/**
 * Get invitation details by token (public)
 */
export async function getInvitationByToken(token: string): Promise<Invitation> {
  return apiRequest(`/invitations/${token}`);
}

/**
 * Accept an invitation (public)
 */
export async function acceptInvitation(
  token: string,
  data?: AcceptInvitationData,
): Promise<{
  organization: { id: string; name: string; slug: string };
  accessToken?: string; // For new users
}> {
  return apiRequest(`/invitations/${token}/accept`, {
    method: "POST",
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * Decline an invitation (public)
 */
export async function declineInvitation(token: string): Promise<void> {
  return apiRequest(`/invitations/${token}/decline`, {
    method: "POST",
  });
}
