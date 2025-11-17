import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../../services/dataService";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2Icon } from "lucide-react";
import "./Auth.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setMessage("");

    try {
      const response = await loginUser({ email, password });
      setMessage(response.message || "Login successful!");
      setIsSuccess(true);
      setTimeout(() => {
        setMessage("");
        navigate("/");
      }, 2000);
    } catch (error: any) {
      // Prevent any navigation/redirect on error
      e.preventDefault();

      let errorMessage = "Login failed. Please try again.";

      // Handle different error types
      if (error.response?.status === 401) {
        errorMessage = "Invalid email or password. Account does not exist.";
      } else if (error.response?.status === 404) {
        errorMessage = "Account not found. Please check your credentials.";
      } else if (error instanceof Error) {
        errorMessage = error.message;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      setMessage(errorMessage);
      setIsSuccess(false);
      setTimeout(() => setMessage(""), 5000);
    }

    return false;
  };

  return (
    <div className="auth-container">
      {/* Animated Background */}
      <div className="auth-background">
        <div className="auth-shape auth-shape-1"></div>
        <div className="auth-shape auth-shape-2"></div>
        <div className="auth-shape auth-shape-3"></div>
      </div>

      {/* Main Content */}
      <div className="auth-content-wrapper">
        {/* Left Side - Branding */}
        <div className="auth-info-section">
          <div className="auth-logo-container">
            <div className="auth-logo">
              <img
                src="src/assets/Career_logo.svg"
                alt="Career Guidance Logo"
              />
            </div>
          </div>

          <div className="auth-info-content">
            <h2 className="auth-info-title">
              Welcome to AI Career Guidance System
            </h2>
            <p className="auth-info-description">
              AI-Powered Career Guidance and Roadmap Generation System for CCS
              Students at Gordon College. Complete our assessment, get
              GroqAI-powered career suggestions, and access personalized
              learning roadmaps for IT careers.
            </p>

            <div className="auth-info-features">
              <div className="auth-feature-item">
                <div className="auth-feature-icon">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <span className="auth-feature-text">
                  GroqAI-Powered Career Recommendations
                </span>
              </div>
              <div className="auth-feature-item">
                <div className="auth-feature-icon">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <span className="auth-feature-text">
                  Personalized Learning Roadmaps
                </span>
              </div>
              <div className="auth-feature-item">
                <div className="auth-feature-icon">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <span className="auth-feature-text">Track Your Progress</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="auth-form-section">
          <div className="auth-form-header">
            <h1 className="auth-form-title">Sign In</h1>
            <p className="auth-form-subtitle">
              Welcome back! Please login to your account.
            </p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="auth-form-group">
              <label htmlFor="email" className="auth-form-label">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="auth-form-input"
                placeholder="your.email@gordon.edu.ph"
                required
              />
            </div>

            <div className="auth-form-group">
              <label htmlFor="password" className="auth-form-label">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="auth-form-input"
                placeholder="••••••••"
                required
              />
            </div>

            <button type="submit" className="auth-submit-button">
              Sign In
            </button>
          </form>

          {message && (
            <Alert
              variant={isSuccess ? "success" : "destructive"}
              className="fixed top-4 right-4 z-50 max-w-sm success-alert"
            >
              <CheckCircle2Icon className="h-4 w-4" />
              <AlertTitle>{isSuccess ? "Success!" : "Error"}</AlertTitle>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          <div className="auth-form-footer">
            <p className="auth-form-footer-text">
              Don't have an account?{" "}
              <a href="/register" className="auth-form-link">
                Sign up here
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
