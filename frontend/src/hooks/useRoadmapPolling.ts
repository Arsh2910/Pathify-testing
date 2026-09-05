import { useEffect, useRef } from 'react';
import useRoadmapStore from '../store/roadmapStore';
import type { Roadmap } from '../store/roadmapStore';

/**
 * Polls GET /roadmaps/:id every 3 seconds while status === 'generating'.
 * Stops automatically when status changes (active / abandoned / completed).
 * Returns the current roadmap status.
 */
export function useRoadmapPolling(roadmapId: string, onComplete: (roadmap: Roadmap) => void) {
  const fetchRoadmapDetail = useRoadmapStore((s) => s.fetchRoadmapDetail);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!roadmapId) return;

    const poll = async () => {
      try {
        const roadmap = await fetchRoadmapDetail(roadmapId);
        if (roadmap.status !== 'generating') {
          if (intervalRef.current) clearInterval(intervalRef.current);
          onComplete(roadmap);
        }
      } catch {
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
    };

    // Start immediately
    poll();
    intervalRef.current = setInterval(poll, 3000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [roadmapId]);
}
