import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Cookies } from "react-cookie";
import FloatingChatbot from "../components/FloatingChatbot";
import SidebarLayout from "../components/SidebarLayout";
import { getFeedbackAnalytics } from "../../services/dataService";

// Icons
import {
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Target,
  Zap,
  Star,
  ChevronLeft,
  ChevronRight,
  Clock,
  Users,
  Brain,
  Route,
  Shield,
  TrendingUp,
  Github,
  Twitter,
  Linkedin,
  Menu,
  X,
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-5 h-5 ${star <= rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
          />
        ))}
      </div>
    );
  };

  // Homepage content 
  const homepageContent = (
    <div className={`min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30`}>
      {/* Header/Navbar - Only show for anonymous users */}
      {!isLoggedIn && (
        <>
          <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                    <Target className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-lg sm:text-xl font-bold text-gray-900">PathFinder</span>
                </div>

                <nav className="hidden md:flex items-center gap-8">
                  <a href="#how-it-works" className="text-gray-600 hover:text-gray-900 transition-colors">How It Works</a>
                  <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">Features</a>
                  <a href="#testimonials" className="text-gray-600 hover:text-gray-900 transition-colors">Testimonials</a>
                </nav>

                {/* Desktop buttons */}
                <div className="hidden sm:flex items-center gap-3">
                  <button
                    onClick={() => navigate("/login")}
                    className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors"
                  >
                    Log In
                  </button>
                  <button
                    onClick={() => navigate("/register")}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
                  >
                    Sign Up Free
                  </button>
                </div>

                {/* Mobile menu button */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="sm:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Toggle menu"
                >
                  {mobileMenuOpen ? (
                    <X className="w-6 h-6 text-gray-700" />
                  ) : (
                    <Menu className="w-6 h-6 text-gray-700" />
                  )}
                </button>
              </div>
            </div>
          </header>

          {/* Mobile menu dropdown */}
          {mobileMenuOpen && (
            <div className="sm:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setMobileMenuOpen(false)}>
              <div 
                className="absolute top-16 left-0 right-0 bg-white border-b border-gray-100 shadow-lg"
                onClick={(e) => e.stopPropagation()}
              >
                <nav className="flex flex-col p-4 space-y-3">
                  <a 
                    href="#how-it-works" 
                    className="text-gray-600 hover:text-gray-900 py-2 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    How It Works
                  </a>
                  <a 
                    href="#features" 
                    className="text-gray-600 hover:text-gray-900 py-2 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Features
                  </a>
                  <a 
                    href="#testimonials" 
                    className="text-gray-600 hover:text-gray-900 py-2 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Testimonials
                  </a>
                  <div className="border-t border-gray-100 pt-3 mt-2 flex flex-col gap-2">
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        navigate("/login");
                      }}
                      className="w-full py-2.5 text-gray-700 hover:text-gray-900 font-medium transition-colors text-center border border-gray-200 rounded-lg"
                    >
                      Log In
                    </button>
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        navigate("/register");
                      }}
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
                    >
                      Sign Up Free
                    </button>
                  </div>
                </nav>
              </div>
            </div>
          )}
        </>
      )}

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Subtle gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-pink-50/50 via-white to-indigo-50/50" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Content */}
            <div className="space-y-8 animate-page-enter">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-full animate-card-enter animate-stagger-1">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span className="text-sm font-medium text-indigo-700">Intelligent Career Navigator</span>
              </div>

              {/* Title */}
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight animate-card-enter animate-stagger-2">
                Discover Your{" "}
                <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  Perfect Career
                </span>{" "}
                Path in Tech
              </h1>

              {/* Description */}
              <p className="text-lg text-gray-600 leading-relaxed max-w-xl animate-card-enter animate-stagger-3">
                Take our intelligent assessment powered by GroqAI and get personalized career recommendations with step-by-step learning roadmaps. Built specifically for CCS students at Gordon College.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-wrap items-center gap-4 animate-card-enter animate-stagger-4">
                <button
                  onClick={handleStartAssessment}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors shadow-lg shadow-indigo-600/25"
                >
                  Start Your Journey Today
                  <ArrowRight className="w-5 h-5" />
                </button>
                <button
                  onClick={() => navigate("/dashboard")}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-lg border border-gray-200 transition-colors"
                >
                  View Dashboard
                </button>
              </div>

              {/* Trust Badges */}
              <div className="flex flex-wrap items-center gap-6 pt-4 animate-card-enter animate-stagger-5">
                <div className="flex items-center gap-2 text-gray-600">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <span className="text-sm">Free Forever</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <span className="text-sm">5 Minutes Assessment</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Shield className="w-5 h-5 text-gray-400" />
                  <span className="text-sm">Privacy Protected</span>
                </div>
              </div>
            </div>

            {/* Right Column - Code Visual */}
            <div className="relative">
              {/* Main Code Card */}
              <div className="relative bg-slate-900 rounded-2xl shadow-2xl overflow-hidden">
                {/* Window Header */}
                <div className="flex items-center justify-between px-4 py-3 bg-slate-800/50">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full">
                    <Star className="w-4 h-4 text-yellow-400" />
                    <span className="text-xs text-white/80">10+ Career Paths</span>
                  </div>
                </div>

                {/* Code Content */}
                <div className="p-6 font-mono text-sm">
                  <div className="text-slate-500 mb-4">// Your Career Journey</div>
                  <div className="mb-2">
                    <span className="text-purple-400">const</span>{" "}
                    <span className="text-blue-300">yourCareer</span>{" "}
                    <span className="text-white">=</span>{" "}
                    <span className="text-green-400">"Software Developer"</span>
                  </div>
                  <div className="mb-1">
                    <span className="text-purple-400">const</span>{" "}
                    <span className="text-blue-300">skills</span>{" "}
                    <span className="text-white">=</span>{" "}
                    <span className="text-yellow-300">[</span>
                  </div>
                  <div className="pl-4 text-green-400">
                    "Python",<br />
                    "JavaScript",<br />
                    "React",<br />
                    "Node.js"
                  </div>
                  <div className="text-yellow-300 mb-4">]</div>
                  <div className="mb-1">
                    <span className="text-purple-400">function</span>{" "}
                    <span className="text-yellow-300">startLearning</span>
                    <span className="text-white">() {"{"}</span>
                  </div>
                  <div className="pl-4">
                    <span className="text-purple-400">return</span>{" "}
                    <span className="text-green-400">"Your roadmap is ready!"</span>
                  </div>
                  <div className="text-white">{"}"}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full uppercase tracking-wide mb-4">
              Simple Process
            </span>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Get your personalized career recommendation in three easy steps
            </p>
          </div>

          {/* Steps Grid */}
          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="relative bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-lg transition-shadow">
              <div className="absolute -top-4 -right-4 w-12 h-12 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg">
                01
              </div>
              <div className="w-14 h-14 bg-cyan-100 rounded-xl flex items-center justify-center mb-6">
                <Target className="w-7 h-7 text-cyan-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Take Assessment</h3>
              <p className="text-gray-600 leading-relaxed">
                Answer questions about your interests, skills, and preferences. Our AI analyzes your responses in real-time.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-lg transition-shadow">
              <div className="absolute -top-4 -right-4 w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg">
                02
              </div>
              <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
                <Sparkles className="w-7 h-7 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Get AI Insights</h3>
              <p className="text-gray-600 leading-relaxed">
                GroqAI processes your assessment and matches you with the best IT career paths based on your unique profile.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-lg transition-shadow">
              <div className="absolute -top-4 -right-4 w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg">
                03
              </div>
              <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mb-6">
                <TrendingUp className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Start Learning</h3>
              <p className="text-gray-600 leading-relaxed">
                Get a personalized learning roadmap with skills, resources, and milestones to achieve your career goals.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="features" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Benefits of Learning With Us</h2>
            <p className="text-lg text-gray-600 italic max-w-2xl mx-auto">
              Everything you need to discover and pursue your ideal tech career
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6">
            {/* AI-Powered Analysis */}
            <div className="bg-white rounded-2xl p-8 border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all">
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                <Brain className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">AI-Powered Analysis</h3>
              <p className="text-gray-600 leading-relaxed">
                Advanced GroqAI technology analyzes your responses to provide accurate and personalized career recommendations.
              </p>
            </div>

            {/* Personalized Roadmaps */}
            <div className="bg-white rounded-2xl p-8 border border-gray-100 hover:border-purple-200 hover:shadow-lg transition-all">
              <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
                <Target className="w-7 h-7 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Personalized Roadmaps</h3>
              <p className="text-gray-600 leading-relaxed">
                Get custom learning paths with specific skills, tools, and resources tailored to your chosen career.
              </p>
            </div>

            {/* Progress Tracking */}
            <div className="bg-white rounded-2xl p-8 border border-gray-100 hover:border-green-200 hover:shadow-lg transition-all">
              <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mb-6">
                <TrendingUp className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Progress Tracking</h3>
              <p className="text-gray-600 leading-relaxed">
                Monitor your learning journey with visual progress indicators and milestone achievements.
              </p>
            </div>

            {/* Instant Results */}
            <div className="bg-white rounded-2xl p-8 border border-gray-100 hover:border-orange-200 hover:shadow-lg transition-all">
              <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center mb-6">
                <Zap className="w-7 h-7 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Instant Results</h3>
              <p className="text-gray-600 leading-relaxed">
                Get your personalized career recommendations immediately after completing the assessment.
              </p>
            </div>

            {/* 100% Free Access */}
            <div className="bg-white rounded-2xl p-8 border border-gray-100 hover:border-pink-200 hover:shadow-lg transition-all">
              <div className="w-14 h-14 bg-pink-100 rounded-xl flex items-center justify-center mb-6">
                <Shield className="w-7 h-7 text-pink-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">100% Free Access</h3>
              <p className="text-gray-600 leading-relaxed">
                Access all features completely free. No hidden costs, no credit card required.
              </p>
            </div>

            {/* IT-Focused Careers */}
            <div className="bg-white rounded-2xl p-8 border border-gray-100 hover:border-teal-200 hover:shadow-lg transition-all">
              <div className="w-14 h-14 bg-teal-100 rounded-xl flex items-center justify-center mb-6">
                <Users className="w-7 h-7 text-teal-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">IT-Focused Careers</h3>
              <p className="text-gray-600 leading-relaxed">
                Explore specialized IT career paths including software development, cybersecurity, data science, and more.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-gradient-to-br from-gray-50 via-white to-indigo-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-1.5 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full uppercase tracking-wide mb-4">
              Testimonials
            </span>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">What Students Say About Us</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Real feedback from students who found their dream career path
            </p>
          </div>

          {/* Stats Cards Row */}
          <div className="flex justify-center">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-4xl">
              {/* Happy Students */}
              <div className="bg-white rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow text-center min-w-[140px]">
                <div className="flex justify-center mb-3">
                  <Users className="w-8 h-8 text-teal-500" />
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {analytics?.summary?.totalFeedback || 0}
                </div>
                <div className="text-xs text-gray-500 uppercase tracking-wide font-medium">Happy Students</div>
              </div>

              {/* Average Rating */}
              <div className="bg-white rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow text-center min-w-[140px]">
                <div className="flex justify-center mb-3">
                  <Star className="w-8 h-8 text-yellow-400 fill-yellow-400" />
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {analytics?.summary?.averageRating ? Number(analytics.summary.averageRating).toFixed(2) : "0.00"}
                </div>
                <div className="text-xs text-gray-500 uppercase tracking-wide font-medium">Average Rating</div>
              </div>

              {/* Assessments */}
              <div className="bg-white rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow text-center min-w-[140px]">
                <div className="flex justify-center mb-3">
                  <CheckCircle2 className="w-8 h-8 text-teal-500" />
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {analytics?.summary?.assessmentFeedback || 0}
                </div>
                <div className="text-xs text-gray-500 uppercase tracking-wide font-medium">Assessments</div>
              </div>

              {/* Roadmaps */}
              <div className="bg-white rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow text-center min-w-[140px]">
                <div className="flex justify-center mb-3">
                  <Route className="w-8 h-8 text-teal-500" />
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {analytics?.summary?.roadmapFeedback || 0}
                </div>
                <div className="text-xs text-gray-500 uppercase tracking-wide font-medium">Roadmaps</div>
              </div>
            </div>
          </div>

          {/* Testimonial Carousel - User Comments */}
          {testimonials.length > 0 && (
            <div className="relative max-w-3xl mx-auto mt-12">
              <button
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-12 w-10 h-10 bg-white hover:bg-gray-50 rounded-full shadow-md flex items-center justify-center text-gray-600 transition-colors z-10"
                onClick={prevTestimonial}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="bg-white rounded-2xl p-8 shadow-lg">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                    {testimonials[currentTestimonial]?.user_name?.charAt(0).toUpperCase() || "S"}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 text-lg">
                      {testimonials[currentTestimonial]?.user_name || "Anonymous Student"}
                    </div>
                    <div className="text-sm text-gray-500">
                      {testimonials[currentTestimonial]?.feedback_type === "roadmap"
                        ? "Career Path Student"
                        : "Assessment Taker"}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 mb-4">
                  {renderStars(testimonials[currentTestimonial]?.rating || 5)}
                </div>
                <p className="text-lg text-gray-700 leading-relaxed italic">
                  "{testimonials[currentTestimonial]?.feedback_text ||
                    "Great experience! The career recommendations were spot on."}"
                </p>
              </div>

              <button
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-12 w-10 h-10 bg-white hover:bg-gray-50 rounded-full shadow-md flex items-center justify-center text-gray-600 transition-colors z-10"
                onClick={nextTestimonial}
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              {/* Dots */}
              <div className="flex items-center justify-center gap-2 mt-6">
                {testimonials.map((_: any, index: number) => (
                  <button
                    key={index}
                    onClick={() => setCurrentTestimonial(index)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentTestimonial ? "bg-indigo-600" : "bg-gray-300"
                    }`}
                  />
                ))}
              </div>
            </div>
          )}

          {isLoadingAnalytics && (
            <div className="flex items-center justify-center gap-3 py-12">
              <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-gray-600">Loading testimonials...</span>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden -mx-4 md:-mx-6 lg:-mx-8">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-600" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
        
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            Ready to Discover Your Career Path?
          </h2>
          <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto">
            Join thousands of students who have found their perfect career match. Start your free assessment today.
          </p>
          <button
            onClick={handleStartAssessment}
            className="inline-flex items-center gap-2 px-8 py-4 bg-white hover:bg-gray-100 text-indigo-600 font-semibold rounded-full transition-colors shadow-xl"
          >
            Get Started — It's Free
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white pt-12 pb-6 -mx-4 md:-mx-6 lg:-mx-8 -mb-4 md:-mb-6 lg:-mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8 mb-8">
            {/* Brand */}
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold">PathFinder</span>
                <p className="text-slate-400 text-sm">Career Guidance for CCS Students</p>
              </div>
            </div>

            {/* Links */}
            <div className="flex flex-wrap items-center gap-6">
              <a href="/assessment" className="text-slate-400 hover:text-white transition-colors text-sm">
                Assessment
              </a>
              <a href="/dashboard" className="text-slate-400 hover:text-white transition-colors text-sm">
                Dashboard
              </a>
              <a href="/progress" className="text-slate-400 hover:text-white transition-colors text-sm">
                Progress
              </a>
            </div>

            {/* Social */}
            <div className="flex items-center gap-3">
              <a href="#" className="w-9 h-9 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center justify-center transition-colors">
                <Github className="w-5 h-5" />
              </a>
              <a href="#" className="w-9 h-9 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center justify-center transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="w-9 h-9 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center justify-center transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Bottom */}
          <div className="border-t border-slate-800 pt-6 text-center">
            <p className="text-slate-400 text-sm">
              © 2025 PathFinder. All Rights Reserved. Made with love for students.
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
        {homepageContent}
      </SidebarLayout>
    );
  }

  // For anonymous users, show homepage without sidebar
  return homepageContent;
};

export default Homepage;
