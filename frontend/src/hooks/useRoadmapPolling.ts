import { useEffect, useRef } from 'react';
import useRoadmapStore from '../store/roadmapStore';
import type { Roadmap } from '../store/roadmapStore';

/**
 * Polls GET /roadmaps/:id every 2.5 seconds while status === 'generating'.
 * Stops automatically when status changes (active / abandoned / completed).
 * Includes retry tolerance for transient network drops and a 90s safety timeout.
 */
export function useRoadmapPolling(
  roadmapId: string,
  onComplete: (roadmap: Roadmap) => void,
  onError?: (errorMsg: string) => void
) {
  const fetchRoadmapDetail = useRoadmapStore((s) => s.fetchRoadmapDetail);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const consecutiveFailuresRef = useRef<number>(0);
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    if (!roadmapId) return;

    consecutiveFailuresRef.current = 0;
    startTimeRef.current = Date.now();

    const poll = async () => {
      // 90-second overall timeout safety valve
      if (Date.now() - startTimeRef.current > 90000) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        onError?.('Generation took longer than expected. Please check your dashboard.');
        return;
      }

      try {
        const roadmap = await fetchRoadmapDetail(roadmapId);
        consecutiveFailuresRef.current = 0; // reset on success

        if (roadmap.status !== 'generating') {
          if (intervalRef.current) clearInterval(intervalRef.current);
          onComplete(roadmap);
        }
      } catch {
        consecutiveFailuresRef.current += 1;
        // Only give up after 6 consecutive failed network requests (15+ seconds of total disconnection)
        if (consecutiveFailuresRef.current >= 6) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          onError?.('Unable to connect to the server. Please check your internet connection.');
        }
      }
    };

    // Initial check
    poll();
    intervalRef.current = setInterval(poll, 2500);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [roadmapId, fetchRoadmapDetail, onComplete, onError]);
}
