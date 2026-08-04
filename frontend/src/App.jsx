import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import IntakeForm from './pages/IntakeForm';
import Dashboard from './pages/Dashboard';
import RoadmapDetail from './pages/RoadmapDetail';
import useStore from './store/useStore';

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const user = useStore(state => state.user);
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
    <Router>
      <div className="app-container">
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            <Route path="/" element={
              <ProtectedRoute>
                <IntakeForm />
              </ProtectedRoute>
            } />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/roadmap/:id" element={
              <ProtectedRoute>
                <RoadmapDetail />
              </ProtectedRoute>
            } />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
