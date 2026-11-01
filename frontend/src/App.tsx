import { useEffect, type ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import CommandPalette from './components/CommandPalette';
import ToastContainer from './components/ToastContainer';
import ErrorBoundary from './components/ErrorBoundary';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import IntakeForm from './pages/IntakeForm';
import LoadingScreen from './pages/LoadingScreen';
import RoadmapDetail from './pages/RoadmapDetail';
import NotFoundPage from './pages/NotFoundPage';
import useAuthStore from './store/authStore';

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const { token, checkAuth } = useAuthStore();

  useEffect(() => {
    if (token) {
      checkAuth();
    }
  }, [token, checkAuth]);

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Navbar />
        <CommandPalette />
        <ToastContainer />
        <Routes>
          {/* Public Auth */}
          <Route path="/login" element={<AuthPage initialTab="login" />} />
          <Route path="/register" element={<AuthPage initialTab="register" />} />
          <Route path="/forgot-password" element={<AuthPage initialTab="forgot" />} />
          <Route path="/reset-password" element={<AuthPage initialTab="reset" />} />

          {/* Protected Application Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/new"
            element={
              <ProtectedRoute>
                <IntakeForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/roadmaps/:id/loading"
            element={
              <ProtectedRoute>
                <LoadingScreen />
              </ProtectedRoute>
            }
          />
          <Route
            path="/roadmaps/:id"
            element={
              <ProtectedRoute>
                <RoadmapDetail />
              </ProtectedRoute>
            }
          />

          {/* 404 Dedicated Route */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
