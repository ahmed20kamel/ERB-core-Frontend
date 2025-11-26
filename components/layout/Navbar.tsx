'use client';

import { useAuth } from '@/lib/hooks/use-auth';
import { useUIStore } from '@/lib/store/ui-store';
import { MenuIcon, SearchIcon } from '@/components/icons';
import NotificationsDropdown from '@/components/ui/NotificationsDropdown';
import DarkModeToggle from '@/components/ui/DarkModeToggle';
import Image from 'next/image';
import Link from 'next/link';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { sidebarOpen, toggleSidebar } = useUIStore();
  
  // Debug: Log user data to see if avatar_url is present
  if (typeof window !== 'undefined' && user) {
    console.log('Navbar user data:', { 
      username: user.username, 
      avatar_url: user.avatar_url, 
      avatar: user.avatar 
    });
  }

  return (
    <nav 
      className="fixed top-0 left-0 right-0 z-30 h-14 border-b transition-all duration-200 lg:left-64"
      style={{ 
        backgroundColor: 'var(--navbar-bg)',
        borderColor: 'var(--navbar-border)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div className="flex h-full items-center justify-between px-4 lg:px-6">
        {/* Left Section: Menu Button (Mobile) + Search */}
        <div className="flex items-center gap-3 lg:gap-4">
          {/* Mobile Menu Button */}
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-1.5 rounded-md transition-all duration-200"
            style={{ 
              color: 'var(--text-secondary)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--text-primary)';
              e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-secondary)';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            aria-label="Toggle sidebar"
          >
            <MenuIcon className="w-5 h-5" />
          </button>
          
          {/* Search Bar - Modern Design */}
          <div 
            className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-200 cursor-text"
            style={{ 
              backgroundColor: 'var(--input-bg)',
              border: '1px solid var(--input-border)',
              width: '280px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--input-focus-border)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--input-border)';
            }}
          >
            <SearchIcon className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-tertiary)' }} />
            <span className="text-sm" style={{ color: 'var(--input-placeholder)' }}>Search...</span>
          </div>
        </div>

        {/* Right Section: Dark Mode + Notifications + User */}
        <div className="flex items-center gap-2.5">
          {/* Dark Mode Toggle */}
          <DarkModeToggle />
          
          {/* Separator */}
          <div 
            className="h-5 w-px" 
            style={{ backgroundColor: 'var(--border-primary)' }} 
          />
          
          {/* Notifications */}
          <NotificationsDropdown />
          
          {/* Separator */}
          <div 
            className="h-5 w-px" 
            style={{ backgroundColor: 'var(--border-primary)' }} 
          />
          
          {/* User Info */}
          <div className="flex items-center gap-2.5">
            {/* User Avatar */}
            <Link
              href="/profile"
              className="flex items-center gap-2.5 px-2 py-1.5 rounded-md transition-all duration-200"
              style={{ 
                color: 'var(--text-secondary)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                e.currentTarget.style.color = 'var(--text-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  backgroundColor: 'var(--bg-tertiary)',
                  border: '2px solid var(--border-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  position: 'relative',
                }}
              >
                {user?.avatar_url ? (
                  <Image
                    src={user.avatar_url}
                    alt={user?.username || 'User'}
                    width={32}
                    height={32}
                    unoptimized
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'var(--bg-tertiary)',
                      color: 'var(--text-tertiary)',
                      fontSize: 'var(--font-sm)',
                      fontWeight: 'var(--font-weight-bold)',
                    }}
                  >
                    {(user?.username || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <span 
                className="text-sm font-semibold hidden sm:inline" 
                style={{ color: 'var(--text-primary)' }}
              >
                {user?.username || 'User'}
              </span>
            </Link>
            <button
              onClick={logout}
              className="px-3 py-1.5 text-sm font-semibold rounded-md transition-all duration-200"
              style={{ 
                color: 'var(--text-secondary)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                e.currentTarget.style.color = 'var(--text-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
