import axios from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true, // Important for cookies
});

let accessToken: string | null = null;
let currentOrganizationId: string | null = null;
let isRefreshing = false;
let isAuthFailed = false; // Flag to prevent API calls after auth failure
let refreshSubscribers: {
  resolve: (token: string) => void;
  reject: (error: any) => void;
}[] = [];
let onAuthFailure: (() => void) | null = null;

// Set callback for auth failure (called when refresh token is invalid)
export const setOnAuthFailure = (callback: () => void) => {
  onAuthFailure = callback;
};

// Reset auth failed state (called after successful login)
export const resetAuthFailedState = () => {
  isAuthFailed = false;
};

// Subscribe to token refresh
const subscribeTokenRefresh = (
  resolve: (token: string) => void,
  reject: (error: any) => void,
) => {
  refreshSubscribers.push({ resolve, reject });
};

// Notify all subscribers when refresh completes successfully
const onRefreshed = (token: string) => {
  refreshSubscribers.forEach(({ resolve }) => resolve(token));
  refreshSubscribers = [];
};

// Notify all subscribers when refresh fails
const onRefreshFailed = (error: any) => {
  refreshSubscribers.forEach(({ reject }) => reject(error));
  refreshSubscribers = [];
};

// Request interceptor to attach access token and organization ID
api.interceptors.request.use(
  (config: any) => {
    // If auth has failed, reject immediately to prevent infinite loops
    if (isAuthFailed) {
      return Promise.reject(new Error("Auth failed - redirecting to login"));
    }

    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Attach organization ID header for RBAC
    const orgId = getCurrentOrganizationId();
    if (orgId) {
      config.headers["X-Organization-Id"] = orgId;
    }

    return config;
  },
  (error: any) => Promise.reject(error),
);

// Response interceptor to handle 401 and refresh
api.interceptors.response.use(
  (response: any) => {
    // If the response contains an access token (e.g. from login or refresh), save it.
    if (response.data?.accessToken) {
      setAccessToken(response.data.accessToken);
    }
    return response;
  },
  async (error: any) => {
    // If auth has already failed, just reject immediately without any processing
    if (isAuthFailed) {
      return Promise.reject(error);
    }

    const originalRequest = error.config;

    // If no config (e.g., from request interceptor rejection), just reject
    if (!originalRequest) {
      return Promise.reject(error);
    }

    // If 401 and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Skip refresh for auth endpoints that are expected to return 401
      if (
        originalRequest.url?.includes("/auth/refresh") ||
        originalRequest.url?.includes("/auth/login") ||
        originalRequest.url?.includes("/auth/register")
      ) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      // If auth already failed while we were waiting, don't try to refresh
      if (isAuthFailed) {
        return Promise.reject(error);
      }

      // If already refreshing, queue the request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          subscribeTokenRefresh(
            (token: string) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(api(originalRequest));
            },
            (err: any) => {
              reject(err);
            },
          );
        });
      }

      isRefreshing = true;

      try {
        // Call refresh endpoint
        const res = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
          {},
          { withCredentials: true },
        );

        const { accessToken: newToken } = res.data;
        setAccessToken(newToken);

        // Notify all queued requests
        onRefreshed(newToken);

        // Retry original request
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed - clear token
        setAccessToken(null);

        // Set auth failed flag to prevent further API calls
        isAuthFailed = true;

        // Reject all queued requests
        onRefreshFailed(refreshError);

        // Call auth failure callback to trigger logout and redirect (only once)
        if (onAuthFailure) {
          onAuthFailure();
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  },
);

export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

export const getAccessToken = () => accessToken;

export const setCurrentOrganizationId = (orgId: string | null) => {
  currentOrganizationId = orgId;
};

export const getCurrentOrganizationId = () => currentOrganizationId;

// Initialize auth - call this before any API requests
// Note: This uses axios directly (not api instance) to avoid triggering interceptors
export const initializeAuth = async (): Promise<boolean> => {
  if (accessToken) return true;

  try {
    const res = await axios.post(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
      {},
      { withCredentials: true },
    );
    setAccessToken(res.data.accessToken);
    return true;
  } catch {
    // Don't set isAuthFailed here - user may just not be logged in yet
    return false;
  }
};

// Check if auth has failed (for components to check before making API calls)
export const hasAuthFailed = () => isAuthFailed;

export const apiRequest = async (
  endpoint: string,
  options: RequestInit = {},
) => {
  const method = options.method || "GET";
  let data: any = undefined;

  if (options.body && typeof options.body === "string") {
    try {
      data = JSON.parse(options.body);
    } catch (e) {
      data = options.body;
    }
  }

  try {
    const response = await api({
      url: endpoint,
      method,
      data,
      headers: options.headers as any,
    });
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error;
  }
};
