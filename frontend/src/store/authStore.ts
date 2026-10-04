import { create } from 'zustand';
import axiosClient from '../api/axiosClient';

interface User {
  _id: string;
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
  register: (email: string, password: string) => Promise<User>;
  logout: () => void;
  updateStreak: (streak: StreakUpdate) => void;
}

const storedToken = localStorage.getItem('trailhead_token');
const storedUser = localStorage.getItem('trailhead_user');

const useAuthStore = create<AuthState>((set) => ({
  token: storedToken || null,
  user: storedUser ? (JSON.parse(storedUser) as User) : null,
  isAuthenticated: !!storedToken,

  login: async (email, password) => {
    const res = await axiosClient.post('/auth/login', { email, password });
    const { token, data } = res.data as { token: string; data: { user: User } };
    localStorage.setItem('trailhead_token', token);
    localStorage.setItem('trailhead_user', JSON.stringify(data.user));
    set({ token, user: data.user, isAuthenticated: true });
    return data.user;
  },

  register: async (email, password) => {
    const res = await axiosClient.post('/auth/register', {
      email,
      password,
    });
    const { token, data } = res.data as { token: string; data: { user: User } };
    localStorage.setItem('trailhead_token', token);
    localStorage.setItem('trailhead_user', JSON.stringify(data.user));
    set({ token, user: data.user, isAuthenticated: true });
    return data.user;
  },

  logout: () => {
    localStorage.removeItem('trailhead_token');
    localStorage.removeItem('trailhead_user');
    set({ token: null, user: null, isAuthenticated: false });
  },

  updateStreak: (streak) => {
    set((state) => {
      const updatedUser = state.user
        ? { ...state.user, currentStreak: streak.currentStreak, longestStreak: streak.longestStreak }
        : null;
      if (updatedUser) localStorage.setItem('trailhead_user', JSON.stringify(updatedUser));
      return { user: updatedUser };
    });
  },
}));

export default useAuthStore;
