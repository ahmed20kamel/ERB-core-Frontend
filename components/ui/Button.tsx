'use client';

import { ButtonHTMLAttributes, ReactNode, ElementType } from 'react';
import { BaseButton, BaseButtonProps } from './base/BaseButton';
import { cn } from '@/lib/utils/cn';
import Link from 'next/link';

export interface ButtonProps extends BaseButtonProps {
  children: ReactNode;
  asChild?: boolean;
}

export function Button({ children, asChild, ...props }: ButtonProps) {
  if (asChild && children && typeof children === 'object' && 'type' in children && children.type === Link) {
    const childProps = (children as any).props || {};
    const { className, ...linkProps } = childProps;
    return (
      <Link
        {...linkProps}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-medium transition-all duration-150 ease-in-out whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2',
          props.variant === 'primary' && 'bg-[var(--brand-orange)] text-[var(--primary-foreground)] hover:bg-[var(--primary-hover)] focus:ring-[var(--ring)] shadow-sm',
          props.variant === 'view' && 'bg-[var(--secondary)] text-[var(--secondary-foreground)] border border-[var(--border)] hover:bg-[var(--secondary-hover)]',
          props.variant === 'edit' && 'bg-transparent text-[var(--brand-orange)] border border-[var(--brand-orange)] hover:bg-[var(--brand-orange)] hover:text-[var(--primary-foreground)]',
          props.variant === 'delete' && 'bg-[var(--danger)] text-[var(--destructive-foreground)] hover:bg-[var(--destructive-hover)] focus:ring-[var(--destructive)]',
          props.variant === 'secondary' && 'bg-secondary text-secondary-foreground border border-border hover:bg-muted focus:ring-[var(--grey-400)]',
          props.variant === 'ghost' && 'bg-transparent text-foreground hover:bg-accent focus:ring-primary',
          props.variant === 'destructive' && 'bg-destructive text-destructive-foreground hover:opacity-90 focus:ring-destructive',
          props.variant === 'success' && 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-600',
          props.size === 'sm' && 'h-9 px-3 text-xs rounded-md',
          props.size === 'md' && 'h-[42px] px-4 text-sm rounded-md',
          props.size === 'lg' && 'h-12 px-6 text-base rounded-md',
          !props.size && 'h-[42px] px-4 text-sm rounded-md',
          className
        )}
      >
        {(children as any).props?.children || children}
      </Link>
    );
  }
  return <BaseButton {...props}>{children}</BaseButton>;
}

// Primary Button
export function PrimaryButton({ children, ...props }: ButtonProps) {
  return (
    <Button variant="primary" {...props}>
      {children}
    </Button>
  );
}

// Secondary Button
export function SecondaryButton({ children, ...props }: ButtonProps) {
  return (
    <Button variant="secondary" {...props}>
      {children}
    </Button>
  );
}

// Ghost Button
export function GhostButton({ children, ...props }: ButtonProps) {
  return (
    <Button variant="ghost" {...props}>
      {children}
    </Button>
  );
}

// Icon Button
export interface IconButtonProps extends Omit<BaseButtonProps, 'children'> {
  icon: ReactNode;
  'aria-label': string;
}

export function IconButton({ icon, className, ...props }: IconButtonProps) {
  return (
    <BaseButton
      variant={props.variant || 'ghost'}
      size={props.size || 'sm'}
      className={cn('p-0 w-9 h-9', className)}
      {...props}
    >
      {icon}
    </BaseButton>
  );
}

