import { useState } from "react";
import "./LoginModule.css"; // Import the specific CSS file

function App_1({ onLogin }) {
  // State for form inputs
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [activeTab, setActiveTab] = useState("signin");
  const [successMessage, setSuccessMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [signInError, setSignInError] = useState("");
  const [registrationError, setRegistrationError] = useState("");

  // Register function
  async function registerUser(email, password) {
    const response = await fetch('http://localhost:8080/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), password })
    });

    if (!response.ok) {
      const serverMessage = await response.text();
      throw new Error(
        response.status === 409
          ? "An account with this email already exists."
          : serverMessage || "Registration could not be completed.",
      );
    }

    return response.json();
  }

  // Sign In Handler
  const handleSignIn = async (e) => {
    e.preventDefault();
    setSignInError("");

    if (!signInEmail || !signInPassword) {
      setSignInError("Please fill in both fields.");
      return;
    }

    try {
      const response = await fetch("http://localhost:8080/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: signInEmail.trim(),
          password: signInPassword,
        }),
      });

      if (!response.ok) {
        setSignInError(
          response.status === 401
            ? "Invalid email or password."
            : "The server could not complete the sign-in request. Please try again.",
        );
        return;
      }

      const data = await response.json();

      if (!data.token) {
        setSignInError("The server response did not include a login token.");
        return;
      }

      localStorage.setItem("token", data.token);localStorage.setItem("email", signInEmail);
      onLogin();

    } catch (err) {
      console.error(err);
      setSignInError("Unable to connect to the server.");
    }
  };

  // Sign Up Handler
  const handleSignUp = async (e) => {
    e.preventDefault();
    setRegistrationError("");

    // Validate password match
    if (signUpPassword !== confirmPassword) {
      setPasswordError("❌ Passwords do not match.");
      return;
    } else {
      setPasswordError("");
    }

    if (!signUpEmail || !signUpPassword) {
      alert('Please fill in all fields.');
      return;
    }

    // Call register API
    try {
      await registerUser(signUpEmail, signUpPassword);
      setSuccessMessage(`✅ Registration successful for ${signUpEmail}!`);
      // Reset form
      setSignUpEmail("");
      setSignUpPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error("Registration failed:", error);
      setRegistrationError(
        error instanceof Error
          ? error.message
          : "Registration could not be completed.",
      );
    }
  };

  // Switch tabs
  const switchTab = (tab) => {
    setActiveTab(tab);
    setSuccessMessage("");
    setPasswordError("");
    setSignInError("");
    setRegistrationError("");
  };

  return (
    <div className="login-container">
      <div className="login-main">
        {/* Brand Section */}
        <div className="brand-section">
          <div className="login-logo">
            📄 Docs<span>Online</span>
          </div>
          <p className="tagline">
            Secure, collaborative document management<br />
            for teams and individuals.
          </p>
          <ul className="feature-list">
            <li>Real-time collaboration</li>
            <li>End-to-end encryption</li>
            <li>Access from any device</li>
            <li>Version history & restore</li>
          </ul>
        </div>

        {/* Form Section */}
        <div className="form-section">
          {/* Success Message */}
          {successMessage && (
            <div className="success-msg">✅ {successMessage}</div>
          )}

          {/* Tabs */}
          <div className="form-tabs">
            <button 
              className={`tab-button ${activeTab === 'signin' ? 'active' : ''}`}
              onClick={() => switchTab('signin')}
            >
              🔐 Sign In
            </button>
            <button 
              className={`tab-button ${activeTab === 'signup' ? 'active' : ''}`}
              onClick={() => switchTab('signup')}
            >
              📝 Register
            </button>
          </div>

          {/* Sign In Panel */}
          {activeTab === 'signin' && (
            <div className="form-panel">
              <h2 className="form-title">Welcome Back</h2>
              <p className="form-subtitle">Sign in to access your documents.</p>

              {signInError && (
                <div className="error-msg auth-error" role="alert">
                  {signInError}
                </div>
              )}

              <form onSubmit={handleSignIn}>
                <div className="form-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={signInEmail}
                    onChange={(e) => setSignInEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                    required
                    minLength="6"
                  />
                </div>
                <button type="submit" className="btn-primary">
                  Sign In
                </button>
              </form>

              <div className="form-footer">
                Don't have an account?{' '}
                <a onClick={() => switchTab('signup')}>
                  Register here
                </a>
              </div>
            </div>
          )}

          {/* Sign Up Panel */}
          {activeTab === 'signup' && (
            <div className="form-panel">
              <h2 className="form-title">Create Account</h2>
              <p className="form-subtitle">Start managing your docs in minutes.</p>

              {registrationError && (
                <div className="error-msg auth-error" role="alert">
                  {registrationError}
                </div>
              )}

              <form onSubmit={handleSignUp}>
                <div className="form-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Password</label>
                    <input
                      type="password"
                      placeholder="Min 6 chars"
                      value={signUpPassword}
                      onChange={(e) => setSignUpPassword(e.target.value)}
                      required
                      minLength="6"
                    />
                  </div>
                  <div className="form-group">
                    <label>Confirm Password</label>
                    <input
                      type="password"
                      placeholder="Re-enter password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength="6"
                    />
                    {passwordError && (
                      <div className="error-msg">❌ {passwordError}</div>
                    )}
                  </div>
                </div>

                <button type="submit" className="btn-primary">
                  📝 Register
                </button>
              </form>

              <div className="form-footer">
                Already have an account?{' '}
                <a onClick={() => switchTab('signin')}>
                  Sign In
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App_1;
