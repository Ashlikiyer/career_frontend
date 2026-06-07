import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerUser } from "../../services/dataService";
import { useToast } from "@/components/ui/Toast";
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Compass, Zap, TrendingUp, Shield } from "lucide-react";
import EmailVerificationModal from "@/components/EmailVerificationModal";

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (!agreeTerms) {
      toast.warning("Please agree to the Terms of Service and Privacy Policy");
      return false;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match!");
      return false;
    }

    setIsSubmitting(true);
    
    try {
      const response = await registerUser({ username, email, password });
      
      if (response.requiresVerification) {
        setRegisteredEmail(email);
        setShowVerificationModal(true);
        toast.success("Verification code sent to your email!");
      } else {
        toast.success(
          response.message || "Registration successful! Redirecting to login...",
        );
        setTimeout(() => {
          navigate("/login");
        }, 2500);
      }
    } catch (error: any) {
      let errorMessage = "Registration failed. Please try again.";

      if (error.response?.status === 409 || error.response?.status === 400) {
        errorMessage = "Email already exists. Please use a different email.";
      } else if (error instanceof Error) {
        errorMessage = error.message;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }

    return false;
  };

  const handleVerified = () => {
    toast.success("Email verified! Welcome to PathFinder!");
    navigate("/dashboard");
  };

  useEffect(() => {
    const applyOverflow = () => {
      const shouldLock = window.innerWidth >= 1024;
      document.body.style.overflow = shouldLock ? "hidden" : "";
      document.documentElement.style.overflow = shouldLock ? "hidden" : "";
    };

    applyOverflow();
    window.addEventListener("resize", applyOverflow);

    return () => {
      window.removeEventListener("resize", applyOverflow);
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, []);

  return (
    <div className="min-h-screen lg:h-[100dvh] flex bg-white">
      {/* Left Side - Modern Hero Section */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-1/2 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 animate-pulse"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-pink-500/20 rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2 animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>

        {/* Content Container */}
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-lg flex items-center justify-center border border-white/30">
              <Compass className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">PathFinder</h1>
              <p className="text-xs text-white/80">Career Intelligence</p>
            </div>
          </div>

          {/* Hero Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="inline-block px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full border border-white/30">
                <span className="text-white text-sm font-medium">Built for CCS Students</span>
              </div>
              <h2 className="text-5xl font-bold text-white leading-tight">
                Start Your Career<br />Journey Today
              </h2>
              <p className="text-lg text-white/90 max-w-md">
                Join students who have discovered their perfect career path with intelligent guidance.
              </p>
            </div>

            {/* Feature List */}
            <div className="space-y-3">
              {[
                { icon: Zap, text: "AI-Powered Career Assessments" },
                { icon: Compass, text: "Personalized Learning Paths" },
                { icon: TrendingUp, text: "Track Your Progress" }
              ].map((feature, index) => (
                <div key={index} className="flex items-center gap-3 text-white/90">
                  <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0 border border-white/30">
                    <feature.icon className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium">{feature.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="text-white/60 text-sm">
            © 2026 PathFinder. Empowering students to reach their full potential.
          </div>
        </div>
      </div>

      {/* Right Side - Register Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 overflow-y-auto">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Compass className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">PathFinder</h1>
              <p className="text-xs text-gray-600">Career Intelligence</p>
            </div>
          </div>

          {/* Header */}
          <div className="text-center lg:text-left space-y-2">
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">
              Create account
            </h1>
            <p className="text-gray-600">
              Join us and discover your perfect career path
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username Field */}
            <div className="space-y-2">
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Username
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                </div>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  placeholder="Choose a username"
                  required
                />
              </div>
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                </div>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  placeholder="your.email@gordon.edu.ph"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-12 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  placeholder="Create a strong password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                </div>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirm-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-11 pr-12 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  placeholder="Confirm your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Terms Checkbox */}
            <div className="flex items-start gap-3 pt-2">
              <input
                type="checkbox"
                id="terms"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="w-4 h-4 mt-1 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0"
              />
              <label htmlFor="terms" className="text-sm text-gray-600 leading-relaxed">
                I agree to the{" "}
                <a href="#" className="text-indigo-600 hover:text-indigo-700 font-medium">
                  Terms of Service
                </a>
                {" "}and{" "}
                <a href="#" className="text-indigo-600 hover:text-indigo-700 font-medium">
                  Privacy Policy
                </a>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating account...
                </>
              ) : (
                <>
                  Create account
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">
                Already have an account?
              </span>
            </div>
          </div>

          {/* Login Link */}
          <div className="text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-indigo-600 font-semibold hover:text-indigo-700 transition-colors group"
            >
              Sign in here
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>

      {/* Email Verification Modal */}
      <EmailVerificationModal
        isOpen={showVerificationModal}
        email={registeredEmail}
        onClose={() => setShowVerificationModal(false)}
        onVerified={handleVerified}
      />
    </div>
  );
};

export default Register;