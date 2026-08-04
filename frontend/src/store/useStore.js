import { create } from 'zustand';

const useStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('user')) || null,
  token: localStorage.getItem('token') || null,
  currentRoadmap: null,

  setAuth: (user, token) => {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token', token);
    set({ user, token });
  },

  logout: () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    set({ user: null, token: null, currentRoadmap: null });
  },

  setCurrentRoadmap: (roadmapData) => {
    set({ currentRoadmap: roadmapData });
  },

  // Optimistic UI update for milestone
  toggleMilestoneCompletion: (phaseId, milestoneId, isCompleted) => {
    const { currentRoadmap } = get();
    if (!currentRoadmap) return;

    // Deep clone the phases to avoid direct state mutation
    const updatedPhases = currentRoadmap.phases.map(phase => {
      if (phase._id === phaseId) {
        return {
          ...phase,
          milestones: phase.milestones.map(milestone => {
            if (milestone._id === milestoneId) {
              return { ...milestone, isCompleted };
            }
            return milestone;
          })
        };
      }
      return phase;
    });

    set({ currentRoadmap: { ...currentRoadmap, phases: updatedPhases } });
  }
}));

export default useStore;
