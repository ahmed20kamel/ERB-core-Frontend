'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { purchaseInvoicesApi } from '@/lib/api/purchase-invoices';
import MainLayout from '@/components/layout/MainLayout';
import Link from 'next/link';
import { formatPrice } from '@/lib/utils/format';
import RejectionReasonDialog from '@/components/ui/RejectionReasonDialog';
import LinkedDocumentsSection from '@/components/ui/LinkedDocumentsSection';
import { toast } from '@/lib/hooks/use-toast';
import { useAuth } from '@/lib/hooks/use-auth';

const statusColors: Record<string, string> = {
  draft: 'badge-info',
  pending: 'badge-warning',
  approved: 'badge-success',
  rejected: 'badge-error',
  paid: 'badge-success',
  cancelled: 'badge-error',
};

const statusLabels: Record<string, string> = {
  draft: 'Draft',
  pending: 'Pending Approval',
  approved: 'Approved',
  rejected: 'Rejected',
  paid: 'Paid',
  cancelled: 'Cancelled',
};

export default function PurchaseInvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);

  const { data: invoice, isLoading } = useQuery({
    queryKey: ['purchase-invoices', id],
    queryFn: () => purchaseInvoicesApi.getById(id),
  });

  const approveMutation = useMutation({
    mutationFn: () => purchaseInvoicesApi.approve(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-invoices'] });
      toast('Invoice approved successfully!', 'success');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error || 'Failed to approve invoice';
      toast(message, 'error');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (reason: string) => purchaseInvoicesApi.reject(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-invoices'] });
      setRejectDialogOpen(false);
      toast('Invoice rejected', 'info');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error || 'Failed to reject invoice';
      toast(message, 'error');
    },
  });

  const markPaidMutation = useMutation({
    mutationFn: (data: { paid_amount?: number; payment_date?: string; payment_method?: string; payment_reference?: string }) =>
      purchaseInvoicesApi.markPaid(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-invoices'] });
      toast('Invoice marked as paid!', 'success');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error || 'Failed to mark invoice as paid';
      toast(message, 'error');
    },
  });

  const canApprove = user && (user.role === 'procurement_manager' || user.role === 'super_admin' || user.is_staff);
  const canMarkPaid = user && (user.role === 'super_admin' || user.is_staff);

  if (isLoading) {
    return (
      <MainLayout>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
          <div className="card" style={{ textAlign: 'center', padding: 'var(--spacing-12)' }}>
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Loading...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!invoice) {
    return (
      <MainLayout>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
          <div className="card" style={{ textAlign: 'center', padding: 'var(--spacing-12)' }}>
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Invoice not found</p>
            <Link href="/purchase-invoices" className="btn btn-primary" style={{ marginTop: 'var(--spacing-4)' }}>
              Back to Invoices
            </Link>
          </div>
        </div>
      </MainLayout>
    );
  }

  const purchaseOrder = typeof invoice.purchase_order === 'object' ? invoice.purchase_order : null;

  return (
    <MainLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
        {/* Header Section - Unified */}
        <div>
          <Link 
            href="/purchase-invoices" 
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
            ← Back to Purchase Invoices
          </Link>
          <div style={{ 
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <div>
              <h1 style={{ 
                fontSize: 'var(--font-2xl)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--text-primary)',
                margin: 0,
                marginBottom: 'var(--spacing-1)',
              }}>
                Invoice: {invoice.invoice_number}
              </h1>
              <p style={{ 
                fontSize: 'var(--font-sm)',
                color: 'var(--text-secondary)',
                margin: 0,
              }}>
                Purchase Invoice Details
              </p>
            </div>
            {invoice.status && (
              <span className={`badge ${statusColors[invoice.status] || 'badge-info'}`}>
                {statusLabels[invoice.status] || invoice.status}
              </span>
            )}
          </div>
        </div>

        {/* Linked Documents */}
        <LinkedDocumentsSection
          documents={{
            purchaseOrder: purchaseOrder ? { id: purchaseOrder.id, order_number: purchaseOrder.order_number } : null,
            invoice: { id: invoice.id, invoice_number: invoice.invoice_number },
          }}
        />

        {/* Details Card - Unified */}
        <div className="card">
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: 'var(--spacing-4)',
          }}>
            <div>
              <label style={{ 
                display: 'block',
                fontSize: 'var(--font-sm)',
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--text-secondary)',
                marginBottom: 'var(--spacing-2)',
              }}>
                Purchase Order
              </label>
              <p style={{ 
                fontSize: 'var(--font-base)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--text-primary)',
                margin: 0,
                marginBottom: 'var(--spacing-1)',
              }}>
                {purchaseOrder?.order_number || 'N/A'}
              </p>
              {purchaseOrder && (
                <Link
                  href={`/purchase-orders/${purchaseOrder.id}`}
                  style={{ 
                    fontSize: 'var(--font-sm)',
                    color: 'var(--text-primary)',
                    textDecoration: 'underline',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'var(--brand-orange)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'var(--text-primary)';
                  }}
                >
                  View Purchase Order
                </Link>
              )}
            </div>
            <div>
              <label style={{ 
                display: 'block',
                fontSize: 'var(--font-sm)',
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--text-secondary)',
                marginBottom: 'var(--spacing-2)',
              }}>
                Invoice Date
              </label>
              <p style={{ 
                fontSize: 'var(--font-base)',
                color: 'var(--text-primary)',
                margin: 0,
              }}>
                {new Date(invoice.invoice_date).toLocaleDateString('en-US')}
              </p>
            </div>
            {invoice.due_date && (
              <div>
                <label style={{ 
                  display: 'block',
                  fontSize: 'var(--font-sm)',
                  fontWeight: 'var(--font-weight-medium)',
                  color: 'var(--text-secondary)',
                  marginBottom: 'var(--spacing-2)',
                }}>
                  Due Date
                </label>
                <p style={{ 
                  fontSize: 'var(--font-base)',
                  color: 'var(--text-primary)',
                  margin: 0,
                }}>
                  {new Date(invoice.due_date).toLocaleDateString('en-US')}
                </p>
              </div>
            )}
            {invoice.approved_by_name && (
              <div>
                <label style={{ 
                  display: 'block',
                  fontSize: 'var(--font-sm)',
                  fontWeight: 'var(--font-weight-medium)',
                  color: 'var(--text-secondary)',
                  marginBottom: 'var(--spacing-2)',
                }}>
                  Approved By
                </label>
                <p style={{ 
                  fontSize: 'var(--font-base)',
                  color: 'var(--text-primary)',
                  margin: 0,
                }}>
                  {invoice.approved_by_name}
                </p>
              </div>
            )}
            {invoice.approved_at && (
              <div>
                <label style={{ 
                  display: 'block',
                  fontSize: 'var(--font-sm)',
                  fontWeight: 'var(--font-weight-medium)',
                  color: 'var(--text-secondary)',
                  marginBottom: 'var(--spacing-2)',
                }}>
                  Approved At
                </label>
                <p style={{ 
                  fontSize: 'var(--font-base)',
                  color: 'var(--text-primary)',
                  margin: 0,
                }}>
                  {new Date(invoice.approved_at).toLocaleDateString('en-US')}
                </p>
              </div>
            )}
            {invoice.payment_date && (
              <div>
                <label style={{ 
                  display: 'block',
                  fontSize: 'var(--font-sm)',
                  fontWeight: 'var(--font-weight-medium)',
                  color: 'var(--text-secondary)',
                  marginBottom: 'var(--spacing-2)',
                }}>
                  Payment Date
                </label>
                <p style={{ 
                  fontSize: 'var(--font-base)',
                  color: 'var(--text-primary)',
                  margin: 0,
                }}>
                  {new Date(invoice.payment_date).toLocaleDateString('en-US')}
                </p>
              </div>
            )}
            {invoice.payment_method && (
              <div>
                <label style={{ 
                  display: 'block',
                  fontSize: 'var(--font-sm)',
                  fontWeight: 'var(--font-weight-medium)',
                  color: 'var(--text-secondary)',
                  marginBottom: 'var(--spacing-2)',
                }}>
                  Payment Method
                </label>
                <p style={{ 
                  fontSize: 'var(--font-base)',
                  color: 'var(--text-primary)',
                  margin: 0,
                }}>
                  {invoice.payment_method}
                </p>
              </div>
            )}
            {invoice.payment_reference && (
              <div>
                <label style={{ 
                  display: 'block',
                  fontSize: 'var(--font-sm)',
                  fontWeight: 'var(--font-weight-medium)',
                  color: 'var(--text-secondary)',
                  marginBottom: 'var(--spacing-2)',
                }}>
                  Payment Reference
                </label>
                <p style={{ 
                  fontSize: 'var(--font-base)',
                  color: 'var(--text-primary)',
                  margin: 0,
                }}>
                  {invoice.payment_reference}
                </p>
              </div>
            )}
            {invoice.notes && (
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ 
                  display: 'block',
                  fontSize: 'var(--font-sm)',
                  fontWeight: 'var(--font-weight-medium)',
                  color: 'var(--text-secondary)',
                  marginBottom: 'var(--spacing-2)',
                }}>
                  Notes
                </label>
                <p style={{ 
                  fontSize: 'var(--font-base)',
                  color: 'var(--text-primary)',
                  margin: 0,
                }}>
                  {invoice.notes}
                </p>
              </div>
            )}
            {invoice.rejection_reason && (
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ 
                  display: 'block',
                  fontSize: 'var(--font-sm)',
                  fontWeight: 'var(--font-weight-medium)',
                  color: 'var(--text-secondary)',
                  marginBottom: 'var(--spacing-2)',
                }}>
                  Rejection Reason
                </label>
                <div style={{ 
                  padding: 'var(--spacing-3)',
                  backgroundColor: 'var(--color-error-light)',
                  border: `1px solid var(--color-error)`,
                  borderRadius: 'var(--radius-md)',
                }}>
                  <p style={{ 
                    fontSize: 'var(--font-base)',
                    color: '#991B1B',
                    margin: 0,
                  }}>
                    {invoice.rejection_reason}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Items Section - Unified */}
        <div className="card">
          <h3 style={{ 
            fontSize: 'var(--font-lg)',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--text-primary)',
            margin: 0,
            marginBottom: 'var(--spacing-4)',
          }}>
            Invoice Items
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Unit Price</th>
                  <th>Discount</th>
                  <th>Tax</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items && invoice.items.length > 0 ? (
                  invoice.items.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div style={{ 
                          fontWeight: 'var(--font-weight-medium)',
                          color: 'var(--text-primary)',
                        }}>
                          {item.product?.name || 'N/A'}
                        </div>
                        <div style={{ 
                          fontSize: 'var(--font-xs)',
                          color: 'var(--text-secondary)',
                        }}>
                          {item.product?.code || ''}
                        </div>
                      </td>
                      <td>
                        <div style={{ color: 'var(--text-primary)' }}>{item.quantity}</div>
                      </td>
                      <td>
                        <div style={{ color: 'var(--text-secondary)' }}>{formatPrice(Number(item.unit_price))}</div>
                      </td>
                      <td>
                        <div style={{ color: 'var(--text-secondary)' }}>{item.discount || 0}%</div>
                      </td>
                      <td>
                        <div style={{ color: 'var(--text-secondary)' }}>{item.tax_rate || 0}%</div>
                      </td>
                      <td>
                        <div style={{ 
                          fontWeight: 'var(--font-weight-semibold)',
                          color: 'var(--text-primary)',
                        }}>
                          {formatPrice(Number(item.total))}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} style={{ 
                      textAlign: 'center',
                      color: 'var(--text-secondary)',
                      padding: 'var(--spacing-4)',
                    }}>
                      No items found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary - Unified */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ width: '256px', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
              <div style={{ 
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 'var(--font-sm)',
              }}>
                <span style={{ color: 'var(--text-secondary)' }}>Subtotal:</span>
                <span style={{ 
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--text-primary)',
                }}>
                  {formatPrice(Number(invoice.subtotal || 0))}
                </span>
              </div>
              <div style={{ 
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 'var(--font-sm)',
              }}>
                <span style={{ color: 'var(--text-secondary)' }}>Discount:</span>
                <span style={{ 
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--text-primary)',
                }}>
                  {formatPrice(Number(invoice.discount || 0))}
                </span>
              </div>
              <div style={{ 
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 'var(--font-sm)',
              }}>
                <span style={{ color: 'var(--text-secondary)' }}>Tax:</span>
                <span style={{ 
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--text-primary)',
                }}>
                  {formatPrice(Number(invoice.tax_amount || 0))}
                </span>
              </div>
              <div style={{ 
                display: 'flex',
                justifyContent: 'space-between',
                borderTop: `1px solid var(--border-primary)`,
                paddingTop: 'var(--spacing-2)',
                fontSize: 'var(--font-base)',
              }}>
                <span style={{ 
                  fontWeight: 'var(--font-weight-bold)',
                  color: 'var(--text-primary)',
                }}>
                  Total:
                </span>
                <span style={{ 
                  fontWeight: 'var(--font-weight-bold)',
                  color: 'var(--text-primary)',
                }}>
                  {formatPrice(Number(invoice.total || 0))}
                </span>
              </div>
              {invoice.paid_amount !== undefined && invoice.paid_amount > 0 && (
                <>
                  <div style={{ 
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 'var(--font-sm)',
                    paddingTop: 'var(--spacing-2)',
                    borderTop: `1px solid var(--border-primary)`,
                  }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Paid Amount:</span>
                    <span style={{ 
                      fontWeight: 'var(--font-weight-semibold)',
                      color: 'var(--color-success)',
                    }}>
                      {formatPrice(Number(invoice.paid_amount))}
                    </span>
                  </div>
                  <div style={{ 
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 'var(--font-sm)',
                  }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Remaining:</span>
                    <span style={{ 
                      fontWeight: 'var(--font-weight-semibold)',
                      color: 'var(--text-primary)',
                    }}>
                      {formatPrice(Number(invoice.remaining_amount || 0))}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Actions - Unified */}
        <div style={{ display: 'flex', gap: 'var(--spacing-3)' }}>
          {canApprove && (invoice.status === 'draft' || invoice.status === 'pending') && (
            <>
              <button
                onClick={() => approveMutation.mutate()}
                disabled={approveMutation.isPending}
                className="btn btn-success"
              >
                {approveMutation.isPending ? 'Processing...' : 'Approve for Payment'}
              </button>
              <button
                onClick={() => setRejectDialogOpen(true)}
                disabled={rejectMutation.isPending}
                className="btn btn-destructive"
              >
                {rejectMutation.isPending ? 'Processing...' : 'Reject'}
              </button>
            </>
          )}
          {canMarkPaid && invoice.status === 'approved' && !invoice.is_fully_paid && (
            <button
              onClick={() => {
                if (confirm('Mark this invoice as fully paid?')) {
                  markPaidMutation.mutate({
                    paid_amount: invoice.total,
                    payment_date: new Date().toISOString().split('T')[0],
                  });
                }
              }}
              disabled={markPaidMutation.isPending}
              className="btn btn-primary"
            >
              {markPaidMutation.isPending ? 'Processing...' : 'Mark as Paid'}
            </button>
          )}
        </div>

        <RejectionReasonDialog
          isOpen={rejectDialogOpen}
          onClose={() => setRejectDialogOpen(false)}
          onConfirm={(reason) => rejectMutation.mutate(reason)}
          title="Reject Purchase Invoice"
          message="Please provide a reason for rejecting this invoice. This reason will be saved and visible to the creator."
        />
      </div>
    </MainLayout>
  );
}

