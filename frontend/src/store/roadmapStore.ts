import { create } from 'zustand';
import axiosClient from '../api/axiosClient';

export interface Resource {
  title: string;
  link: string;
  type: 'video' | 'article' | 'course' | 'book' | 'other';
}

export interface Milestone {
  _id: string;
  title: string;
  description: string;
  microFirstStep: string;
  whyNow: string;
  suggestedTimeBox: string;
  resources: Resource[];
  isCompleted: boolean;
  order: number;
  phase?: { title: string; order: number };
}

export interface Phase {
  _id: string;
  title: string;
  order: number;
  milestones: Milestone[];
}

export interface Roadmap {
  _id: string;
  goal: string;
  targetTimeframe: string;
  skillLevel: 'beginner' | 'intermediate' | 'advanced';
  hoursPerDay: number;
  status: 'generating' | 'active' | 'completed' | 'abandoned';
}

interface Progress {
  total: number;
  completed: number;
  percentage: number;
}

interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
}

interface CreateRoadmapParams {
  goal: string;
  targetTimeframe: string;
  skillLevel: string;
  hoursPerDay: number;
}

interface RoadmapState {
  roadmaps: Roadmap[];
  currentRoadmap: Roadmap | null;
  phases: Phase[];
  progress: Progress | null;
  nextTask: Milestone | null;
  loading: boolean;
  error: string | null;
  fetchRoadmaps: () => Promise<void>;
  createRoadmap: (params: CreateRoadmapParams) => Promise<Roadmap>;
  fetchRoadmapDetail: (id: string) => Promise<Roadmap>;
  fetchNextTask: (id: string) => Promise<void>;
  completeMilestone: (milestoneId: string, isCompleted: boolean) => Promise<{ milestone: Milestone; progress: Progress; streak: StreakInfo }>;
  regeneratePhase: (roadmapId: string, phaseId: string) => Promise<void>;
  abandonRoadmap: (id: string) => Promise<Roadmap>;
  deleteRoadmap: (id: string) => Promise<void>;
  clearCurrent: () => void;
}

const useRoadmapStore = create<RoadmapState>((set, get) => ({
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
      set({ roadmaps: (res.data as { data: { roadmaps: Roadmap[] } }).data.roadmaps, loading: false });
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message;
      set({ error: msg || 'Failed to load roadmaps', loading: false });
    }
  },

  createRoadmap: async ({ goal, targetTimeframe, skillLevel, hoursPerDay }) => {
    const res = await axiosClient.post('/roadmaps', {
      goal,
      targetTimeframe,
      skillLevel,
      hoursPerDay: Number(hoursPerDay),
    });
    const newRoadmap = (res.data as { data: { roadmap: Roadmap } }).data.roadmap;
    set((state) => ({ roadmaps: [newRoadmap, ...state.roadmaps] }));
    return newRoadmap;
  },

  fetchRoadmapDetail: async (id) => {
    set({ loading: true, error: null });
    try {
      const res = await axiosClient.get(`/roadmaps/${id}`);
      const { roadmap, phases, progress } = (res.data as { data: { roadmap: Roadmap; phases: Phase[]; progress: Progress } }).data;
      set({ currentRoadmap: roadmap, phases, progress, loading: false });
      return roadmap;
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message;
      set({ error: msg || 'Failed to load roadmap', loading: false });
      throw err;
    }
  },

  fetchNextTask: async (id) => {
    try {
      const res = await axiosClient.get(`/roadmaps/${id}/next`);
      set({ nextTask: (res.data as { data: { milestone: Milestone | null } }).data.milestone });
    } catch (err) {
      console.error('Failed to fetch next task', err);
    }
  },

  completeMilestone: async (milestoneId, isCompleted) => {
    const res = await axiosClient.patch(`/milestones/${milestoneId}`, { isCompleted });
    const { milestone, progress, streak } = (res.data as { data: { milestone: Milestone; progress: Progress; streak: StreakInfo } }).data;

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
    await get().fetchRoadmapDetail(roadmapId);
  },

  abandonRoadmap: async (id) => {
    const res = await axiosClient.patch(`/roadmaps/${id}/abandon`);
    const updatedRoadmap = (res.data as { data: { roadmap: Roadmap } }).data.roadmap;
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
