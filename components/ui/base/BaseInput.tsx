'use client';

import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils/cn';

export interface BaseInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  className?: string;
}

export const BaseInput = forwardRef<HTMLInputElement, BaseInputProps>(
  ({ label, error, helperText, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label 
            className="form-label"
          >
            {label}
            {props.required && <span style={{ color: 'var(--color-error)' }} className="ml-1">*</span>}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            'input',
            error && 'border-red-500 focus:ring-red-500/20 focus:border-red-500',
            className
          )}
          {...props}
        />
        {error && (
          <p 
            className="mt-1.5 text-xs"
            style={{ color: 'var(--color-error)' }}
          >
            {error}
          </p>
        )}
        {helperText && !error && (
          <p 
            className="mt-1.5 text-xs"
            style={{ color: 'var(--text-secondary)' }}
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

BaseInput.displayName = 'BaseInput';

export interface BaseTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  className?: string;
}

export const BaseTextarea = forwardRef<HTMLTextAreaElement, BaseTextareaProps>(
  ({ label, error, helperText, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label 
            className="form-label"
          >
            {label}
            {props.required && <span style={{ color: 'var(--color-error)' }} className="ml-1">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          className={cn(
            'input resize-none',
            error && 'border-red-500 focus:ring-red-500/20 focus:border-red-500',
            className
          )}
          {...props}
        />
        {error && (
          <p 
            className="mt-1.5 text-xs"
            style={{ color: 'var(--color-error)' }}
          >
            {error}
          </p>
        )}
        {helperText && !error && (
          <p 
            className="mt-1.5 text-xs"
            style={{ color: 'var(--text-secondary)' }}
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

BaseTextarea.displayName = 'BaseTextarea';
