import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useGoogleLogin } from "@react-oauth/google";
import useAuthStore from "../store/authStore";

interface AuthPageProps {
  initialTab?: "login" | "register" | "forgot" | "reset";
}

const rawClientId = (
  import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined
)?.trim();
const hasGoogleAuth = Boolean(
  rawClientId && rawClientId !== "your-google-client-id-here",
);

function ActiveGoogleButton({
  onSuccess,
  onError,
  loading,
}: {
  onSuccess: (token: string) => void;
  onError: (msg: string) => void;
  loading: boolean;
}) {
  const trigger = useGoogleLogin({
    onSuccess: (tokenResponse) => onSuccess(tokenResponse.access_token),
    onError: (err) => {
      console.error("Google sign-in error:", err);
      onError("Google sign-in was cancelled or failed.");
    },
  });

  return (
    <button
      type="button"
      onClick={() => trigger()}
      disabled={loading}
      className="w-full py-2.5 px-4 rounded-lg flex items-center justify-center gap-3 transition-all duration-200 hover:opacity-90 active:scale-[0.99] cursor-pointer"
      style={{
        background: "var(--th-surface-container-high)",
        border: "1px solid var(--th-outline-variant)",
        color: "var(--th-on-surface)",
        fontFamily: "Hanken Grotesk, sans-serif",
        fontWeight: 600,
        fontSize: "14px",
      }}
    >
      <GoogleSvg />
      <span>Continue with Google</span>
    </button>
  );
}

function GoogleSvg() {
  return (
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
  );
}

export default function AuthPage({ initialTab = "login" }: AuthPageProps) {
  const [tab, setTab] = useState<"login" | "register" | "forgot" | "reset">(
    initialTab,
  );
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Show/Hide password toggles
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirm, setShowRegConfirm] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Login inputs
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register inputs
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");

  // Forgot / Reset inputs
  const [forgotEmail, setForgotEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [generatedCodePreview, setGeneratedCodePreview] = useState<
    string | null
  >(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const { login, register, googleLogin, forgotPassword, resetPassword } =
    useAuthStore();
  const navigate = useNavigate();

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMsg("");
    try {
      await login(loginEmail, loginPassword);
      navigate("/");
    } catch (err) {
      setError(
        (err as { response?: { data?: { message?: string } } }).response?.data
          ?.message || "Login failed. Please check your credentials.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    if (regPassword !== regConfirmPassword) {
      setError("Passwords do not match. Please ensure both passwords match.");
      return;
    }
    if (regPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccessMsg("");
    try {
      await register(regEmail, regPassword, regName);
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

  const handleForgotPassword = async (e: FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccessMsg("");
    try {
      const res = await forgotPassword(forgotEmail);
      setSuccessMsg(res.message);
      if (res.resetCode) {
        setGeneratedCodePreview(res.resetCode);
        setResetCode(res.resetCode);
      }
      setTab("reset");
    } catch (err) {
      setError(
        (err as { response?: { data?: { message?: string } } }).response?.data
          ?.message || "Failed to process password reset request.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      setError("New passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccessMsg("");
    try {
      await resetPassword(forgotEmail || loginEmail, resetCode, newPassword);
      setSuccessMsg("Password successfully reset! Logging you in...");
      setTimeout(() => navigate("/"), 600);
    } catch (err) {
      setError(
        (err as { response?: { data?: { message?: string } } }).response?.data
          ?.message || "Password reset failed. Invalid or expired code.",
      );
    } finally {
      setLoading(false);
    }
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
              hub
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
              GoalWeave
            </span>
          </Link>
          <p
            style={{
              fontFamily: "Hanken Grotesk",
              fontSize: "15px",
              color: "var(--th-on-surface-variant)",
            }}
          >
            {tab === "forgot" || tab === "reset"
              ? "Account Recovery & Security"
              : "Weave your path to mastery. One milestone at a time."}
          </p>
        </div>

        {/* Card */}
        <div className="card-flat" style={{ padding: "2rem" }}>
          {/* Tabs for Login / Register */}
          {(tab === "login" || tab === "register") && (
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
                    setSuccessMsg("");
                  }}
                  className="flex-1 py-2 rounded-md text-sm capitalize transition-all duration-200 cursor-pointer"
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
          )}

          {/* Success Banner */}
          {successMsg && (
            <div
              className="flex items-start gap-2 p-3 rounded-lg mb-5 animate-fade-in"
              style={{
                background:
                  "color-mix(in srgb, var(--th-primary-container) 15%, transparent)",
                border: "1px solid var(--th-primary-container)",
              }}
            >
              <span
                className="material-symbols-outlined icon-fill"
                style={{
                  color: "var(--th-primary)",
                  fontSize: "18px",
                  flexShrink: 0,
                }}
              >
                check_circle
              </span>
              <p
                style={{
                  fontFamily: "Hanken Grotesk",
                  fontSize: "13px",
                  color: "var(--th-on-surface)",
                }}
              >
                {successMsg}
              </p>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div
              className="flex items-start gap-2 p-3 rounded-lg mb-5 animate-fade-in"
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

          {/* ================= LOGIN FORM ================= */}
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
                  placeholder="weaver@example.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    style={{
                      fontFamily: "Hanken Grotesk",
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "var(--th-on-surface)",
                    }}
                  >
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotEmail(loginEmail);
                      setTab("forgot");
                      setError("");
                      setSuccessMsg("");
                    }}
                    style={{
                      color: "var(--th-primary)",
                      fontSize: "12px",
                      fontWeight: 600,
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: 0,
                    }}
                    className="hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showLoginPassword ? "text" : "password"}
                    className="input-field pr-10"
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                    }}
                    tabIndex={-1}
                  >
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: "19px" }}
                    >
                      {showLoginPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
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

          {/* ================= REGISTER FORM ================= */}
          {tab === "register" && (
            <form onSubmit={handleRegister} className="space-y-4">
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
                  Full Name (Optional)
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Alex Rivera"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
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
                  Email Address
                </label>
                <input
                  type="email"
                  className="input-field"
                  placeholder="weaver@example.com"
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
                  Password (min. 6 characters)
                </label>
                <div className="relative">
                  <input
                    type={showRegPassword ? "text" : "password"}
                    className="input-field pr-10"
                    placeholder="••••••••"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                    }}
                    tabIndex={-1}
                  >
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: "19px" }}
                    >
                      {showRegPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
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
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showRegConfirm ? "text" : "password"}
                    className="input-field pr-10"
                    placeholder="••••••••"
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegConfirm((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                    }}
                    tabIndex={-1}
                  >
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: "19px" }}
                    >
                      {showRegConfirm ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
                {regConfirmPassword && regPassword !== regConfirmPassword && (
                  <p className="text-xs text-red-500 mt-1">
                    Passwords do not match
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="btn-primary w-full py-3 mt-2"
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

          {/* ================= FORGOT PASSWORD FORM ================= */}
          {tab === "forgot" && (
            <div className="space-y-5 animate-fade-in">
              <div className="text-left">
                <h3
                  style={{
                    fontFamily: "Manrope, sans-serif",
                    fontWeight: 700,
                    fontSize: "20px",
                    color: "var(--th-on-surface)",
                  }}
                >
                  Forgot Password
                </h3>
                <p
                  className="mt-1"
                  style={{
                    fontFamily: "Hanken Grotesk",
                    fontSize: "13px",
                    color: "var(--th-on-surface-variant)",
                  }}
                >
                  Enter your account email. We'll generate a secure 6-digit reset
                  code valid for 15 minutes.
                </p>
              </div>

              <form onSubmit={handleForgotPassword} className="space-y-4">
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
                    placeholder="weaver@example.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn-primary w-full py-3"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span
                        className="material-symbols-outlined animate-spin-glow"
                        style={{ fontSize: "18px" }}
                      >
                        refresh
                      </span>{" "}
                      Generating Code...
                    </>
                  ) : (
                    <>
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: "18px" }}
                      >
                        mark_email_read
                      </span>{" "}
                      Send Reset Code
                    </>
                  )}
                </button>
              </form>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setTab("login");
                    setError("");
                    setSuccessMsg("");
                  }}
                  className="text-sm font-semibold hover:underline inline-flex items-center gap-1"
                  style={{
                    color: "var(--th-primary)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: "16px" }}
                  >
                    arrow_back
                  </span>
                  Back to Sign In
                </button>
              </div>
            </div>
          )}

          {/* ================= RESET PASSWORD FORM ================= */}
          {tab === "reset" && (
            <div className="space-y-5 animate-fade-in">
              <div className="text-left">
                <h3
                  style={{
                    fontFamily: "Manrope, sans-serif",
                    fontWeight: 700,
                    fontSize: "20px",
                    color: "var(--th-on-surface)",
                  }}
                >
                  Set New Password
                </h3>
                <p
                  className="mt-1"
                  style={{
                    fontFamily: "Hanken Grotesk",
                    fontSize: "13px",
                    color: "var(--th-on-surface-variant)",
                  }}
                >
                  Enter the 6-digit verification code and choose your new
                  password.
                </p>
              </div>

              {generatedCodePreview && (
                <div
                  className="p-3.5 rounded-lg border flex items-center justify-between"
                  style={{
                    background: "var(--th-surface-container-high)",
                    borderColor: "var(--th-primary-container)",
                  }}
                >
                  <div>
                    <p
                      style={{
                        fontFamily: "Hanken Grotesk",
                        fontSize: "11px",
                        fontWeight: 700,
                        color: "var(--th-primary)",
                        letterSpacing: "0.05em",
                      }}
                    >
                      YOUR RESET CODE:
                    </p>
                    <p
                      style={{
                        fontFamily: "monospace",
                        fontSize: "20px",
                        fontWeight: 700,
                        letterSpacing: "0.2em",
                        color: "var(--th-on-surface)",
                      }}
                    >
                      {generatedCodePreview}
                    </p>
                  </div>
                  <span
                    className="material-symbols-outlined text-green-500"
                    style={{ fontSize: "28px" }}
                  >
                    key
                  </span>
                </div>
              )}

              <form onSubmit={handleResetPassword} className="space-y-4">
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
                    placeholder="weaver@example.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
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
                    6-Digit Reset Code
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    className="input-field text-center tracking-widest font-mono text-lg"
                    placeholder="123456"
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value)}
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
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showResetPassword ? "text" : "password"}
                      className="input-field pr-10"
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowResetPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                      }}
                      tabIndex={-1}
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: "19px" }}
                      >
                        {showResetPassword ? "visibility_off" : "visibility"}
                      </span>
                    </button>
                  </div>
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
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showResetConfirm ? "text" : "password"}
                      className="input-field pr-10"
                      placeholder="••••••••"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowResetConfirm((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                      }}
                      tabIndex={-1}
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: "19px" }}
                      >
                        {showResetConfirm ? "visibility_off" : "visibility"}
                      </span>
                    </button>
                  </div>
                  {confirmNewPassword && newPassword !== confirmNewPassword && (
                    <p className="text-xs text-red-500 mt-1">
                      Passwords do not match
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  className="btn-primary w-full py-3 mt-2"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span
                        className="material-symbols-outlined animate-spin-glow"
                        style={{ fontSize: "18px" }}
                      >
                        refresh
                      </span>{" "}
                      Resetting Password...
                    </>
                  ) : (
                    <>
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: "18px" }}
                      >
                        lock_reset
                      </span>{" "}
                      Reset Password & Sign In
                    </>
                  )}
                </button>
              </form>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setTab("login");
                    setError("");
                    setSuccessMsg("");
                  }}
                  className="text-sm font-semibold hover:underline inline-flex items-center gap-1"
                  style={{
                    color: "var(--th-primary)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: "16px" }}
                  >
                    arrow_back
                  </span>
                  Back to Sign In
                </button>
              </div>
            </div>
          )}

          {/* Social login divider for login/register */}
          {(tab === "login" || tab === "register") && (
            <>
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
              {hasGoogleAuth ? (
                <ActiveGoogleButton
                  onSuccess={async (accessToken) => {
                    setGoogleLoading(true);
                    setError("");
                    try {
                      await googleLogin(accessToken);
                      navigate("/");
                    } catch (err) {
                      setError(
                        (err as { response?: { data?: { message?: string } } })
                          .response?.data?.message ||
                          "Google sign-in failed. Please try again.",
                      );
                    } finally {
                      setGoogleLoading(false);
                    }
                  }}
                  onError={(msg) => setError(msg)}
                  loading={loading || googleLoading}
                />
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    setError(
                      "Google Sign-In is not configured yet. Add VITE_GOOGLE_CLIENT_ID to your frontend .env file.",
                    )
                  }
                  disabled={loading || googleLoading}
                  className="w-full py-2.5 px-4 rounded-lg flex items-center justify-center gap-3 transition-all duration-200 hover:opacity-90 active:scale-[0.99] cursor-pointer"
                  style={{
                    background: "var(--th-surface-container-high)",
                    border: "1px solid var(--th-outline-variant)",
                    color: "var(--th-on-surface)",
                    fontFamily: "Hanken Grotesk, sans-serif",
                    fontWeight: 600,
                    fontSize: "14px",
                  }}
                >
                  <GoogleSvg />
                  <span>Continue with Google</span>
                </button>
              )}

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
                    New to GoalWeave?{" "}
                    <button
                      onClick={() => {
                        setTab("register");
                        setError("");
                        setSuccessMsg("");
                      }}
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
                      onClick={() => {
                        setTab("login");
                        setError("");
                        setSuccessMsg("");
                      }}
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
