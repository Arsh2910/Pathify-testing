import { create } from "zustand";

const useStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem("user")) || null,
  token: localStorage.getItem("token") || null,
  currentRoadmap: null,
  roadmapProgress: null,

  setAuth: (user, token) => {
    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("token", token);
    set({ user, token });
  },

  // Merge partial user updates (e.g. streak) without a full re-login
  updateUser: (partialUser) => {
    const updatedUser = { ...get().user, ...partialUser };
    localStorage.setItem("user", JSON.stringify(updatedUser));
    set({ user: updatedUser });
  },

  logout: () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    set({
      user: null,
      token: null,
      currentRoadmap: null,
      roadmapProgress: null,
    });
  },

  setCurrentRoadmap: (roadmapData) => {
    set({ currentRoadmap: roadmapData });
  },

  setRoadmapProgress: (progress) => {
    set({ roadmapProgress: progress });
  },

  toggleMilestoneCompletion: (phaseId, milestoneId, isCompleted) => {
    const { currentRoadmap } = get();
    if (!currentRoadmap) return;

    const updatedPhases = currentRoadmap.phases.map((phase) => {
      if (phase._id === phaseId) {
        return {
          ...phase,
          milestones: phase.milestones.map((milestone) => {
            if (milestone._id === milestoneId) {
              return { ...milestone, isCompleted };
            }
            return milestone;
          }),
        };
      }
      return phase;
    });

    set({ currentRoadmap: { ...currentRoadmap, phases: updatedPhases } });
  },
}));

export default useStore;
