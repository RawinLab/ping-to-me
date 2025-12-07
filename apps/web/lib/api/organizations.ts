import { apiRequest, api } from "../api";

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
}

export interface OrganizationSettings {
  id: string;
  organizationId: string;
  ipAllowlist?: string[];
  ssoEnabled: boolean;
  ssoProviderId?: string;
  enforced2FA: boolean;
  sessionTimeout: number;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateOrganizationData {
  name?: string;
  slug?: string;
  description?: string;
  timezone?: string;
  dataRetentionDays?: number;
  defaultDomainId?: string;
}

export interface UpdateOrganizationSettingsData {
  ipAllowlist?: string[];
  ssoEnabled?: boolean;
  ssoProviderId?: string;
  enforced2FA?: boolean;
  sessionTimeout?: number;
}

// Organization CRUD

/**
 * Get all organizations for current user
 */
export async function getOrganizations(): Promise<Organization[]> {
  return apiRequest("/organizations");
}

/**
 * Get a single organization by ID
 */
export async function getOrganization(orgId: string): Promise<Organization> {
  return apiRequest(`/organizations/${orgId}`);
}

/**
 * Create a new organization
 */
export async function createOrganization(data: {
  name: string;
  slug: string;
}): Promise<Organization> {
  return apiRequest("/organizations", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Update an organization
 */
export async function updateOrganization(
  orgId: string,
  data: UpdateOrganizationData,
): Promise<Organization> {
  return apiRequest(`/organizations/${orgId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

/**
 * Delete an organization
 */
export async function deleteOrganization(orgId: string): Promise<void> {
  return apiRequest(`/organizations/${orgId}`, {
    method: "DELETE",
  });
}

// Organization Settings

/**
 * Get organization settings
 */
export async function getOrganizationSettings(
  orgId: string,
): Promise<OrganizationSettings> {
  return apiRequest(`/organizations/${orgId}/settings`);
}

/**
 * Update organization settings
 */
export async function updateOrganizationSettings(
  orgId: string,
  data: UpdateOrganizationSettingsData,
): Promise<OrganizationSettings> {
  return apiRequest(`/organizations/${orgId}/settings`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

// Logo Management

/**
 * Upload organization logo
 */
export async function uploadOrganizationLogo(
  orgId: string,
  file: File,
): Promise<{ logoUrl: string }> {
  const formData = new FormData();
  formData.append("logo", file);

  const response = await api.post(`/organizations/${orgId}/logo`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
}

/**
 * Delete organization logo
 */
export async function deleteOrganizationLogo(orgId: string): Promise<void> {
  return apiRequest(`/organizations/${orgId}/logo`, {
    method: "DELETE",
  });
}

// Ownership Transfer

/**
 * Transfer organization ownership to another member
 */
export async function transferOwnership(
  orgId: string,
  newOwnerId: string,
): Promise<void> {
  return apiRequest(`/organizations/${orgId}/transfer-ownership`, {
    method: "POST",
    body: JSON.stringify({ newOwnerId }),
  });
}

// Members

/**
 * Get organization members
 */
export async function getOrganizationMembers(orgId: string): Promise<
  Array<{
    userId: string;
    organizationId: string;
    role: "OWNER" | "ADMIN" | "EDITOR" | "VIEWER";
    joinedAt: string;
    lastActiveAt?: string;
    user: {
      id: string;
      email: string;
      name?: string;
      avatarUrl?: string;
    };
  }>
> {
  return apiRequest(`/organizations/${orgId}/members`);
}

/**
 * Update member role
 */
export async function updateMemberRole(
  orgId: string,
  userId: string,
  role: "ADMIN" | "EDITOR" | "VIEWER",
): Promise<void> {
  return apiRequest(`/organizations/${orgId}/members/${userId}`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });
}

/**
 * Remove member from organization
 */
export async function removeMember(
  orgId: string,
  userId: string,
): Promise<void> {
  return apiRequest(`/organizations/${orgId}/members/${userId}`, {
    method: "DELETE",
  });
}
