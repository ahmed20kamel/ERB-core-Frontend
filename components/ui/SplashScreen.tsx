'use client';

import { useEffect, useState } from 'react';

export default function SplashScreen() {
  const [isVisible, setIsVisible] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Hide splash screen after page load
    const timer = setTimeout(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setIsVisible(false);
      }, 500); // Match animation duration
    }, 1500); // Show for 1.5 seconds minimum

    // Also hide if page is already loaded
    if (document.readyState === 'complete') {
      clearTimeout(timer);
      setIsAnimating(true);
      setTimeout(() => {
        setIsVisible(false);
      }, 500);
    } else {
      window.addEventListener('load', () => {
        clearTimeout(timer);
        setIsAnimating(true);
        setTimeout(() => {
          setIsVisible(false);
        }, 500);
      });
    }

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center transition-opacity duration-500 ${
        isAnimating ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{
        backgroundColor: 'var(--background)',
      }}
    >
      <div className="flex flex-col items-center gap-4">
        {/* Logo */}
        <div className="relative">
          <img
            src="/logo.png"
            alt="AL YAFOUR CONSTRUCTION Logo"
            width={80}
            height={80}
            className="animate-pulse"
            style={{
              filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))',
            }}
            onError={(e) => {
              e.currentTarget.src = '/logo.svg';
            }}
          />
        </div>
        
        {/* Company Name */}
        <div className="text-center">
          <h1
            className="text-2xl font-bold mb-1"
            style={{ color: 'var(--foreground)' }}
          >
            Procurement System
          </h1>
          <p
            className="text-sm"
            style={{ color: 'var(--muted-foreground)' }}
          >
            AL YAFOUR CONSTRUCTION
          </p>
        </div>

        {/* Loading Indicator */}
        <div className="mt-4">
          <div className="flex gap-1">
            <div
              className="w-2 h-2 rounded-full animate-bounce"
              style={{
                backgroundColor: 'var(--primary)',
                animationDelay: '0ms',
              }}
            />
            <div
              className="w-2 h-2 rounded-full animate-bounce"
              style={{
                backgroundColor: 'var(--primary)',
                animationDelay: '150ms',
              }}
            />
            <div
              className="w-2 h-2 rounded-full animate-bounce"
              style={{
                backgroundColor: 'var(--primary)',
                animationDelay: '300ms',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

