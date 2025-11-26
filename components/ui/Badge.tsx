'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

export interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'success' | 'error' | 'warning' | 'info' | 'active' | 'inactive' | 'on-going' | 'pending';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Badge({
  children,
  variant = 'default',
  size = 'md',
  className,
}: BadgeProps) {
  const baseStyles = 'inline-flex items-center font-medium rounded-full';
  
  // Unified Status Tags - Using Design Tokens
  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
      case 'active':
        return {
          backgroundColor: 'var(--success)',
          color: '#ffffff',
          border: '1px solid var(--success)',
        };
      case 'error':
      case 'inactive':
        return {
          backgroundColor: 'var(--danger)',
          color: '#ffffff',
          border: '1px solid var(--danger)',
        };
      case 'warning':
      case 'on-going':
        return {
          backgroundColor: 'var(--warning)',
          color: '#000000',
          border: '1px solid var(--warning)',
        };
      case 'info':
      case 'pending':
        return {
          backgroundColor: 'var(--info)',
          color: '#ffffff',
          border: '1px solid var(--info)',
        };
      default:
        return {
          backgroundColor: 'var(--muted)',
          color: 'var(--foreground)',
          border: '1px solid var(--border)',
        };
    }
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  };

  return (
    <span
      className={cn(
        baseStyles,
        sizes[size],
        className
      )}
      style={getVariantStyles()}
    >
      {children}
    </span>
  );
}

