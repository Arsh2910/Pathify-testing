import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Sparkles } from 'lucide-react';
import apiClient from '../api/apiClient';
import './IntakeForm.css';

const IntakeForm = () => {
  const [formData, setFormData] = useState({
    goal: '',
    targetTimeframe: '1 month'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.post('/roadmaps', formData);
      const newRoadmapId = response.data.data.roadmap._id;
      // Navigate to the newly generated roadmap detail view
      navigate(`/roadmap/${newRoadmapId}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate roadmap. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="intake-container animate-fade-in">
      <div className="intake-hero">
        <h1>What do you want to learn?</h1>
        <p className="text-secondary">Tell us your goal and we'll use AI to build a personalized roadmap designed to beat procrastination.</p>
      </div>

      <div className="card intake-card">
        {error && <div className="alert alert-error">{error}</div>}
        
        {loading ? (
          <div className="loading-state">
            <Loader2 className="spinner" size={48} />
            <h3 className="mt-4">Crafting your personalized journey...</h3>
            <p className="text-secondary">Our AI is breaking down your goal into bite-sized, achievable steps.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Learning Goal</label>
              <input 
                type="text" 
                name="goal" 
                className="form-input" 
                placeholder="e.g., Learn conversational Spanish, Master React.js..."
                value={formData.goal} 
                onChange={handleChange} 
                required 
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Target Timeframe</label>
              <select 
                name="targetTimeframe" 
                className="form-input" 
                value={formData.targetTimeframe} 
                onChange={handleChange}
              >
                <option value="1 week">1 week</option>
                <option value="2 weeks">2 weeks</option>
                <option value="1 month">1 month</option>
                <option value="3 months">3 months</option>
                <option value="6 months">6 months</option>
              </select>
            </div>

            <button type="submit" className="btn btn-primary btn-generate w-100 mt-2">
              <Sparkles size={20} /> Generate My Roadmap
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default IntakeForm;
