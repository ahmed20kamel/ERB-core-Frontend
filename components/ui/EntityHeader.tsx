'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ReactNode } from 'react';

interface EntityHeaderProps {
  title: string;
  subtitle?: string;
  image?: string | null;
  imageAlt?: string;
  entityType: 'product' | 'project' | 'supplier' | 'user';
  status?: ReactNode;
  statusBadge?: string;
  statusVariant?: 'success' | 'error' | 'warning' | 'info';
  backHref: string;
  backLabel: string;
  actions?: ReactNode;
  imageSize?: number;
}

const getDefaultImage = (entityType: 'product' | 'project' | 'supplier' | 'user'): string => {
  switch (entityType) {
    case 'product':
      return '/images/default-product.png';
    case 'project':
      return '/images/default-project.png';
    case 'supplier':
      return '/images/default-supplier.png';
    case 'user':
      return '/images/default-avatar.png';
    default:
      return '/images/default-entity.png';
  }
};

const getImageUrl = (image: string | null | undefined, defaultImage: string): string => {
  if (!image || image === '' || image === 'null' || image === 'undefined') {
    return defaultImage;
  }
  
  // If image is a full URL, return it
  if (image.startsWith('http://') || image.startsWith('https://')) {
    return image;
  }
  
  // If image starts with /, it's a relative path
  if (image.startsWith('/')) {
    return image;
  }
  
  // If image already contains /media/, it's already a full path
  if (image.includes('/media/')) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    if (image.startsWith('/media/')) {
      return `${apiUrl}${image}`;
    }
    return `${apiUrl}/${image}`;
  }
  
  // Otherwise, assume it's a media URL from backend
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  return `${apiUrl}/media/${image}`;
};

export default function EntityHeader({
  title,
  subtitle,
  image,
  imageAlt,
  entityType,
  status,
  statusBadge,
  statusVariant = 'info',
  backHref,
  backLabel,
  actions,
  imageSize = 120,
}: EntityHeaderProps) {
  const defaultImage = getDefaultImage(entityType);
  const imageUrl = getImageUrl(image, defaultImage);
  const isCircular = entityType === 'user';

  const getStatusBadgeClass = () => {
    switch (statusVariant) {
      case 'success':
        return 'badge-success';
      case 'error':
        return 'badge-error';
      case 'warning':
        return 'badge-warning';
      case 'info':
      default:
        return 'badge-info';
    }
  };

  return (
    <div className="card" style={{ marginBottom: 'var(--spacing-6)' }}>
      <div style={{ display: 'flex', gap: 'var(--spacing-4)', alignItems: 'flex-start' }}>
        {/* Image */}
        <div
          style={{
            flexShrink: 0,
            width: `${imageSize}px`,
            height: `${imageSize}px`,
            borderRadius: isCircular ? '50%' : 'var(--radius-lg)',
            overflow: 'hidden',
            backgroundColor: 'var(--bg-tertiary)',
            border: '2px solid var(--border-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          {imageUrl && imageUrl !== defaultImage ? (
            <Image
              src={imageUrl}
              alt={imageAlt || title}
              width={imageSize}
              height={imageSize}
              unoptimized
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
              onError={(e) => {
                // Fallback to default image on error
                const target = e.target as HTMLImageElement;
                if (target.src !== defaultImage) {
                  target.src = defaultImage;
                }
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
                fontSize: 'var(--font-2xl)',
                fontWeight: 'var(--font-weight-bold)',
              }}
            >
              {title.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Back Link */}
          <Link
            href={backHref}
            className="text-sm mb-2 inline-block"
            style={{
              color: 'var(--text-secondary)',
              textDecoration: 'none',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
          >
            ← {backLabel}
          </Link>

          {/* Title and Subtitle */}
          <div style={{ marginBottom: 'var(--spacing-2)' }}>
            <h1
              style={{
                fontSize: 'var(--font-2xl)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--text-primary)',
                margin: 0,
                marginBottom: subtitle ? 'var(--spacing-1)' : 0,
                wordBreak: 'break-word',
              }}
            >
              {title}
            </h1>
            {subtitle && (
              <p
                style={{
                  fontSize: 'var(--font-sm)',
                  color: 'var(--text-secondary)',
                  margin: 0,
                }}
              >
                {subtitle}
              </p>
            )}
          </div>

          {/* Status and Actions */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-2)',
              flexWrap: 'wrap',
            }}
          >
            {statusBadge && (
              <span className={`badge ${getStatusBadgeClass()}`}>
                {statusBadge}
              </span>
            )}
            {status}
            {actions && (
              <div style={{ display: 'flex', gap: 'var(--spacing-2)', marginLeft: 'auto' }}>
                {actions}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

