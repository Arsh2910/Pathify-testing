import { Link, useNavigate } from "react-router-dom";
import { Map, LogOut, Flame } from "lucide-react";
import useStore from "../../store/useStore";
import "./Navbar.css";

const Navbar = () => {
  const { user, logout } = useStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <Map className="logo-icon" size={28} />
          <span>Trailhead</span>
        </Link>
        <div className="navbar-links">
          {user ? (
            <>
              {user.currentStreak > 0 && (
                <span
                  className="streak-badge"
                  title={`Longest streak: ${user.longestStreak} days`}
                >
                  <Flame size={16} /> {user.currentStreak}
                </span>
              )}
              <Link to="/dashboard" className="nav-link">
                Dashboard
              </Link>
              <button onClick={handleLogout} className="nav-link btn-logout">
                <LogOut size={18} /> Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">
                Login
              </Link>
              <Link to="/register" className="btn btn-primary btn-small">
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
