import { useState, useEffect } from 'react';
import { Download, X, Smartphone, Monitor, Zap, CheckCircle } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Check if iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Check if user has dismissed before
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      if (!dismissed) {
        setShowInstallPrompt(true);
      }
    };

    // Listen for successful installation
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallPrompt(false);
      setShowInstallModal(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // For iOS, show install prompt after a delay if not dismissed
    if (isIOSDevice && !localStorage.getItem('pwa-install-dismissed')) {
      setTimeout(() => setShowInstallPrompt(true), 2000);
    }

    // For testing in development - show banner after delay
    const isDev = import.meta.env.DEV;
    if (isDev && !localStorage.getItem('pwa-install-dismissed')) {
      setTimeout(() => setShowInstallPrompt(true), 1000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = () => {
    if (isIOS) {
      setShowIOSInstructions(true);
      return;
    }
    // Show custom install modal
    setShowInstallModal(true);
  };

  const handleConfirmInstall = async () => {
    setIsInstalling(true);
    
    if (deferredPrompt) {
      // Production: trigger native install prompt
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setShowInstallPrompt(false);
        setShowInstallModal(false);
      }
      setDeferredPrompt(null);
    } else {
      // Dev mode simulation - show success after delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      setShowInstallModal(false);
      setShowInstallPrompt(false);
      localStorage.setItem('pwa-install-dismissed', 'true');
    }
    
    setIsInstalling(false);
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  // Don't show if already installed
  if (isInstalled) return null;
  if (!showInstallPrompt) return null;

  // Install Confirmation Modal
  if (showInstallModal) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 p-3 shadow-lg">
                <img 
                  src="/pathfinder-logo.png" 
                  alt="PathFinder" 
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Install PathFinder
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  pathfinder.app
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowInstallModal(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Features */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Monitor className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white text-sm">Works Offline</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Access your career roadmaps anytime</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Zap className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white text-sm">Quick Access</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Launch directly from your home screen</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white text-sm">No App Store Needed</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Installs directly from your browser</p>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => setShowInstallModal(false)}
              className="flex-1 py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Not Now
            </button>
            <button
              onClick={handleConfirmInstall}
              disabled={isInstalling}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isInstalling ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Installing...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  Install
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // iOS Instructions Modal
  if (showIOSInstructions) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-sm w-full p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Install PathFinder
            </h3>
            <button
              onClick={() => setShowIOSInstructions(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="space-y-4 text-sm text-gray-600 dark:text-gray-300">
            <p>To install PathFinder on your iOS device:</p>
            <ol className="list-decimal list-inside space-y-2">
              <li>Tap the <span className="font-medium">Share</span> button at the bottom of Safari</li>
              <li>Scroll down and tap <span className="font-medium">"Add to Home Screen"</span></li>
              <li>Tap <span className="font-medium">"Add"</span> to confirm</li>
            </ol>
            <div className="flex justify-center mt-4">
              <img 
                src="/pathfinder-logo.png" 
                alt="PathFinder Logo" 
                className="w-16 h-16"
              />
            </div>
          </div>

          <button
            onClick={() => setShowIOSInstructions(false)}
            className="w-full mt-6 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Got it!
          </button>
        </div>
      </div>
    );
  }

  // Main Install Banner - Top horizontal banner with gradient
  return (
    <div className="fixed top-0 left-0 right-0 z-[100]">
      <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-pink-500 py-3 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Left side - Icon and Text */}
          <div className="flex items-center gap-4">
            {/* Phone Icon */}
            <div className="hidden sm:flex items-center justify-center w-12 h-12 bg-white/20 rounded-xl backdrop-blur-sm">
              <Smartphone className="w-6 h-6 text-white" />
            </div>
            
            {/* Text Content */}
            <div className="text-white">
              <div className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                <span className="font-semibold text-sm sm:text-base">Install PathFinder App</span>
              </div>
              <p className="text-white/80 text-xs sm:text-sm">
                Get instant access on your device. Works offline!
              </p>
            </div>
          </div>

          {/* Right side - Install Button and Close */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleInstallClick}
              className="flex items-center gap-2 bg-white text-blue-600 font-semibold py-2 px-4 rounded-lg hover:bg-blue-50 transition-colors text-sm"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Install Now</span>
              <span className="sm:hidden">Install</span>
            </button>
            
            <button
              onClick={handleDismiss}
              className="text-white/80 hover:text-white transition-colors p-1"
              aria-label="Close install prompt"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Export a button component that can be used anywhere to trigger install
export function PWAInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', () => setIsInstalled(true));

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  };

  if (isInstalled) return null;

  return (
    <button
      onClick={handleInstall}
      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors"
    >
      <Download className="w-4 h-4" />
      Install App
    </button>
  );
}
