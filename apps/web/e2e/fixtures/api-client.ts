import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import { TEST_CREDENTIALS, TEST_IDS } from "./test-data";

export type UserRole = "owner" | "admin" | "editor" | "viewer" | "newUser";

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(status: number, data: any) {
    const message =
      typeof data?.message === "string"
        ? data.message
        : `API Error ${status}`;
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

export class ApiClient {
  private http: AxiosInstance;
  private token: string | null = null;
  private orgId: string | null = null;

  private constructor() {
    this.http = axios.create({
      baseURL: "http://localhost:3011",
    });

    this.http.interceptors.request.use((config) => {
      if (this.token) {
        config.headers.set("Authorization", `Bearer ${this.token}`);
      }
      if (this.orgId) {
        config.headers.set("X-Organization-Id", this.orgId);
      }
      return config;
    });

    // Response interceptor: unwrap errors into ApiError
    this.http.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response) {
          throw new ApiError(error.response.status, error.response.data);
        }
        throw error;
      },
    );
  }

  /**
   * Factory: create an authenticated client for the given role.
   * Logs in and sets the main organization as default.
   */
  static async create(role: UserRole): Promise<ApiClient> {
    const client = new ApiClient();
    await client.login(role);
    client.setOrganization(TEST_IDS.organizations.main);
    return client;
  }

  /** Authenticate via /auth/login and store the access token. */
  private async login(role: UserRole): Promise<void> {
    const credentials = TEST_CREDENTIALS[role];
    const response = await this.http.post("/auth/login", {
      email: credentials.email,
      password: credentials.password,
    });
    this.token = response.data.accessToken;
  }

  /** Switch the default organization for subsequent requests. */
  setOrganization(orgId: string): void {
    this.orgId = orgId;
  }

  // ── Generic HTTP methods ──────────────────────────────────────────

  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.http.get<T>(url, config);
    return response.data;
  }

  async post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const response = await this.http.post<T>(url, data, config);
    return response.data;
  }

  async put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const response = await this.http.put<T>(url, data, config);
    return response.data;
  }

  async patch<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const response = await this.http.patch<T>(url, data, config);
    return response.data;
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.http.delete<T>(url, config);
    return response.data;
  }

  // ── Convenience methods ───────────────────────────────────────────

  /** GET /auth/me */
  getMe(): Promise<any> {
    return this.get("/auth/me");
  }

  /** POST /links */
  createLink(data: Record<string, any>): Promise<any> {
    return this.post("/links", data);
  }

  /** DELETE /links/:id */
  deleteLink(id: string): Promise<any> {
    return this.delete(`/links/${id}`);
  }

  /** GET /links with optional query filters */
  getLinks(filters?: Record<string, any>): Promise<any> {
    return this.get("/links", { params: filters });
  }

  /** POST /organizations */
  createOrganization(data: Record<string, any>): Promise<any> {
    return this.post("/organizations", data);
  }

  /** DELETE /organizations/:id */
  deleteOrganization(id: string): Promise<any> {
    return this.delete(`/organizations/${id}`);
  }

  /** POST /organizations/:orgId/invitations */
  inviteMember(data: {
    email: string;
    role: string;
  }): Promise<any> {
    const orgId = this.orgId ?? TEST_IDS.organizations.main;
    return this.post(`/organizations/${orgId}/invitations`, data);
  }

  /** DELETE /organizations/:orgId/members/:userId */
  removeMember(userId: string): Promise<any> {
    const orgId = this.orgId ?? TEST_IDS.organizations.main;
    return this.delete(`/organizations/${orgId}/members/${userId}`);
  }

  /** POST /tags */
  createTag(data: Record<string, any>): Promise<any> {
    return this.post("/tags", data);
  }

  /** DELETE /tags/:id */
  deleteTag(id: string): Promise<any> {
    return this.delete(`/tags/${id}`);
  }

  /** POST /folders */
  createFolder(data: Record<string, any>): Promise<any> {
    return this.post("/folders", data);
  }

  /** DELETE /folders/:id */
  deleteFolder(id: string): Promise<any> {
    return this.delete(`/folders/${id}`);
  }

  /** POST /bio-pages */
  createBioPage(data: Record<string, any>): Promise<any> {
    return this.post("/bio-pages", data);
  }

  /** DELETE /bio-pages/:id */
  deleteBioPage(id: string): Promise<any> {
    return this.delete(`/bio-pages/${id}`);
  }
}
