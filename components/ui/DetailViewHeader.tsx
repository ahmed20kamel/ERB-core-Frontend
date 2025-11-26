'use client';

import Link from 'next/link';

interface DetailViewHeaderProps {
  title: string;
  code?: string;
  id?: number;
  status?: {
    label: string;
    value: string;
    variant?: 'success' | 'error' | 'warning' | 'info';
  };
  imageUrl?: string;
  imagePlaceholder?: string;
  backUrl: string;
  editUrl: string;
  backLabel?: string;
}

export default function DetailViewHeader({
  title,
  code,
  id,
  status,
  imageUrl,
  imagePlaceholder,
  backUrl,
  editUrl,
  backLabel = 'Back',
}: DetailViewHeaderProps) {
  const getStatusBadgeStyle = (variant?: string) => {
    switch (variant) {
      case 'success':
      case 'active':
        return { backgroundColor: '#22C55E', color: '#ffffff', border: '1px solid #22C55E' };
      case 'error':
      case 'inactive':
        return { backgroundColor: '#EF4444', color: '#ffffff', border: '1px solid #EF4444' };
      case 'warning':
      case 'on-going':
        return { backgroundColor: '#FACC15', color: '#000000', border: '1px solid #FACC15' };
      case 'info':
      case 'pending':
        return { backgroundColor: '#3B82F6', color: '#ffffff', border: '1px solid #3B82F6' };
      default:
        return { backgroundColor: '#FFFFFF', color: '#1E293B', border: '1px solid #E5E7EB' };
    }
  };

  return (
    <div 
      className="card rounded-xl p-6 mb-6"
      style={{
        backgroundColor: '#FFFFFF',
        borderColor: '#E5E7EB',
      }}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-5 flex-1">
          {/* Image/Logo */}
          <div className="flex-shrink-0">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={title}
                className="w-28 h-28 rounded-lg object-cover"
                style={{ borderColor: '#E5E7EB' }}
              />
            ) : (
              <div 
                className="w-28 h-28 rounded-lg flex items-center justify-center"
                style={{
                  backgroundColor: '#FFFFFF',
                  borderColor: '#E5E7EB',
                  borderWidth: '1px',
                }}
              >
                {imagePlaceholder ? (
                  <span 
                    className="text-4xl"
                    style={{ color: '#64748B' }}
                  >
                    {imagePlaceholder}
                  </span>
                ) : (
                  <svg
                    className="w-12 h-12"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    style={{ color: '#64748B' }}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                )}
              </div>
            )}
          </div>

          {/* Title and Info */}
          <div className="flex-1 min-w-0">
            <Link
              href={backUrl}
              className="text-xs mb-3 inline-block transition-colors"
              style={{ 
                color: '#64748B',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#1E293B';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#64748B';
              }}
            >
              ← {backLabel}
            </Link>
            <h1 
              className="text-2xl font-bold mb-2"
              style={{ color: '#1E293B' }}
            >
              {title}
            </h1>
            <div className="flex flex-wrap items-center gap-4">
              {code && (
                <div className="flex items-center gap-2">
                  <span 
                    className="text-xs"
                    style={{ color: '#64748B' }}
                  >
                    Code:
                  </span>
                  <span 
                    className="text-sm font-medium"
                    style={{ color: '#1E293B' }}
                  >
                    {code}
                  </span>
                </div>
              )}
              {id && (
                <div className="flex items-center gap-2">
                  <span 
                    className="text-xs"
                    style={{ color: '#64748B' }}
                  >
                    ID:
                  </span>
                  <span 
                    className="text-sm font-medium"
                    style={{ color: '#1E293B' }}
                  >
                    #{id}
                  </span>
                </div>
              )}
              {status && (
                <div className="flex items-center gap-2">
                  <span 
                    className="text-xs"
                    style={{ color: '#64748B' }}
                  >
                    Status:
                  </span>
                  <span
                    className="px-2.5 py-1 rounded-md text-xs font-medium"
                    style={getStatusBadgeStyle(status.variant)}
                  >
                    {status.label}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Edit Button */}
        <div className="flex-shrink-0 ml-4">
          <Link
            href={editUrl}
            className="btn btn-primary px-4 py-2 text-sm font-medium"
          >
            Edit
          </Link>
        </div>
      </div>
    </div>
  );
}

