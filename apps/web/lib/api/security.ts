import { apiRequest } from "../api";

// Types
export interface BackupCode {
  code: string;
  used: boolean;
}

export interface BackupCodesResponse {
  codes: string[];
  remainingCount: number;
}

export interface Session {
  id: string;
  userId: string;
  deviceType: string;
  browser: string;
  os: string;
  ipAddress: string;
  location: string;
  lastActiveAt: string;
  createdAt: string;
  isCurrent: boolean;
}

export interface LoginActivity {
  id: string;
  userId: string;
  success: boolean;
  ipAddress: string;
  userAgent: string;
  location: string;
  failureReason?: string;
  createdAt: string;
}

export interface LoginActivityParams {
  page?: number;
  limit?: number;
  success?: boolean;
}

export interface ApiKey {
  id: string;
  name: string;
  key?: string;
  keyPreview: string;
  expiresAt?: string;
  lastUsedAt?: string;
  createdAt: string;
  organizationId: string;
}

export interface ApiKeyRotateResponse {
  id: string;
  name: string;
  key: string;
  keyPreview: string;
  expiresAt?: string;
  createdAt: string;
}

// Backup Codes API
export const securityApi = {
  // Backup codes
  generateBackupCodes: async (
    password: string,
  ): Promise<BackupCodesResponse> => {
    return apiRequest("/auth/2fa/backup-codes", {
      method: "POST",
      body: JSON.stringify({ password }),
    });
  },

  getRemainingBackupCodes: async (): Promise<{ remainingCount: number }> => {
    return apiRequest("/auth/2fa/backup-codes/status");
  },

  // Sessions
  getSessions: async (): Promise<Session[]> => {
    const response = await apiRequest("/auth/sessions");
    return response.sessions || [];
  },

  logoutSession: async (sessionId: string): Promise<void> => {
    return apiRequest(`/auth/sessions/${sessionId}`, {
      method: "DELETE",
    });
  },

  logoutAllSessions: async (): Promise<void> => {
    return apiRequest("/auth/sessions", {
      method: "DELETE",
    });
  },

  // Login activity
  getLoginActivity: async (
    params: LoginActivityParams = {},
  ): Promise<{
    activities: LoginActivity[];
    total: number;
    page: number;
    limit: number;
  }> => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append("page", params.page.toString());
    if (params.limit) queryParams.append("limit", params.limit.toString());
    if (params.success !== undefined)
      queryParams.append("success", params.success.toString());

    const query = queryParams.toString();
    return apiRequest(`/auth/login-activity${query ? `?${query}` : ""}`);
  },

  // API Keys
  rotateApiKey: async (
    keyId: string,
    password: string,
  ): Promise<ApiKeyRotateResponse> => {
    return apiRequest(`/developer/api-keys/${keyId}/rotate`, {
      method: "POST",
      body: JSON.stringify({ password }),
    });
  },

  setApiKeyExpiration: async (
    keyId: string,
    expiresAt: string | null,
  ): Promise<ApiKey> => {
    return apiRequest(`/developer/api-keys/${keyId}/expiration`, {
      method: "PATCH",
      body: JSON.stringify({ expiresAt }),
    });
  },

  getExpiringKeys: async (days: number = 7): Promise<ApiKey[]> => {
    return apiRequest(`/developer/api-keys/expiring?days=${days}`);
  },
};
