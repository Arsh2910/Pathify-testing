import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Loader2, ArrowLeft, Trophy } from "lucide-react";
import apiClient from "../api/apiClient";
import useStore from "../store/useStore";
import PhaseAccordion from "../components/roadmap/PhaseAccordion";
import NextTaskCard from "../components/roadmap/NextTaskCard";
import "./RoadmapDetail.css";

const RoadmapDetail = () => {
  const { id } = useParams();
  const {
    currentRoadmap,
    setCurrentRoadmap,
    roadmapProgress,
    setRoadmapProgress,
  } = useStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRoadmap = async () => {
      try {
        const response = await apiClient.get(`/roadmaps/${id}`);
        const fullRoadmap = {
          ...response.data.data.roadmap,
          phases: response.data.data.phases,
        };
        setCurrentRoadmap(fullRoadmap);
        setRoadmapProgress(response.data.data.progress);
      } catch (err) {
        setError("Failed to load roadmap.");
      } finally {
        setLoading(false);
      }
    };
    fetchRoadmap();

    return () => setCurrentRoadmap(null);
  }, [id, setCurrentRoadmap, setRoadmapProgress]);

  if (loading)
    return (
      <div className="dashboard-loading">
        <Loader2 className="spinner" size={40} />
      </div>
    );
  if (error || !currentRoadmap)
    return (
      <div className="alert alert-error">{error || "Roadmap not found"}</div>
    );

  // Prefer server-computed progress; fall back to client calc if not yet loaded
  let progressPercent = roadmapProgress?.percentage;
  if (progressPercent === undefined) {
    let total = 0,
      completed = 0;
    currentRoadmap.phases.forEach((phase) => {
      phase.milestones.forEach((m) => {
        total++;
        if (m.isCompleted) completed++;
      });
    });
    progressPercent = total === 0 ? 0 : Math.round((completed / total) * 100);
  }
  const isFullyCompleted = progressPercent === 100;

  let activePhaseId = null;
  for (const phase of currentRoadmap.phases) {
    const isPhaseComplete = phase.milestones.every((m) => m.isCompleted);
    if (!isPhaseComplete && phase.milestones.length > 0) {
      activePhaseId = phase._id;
      break;
    }
  }

  return (
    <div className="roadmap-detail-container animate-fade-in">
      <div className="roadmap-header">
        <Link to="/dashboard" className="back-link">
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
        <h1 className="roadmap-title">{currentRoadmap.goal}</h1>
        <p className="roadmap-timeframe">
          Target: {currentRoadmap.targetTimeframe}
        </p>

        <div className="progress-container mt-4">
          <div className="flex justify-between mb-2">
            <span className="text-secondary font-500">Overall Progress</span>
            <span className="font-500">{progressPercent}%</span>
          </div>
          <div className="progress-bar-bg">
            <div
              className="progress-bar-fill"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>

        {isFullyCompleted && (
          <div className="completion-banner mt-4 animate-fade-in">
            <Trophy size={24} className="trophy-icon" />
            <div>
              <h3>Incredible work!</h3>
              <p>You have completed this entire roadmap.</p>
            </div>
          </div>
        )}
      </div>

      {!isFullyCompleted && <NextTaskCard roadmapId={id} />}

      <div className="phases-container mt-4">
        {currentRoadmap.phases.map((phase, index) => {
          const isPhaseComplete =
            phase.milestones.every((m) => m.isCompleted) &&
            phase.milestones.length > 0;
          let status = "locked";
          if (isPhaseComplete) status = "completed";
          else if (phase._id === activePhaseId) status = "active";

          return (
            <PhaseAccordion
              key={phase._id}
              phase={phase}
              status={status}
              phaseNumber={index + 1}
            />
          );
        })}
      </div>
    </div>
  );
};

export default RoadmapDetail;
