import { useState } from 'react';
import { Play, Clock, Zap, ExternalLink, Video, FileText, BookOpen } from 'lucide-react';
import apiClient from '../../api/apiClient';
import useStore from '../../store/useStore';
import './MilestoneCard.css';

const MilestoneCard = ({ milestone, phaseId }) => {
  const toggleMilestoneCompletion = useStore(state => state.toggleMilestoneCompletion);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleToggle = async () => {
    if (isUpdating) return;
    
    const newStatus = !milestone.isCompleted;
    
    // 1. Optimistic UI update
    toggleMilestoneCompletion(phaseId, milestone._id, newStatus);
    
    setIsUpdating(true);
    try {
      // 2. Network Request
      await apiClient.patch(`/milestones/${milestone._id}`, {
        isCompleted: newStatus
      });
    } catch (error) {
      // 3. Rollback on failure
      console.error("Failed to update milestone status", error);
      toggleMilestoneCompletion(phaseId, milestone._id, !newStatus);
      // Ideally show a toast notification here
    } finally {
      setIsUpdating(false);
    }
  };

  const getResourceIcon = (type) => {
    switch(type) {
      case 'video': return <Video size={16} />;
      case 'article': return <FileText size={16} />;
      case 'course': return <BookOpen size={16} />;
      default: return <ExternalLink size={16} />;
    }
  };

  return (
    <div className={`milestone-card ${milestone.isCompleted ? 'completed' : ''}`}>
      <div className="milestone-content-wrapper">
        
        {/* Toggle Checkbox Column */}
        <div className="milestone-toggle-col">
          <label className="checkbox-container">
            <input 
              type="checkbox" 
              checked={milestone.isCompleted} 
              onChange={handleToggle}
              disabled={isUpdating}
            />
            <span className="checkmark"></span>
          </label>
        </div>

        {/* Main Content Column */}
        <div className="milestone-main-col">
          <div className="milestone-header">
            <h4>{milestone.title}</h4>
            <span className="time-box">
              <Clock size={14} /> {milestone.suggestedTimeBox}
            </span>
          </div>
          
          <p className="milestone-description">{milestone.description}</p>
          
          {/* Procrastination Beating Highlights */}
          <div className="anti-procrastination-block">
            <div className="why-now">
              <strong><Zap size={16} className="inline-icon text-accent" /> Why Now:</strong> {milestone.whyNow}
            </div>
            
            <div className="micro-step">
              <div className="micro-step-badge">
                <Play size={12} fill="currentColor" /> Start Here
              </div>
              <span className="micro-step-text">{milestone.microFirstStep}</span>
            </div>
          </div>

          {/* Resources */}
          {milestone.resources && milestone.resources.length > 0 && (
            <div className="resources-list">
              {milestone.resources.map((resource, idx) => (
                <a 
                  key={idx} 
                  href={resource.link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="resource-link"
                >
                  {getResourceIcon(resource.type)}
                  <span>{resource.title}</span>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MilestoneCard;
