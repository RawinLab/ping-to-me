import { render, screen, waitFor, act } from "@testing-library/react";
import { AuthProvider, useAuth } from "../context/auth-context";
import { api } from "../lib/api";

// Mock API
jest.mock("../lib/api", () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

const TestComponent = () => {
  const { user, login, logout, isLoading } = useAuth();
  if (isLoading) return <div>Loading...</div>;
  if (!user)
    return (
      <div>
        <button
          onClick={() =>
            login({ email: "test@example.com", password: "password" })
          }
        >
          Login
        </button>
        <span>Not Logged In</span>
      </div>
    );
  return (
    <div>
      <span>Welcome {user.name}</span>
      <button onClick={() => logout()}>Logout</button>
    </div>
  );
};

// Mock useRouter
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

import { useRouter } from "next/navigation";

describe("AuthContext", () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
  });

  it("initializes with no user", async () => {
    (api.post as jest.Mock).mockRejectedValue({ response: { status: 401 } });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByText("Loading...")).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByText("Not Logged In")).toBeInTheDocument()
    );
  });

  it("loads user on mount if token exists", async () => {
    (api.post as jest.Mock).mockResolvedValue({
      data: { accessToken: "token" },
    });
    (api.get as jest.Mock).mockResolvedValue({
      data: { id: "1", name: "Test User", email: "test@example.com" },
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByText("Loading...")).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByText("Welcome Test User")).toBeInTheDocument()
    );
  });

  it("login updates user state", async () => {
    (api.post as jest.Mock).mockImplementation((url) => {
      if (url === "/auth/refresh")
        return Promise.reject({ response: { status: 401 } });
      if (url === "/auth/login")
        return Promise.resolve({
          data: { accessToken: "token", user: { id: "1", name: "Test User" } },
        });
      return Promise.reject({});
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() =>
      expect(screen.getByText("Not Logged In")).toBeInTheDocument()
    );

    const loginButton = screen.getByText("Login");
    await act(async () => {
      loginButton.click();
    });

    await waitFor(() =>
      expect(screen.getByText("Welcome Test User")).toBeInTheDocument()
    );
    expect(mockPush).toHaveBeenCalledWith("/dashboard");
  });

  it("logout clears user state", async () => {
    (api.post as jest.Mock).mockImplementation((url) => {
      if (url === "/auth/refresh")
        return Promise.resolve({ data: { accessToken: "token" } });
      if (url === "/auth/logout") return Promise.resolve({});
      return Promise.reject({});
    });
    (api.get as jest.Mock).mockResolvedValue({
      data: { id: "1", name: "Test User" },
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() =>
      expect(screen.getByText("Welcome Test User")).toBeInTheDocument()
    );

    const logoutButton = screen.getByText("Logout");
    await act(async () => {
      logoutButton.click();
    });

    await waitFor(() =>
      expect(screen.getByText("Not Logged In")).toBeInTheDocument()
    );
    expect(mockPush).toHaveBeenCalledWith("/login");
  });
});
