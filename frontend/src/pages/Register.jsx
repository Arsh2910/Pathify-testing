import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import apiClient from '../api/apiClient';
import useStore from '../store/useStore';
import './Auth.css';

const Register = () => {
  const [formData, setFormData] = useState({
    email: '', password: '', skillLevel: 'beginner', hoursPerDay: 1
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { setAuth } = useStore();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const response = await apiClient.post('/auth/register', {
        ...formData,
        hoursPerDay: Number(formData.hoursPerDay)
      });
      const { user } = response.data.data;
      const { token } = response.data;
      setAuth(user, token);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container animate-fade-in">
      <div className="card auth-card">
        <h2 className="text-center mb-4">Create Account</h2>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input type="email" name="email" className="form-input" value={formData.email} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input type="password" name="password" className="form-input" value={formData.password} onChange={handleChange} required minLength="6" />
          </div>
          <div className="form-group">
            <label className="form-label">Default Skill Level</label>
            <select name="skillLevel" className="form-input" value={formData.skillLevel} onChange={handleChange}>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Hours available per day</label>
            <input type="number" name="hoursPerDay" className="form-input" value={formData.hoursPerDay} onChange={handleChange} required min="0.5" max="24" step="0.5" />
          </div>
          <button type="submit" className="btn btn-primary w-100 mt-2" disabled={loading}>
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>
        <p className="text-center mt-4 text-secondary">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
