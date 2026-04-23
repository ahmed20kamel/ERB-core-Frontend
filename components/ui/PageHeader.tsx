'use client';

import Link from 'next/link';
import { ReactNode } from 'react';

interface ActionButton {
  label: string;
  onClick?: () => void;
  href?: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'print';
  disabled?: boolean;
  hidden?: boolean;
}

interface PageHeaderProps {
  backHref: string;
  backLabel: string;
  title: string;
  subtitle?: string;
  status?: string;
  statusColors?: Record<string, string>;
  statusLabels?: Record<string, string>;
  actions?: ActionButton[];
}

const VARIANT_STYLES: Record<string, string> = {
  primary: 'btn btn-primary',
  secondary: 'btn btn-secondary',
  danger: 'btn btn-error',
  ghost: 'btn btn-ghost',
  print: 'btn btn-secondary',
};

export default function PageHeader({
  backHref,
  backLabel,
  title,
  subtitle,
  status,
  statusColors = {},
  statusLabels = {},
  actions = [],
}: PageHeaderProps) {
  const visibleActions = actions.filter((a) => !a.hidden);

  return (
    <div style={{ marginBottom: 4 }}>
      {/* Back link */}
      <Link
        href={backHref}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          fontSize: 13,
          color: 'var(--text-secondary)',
          textDecoration: 'none',
          marginBottom: 10,
          transition: 'color 0.15s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--brand-orange)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; }}
      >
        ← {backLabel}
      </Link>

      {/* Title row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        {/* Left: title + subtitle */}
        <div>
          <h1 style={{
            fontSize: 'var(--font-2xl)',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--text-primary)',
            margin: 0,
            marginBottom: 4,
          }}>
            {title}
          </h1>
          {subtitle && (
            <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', margin: 0 }}>
              {subtitle}
            </p>
          )}
        </div>

        {/* Right: status + action buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {status && (
            <span className={`badge ${statusColors[status] || 'badge-info'}`}>
              {statusLabels[status] || status}
            </span>
          )}
          {visibleActions.map((action, i) =>
            action.href ? (
              <Link key={i} href={action.href}>
                <button
                  className={VARIANT_STYLES[action.variant ?? 'secondary']}
                  style={{ fontSize: 13, padding: '6px 14px' }}
                  disabled={action.disabled}
                >
                  {action.label}
                </button>
              </Link>
            ) : (
              <button
                key={i}
                className={VARIANT_STYLES[action.variant ?? 'secondary']}
                style={{ fontSize: 13, padding: '6px 14px' }}
                onClick={action.onClick}
                disabled={action.disabled}
              >
                {action.label}
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}
