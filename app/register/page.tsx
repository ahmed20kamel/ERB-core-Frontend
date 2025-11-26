'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/use-auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from '@/lib/hooks/use-toast';
import { TextField, PasswordField, Button } from '@/components/ui';
import DarkModeToggle from '@/components/ui/DarkModeToggle';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password2: '',
    first_name: '',
    last_name: '',
    phone: '',
    role: 'employee',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);
  const { register, isRegistering } = useAuth();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    if (/^\d+$/.test(password)) {
      errors.push('Password cannot be entirely numeric');
    }
    
    // Check for common passwords
    const commonPasswords = ['123456', 'password', '12345678', 'qwerty', 'abc123', '1234567', 'password1', 'admin'];
    if (commonPasswords.includes(password.toLowerCase())) {
      errors.push('Password is too common. Please choose a stronger password');
    }
    
    // Check for at least one letter and one number
    if (!/[a-zA-Z]/.test(password)) {
      errors.push('Password must contain at least one letter');
    }
    
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    return errors;
  };

  const handlePasswordChange = (value: string) => {
    setFormData({ ...formData, password: value });
    if (value.length > 0) {
      const errors = validatePassword(value);
      setPasswordErrors(errors);
    } else {
      setPasswordErrors([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate passwords match
    if (formData.password !== formData.password2) {
      toast('Passwords do not match', 'error');
      return;
    }
    
    // Validate password strength
    const errors = validatePassword(formData.password);
    if (errors.length > 0) {
      toast(errors[0], 'error');
      setPasswordErrors(errors);
      return;
    }
    
    setPasswordErrors([]);
    register(formData);
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center relative overflow-hidden py-12"
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
            Create New Account
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
            Sign Up
          </h2>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <TextField
                id="username"
                name="username"
                type="text"
                label="Username"
                required
                placeholder="Choose a username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              />

              <TextField
                id="email"
                name="email"
                type="email"
                label="Email"
                required
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />

              <div className="grid grid-cols-2 gap-4">
                <TextField
                  id="first_name"
                  name="first_name"
                  type="text"
                  label="First Name"
                  placeholder="First name"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                />
                <TextField
                  id="last_name"
                  name="last_name"
                  type="text"
                  label="Last Name"
                  placeholder="Last name"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                />
              </div>

              <TextField
                id="phone"
                name="phone"
                type="tel"
                label="Phone"
                placeholder="Phone number"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />

              <div>
                <PasswordField
                  id="password"
                  name="password"
                  label="Password"
                  required
                  placeholder="Create a password (min 8 characters)"
                  value={formData.password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  showPassword={showPassword}
                  onTogglePassword={() => setShowPassword(!showPassword)}
                />
                {passwordErrors.length > 0 && (
                  <div className="mt-1 space-y-1">
                    {passwordErrors.map((error, index) => (
                      <p key={index} className="text-xs text-red-500">
                        • {error}
                      </p>
                    ))}
                  </div>
                )}
                {formData.password.length > 0 && passwordErrors.length === 0 && (
                  <p className="text-xs mt-1" style={{ color: 'var(--color-success)' }}>
                    ✓ Password is valid
                  </p>
                )}
                {formData.password.length === 0 && (
                  <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                    Password must be at least 8 characters and contain letters and numbers
                  </p>
                )}
              </div>

              <PasswordField
                id="password2"
                name="password2"
                label="Confirm Password"
                required
                placeholder="Confirm your password"
                value={formData.password2}
                onChange={(e) => setFormData({ ...formData, password2: e.target.value })}
                showPassword={showPassword2}
                onTogglePassword={() => setShowPassword2(!showPassword2)}
              />
            </div>

            <div 
              className="p-3 rounded-lg text-sm"
              style={{ 
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-primary)',
                color: 'var(--text-secondary)',
              }}
            >
              <p className="text-xs mb-1" style={{ color: 'var(--text-primary)', fontWeight: '500' }}>
                ⓘ Account Approval Required
              </p>
              <p className="text-xs">
                Your account will be reviewed by an administrator. You'll receive a notification once approved.
              </p>
            </div>

            <Button
              type="submit"
              disabled={isRegistering}
              isLoading={isRegistering}
              className="w-full"
              style={{
                backgroundColor: 'var(--color-primary)',
                borderColor: 'var(--color-primary)',
                color: '#FFFFFF',
              }}
            >
              {isRegistering ? 'Creating Account...' : 'Create Account'}
            </Button>

            <div className="text-center pt-4">
              <Link
                href="/login"
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
                Already have an account? <span style={{ color: 'var(--color-primary)' }}>Sign in</span>
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
      `}} />
    </div>
  );
}
