'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { purchaseRequestsApi } from '@/lib/api/purchase-requests';
import MainLayout from '@/components/layout/MainLayout';
import Link from 'next/link';
import RouteGuard from '@/components/auth/RouteGuard';
import { Loader } from '@/components/ui';
import { useT } from '@/lib/i18n/useT';

const statusColors: Record<string, string> = {
  completed: '#10B981', // Green
  in_progress: '#F59E0B', // Amber
  pending: '#3B82F6', // Blue
  rejected: '#EF4444', // Red
};

const statusBgColors: Record<string, string> = {
  completed: 'rgba(16, 185, 129, 0.1)',
  in_progress: 'rgba(245, 158, 11, 0.1)',
  pending: 'rgba(59, 130, 246, 0.1)',
  rejected: 'rgba(239, 68, 68, 0.1)',
};

const statusLabels: Record<string, string> = {
  completed: 'Completed',
  in_progress: 'In Progress',
  pending: 'Pending',
  rejected: 'Rejected',
};

const stageIcons: Record<string, string> = {
  pr_created: '📝',
  pr_approved: '✅',
  pr_rejected: '❌',
  pr_pending: '⏳',
  quotation_request_issued: '📋',
  purchase_quotation_received: '💰',
  supplier_awarded: '🏆',
  lpo_created: '📄',
  lpo_pending: '⏳',
  lpo_approved: '✅',
  lpo_rejected: '❌',
  lpo_completed: '✅',
  grn_created: '📦',
  invoice_created: '🧾',
  invoice_approved: '✅',
  invoice_paid: '💵',
};

const stageLabels: Record<string, string> = {
  pr_created: 'PR Created',
  pr_approved: 'PR Approved',
  pr_rejected: 'PR Rejected',
  pr_pending: 'PR Pending',
  quotation_request_issued: 'Quotation Request',
  purchase_quotation_received: 'Quotation Received',
  supplier_awarded: 'Supplier Awarded',
  lpo_created: 'LPO Created',
  lpo_pending: 'LPO Pending Approval',
  lpo_approved: 'LPO Approved',
  lpo_rejected: 'LPO Rejected',
  lpo_completed: 'LPO Completed',
  grn_created: 'GRN Created',
  invoice_created: 'Invoice Created',
  invoice_approved: 'Invoice Approved',
  invoice_paid: 'Invoice Paid',
};

export default function PurchaseRequestTrackingPage() {
  return (
    <RouteGuard
      requiredPermission={{ category: 'purchase_request', action: 'view' }}
      redirectTo="/purchase-requests"
    >
      <PurchaseRequestTrackingPageContent />
    </RouteGuard>
  );
}

function PurchaseRequestTrackingPageContent() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);
  const t = useT();

  const { data, isLoading, error } = useQuery({
    queryKey: ['purchase-request-tracking', id],
    queryFn: () => purchaseRequestsApi.getTrackingTimeline(id),
  });

  if (isLoading) {
    return (
      <MainLayout>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
          <div className="card" style={{ textAlign: 'center', padding: 'var(--spacing-12)' }}>
            <Loader className="mx-auto mb-4" />
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>{t('page', 'loadingTimeline')}</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error || !data) {
    return (
      <MainLayout>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
          <div className="card" style={{ textAlign: 'center', padding: 'var(--spacing-12)' }}>
            <p style={{ color: 'var(--color-error)', margin: 0, marginBottom: 'var(--spacing-4)' }}>
              {t('page', 'errorLoadingTimeline')}
            </p>
            <Link 
              href={`/purchase-requests/${id}`} 
              className="btn btn-primary"
            >
              {t('page', 'backToPurchaseRequest')}
            </Link>
          </div>
        </div>
      </MainLayout>
    );
  }

  const { purchase_request, timeline, current_stage, total_duration } = data;

  const completedCount = timeline.filter(item => item.status === 'completed').length;
  const progressPercentage = timeline.length > 0 ? (completedCount / timeline.length) * 100 : 0;

  const getRelatedUrl = (relatedType: string, relatedId: number): string => {
    switch (relatedType) {
      case 'purchase_request':
        return `/purchase-requests/${relatedId}`;
      case 'quotation_request':
        return `/quotation-requests/${relatedId}`;
      case 'purchase_quotation':
        return `/purchase-quotations/${relatedId}`;
      case 'purchase_order':
        return `/purchase-orders/${relatedId}`;
      case 'goods_receiving':
        return `/goods-receiving/${relatedId}`;
      case 'purchase_invoice':
        return `/purchase-invoices/${relatedId}`;
      default:
        return '#';
    }
  };

  const formatRole = (role: string | null): string => {
    if (!role) return '';
    return role
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <MainLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
        {/* Header Section - Enhanced */}
        <div className="card" style={{ 
          background: 'linear-gradient(135deg, var(--card-bg) 0%, var(--bg-tertiary) 100%)',
          border: '1px solid var(--border-primary)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--spacing-4)' }}>
            <div style={{ flex: 1, minWidth: '300px' }}>
              <Link
                href={`/purchase-requests/${id}`}
                className="text-sm mb-3 inline-block"
                style={{
                  color: 'var(--text-secondary)',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 'var(--spacing-1)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--color-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }}
              >
                {t('btn', 'back')} {t('page', 'backToPurchaseRequest')}
              </Link>
              <h1 style={{
                fontSize: 'var(--font-3xl)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'var(--text-primary)',
                margin: 0,
                marginBottom: 'var(--spacing-2)',
                lineHeight: 1.2,
              }}>
                {t('page', 'purchaseRequestTracking')}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)', flexWrap: 'wrap' }}>
                <div style={{
                  padding: 'var(--spacing-1) var(--spacing-3)',
                  backgroundColor: 'var(--bg-tertiary)',
                  borderRadius: 'var(--radius-full)',
                  fontSize: 'var(--font-sm)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-primary)',
                }}>
                  {purchase_request.code}
                </div>
                <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-sm)' }}>
                  {purchase_request.title}
                </span>
              </div>
            </div>
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'flex-end', 
              gap: 'var(--spacing-2)',
              minWidth: '200px',
            }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{
                  fontSize: 'var(--font-xs)',
                  color: 'var(--text-secondary)',
                  marginBottom: 'var(--spacing-1)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}>
                  {t('page', 'totalDuration')}
                </div>
                <div style={{
                  fontSize: 'var(--font-xl)',
                  fontWeight: 'var(--font-weight-bold)',
                  color: 'var(--color-primary)',
                }}>
                  {total_duration || 'N/A'}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{
                  fontSize: 'var(--font-xs)',
                  color: 'var(--text-secondary)',
                  marginBottom: 'var(--spacing-1)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}>
                  {t('page', 'progress')}
                </div>
                <div style={{
                  fontSize: 'var(--font-lg)',
                  fontWeight: 'var(--font-weight-bold)',
                  color: 'var(--text-primary)',
                }}>
                  {completedCount} / {timeline.length}
                </div>
                <div style={{
                  width: '120px',
                  height: '6px',
                  backgroundColor: 'var(--bg-tertiary)',
                  borderRadius: 'var(--radius-full)',
                  marginTop: 'var(--spacing-1)',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    width: `${progressPercentage}%`,
                    height: '100%',
                    backgroundColor: 'var(--color-success)',
                    borderRadius: 'var(--radius-full)',
                    transition: 'width 0.3s ease',
                  }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline Section - Professional Design */}
        <div className="card" style={{ 
          padding: 'var(--spacing-8)',
          background: 'var(--card-bg)',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-3)',
            marginBottom: 'var(--spacing-8)',
            paddingBottom: 'var(--spacing-4)',
            borderBottom: '2px solid var(--border-primary)',
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--color-primary-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 'var(--font-xl)',
            }}>
              📊
            </div>
            <div>
              <h2 style={{
                fontSize: 'var(--font-2xl)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'var(--text-primary)',
                margin: 0,
                marginBottom: 'var(--spacing-1)',
              }}>
                {t('page', 'procurementWorkflow')}
              </h2>
              <p style={{
                fontSize: 'var(--font-sm)',
                color: 'var(--text-secondary)',
                margin: 0,
              }}>
                {t('page', 'completeTracking')}
              </p>
            </div>
          </div>

          {/* Vertical Timeline */}
          <div style={{ position: 'relative', paddingLeft: 'var(--spacing-10)' }}>
            {/* Timeline Line - Enhanced */}
            <div style={{
              position: 'absolute',
              left: '32px',
              top: '12px',
              bottom: '12px',
              width: '3px',
              background: `linear-gradient(to bottom, 
                ${statusColors.completed} 0%, 
                ${statusColors.completed} ${progressPercentage}%, 
                var(--border-primary) ${progressPercentage}%, 
                var(--border-primary) 100%)`,
              borderRadius: 'var(--radius-full)',
              zIndex: 0,
            }} />

            {/* Timeline Items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-8)' }}>
              {timeline.map((item, index) => {
                const isLast = index === timeline.length - 1;
                const statusColor = statusColors[item.status] || statusColors.pending;
                const statusBg = statusBgColors[item.status] || statusBgColors.pending;

                return (
                  <div key={index} style={{ position: 'relative', zIndex: 1 }}>
                    {/* Timeline Dot - Enhanced */}
                    <div style={{
                      position: 'absolute',
                      left: '-40px',
                      top: '12px',
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: statusColor,
                      border: '4px solid var(--bg-primary)',
                      boxShadow: `0 0 0 2px ${statusColor}20, 0 2px 8px ${statusColor}40`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '10px',
                      color: '#FFFFFF',
                      fontWeight: 'bold',
                      zIndex: 2,
                    }}>
                      {index + 1}
                    </div>

                    {/* Timeline Card - Professional */}
                    <div className="card" style={{
                      marginLeft: 'var(--spacing-6)',
                      borderLeft: `4px solid ${statusColor}`,
                      backgroundColor: statusBg,
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                      transition: 'all 0.2s ease',
                      position: 'relative',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateX(4px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.12)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateX(0)';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)';
                    }}
                    >
                      {/* Card Header */}
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'flex-start', 
                        marginBottom: 'var(--spacing-4)',
                        flexWrap: 'wrap',
                        gap: 'var(--spacing-3)',
                      }}>
                        <div style={{ flex: 1, minWidth: '300px' }}>
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 'var(--spacing-3)', 
                            marginBottom: 'var(--spacing-2)',
                          }}>
                            <span style={{ 
                              fontSize: 'var(--font-2xl)',
                              lineHeight: 1,
                            }}>
                              {stageIcons[item.stage] || '📌'}
                            </span>
                            <h3 style={{
                              fontSize: 'var(--font-lg)',
                              fontWeight: 'var(--font-weight-bold)',
                              color: 'var(--text-primary)',
                              margin: 0,
                            }}>
                              {item.stage_name}
                            </h3>
                          </div>
                          
                          {/* Metadata Grid */}
                          <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                            gap: 'var(--spacing-3)',
                            marginTop: 'var(--spacing-3)',
                          }}>
                            {item.user && (
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'var(--spacing-2)',
                              }}>
                                <span style={{ 
                                  fontSize: 'var(--font-xs)', 
                                  color: 'var(--text-secondary)',
                                  fontWeight: 'var(--font-weight-medium)',
                                }}>
                                  👤
                                </span>
                                <div>
                                  <div style={{ 
                                    fontSize: 'var(--font-xs)', 
                                    color: 'var(--text-secondary)',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                  }}>
                                    {t('page', 'performedBy')}
                                  </div>
                                  <div style={{ 
                                    fontSize: 'var(--font-sm)', 
                                    color: 'var(--text-primary)', 
                                    fontWeight: 'var(--font-weight-semibold)',
                                  }}>
                                    {item.user}
                                    {item.user_role && (
                                      <span style={{ 
                                        color: 'var(--text-secondary)',
                                        fontWeight: 'var(--font-weight-normal)',
                                        marginLeft: 'var(--spacing-1)',
                                      }}>
                                        • {formatRole(item.user_role)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            {item.timestamp && (
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'var(--spacing-2)',
                              }}>
                                <span style={{ 
                                  fontSize: 'var(--font-xs)', 
                                  color: 'var(--text-secondary)',
                                }}>
                                  🕐
                                </span>
                                <div>
                                  <div style={{ 
                                    fontSize: 'var(--font-xs)', 
                                    color: 'var(--text-secondary)',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                  }}>
                                    {t('page', 'dateTime')}
                                  </div>
                                  <div style={{ 
                                    fontSize: 'var(--font-sm)', 
                                    color: 'var(--text-primary)',
                                    fontWeight: 'var(--font-weight-semibold)',
                                  }}>
                                    {new Date(item.timestamp).toLocaleString('en-US', {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            {item.duration && (
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'var(--spacing-2)',
                              }}>
                                <span style={{ 
                                  fontSize: 'var(--font-xs)', 
                                  color: 'var(--text-secondary)',
                                }}>
                                  ⏱️
                                </span>
                                <div>
                                  <div style={{ 
                                    fontSize: 'var(--font-xs)', 
                                    color: 'var(--text-secondary)',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                  }}>
                                    {t('page', 'duration')}
                                  </div>
                                  <div style={{ 
                                    fontSize: 'var(--font-sm)', 
                                    color: statusColor,
                                    fontWeight: 'var(--font-weight-bold)',
                                  }}>
                                    {item.duration}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Status Badge */}
                        <div>
                          <div style={{
                            padding: 'var(--spacing-2) var(--spacing-4)',
                            backgroundColor: statusColor,
                            color: '#FFFFFF',
                            borderRadius: 'var(--radius-full)',
                            fontSize: 'var(--font-xs)',
                            fontWeight: 'var(--font-weight-bold)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            boxShadow: `0 2px 4px ${statusColor}40`,
                          }}>
                            {statusLabels[item.status] || item.status}
                          </div>
                        </div>
                      </div>

                      {/* Notes */}
                      {item.notes && (
                        <div style={{
                          marginTop: 'var(--spacing-4)',
                          padding: 'var(--spacing-4)',
                          backgroundColor: 'var(--bg-primary)',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--border-primary)',
                        }}>
                          <div style={{
                            fontSize: 'var(--font-xs)',
                            fontWeight: 'var(--font-weight-bold)',
                            color: 'var(--text-secondary)',
                            marginBottom: 'var(--spacing-2)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                          }}>
                            📝 {t('field', 'notes')}
                          </div>
                          <p style={{
                            fontSize: 'var(--font-sm)',
                            color: 'var(--text-primary)',
                            margin: 0,
                            lineHeight: 1.6,
                          }}>
                            {item.notes}
                          </p>
                        </div>
                      )}

                      {/* Documents */}
                      {item.documents && item.documents.length > 0 && (
                        <div style={{ marginTop: 'var(--spacing-4)' }}>
                          <div style={{ 
                            fontSize: 'var(--font-xs)',
                            fontWeight: 'var(--font-weight-bold)',
                            color: 'var(--text-secondary)',
                            marginBottom: 'var(--spacing-3)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                          }}>
                            📎 {t('page', 'attachments')} ({item.documents.length})
                          </div>
                          <div style={{ 
                            display: 'flex', 
                            flexWrap: 'wrap', 
                            gap: 'var(--spacing-2)',
                          }}>
                            {item.documents.map((doc, docIndex) => (
                              <a
                                key={docIndex}
                                href={doc.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 'var(--spacing-2)',
                                  padding: 'var(--spacing-2) var(--spacing-3)',
                                  backgroundColor: 'var(--bg-primary)',
                                  border: '1px solid var(--border-primary)',
                                  borderRadius: 'var(--radius-md)',
                                  fontSize: 'var(--font-xs)',
                                  color: 'var(--color-primary)',
                                  textDecoration: 'none',
                                  fontWeight: 'var(--font-weight-medium)',
                                  transition: 'all 0.2s ease',
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = 'var(--color-primary-light)';
                                  e.currentTarget.style.borderColor = 'var(--color-primary)';
                                  e.currentTarget.style.transform = 'translateY(-2px)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = 'var(--bg-primary)';
                                  e.currentTarget.style.borderColor = 'var(--border-primary)';
                                  e.currentTarget.style.transform = 'translateY(0)';
                                }}
                              >
                                <span>{doc.type === 'image' ? '🖼️' : '📄'}</span>
                                <span>{doc.name}</span>
                                <span style={{ fontSize: '10px' }}>↗</span>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* View Details Link */}
                      <div style={{ 
                        marginTop: 'var(--spacing-4)',
                        paddingTop: 'var(--spacing-4)',
                        borderTop: '1px solid var(--border-primary)',
                      }}>
                        <Link
                          href={getRelatedUrl(item.related_type, item.related_id)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 'var(--spacing-2)',
                            fontSize: 'var(--font-sm)',
                            fontWeight: 'var(--font-weight-semibold)',
                            color: 'var(--color-primary)',
                            textDecoration: 'none',
                            transition: 'all 0.2s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = 'var(--color-primary-dark)';
                            e.currentTarget.style.gap = 'var(--spacing-3)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = 'var(--color-primary)';
                            e.currentTarget.style.gap = 'var(--spacing-2)';
                          }}
                        >
                          {t('page', 'viewDetails')}
                          <span style={{ fontSize: 'var(--font-base)' }}>→</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Summary Card - Enhanced */}
        <div className="card" style={{ 
          background: 'linear-gradient(135deg, var(--bg-tertiary) 0%, var(--card-bg) 100%)',
          border: '1px solid var(--border-primary)',
        }}>
          <h3 style={{
            fontSize: 'var(--font-xl)',
            fontWeight: 'var(--font-weight-bold)',
            color: 'var(--text-primary)',
            margin: 0,
            marginBottom: 'var(--spacing-6)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-2)',
          }}>
            <span>📊</span>
            <span>{t('page', 'summary')}</span>
          </h3>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: 'var(--spacing-6)',
          }}>
            <div style={{
              padding: 'var(--spacing-4)',
              backgroundColor: 'var(--bg-primary)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-primary)',
            }}>
              <div style={{ 
                fontSize: 'var(--font-xs)', 
                color: 'var(--text-secondary)', 
                marginBottom: 'var(--spacing-2)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                fontWeight: 'var(--font-weight-semibold)',
              }}>
                {t('page', 'currentStage')}
              </div>
              <div style={{ 
                fontSize: 'var(--font-lg)', 
                fontWeight: 'var(--font-weight-bold)', 
                color: 'var(--text-primary)',
                lineHeight: 1.3,
              }}>
                {timeline[timeline.length - 1]?.stage_name || 'N/A'}
              </div>
            </div>
            <div style={{
              padding: 'var(--spacing-4)',
              backgroundColor: 'var(--bg-primary)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-primary)',
            }}>
              <div style={{ 
                fontSize: 'var(--font-xs)', 
                color: 'var(--text-secondary)', 
                marginBottom: 'var(--spacing-2)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                fontWeight: 'var(--font-weight-semibold)',
              }}>
                {t('page', 'totalSteps')}
              </div>
              <div style={{ 
                fontSize: 'var(--font-2xl)', 
                fontWeight: 'var(--font-weight-bold)', 
                color: 'var(--text-primary)',
              }}>
                {timeline.length}
              </div>
            </div>
            <div style={{
              padding: 'var(--spacing-4)',
              backgroundColor: 'var(--bg-primary)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-primary)',
            }}>
              <div style={{ 
                fontSize: 'var(--font-xs)', 
                color: 'var(--text-secondary)', 
                marginBottom: 'var(--spacing-2)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                fontWeight: 'var(--font-weight-semibold)',
              }}>
                {t('page', 'completed')}
              </div>
              <div style={{ 
                fontSize: 'var(--font-2xl)', 
                fontWeight: 'var(--font-weight-bold)', 
                color: 'var(--color-success)',
              }}>
                {completedCount}
              </div>
            </div>
            <div style={{
              padding: 'var(--spacing-4)',
              backgroundColor: 'var(--bg-primary)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-primary)',
            }}>
              <div style={{ 
                fontSize: 'var(--font-xs)', 
                color: 'var(--text-secondary)', 
                marginBottom: 'var(--spacing-2)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                fontWeight: 'var(--font-weight-semibold)',
              }}>
                {t('page', 'totalDuration')}
              </div>
              <div style={{ 
                fontSize: 'var(--font-lg)', 
                fontWeight: 'var(--font-weight-bold)', 
                color: 'var(--text-primary)',
              }}>
                {total_duration || 'N/A'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
