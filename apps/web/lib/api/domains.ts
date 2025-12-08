import { apiRequest } from "../api";

export type DomainStatus = "PENDING" | "VERIFYING" | "VERIFIED" | "FAILED";
export type SslStatus = "PENDING" | "PROVISIONING" | "ACTIVE" | "EXPIRED" | "FAILED";
export type VerificationType = "txt" | "cname";

export interface Domain {
  id: string;
  hostname: string;
  organizationId: string;

  // Verification fields
  status: DomainStatus;
  isVerified: boolean;
  verificationType?: VerificationType;
  verificationToken?: string;
  verificationAttempts: number;
  lastVerifiedAt?: string;
  lastCheckAt?: string;
  verificationError?: string;
  isDefault: boolean;

  // SSL fields
  sslStatus: SslStatus;
  sslProvider?: string;
  sslCertificateId?: string;
  sslIssuedAt?: string;
  sslExpiresAt?: string;
  sslAutoRenew: boolean;

  createdAt: string;
  updatedAt: string;
}

export interface CreateDomainDto {
  hostname: string;
  orgId: string;
  verificationType?: VerificationType;
}

export interface DomainLink {
  id: string;
  slug: string;
  originalUrl: string;
  title?: string;
  status: string;
  createdAt: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Get all domains for an organization
 */
export async function listDomains(orgId: string): Promise<Domain[]> {
  return apiRequest(`/domains?orgId=${orgId}`);
}

/**
 * Get a single domain by ID
 */
export async function getDomain(orgId: string, domainId: string): Promise<Domain> {
  return apiRequest(`/domains/${domainId}?orgId=${orgId}`);
}

/**
 * Create a new domain
 */
export async function createDomain(data: CreateDomainDto): Promise<Domain> {
  return apiRequest("/domains", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Verify a domain using TXT or CNAME record
 */
export async function verifyDomain(
  orgId: string,
  domainId: string,
  type?: VerificationType
): Promise<Domain> {
  const params = new URLSearchParams({ orgId });
  if (type) params.append("type", type);

  return apiRequest(`/domains/${domainId}/verify?${params.toString()}`, {
    method: "POST",
  });
}

/**
 * Delete a domain
 */
export async function deleteDomain(orgId: string, domainId: string): Promise<void> {
  return apiRequest(`/domains/${domainId}?orgId=${orgId}`, {
    method: "DELETE",
  });
}

/**
 * Set a domain as the default for the organization
 */
export async function setDefaultDomain(orgId: string, domainId: string): Promise<Domain> {
  return apiRequest(`/domains/${domainId}/set-default`, {
    method: "POST",
    body: JSON.stringify({ orgId }),
  });
}

/**
 * Provision SSL certificate for a domain
 */
export async function provisionSsl(orgId: string, domainId: string): Promise<Domain> {
  return apiRequest(`/domains/${domainId}/ssl/provision`, {
    method: "POST",
    body: JSON.stringify({ orgId }),
  });
}

/**
 * Get SSL status for a domain
 */
export async function getSslStatus(orgId: string, domainId: string): Promise<{
  status: SslStatus;
  provider?: string;
  certificateId?: string;
  issuedAt?: string;
  expiresAt?: string;
  autoRenew: boolean;
}> {
  return apiRequest(`/domains/${domainId}/ssl/status?orgId=${orgId}`);
}

/**
 * Update SSL settings for a domain
 */
export async function updateSsl(
  orgId: string,
  domainId: string,
  autoRenew: boolean
): Promise<Domain> {
  return apiRequest(`/domains/${domainId}/ssl`, {
    method: "PATCH",
    body: JSON.stringify({ orgId, autoRenew }),
  });
}

/**
 * Get links using a specific domain
 */
export async function getDomainLinks(
  orgId: string,
  domainId: string,
  pagination?: PaginationParams
): Promise<PaginatedResponse<DomainLink>> {
  const params = new URLSearchParams({ orgId });
  if (pagination?.page) params.append("page", pagination.page.toString());
  if (pagination?.limit) params.append("limit", pagination.limit.toString());

  return apiRequest(`/domains/${domainId}/links?${params.toString()}`);
}

/**
 * Get analytics for a specific domain
 */
export async function getDomainAnalytics(
  orgId: string,
  domainId: string,
  period = '30d'
): Promise<{
  totalClicks: number;
  totalLinks: number;
  changePercent: number;
  clicksByDay: { date: string; clicks: number }[];
  topLinks: { id: string; slug: string; title: string | null; clicks: number }[];
}> {
  const params = new URLSearchParams({ orgId, period });
  return apiRequest(`/domains/${domainId}/analytics?${params.toString()}`);
}

// Export as a named object for convenience
export const domainsApi = {
  list: listDomains,
  get: getDomain,
  create: createDomain,
  verify: verifyDomain,
  delete: deleteDomain,
  setDefault: setDefaultDomain,
  provisionSsl,
  getSslStatus,
  updateSsl,
  getLinks: getDomainLinks,
  getAnalytics: getDomainAnalytics,
};
