import { create } from 'zustand';
import axiosClient from '../api/axiosClient';

const storedToken = localStorage.getItem('trailhead_token');
const storedUser = localStorage.getItem('trailhead_user');

const useAuthStore = create((set) => ({
  token: storedToken || null,
  user: storedUser ? JSON.parse(storedUser) : null,
  isAuthenticated: !!storedToken,

  login: async (email, password) => {
    const res = await axiosClient.post('/auth/login', { email, password });
    const { token, data } = res.data;
    localStorage.setItem('trailhead_token', token);
    localStorage.setItem('trailhead_user', JSON.stringify(data.user));
    set({ token, user: data.user, isAuthenticated: true });
    return data.user;
  },

  register: async (email, password, skillLevel, hoursPerDay) => {
    const res = await axiosClient.post('/auth/register', {
      email,
      password,
      skillLevel,
      hoursPerDay,
    });
    const { token, data } = res.data;
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
      const updatedUser = {
        ...state.user,
        currentStreak: streak.currentStreak,
        longestStreak: streak.longestStreak,
      };
      localStorage.setItem('trailhead_user', JSON.stringify(updatedUser));
      return { user: updatedUser };
    });
  },
}));

export default useAuthStore;
