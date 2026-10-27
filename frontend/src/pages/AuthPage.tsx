import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useGoogleLogin } from "@react-oauth/google";
import useAuthStore from "../store/authStore";

export default function AuthPage() {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");

  const { login, register, googleLogin } = useAuthStore();
  const navigate = useNavigate();

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await login(loginEmail, loginPassword);
      navigate("/");
    } catch (err) {
      setError(
        (err as { response?: { data?: { message?: string } } }).response?.data
          ?.message || "Login failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await register(regEmail, regPassword);
      navigate("/");
    } catch (err) {
      setError(
        (err as { response?: { data?: { message?: string } } }).response?.data
          ?.message || "Registration failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const triggerGoogleAuth = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setGoogleLoading(true);
      setError("");
      try {
        await googleLogin(tokenResponse.access_token);
        navigate("/");
      } catch (err) {
        setError(
          (err as { response?: { data?: { message?: string } } }).response?.data
            ?.message || "Google sign-in failed. Please try again.",
        );
      } finally {
        setGoogleLoading(false);
      }
    },
    onError: (err) => {
      console.error("Google authentication error:", err);
      setError("Google sign-in was cancelled or failed.");
      setGoogleLoading(false);
    },
  });

  const handleGoogleClick = () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId || clientId === "your-google-client-id-here") {
      setError(
        "Google Sign-In is not configured yet. Please add VITE_GOOGLE_CLIENT_ID in your frontend .env file.",
      );
      return;
    }
    triggerGoogleAuth();
  };

  return (
    <div className="page-bg min-h-screen flex items-center justify-center px-4 pt-16">
      <div className="w-full max-w-md animate-fade-in py-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-3">
            <span
              className="material-symbols-outlined icon-fill"
              style={{ color: "var(--th-primary-container)", fontSize: "32px" }}
            >
              hiking
            </span>
            <span
              style={{
                fontFamily: "Manrope, sans-serif",
                fontWeight: 700,
                fontSize: "28px",
                color: "var(--th-primary)",
                letterSpacing: "-0.02em",
              }}
            >
              Trailhead
            </span>
          </Link>
          <p
            style={{
              fontFamily: "Hanken Grotesk",
              fontSize: "15px",
              color: "var(--th-on-surface-variant)",
            }}
          >
            Welcome back. Let's get moving.
          </p>
        </div>

        {/* Card */}
        <div className="card-flat" style={{ padding: "2rem" }}>
          {/* Tabs */}
          <div
            className="flex rounded-lg p-1 mb-7"
            style={{
              background: "var(--th-surface-container)",
              border: "1px solid var(--th-outline-variant)",
            }}
          >
            {(["login", "register"] as const).map((t) => (
              <button
                key={t}
                onClick={() => {
                  setTab(t);
                  setError("");
                }}
                className="flex-1 py-2 rounded-md text-sm capitalize transition-all duration-200"
                style={{
                  fontFamily: "Hanken Grotesk, sans-serif",
                  fontWeight: 600,
                  background:
                    tab === t ? "var(--th-primary-container)" : "transparent",
                  color:
                    tab === t
                      ? "var(--th-on-primary)"
                      : "var(--th-on-surface-variant)",
                }}
              >
                {t === "login" ? "Sign In" : "Create Account"}
              </button>
            ))}
          </div>

          {/* Error Banner */}
          {error && (
            <div
              className="flex items-start gap-2 p-3 rounded-lg mb-5"
              style={{
                background:
                  "color-mix(in srgb, var(--th-error-container) 50%, transparent)",
                border:
                  "1px solid color-mix(in srgb, var(--th-error) 30%, transparent)",
              }}
            >
              <span
                className="material-symbols-outlined icon-fill"
                style={{
                  color: "var(--th-error)",
                  fontSize: "18px",
                  flexShrink: 0,
                }}
              >
                error
              </span>
              <p
                style={{
                  fontFamily: "Hanken Grotesk",
                  fontSize: "13px",
                  color: "var(--th-on-error-container)",
                }}
              >
                {error}
              </p>
            </div>
          )}

          {/* Login Form */}
          {tab === "login" && (
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label
                  className="block mb-1.5"
                  style={{
                    fontFamily: "Hanken Grotesk",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "var(--th-on-surface)",
                  }}
                >
                  Email Address
                </label>
                <input
                  type="email"
                  className="input-field"
                  placeholder="hiker@example.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <label
                  className="block mb-1.5"
                  style={{
                    fontFamily: "Hanken Grotesk",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "var(--th-on-surface)",
                  }}
                >
                  Password
                </label>
                <input
                  type="password"
                  className="input-field"
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                />
              </div>
              <button
                type="submit"
                className="btn-primary w-full py-3"
                disabled={loading || googleLoading}
              >
                {loading ? (
                  <>
                    <span
                      className="material-symbols-outlined animate-spin-glow"
                      style={{ fontSize: "18px" }}
                    >
                      refresh
                    </span>{" "}
                    Signing in...
                  </>
                ) : (
                  <>
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: "18px" }}
                    >
                      login
                    </span>{" "}
                    Sign In
                  </>
                )}
              </button>
            </form>
          )}

          {/* Register Form */}
          {tab === "register" && (
            <form onSubmit={handleRegister} className="space-y-5">
              <div>
                <label
                  className="block mb-1.5"
                  style={{
                    fontFamily: "Hanken Grotesk",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "var(--th-on-surface)",
                  }}
                >
                  Email Address
                </label>
                <input
                  type="email"
                  className="input-field"
                  placeholder="hiker@example.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <label
                  className="block mb-1.5"
                  style={{
                    fontFamily: "Hanken Grotesk",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "var(--th-on-surface)",
                  }}
                >
                  Password
                </label>
                <input
                  type="password"
                  className="input-field"
                  placeholder="••••••••"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  required
                />
              </div>
              <button
                type="submit"
                className="btn-primary w-full py-3"
                disabled={loading || googleLoading}
              >
                {loading ? (
                  <>
                    <span
                      className="material-symbols-outlined animate-spin-glow"
                      style={{ fontSize: "18px" }}
                    >
                      refresh
                    </span>{" "}
                    Creating account...
                  </>
                ) : (
                  <>
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: "18px" }}
                    >
                      person_add
                    </span>{" "}
                    Create Account
                  </>
                )}
              </button>
            </form>
          )}

          {/* Divider */}
          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center">
              <div
                className="w-full border-t"
                style={{ borderColor: "var(--th-outline-variant)" }}
              />
            </div>
            <span
              className="relative px-3 text-xs uppercase"
              style={{
                fontFamily: "Hanken Grotesk",
                background: "var(--th-surface-container-low)",
                color: "var(--th-muted)",
                letterSpacing: "0.08em",
                fontWeight: 600,
              }}
            >
              Or continue with
            </span>
          </div>

          {/* Google Sign In Button */}
          <button
            type="button"
            onClick={handleGoogleClick}
            disabled={loading || googleLoading}
            className="w-full py-2.5 px-4 rounded-lg flex items-center justify-center gap-3 transition-all duration-200 hover:opacity-90 active:scale-[0.99]"
            style={{
              background: "var(--th-surface-container-high)",
              border: "1px solid var(--th-outline-variant)",
              color: "var(--th-on-surface)",
              fontFamily: "Hanken Grotesk, sans-serif",
              fontWeight: 600,
              fontSize: "14px",
              cursor: loading || googleLoading ? "not-allowed" : "pointer",
            }}
          >
            {googleLoading ? (
              <>
                <span
                  className="material-symbols-outlined animate-spin-glow"
                  style={{ fontSize: "18px" }}
                >
                  refresh
                </span>
                <span>Connecting to Google...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </>
            )}
          </button>

          {/* Footer link */}
          <p
            className="mt-6 text-center"
            style={{
              fontFamily: "Hanken Grotesk",
              fontSize: "14px",
              color: "var(--th-on-surface-variant)",
            }}
          >
            {tab === "login" ? (
              <>
                New to Trailhead?{" "}
                <button
                  onClick={() => setTab("register")}
                  style={{
                    color: "var(--th-primary-container)",
                    fontWeight: 600,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  Create an account
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  onClick={() => setTab("login")}
                  style={{
                    color: "var(--th-primary-container)",
                    fontWeight: 600,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
