import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Target, Calendar, ArrowRight, Loader2 } from 'lucide-react';
import apiClient from '../api/apiClient';
import './Dashboard.css';

const Dashboard = () => {
  const [roadmaps, setRoadmaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRoadmaps = async () => {
      try {
        const response = await apiClient.get('/roadmaps');
        setRoadmaps(response.data.data.roadmaps);
      } catch (err) {
        setError('Failed to fetch roadmaps. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchRoadmaps();
  }, []);

  if (loading) {
    return (
      <div className="dashboard-loading">
        <Loader2 className="spinner" size={40} />
      </div>
    );
  }

  return (
    <div className="dashboard-container animate-fade-in">
      <div className="dashboard-header">
        <h2>Your Roadmaps</h2>
        <Link to="/" className="btn btn-primary">Create New Roadmap</Link>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {roadmaps.length === 0 && !error ? (
        <div className="empty-state card text-center">
          <h3>No roadmaps yet!</h3>
          <p className="text-secondary mt-1 mb-4">Start your learning journey by generating your first AI roadmap.</p>
          <Link to="/" className="btn btn-primary">Get Started</Link>
        </div>
      ) : (
        <div className="roadmap-grid">
          {roadmaps.map(roadmap => (
            <div key={roadmap._id} className="card roadmap-card">
              <h3 className="roadmap-title">{roadmap.goal}</h3>
              <div className="roadmap-meta">
                <span className="meta-item"><Target size={16} /> {roadmap.status}</span>
                <span className="meta-item"><Calendar size={16} /> {roadmap.targetTimeframe}</span>
              </div>
              <Link to={`/roadmap/${roadmap._id}`} className="btn btn-secondary w-100 mt-4">
                View Roadmap <ArrowRight size={16} />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
