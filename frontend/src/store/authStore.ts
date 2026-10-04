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
  googleLogin: (token: string) => Promise<User>;
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
    // DEBUG STORE A: Entering register action
    console.log('[AuthStore] A - register() called with email:', email);

    // DEBUG STORE B: About to POST to /auth/register
    console.log('[AuthStore] B - POSTing to /auth/register...');
    const res = await axiosClient.post('/auth/register', {
      email,
      password,
    });

    // DEBUG STORE C: Got a response — check the raw shape
    console.log('[AuthStore] C - Response received:', res.status, res.data);

    const { token, data } = res.data as { token: string; data: { user: User } };

    // DEBUG STORE D: Destructured token + user
    console.log('[AuthStore] D - token present:', !!token, '| user:', data?.user);

    localStorage.setItem('trailhead_token', token);
    localStorage.setItem('trailhead_user', JSON.stringify(data.user));
    set({ token, user: data.user, isAuthenticated: true });

    // DEBUG STORE E: Store updated, returning user
    console.log('[AuthStore] E - Store updated, registration complete.');
    return data.user;
  },

  googleLogin: async (accessToken: string) => {
    // DEBUG GOOGLE A: sending token to backend
    console.log('[AuthStore] Google A - sending token to /auth/google...');
    const res = await axiosClient.post('/auth/google', {
      access_token: accessToken,
      idToken: accessToken,
    });
    console.log('[AuthStore] Google B - response:', res.status, res.data);
    const { token, data } = res.data as { token: string; data: { user: User } };
    localStorage.setItem('trailhead_token', token);
    localStorage.setItem('trailhead_user', JSON.stringify(data.user));
    set({ token, user: data.user, isAuthenticated: true });
    console.log('[AuthStore] Google C - done, user:', data.user);
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
