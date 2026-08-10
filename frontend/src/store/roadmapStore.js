import { create } from 'zustand';
import axiosClient from '../api/axiosClient';

const useRoadmapStore = create((set, get) => ({
  roadmaps: [],
  currentRoadmap: null,
  phases: [],
  progress: null,
  nextTask: null,
  loading: false,
  error: null,

  fetchRoadmaps: async () => {
    set({ loading: true, error: null });
    try {
      const res = await axiosClient.get('/roadmaps');
      set({ roadmaps: res.data.data.roadmaps, loading: false });
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to load roadmaps', loading: false });
    }
  },

  createRoadmap: async ({ goal, targetTimeframe, skillLevel, hoursPerDay }) => {
    const res = await axiosClient.post('/roadmaps', {
      goal,
      targetTimeframe,
      skillLevel,
      hoursPerDay: Number(hoursPerDay),
    });
    // Returns 202 — roadmap is in "generating" status
    const newRoadmap = res.data.data.roadmap;
    set((state) => ({ roadmaps: [newRoadmap, ...state.roadmaps] }));
    return newRoadmap;
  },

  fetchRoadmapDetail: async (id) => {
    set({ loading: true, error: null });
    try {
      const res = await axiosClient.get(`/roadmaps/${id}`);
      const { roadmap, phases, progress } = res.data.data;
      set({ currentRoadmap: roadmap, phases, progress, loading: false });
      return roadmap;
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to load roadmap', loading: false });
      throw err;
    }
  },

  fetchNextTask: async (id) => {
    try {
      const res = await axiosClient.get(`/roadmaps/${id}/next`);
      set({ nextTask: res.data.data.milestone });
    } catch (err) {
      console.error('Failed to fetch next task', err);
    }
  },

  completeMilestone: async (milestoneId, isCompleted) => {
    const res = await axiosClient.patch(`/milestones/${milestoneId}`, { isCompleted });
    const { milestone, progress, streak } = res.data.data;

    // Update milestone in phases
    set((state) => ({
      phases: state.phases.map((phase) => ({
        ...phase,
        milestones: phase.milestones.map((m) =>
          m._id === milestoneId ? { ...m, isCompleted: milestone.isCompleted } : m
        ),
      })),
      progress,
    }));

    return { milestone, progress, streak };
  },

  regeneratePhase: async (roadmapId, phaseId) => {
    await axiosClient.patch(`/roadmaps/${roadmapId}/phases/${phaseId}/regenerate`);
    // Refresh roadmap detail
    await get().fetchRoadmapDetail(roadmapId);
  },

  abandonRoadmap: async (id) => {
    const res = await axiosClient.patch(`/roadmaps/${id}/abandon`);
    const updatedRoadmap = res.data.data.roadmap;
    set((state) => ({
      roadmaps: state.roadmaps.map((r) => (r._id === id ? updatedRoadmap : r)),
      currentRoadmap: state.currentRoadmap?._id === id ? updatedRoadmap : state.currentRoadmap,
    }));
    return updatedRoadmap;
  },

  deleteRoadmap: async (id) => {
    await axiosClient.delete(`/roadmaps/${id}`);
    set((state) => ({
      roadmaps: state.roadmaps.filter((r) => r._id !== id),
      currentRoadmap: state.currentRoadmap?._id === id ? null : state.currentRoadmap,
    }));
  },

  clearCurrent: () => set({ currentRoadmap: null, phases: [], progress: null, nextTask: null }),
}));

export default useRoadmapStore;
