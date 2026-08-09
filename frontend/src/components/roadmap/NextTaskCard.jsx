import { useEffect, useState } from "react";
import { ArrowRight, Sparkles, PartyPopper, Loader2 } from "lucide-react";
import apiClient from "../../api/apiClient";
import "./NextTaskCard.css";

const NextTaskCard = ({ roadmapId, onFocus }) => {
  const [task, setTask] = useState(undefined); // undefined = loading, null = none found
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const fetchNext = async () => {
      try {
        const response = await apiClient.get(`/roadmaps/${roadmapId}/next`);
        setTask(response.data.data.milestone);
        setMessage(response.data.data.message || null);
      } catch (err) {
        setTask(null);
      }
    };
    fetchNext();
  }, [roadmapId]);

  if (task === undefined) {
    return (
      <div className="next-task-card loading">
        <Loader2 className="spinner" size={20} />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="next-task-card done">
        <PartyPopper size={24} />
        <span>{message || "All caught up! No pending milestones."}</span>
      </div>
    );
  }

  return (
    <div className="next-task-card">
      <div className="next-task-label">
        <Sparkles size={16} /> Today's Focus
      </div>
      <h3 className="next-task-title">{task.title}</h3>
      <p className="next-task-phase">{task.phase?.title}</p>
      <p className="next-task-micro">{task.microFirstStep}</p>
      <button
        className="btn btn-primary btn-small mt-2"
        onClick={() => onFocus && onFocus(task)}
      >
        Jump to this milestone <ArrowRight size={16} />
      </button>
    </div>
  );
};

export default NextTaskCard;
