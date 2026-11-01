import { create } from "zustand";
import axiosClient from "../api/axiosClient";

export interface User {
  _id: string;
  name?: string;
  email: string;
  currentStreak: number;
  longestStreak: number;
}

interface StreakUpdate {
  currentStreak: number;
  longestStreak: number;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (email: string, password: string, name?: string) => Promise<User>;
  googleLogin: (accessToken: string) => Promise<User>;
  forgotPassword: (
    email: string,
  ) => Promise<{ message: string; resetCode?: string }>;
  resetPassword: (
    email: string,
    token: string,
    password: string,
  ) => Promise<User>;
  checkAuth: () => Promise<User | null>;
  deleteAccount: () => Promise<void>;
  logout: () => void;
  updateStreak: (streak: StreakUpdate) => void;
}

const TOKEN_KEY = "goalweave_token";
const USER_KEY = "goalweave_user";

const storedToken =
  localStorage.getItem(TOKEN_KEY) || localStorage.getItem("trailhead_token");
const storedUser =
  localStorage.getItem(USER_KEY) || localStorage.getItem("trailhead_user");

const useAuthStore = create<AuthState>((set) => ({
  token: storedToken || null,
  user: storedUser ? (JSON.parse(storedUser) as User) : null,
  isAuthenticated: !!storedToken,

  login: async (email, password) => {
    const res = await axiosClient.post("/auth/login", { email, password });
    const { token, data } = res.data as { token: string; data: { user: User } };
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    // Clean old keys if present
    localStorage.removeItem("trailhead_token");
    localStorage.removeItem("trailhead_user");
    set({ token, user: data.user, isAuthenticated: true });
    return data.user;
  },

  register: async (email, password, name) => {
    const res = await axiosClient.post("/auth/register", {
      email,
      password,
      ...(name ? { name } : {}),
    });
    const { token, data } = res.data as { token: string; data: { user: User } };
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    localStorage.removeItem("trailhead_token");
    localStorage.removeItem("trailhead_user");
    set({ token, user: data.user, isAuthenticated: true });
    return data.user;
  },

  googleLogin: async (accessToken: string) => {
    const res = await axiosClient.post("/auth/google", {
      access_token: accessToken,
    });
    const { token, data } = res.data as { token: string; data: { user: User } };
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    localStorage.removeItem("trailhead_token");
    localStorage.removeItem("trailhead_user");
    set({ token, user: data.user, isAuthenticated: true });
    return data.user;
  },

  forgotPassword: async (email: string) => {
    const res = await axiosClient.post("/auth/forgot-password", { email });
    return res.data as { message: string; resetCode?: string };
  },

  resetPassword: async (email: string, token: string, password: string) => {
    const res = await axiosClient.post("/auth/reset-password", {
      email,
      token,
      password,
    });
    const { token: jwtToken, data } = res.data as {
      token: string;
      data: { user: User };
    };
    localStorage.setItem(TOKEN_KEY, jwtToken);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    set({ token: jwtToken, user: data.user, isAuthenticated: true });
    return data.user;
  },

  checkAuth: async () => {
    try {
      const res = await axiosClient.get("/auth/me");
      const { data } = res.data as { data: { user: User } };
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      set({ user: data.user, isAuthenticated: true });
      return data.user;
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      set({ token: null, user: null, isAuthenticated: false });
      return null;
    }
  },

  deleteAccount: async () => {
    await axiosClient.delete("/auth/account");
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem("trailhead_token");
    localStorage.removeItem("trailhead_user");
    set({ token: null, user: null, isAuthenticated: false });
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem("trailhead_token");
    localStorage.removeItem("trailhead_user");
    set({ token: null, user: null, isAuthenticated: false });
  },

  updateStreak: (streak) => {
    set((state) => {
      const updatedUser = state.user
        ? {
            ...state.user,
            currentStreak: streak.currentStreak,
            longestStreak: streak.longestStreak,
          }
        : null;
      if (updatedUser)
        localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
      return { user: updatedUser };
    });
  },
}));

export default useAuthStore;
