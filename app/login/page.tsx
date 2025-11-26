'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/use-auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { TextField, PasswordField, Button } from '@/components/ui';
import DarkModeToggle from '@/components/ui/DarkModeToggle';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { login, isLoggingIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    login({ username, password });
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{
        backgroundImage: `
          linear-gradient(135deg, rgba(15, 23, 42, 0.85) 0%, rgba(30, 41, 59, 0.85) 100%),
          url('/background.jpg')
        `,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Animated Background Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full opacity-20"
            style={{
              width: `${Math.random() * 4 + 2}px`,
              height: `${Math.random() * 4 + 2}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              backgroundColor: 'var(--color-primary)',
              animation: `float ${Math.random() * 10 + 10}s infinite ease-in-out`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          />
        ))}
      </div>

      {/* Dark Mode Toggle - Top Right */}
      <div 
        className="absolute top-6 right-6 z-10"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(-20px)',
          transition: 'all 0.6s ease-out',
        }}
      >
        <DarkModeToggle />
      </div>

      {/* Main Content */}
      <div 
        className="relative z-10 w-full max-w-md px-6"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(30px)',
          transition: 'all 0.8s ease-out',
        }}
      >
        {/* Logo and Branding */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div 
              className="relative"
              style={{
                opacity: mounted ? 1 : 0,
                transform: mounted ? 'scale(1) rotate(0deg)' : 'scale(0.8) rotate(-10deg)',
                transition: 'all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
                transitionDelay: '0.2s',
              }}
            >
              <div 
                className="w-20 h-20 rounded-2xl flex items-center justify-center relative overflow-hidden"
                style={{
                  backgroundColor: 'rgba(249, 115, 22, 0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '2px solid rgba(249, 115, 22, 0.3)',
                  boxShadow: '0 8px 32px rgba(249, 115, 22, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)',
                }}
              >
                <Image
                  src="/logo.png"
                  alt="AL YAFOUR Logo"
                  width={64}
                  height={64}
                  className="object-contain"
                  priority
                  style={{
                    filter: 'drop-shadow(0 2px 8px rgba(249, 115, 22, 0.5))',
                  }}
                />
                {/* Glow Effect */}
                <div 
                  className="absolute inset-0 rounded-2xl"
                  style={{
                    background: 'radial-gradient(circle at center, rgba(249, 115, 22, 0.3) 0%, transparent 70%)',
                    animation: 'pulse 3s ease-in-out infinite',
                  }}
                />
              </div>
            </div>
          </div>
          <h1 
            className="text-3xl font-bold mb-2"
            style={{ 
              color: 'var(--text-primary)',
              opacity: mounted ? 1 : 0,
              transform: mounted ? 'translateY(0)' : 'translateY(20px)',
              transition: 'all 0.6s ease-out',
              transitionDelay: '0.4s',
            }}
          >
            AL YAFOUR
          </h1>
          <p 
            className="text-sm"
            style={{ 
              color: 'var(--text-secondary)',
              opacity: mounted ? 1 : 0,
              transform: mounted ? 'translateY(0)' : 'translateY(20px)',
              transition: 'all 0.6s ease-out',
              transitionDelay: '0.5s',
            }}
          >
            Operations & Procurement System
          </p>
        </div>

        {/* Glass Card */}
        <div 
          className="rounded-2xl p-8 backdrop-blur-xl border"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0) scale(1)' : 'translateY(30px) scale(0.95)',
            transition: 'all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
            transitionDelay: '0.3s',
          }}
        >
          <h2 
            className="text-2xl font-semibold text-center mb-6"
            style={{ color: 'var(--text-primary)' }}
          >
            Sign In
          </h2>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <TextField
              id="username"
              name="username"
              type="text"
              label="Username"
              required
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />

            <PasswordField
              id="password"
              name="password"
              label="Password"
              required
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              showPassword={showPassword}
              onTogglePassword={() => setShowPassword(!showPassword)}
            />

            <Button
              type="submit"
              disabled={isLoggingIn}
              isLoading={isLoggingIn}
              className="w-full relative overflow-hidden"
              style={{
                backgroundColor: 'var(--color-primary)',
                borderColor: 'var(--color-primary)',
                color: '#FFFFFF',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 14px rgba(249, 115, 22, 0.4)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(249, 115, 22, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 14px rgba(249, 115, 22, 0.4)';
              }}
            >
              <span className="relative z-10">{isLoggingIn ? 'Signing in...' : 'Sign In'}</span>
              {isLoggingIn && (
                <div 
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  style={{
                    animation: 'shimmer 1.5s infinite',
                  }}
                />
              )}
            </Button>

            <div className="text-center pt-4">
              <Link
                href="/register"
                className="text-sm font-medium transition-colors"
                style={{ 
                  color: 'var(--text-secondary)',
                  textDecoration: 'none',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--color-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }}
              >
                Don't have an account? <span style={{ color: 'var(--color-primary)' }}>Sign up</span>
              </Link>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div 
          className="text-center mt-8 text-xs"
          style={{ 
            color: 'var(--text-tertiary)',
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.6s ease-out',
            transitionDelay: '0.6s',
          }}
        >
          <p>© 2025 Al Yafour — All Rights Reserved.</p>
        </div>
      </div>

      {/* Add CSS Animations */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes float {
          0%, 100% {
            transform: translateY(0) translateX(0);
          }
          25% {
            transform: translateY(-20px) translateX(10px);
          }
          50% {
            transform: translateY(-10px) translateX(-10px);
          }
          75% {
            transform: translateY(-30px) translateX(5px);
          }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 0.3;
            transform: scale(1);
          }
          50% {
            opacity: 0.6;
            transform: scale(1.1);
          }
        }

        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `}} />
    </div>
  );
}
