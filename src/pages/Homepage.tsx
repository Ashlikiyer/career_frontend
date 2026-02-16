import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Cookies } from "react-cookie";
import FloatingChatbot from "../components/FloatingChatbot";
import SidebarLayout from "../components/SidebarLayout";
import { getFeedbackAnalytics } from "../../services/dataService";
import "./Homepage.css";

// Icons
import {
  ArrowRight,
  CheckCircle2,
  Sparkles,
  BookOpen,
  Target,
  Zap,
  Star,
  ChevronLeft,
  ChevronRight,
  Clock,
  Users,
  Award,
  TrendingUp,
  Brain,
  Route,
  Shield,
} from "lucide-react";

const Homepage = () => {
  const navigate = useNavigate();
  const cookies = new Cookies();

  // Check if user is logged in
  const authToken = cookies.get("authToken");
  const isLoggedIn = !!authToken;

  // State
  const [analytics, setAnalytics] = useState<any>(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  const loadAnalytics = useCallback(async () => {
    try {
      setIsLoadingAnalytics(true);
      const response = await getFeedbackAnalytics("30d");
      if (response.success) {
        setAnalytics(response.data);
      }
    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setIsLoadingAnalytics(false);
    }
  }, []);

  useEffect(() => {
    if (!analytics && !isLoadingAnalytics) {
      loadAnalytics();
    }
  }, [loadAnalytics, analytics, isLoadingAnalytics]);

  const handleStartAssessment = () => {
    const authToken = cookies.get("authToken");
    if (!authToken) {
      navigate("/login");
    } else {
      navigate("/assessment");
    }
  };

  // Testimonials navigation
  const testimonials = analytics?.recentFeedback?.slice(0, 6) || [];

  const nextTestimonial = () => {
    setCurrentTestimonial((prev) =>
      prev === testimonials.length - 1 ? 0 : prev + 1,
    );
  };

  const prevTestimonial = () => {
    setCurrentTestimonial((prev) =>
      prev === 0 ? testimonials.length - 1 : prev - 1,
    );
  };

  // Auto-rotate testimonials
  useEffect(() => {
    if (testimonials.length > 1) {
      const interval = setInterval(nextTestimonial, 5000);
      return () => clearInterval(interval);
    }
  }, [testimonials.length]);

  const renderStars = (rating: number) => {
    return (
      <div className="stars-container">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`star-icon ${star <= rating ? "star-filled" : "star-empty"}`}
            size={18}
          />
        ))}
      </div>
    );
  };

  // Homepage content component
  const HomepageContent = () => (
    <div className={`homepage-new ${isLoggedIn ? "with-sidebar" : ""}`}>
      {/* Decorative Blobs */}
      <div className="decorative-blobs">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
        <div className="blob blob-4"></div>
        <div className="blob blob-5"></div>
      </div>

      {/* Header/Navbar - Only show for anonymous users */}
      {!isLoggedIn && (
        <header className="navbar">
          <div className="navbar-container">
            <div className="navbar-logo">
              <div className="logo-icon">
                <Brain size={28} />
              </div>
              <span className="logo-text">PathFinder</span>
            </div>

            <nav className="navbar-links">
              <a href="#how-it-works">How It Works</a>
              <a href="#features">Features</a>
              <a href="#testimonials">Testimonials</a>
            </nav>

            <div className="navbar-actions">
              <button
                className="btn-outline"
                onClick={() => navigate("/login")}
              >
                Log In
              </button>
              <button
                className="btn-primary"
                onClick={() => navigate("/register")}
              >
                Sign Up Free
              </button>
            </div>
          </div>
        </header>
      )}

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-content">
            <div className="hero-badge">
              <Sparkles size={16} />
              <span>Intelligent Career Navigator</span>
            </div>

            <h1 className="hero-title">
              Discover Your
              <span className="title-highlight"> Perfect Career </span>
              Path in Tech
            </h1>

            <p className="hero-description">
              Take our intelligent assessment powered by GroqAI and get
              personalized career recommendations with step-by-step learning
              roadmaps. Built specifically for CCS students at Gordon College.
            </p>

            <div className="hero-cta">
              <button
                className="btn-primary btn-lg"
                onClick={handleStartAssessment}
              >
                Start Your Journey Today
                <ArrowRight size={20} />
              </button>
            </div>

            <div className="hero-trust">
              <div className="trust-item">
                <CheckCircle2 size={18} className="trust-icon" />
                <span>Free Forever</span>
              </div>
              <div className="trust-item">
                <Clock size={18} className="trust-icon" />
                <span>5 Minutes Assessment</span>
              </div>
              <div className="trust-item">
                <Shield size={18} className="trust-icon" />
                <span>Privacy Protected</span>
              </div>
            </div>
          </div>

          <div className="hero-visual">
            <div className="visual-card main-card">
              <div className="card-header">
                <div className="card-dot dot-red"></div>
                <div className="card-dot dot-yellow"></div>
                <div className="card-dot dot-green"></div>
              </div>
              <div className="card-content">
                <div className="code-line">
                  <span className="code-keyword">const</span>
                  <span className="code-var"> yourCareer</span>
                  <span className="code-operator"> = </span>
                  <span className="code-string">"Software Developer"</span>
                </div>
                <div className="code-line">
                  <span className="code-keyword">const</span>
                  <span className="code-var"> skills</span>
                  <span className="code-operator"> = </span>
                  <span className="code-bracket">[</span>
                </div>
                <div className="code-line indent">
                  <span className="code-string">"Python"</span>,
                  <span className="code-string"> "JavaScript"</span>,
                </div>
                <div className="code-line indent">
                  <span className="code-string">"React"</span>,
                  <span className="code-string"> "Node.js"</span>
                </div>
                <div className="code-line">
                  <span className="code-bracket">]</span>
                </div>
              </div>
            </div>

            <div className="floating-badge badge-courses">
              <BookOpen size={20} />
              <span>10+ Career Paths</span>
            </div>

            <div className="floating-badge badge-rating">
              <Star size={20} className="star-filled" />
              <span>4.9 Rating</span>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="section section-works">
        <div className="section-container">
          <div className="section-header">
            <span className="section-label">Simple Process</span>
            <h2 className="section-title">How It Works</h2>
            <p className="section-subtitle">
              Get your personalized career recommendation in three easy steps
            </p>
          </div>

          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">01</div>
              <div className="step-icon step-icon-green">
                <Target size={32} />
              </div>
              <h3 className="step-title">Take Assessment</h3>
              <p className="step-description">
                Answer questions about your interests, skills, and preferences.
                Our AI analyzes your responses in real-time.
              </p>
              <ul className="step-features">
                <li>
                  <CheckCircle2 size={16} /> 5-10 minutes to complete
                </li>
                <li>
                  <CheckCircle2 size={16} /> Interactive questions
                </li>
              </ul>
            </div>

            <div className="step-connector">
              <ArrowRight size={24} />
            </div>

            <div className="step-card">
              <div className="step-number">02</div>
              <div className="step-icon step-icon-purple">
                <Brain size={32} />
              </div>
              <h3 className="step-title">Get AI Insights</h3>
              <p className="step-description">
                GroqAI processes your assessment and matches you with the best
                IT career paths based on your unique profile.
              </p>
              <ul className="step-features">
                <li>
                  <CheckCircle2 size={16} /> Instant recommendations
                </li>
                <li>
                  <CheckCircle2 size={16} /> Multiple career options
                </li>
              </ul>
            </div>

            <div className="step-connector">
              <ArrowRight size={24} />
            </div>

            <div className="step-card">
              <div className="step-number">03</div>
              <div className="step-icon step-icon-orange">
                <Route size={32} />
              </div>
              <h3 className="step-title">Follow Your Roadmap</h3>
              <p className="step-description">
                Get a personalized learning roadmap with skills, resources, and
                milestones to achieve your career goals.
              </p>
              <ul className="step-features">
                <li>
                  <CheckCircle2 size={16} /> Step-by-step guidance
                </li>
                <li>
                  <CheckCircle2 size={16} /> Track your progress
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="section section-features">
        <div className="section-container">
          <div className="section-header">
            <span className="section-label">Why Choose Us</span>
            <h2 className="section-title">Benefits of Learning With Us</h2>
            <p className="section-subtitle">
              Everything you need to discover and pursue your ideal tech career
            </p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon feature-icon-blue">
                <Brain size={28} />
              </div>
              <h3 className="feature-title">AI-Powered Analysis</h3>
              <p className="feature-description">
                Advanced GroqAI technology analyzes your responses to provide
                accurate and personalized career recommendations.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon feature-icon-green">
                <Route size={28} />
              </div>
              <h3 className="feature-title">Personalized Roadmaps</h3>
              <p className="feature-description">
                Get custom learning paths with specific skills, tools, and
                resources tailored to your chosen career.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon feature-icon-purple">
                <TrendingUp size={28} />
              </div>
              <h3 className="feature-title">Progress Tracking</h3>
              <p className="feature-description">
                Monitor your learning journey with visual progress indicators
                and milestone achievements.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon feature-icon-orange">
                <Zap size={28} />
              </div>
              <h3 className="feature-title">Instant Results</h3>
              <p className="feature-description">
                Get your personalized career recommendations immediately after
                completing the assessment.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon feature-icon-pink">
                <Shield size={28} />
              </div>
              <h3 className="feature-title">100% Free Access</h3>
              <p className="feature-description">
                Access all features completely free. No hidden costs, no credit
                card required.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon feature-icon-teal">
                <Award size={28} />
              </div>
              <h3 className="feature-title">IT-Focused Careers</h3>
              <p className="feature-description">
                Explore specialized IT career paths including software
                development, cybersecurity, data science, and more.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="section section-testimonials">
        <div className="section-container">
          <div className="section-header">
            <span className="section-label">Testimonials</span>
            <h2 className="section-title">What Students Say About Us</h2>
            <p className="section-subtitle">
              Real feedback from students who found their dream career path
            </p>
          </div>

          {/* Stats */}
          {analytics && (
            <div className="stats-row">
              <div className="stat-item">
                <Users size={24} className="stat-icon" />
                <div className="stat-value">
                  {analytics.summary.totalFeedback}
                </div>
                <div className="stat-label">Happy Students</div>
              </div>
              <div className="stat-item">
                <Star size={24} className="stat-icon star-filled" />
                <div className="stat-value">
                  {analytics.summary.averageRating}
                </div>
                <div className="stat-label">Average Rating</div>
              </div>
              <div className="stat-item">
                <CheckCircle2 size={24} className="stat-icon" />
                <div className="stat-value">
                  {analytics.summary.assessmentFeedback || 0}
                </div>
                <div className="stat-label">Assessments</div>
              </div>
              <div className="stat-item">
                <Route size={24} className="stat-icon" />
                <div className="stat-value">
                  {analytics.summary.roadmapFeedback || 0}
                </div>
                <div className="stat-label">Roadmaps</div>
              </div>
            </div>
          )}

          {/* Testimonial Carousel */}
          {testimonials.length > 0 && (
            <div className="testimonial-carousel">
              <button
                className="carousel-btn carousel-prev"
                onClick={prevTestimonial}
                aria-label="Previous testimonial"
              >
                <ChevronLeft size={24} />
              </button>

              <div className="testimonial-card">
                <div className="testimonial-quote">"</div>
                <p className="testimonial-text">
                  {testimonials[currentTestimonial]?.feedback_text ||
                    "Great experience! The career recommendations were spot on."}
                </p>
                <div className="testimonial-rating">
                  {renderStars(testimonials[currentTestimonial]?.rating || 5)}
                </div>
                <div className="testimonial-author">
                  <div className="author-avatar">
                    {testimonials[currentTestimonial]?.user_name
                      ?.charAt(0)
                      .toUpperCase() || "S"}
                  </div>
                  <div className="author-info">
                    <div className="author-name">
                      {testimonials[currentTestimonial]?.user_name ||
                        "Anonymous Student"}
                    </div>
                    <div className="author-role">
                      {testimonials[currentTestimonial]?.feedback_type ===
                      "roadmap"
                        ? "Career Path Student"
                        : "Assessment Taker"}
                    </div>
                  </div>
                </div>
              </div>

              <button
                className="carousel-btn carousel-next"
                onClick={nextTestimonial}
                aria-label="Next testimonial"
              >
                <ChevronRight size={24} />
              </button>

              {/* Dots */}
              <div className="carousel-dots">
                {testimonials.map((_: any, index: number) => (
                  <button
                    key={index}
                    className={`dot ${index === currentTestimonial ? "active" : ""}`}
                    onClick={() => setCurrentTestimonial(index)}
                    aria-label={`Go to testimonial ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          )}

          {isLoadingAnalytics && (
            <div className="loading-testimonials">
              <div className="loading-spinner"></div>
              <p>Loading testimonials...</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="section section-cta">
        <div className="cta-container">
          <div className="cta-content">
            <h2 className="cta-title">Ready to Discover Your Career Path?</h2>
            <p className="cta-description">
              Join thousands of students who have found their perfect career
              match. Start your free assessment today.
            </p>
            <button
              className="btn-primary btn-lg btn-white"
              onClick={handleStartAssessment}
            >
              Get Started — It's Free
              <ArrowRight size={20} />
            </button>
          </div>
          <div className="cta-image">
            <img
              src="/career-illustration.svg"
              alt="Career Discovery"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-main">
            <div className="footer-brand">
              <div className="footer-logo">
                <Brain size={28} />
                <span>PathFinder</span>
              </div>
              <p className="footer-tagline">
                Navigate Your Tech Career - An Intelligent Career Guidance
                System for CCS Students at Gordon College. Powered by GroqAI.
              </p>
              <div className="footer-social">
                <a href="#" aria-label="Facebook">
                  <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    width="20"
                    height="20"
                  >
                    <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
                  </svg>
                </a>
                <a href="#" aria-label="Twitter">
                  <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    width="20"
                    height="20"
                  >
                    <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" />
                  </svg>
                </a>
                <a href="#" aria-label="LinkedIn">
                  <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    width="20"
                    height="20"
                  >
                    <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2zM4 6a2 2 0 100-4 2 2 0 000 4z" />
                  </svg>
                </a>
              </div>
            </div>

            <div className="footer-links-grid">
              <div className="footer-links-column">
                <h4>Resources</h4>
                <ul>
                  <li>
                    <a href="/assessment">Take Assessment</a>
                  </li>
                  <li>
                    <a href="/dashboard">Dashboard</a>
                  </li>
                  <li>
                    <a href="/progress">My Progress</a>
                  </li>
                </ul>
              </div>
              <div className="footer-links-column">
                <h4>Careers</h4>
                <ul>
                  <li>
                    <a href="#">Software Developer</a>
                  </li>
                  <li>
                    <a href="#">Data Analyst</a>
                  </li>
                  <li>
                    <a href="#">Cybersecurity</a>
                  </li>
                </ul>
              </div>
              <div className="footer-links-column">
                <h4>About</h4>
                <ul>
                  <li>
                    <a href="#">Gordon College</a>
                  </li>
                  <li>
                    <a href="#">CCS Department</a>
                  </li>
                  <li>
                    <a href="#">Contact Us</a>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <p>
              © 2025 PathFinder. All Rights Reserved. Made with ❤️ for students.
            </p>
          </div>
        </div>
      </footer>

      {/* Floating Chatbot */}
      <FloatingChatbot position="bottom-right" />
    </div>
  );

  // If logged in, wrap with SidebarLayout
  if (isLoggedIn) {
    return (
      <SidebarLayout>
        <HomepageContent />
      </SidebarLayout>
    );
  }

  // For anonymous users, show homepage without sidebar
  return <HomepageContent />;
};

export default Homepage;
