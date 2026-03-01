import { useState, useEffect } from 'react';

interface SplashScreenProps {
  onFinish?: () => void;
  minDisplayTime?: number;
}

export function SplashScreen({ onFinish, minDisplayTime = 2000 }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  useEffect(() => {
    // Minimum display time for splash screen
    const timer = setTimeout(() => {
      setIsAnimatingOut(true);
      // Wait for fade out animation before calling onFinish
      setTimeout(() => {
        setIsVisible(false);
        onFinish?.();
      }, 500);
    }, minDisplayTime);

    return () => clearTimeout(timer);
  }, [minDisplayTime, onFinish]);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-[200] flex flex-col items-center justify-center bg-gradient-to-br from-blue-600 via-blue-500 to-purple-600 transition-opacity duration-500 ${
        isAnimatingOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.3)_0%,transparent_50%)]" />
        <div className="absolute top-20 left-20 w-32 h-32 bg-white/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-purple-300/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0.5s' }} />
      </div>

      {/* Logo Container */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Animated Logo */}
        <div className="relative mb-8">
          {/* Glow Effect */}
          <div className="absolute inset-0 bg-white/30 rounded-3xl blur-2xl animate-pulse scale-125" />
          
          {/* Logo Background */}
          <div className="relative w-28 h-28 sm:w-36 sm:h-36 bg-white rounded-3xl shadow-2xl flex items-center justify-center overflow-hidden animate-bounce-slow">
            <img
              src="/pathfinder-logo.png"
              alt="PathFinder"
              className="w-20 h-20 sm:w-28 sm:h-28 object-contain animate-fade-in"
            />
          </div>

          {/* Ring Animation */}
          <div className="absolute -inset-2 border-4 border-white/30 rounded-[2rem] animate-ping-slow" />
        </div>

        {/* App Name */}
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 animate-fade-in-up">
          PathFinder
        </h1>
        
        {/* Tagline */}
        <p className="text-white/80 text-sm sm:text-base mb-8 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          Navigate Your Tech Career
        </p>

        {/* Loading Indicator */}
        <div className="flex flex-col items-center gap-4 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          {/* Loading Dots */}
          <div className="flex gap-2">
            <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          
          <p className="text-white/60 text-sm">Loading...</p>
        </div>
      </div>

      {/* Bottom Text */}
      <div className="absolute bottom-8 text-center animate-fade-in" style={{ animationDelay: '0.6s' }}>
        <p className="text-white/50 text-xs">
          Built for CCS Students at Gordon College
        </p>
      </div>

      {/* Custom Animations Styles */}
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes fade-in-up {
          from { 
            opacity: 0; 
            transform: translateY(20px);
          }
          to { 
            opacity: 1; 
            transform: translateY(0);
          }
        }
        
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes ping-slow {
          0% { transform: scale(1); opacity: 0.5; }
          75%, 100% { transform: scale(1.3); opacity: 0; }
        }
        
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.5s ease-out forwards;
          opacity: 0;
        }
        
        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }
        
        .animate-ping-slow {
          animation: ping-slow 2s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
      `}</style>
    </div>
  );
}

// Hook to check if running as installed PWA
export function useIsPWA() {
  const [isPWA, setIsPWA] = useState(false);

  useEffect(() => {
    // Check if running in standalone mode (installed PWA)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isIOSStandalone = (window.navigator as any).standalone === true;
    setIsPWA(isStandalone || isIOSStandalone);
  }, []);

  return isPWA;
}
