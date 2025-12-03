import axios from 'axios';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true, // Important for cookies
});

// Request interceptor to attach access token
api.interceptors.request.use(
  (config: any) => {
    // We store access token in memory (e.g. a variable in this file or context)
    // But context is React.
    // A common pattern is to let the interceptor handle the refresh logic transparently.
    // Or store the token in a closure variable here.
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: any) => Promise.reject(error)
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
    const originalRequest = error.config;

    // If 401 and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Call refresh endpoint
        // We use a separate instance to avoid infinite loops if refresh fails
        const res = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const { accessToken } = res.data;
        setAccessToken(accessToken);

        // Retry original request
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed (e.g. token expired), redirect to login or clear state
        // We can't access React Router here easily.
        // We might need to broadcast an event or let the caller handle it.
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

let accessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

export const getAccessToken = () => accessToken;
