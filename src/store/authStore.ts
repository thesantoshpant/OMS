import { create } from "zustand";
import axios from "axios";

// API base URL is overridable at build time (Vite) via VITE_API_URL so the same
// build can target local Docker or the deployed reverse proxy.
const env = import.meta.env as unknown as Record<string, string | undefined>;
const API_BASE_URL = env.VITE_API_URL || "https://euclid.santoshpant.com.np/oms/api";

// WebSocket base for the live market-data feed (http->ws, https->wss).
export const WS_BASE_URL = API_BASE_URL.replace(/^http/, "ws");

export interface AuthStore {
  token: string | null;
  userId: number | null;
  email: string | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setToken: (token: string, userId: number, email: string) => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthStore>(
  (set): AuthStore => ({
    token: localStorage.getItem("token"),
    userId: localStorage.getItem("userId")
      ? parseInt(localStorage.getItem("userId")!)
      : null,
    email: localStorage.getItem("email"),
    isLoading: false,
    error: null,

    login: async (email: string, password: string) => {
      set({ isLoading: true, error: null });
      try {
        const response = await axios.post(`${API_BASE_URL}/auth/login`, {
          email,
          password,
        });

        const { token, user_id, email: userEmail } = response.data;

        localStorage.setItem("token", token);
        localStorage.setItem("userId", user_id.toString());
        localStorage.setItem("email", userEmail);

        set({
          token,
          userId: user_id,
          email: userEmail,
          isLoading: false,
        });
      } catch (err: any) {
        const errorMsg = err.response?.data?.message || "Login failed";
        set({ error: errorMsg, isLoading: false });
        throw err;
      }
    },

    signup: async (email: string, password: string) => {
      set({ isLoading: true, error: null });
      try {
        const response = await axios.post(`${API_BASE_URL}/auth/signup`, {
          email,
          password,
        });

        const { user_id, email: userEmail } = response.data;

        // Auto-login after signup
        const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
          email,
          password,
        });

        const { token } = loginResponse.data;

        localStorage.setItem("token", token);
        localStorage.setItem("userId", user_id.toString());
        localStorage.setItem("email", userEmail);

        set({
          token,
          userId: user_id,
          email: userEmail,
          isLoading: false,
        });
      } catch (err: any) {
        const errorMsg = err.response?.data?.message || "Signup failed";
        set({ error: errorMsg, isLoading: false });
        throw err;
      }
    },

    logout: () => {
      localStorage.removeItem("token");
      localStorage.removeItem("userId");
      localStorage.removeItem("email");
      set({
        token: null,
        userId: null,
        email: null,
        isLoading: false,
        error: null,
      });
    },

    setToken: (token: string, userId: number, email: string) => {
      localStorage.setItem("token", token);
      localStorage.setItem("userId", userId.toString());
      localStorage.setItem("email", email);
      set({ token, userId, email });
    },

    isAuthenticated: (): boolean => {
      const state = useAuthStore.getState();
      return !!state.token && !!state.userId;
    },
  }),
);

// Create axios instance with auth header
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On 401 (expired/invalid token) clear auth and bounce to login. Login/signup
// use raw axios (not apiClient), so their 401s are unaffected by this.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("userId");
      localStorage.removeItem("email");
      useAuthStore.setState({ token: null, userId: null, email: null });
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);
