import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, CheckCircle2, Lock } from 'lucide-react';
import MilestoneCard from './MilestoneCard';
import './PhaseAccordion.css';

const PhaseAccordion = ({ phase, status, phaseNumber }) => {
  // Determine if it should be expanded by default (only 'active' phases)
  const [isExpanded, setIsExpanded] = useState(status === 'active');

  // Update expansion if status changes from outside (e.g., previous phase completed)
  useEffect(() => {
    if (status === 'active') setIsExpanded(true);
  }, [status]);

  const toggleExpand = () => {
    // Only allow toggling if not locked
    if (status !== 'locked') {
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <div className={`phase-accordion status-${status}`}>
      <div className="phase-header" onClick={toggleExpand}>
        <div className="phase-header-left">
          <div className="phase-number">{phaseNumber}</div>
          <div className="phase-title-group">
            <h3>{phase.title}</h3>
            <span className="phase-meta">
              {phase.milestones.filter(m => m.isCompleted).length} / {phase.milestones.length} Milestones Completed
            </span>
          </div>
        </div>
        
        <div className="phase-header-right">
          {status === 'completed' && <CheckCircle2 className="status-icon completed" />}
          {status === 'locked' && <Lock className="status-icon locked" size={20} />}
          {status !== 'locked' && (
            <div className={`chevron-icon ${isExpanded ? 'expanded' : ''}`}>
              <ChevronDown />
            </div>
          )}
        </div>
      </div>

      {isExpanded && status !== 'locked' && (
        <div className="phase-content animate-fade-in">
          {phase.milestones.length === 0 ? (
            <p className="text-secondary text-center py-4">No milestones in this phase.</p>
          ) : (
            phase.milestones.map((milestone) => (
              <MilestoneCard 
                key={milestone._id} 
                milestone={milestone} 
                phaseId={phase._id} 
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default PhaseAccordion;
