'use client';

import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils/cn';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <div className="w-full">
        <label className="flex items-center gap-2 cursor-pointer group">
          <input
            ref={ref}
            type="checkbox"
            className={cn(
              'w-4 h-4 rounded',
              'bg-white',
              'text-[#F97316]',
              'focus:ring-2 focus:ring-[#F97316]/18 focus:ring-offset-0',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'cursor-pointer',
              error && 'border-red-500',
              className
            )}
            style={{
              borderColor: error ? '#EF4444' : '#E5E7EB',
            }}
            {...props}
          />
          {label && (
            <span 
              className={cn(
                'text-sm',
                props.disabled && 'opacity-50 cursor-not-allowed'
              )}
              style={{ color: '#1E293B' }}
            >
              {label}
              {props.required && <span className="text-red-500 ml-1">*</span>}
            </span>
          )}
        </label>
        {error && (
          <p className="mt-1.5 text-xs" style={{ color: '#EF4444' }}>{error}</p>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

