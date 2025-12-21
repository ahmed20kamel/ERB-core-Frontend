'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { purchaseOrdersApi } from '@/lib/api/purchase-orders';
import MainLayout from '@/components/layout/MainLayout';
import Link from 'next/link';
import { formatPrice } from '@/lib/utils/format';
import RejectionReasonDialog from '@/components/ui/RejectionReasonDialog';
import LinkedDocumentsSection from '@/components/ui/LinkedDocumentsSection';
import DetailCard, { DetailField } from '@/components/ui/DetailCard';
import { toast } from '@/lib/hooks/use-toast';
import { useAuth } from '@/lib/hooks/use-auth';
import { usePermissions } from '@/lib/hooks/use-permissions';
import { canCreateGRN, canCreateInvoice } from '@/lib/utils/workflow-guards';

const statusColors: Record<string, string> = {
  draft: 'badge-info',
  pending: 'badge-warning',
  approved: 'badge-success',
  rejected: 'badge-error',
  completed: 'badge-success',
  cancelled: 'badge-error',
};

const statusLabels: Record<string, string> = {
  draft: 'Draft',
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export default function PurchaseOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);

  const { data: order, isLoading } = useQuery({
    queryKey: ['purchase-orders', id],
    queryFn: () => purchaseOrdersApi.getById(id),
  });

  const approveMutation = useMutation({
    mutationFn: () => purchaseOrdersApi.approve(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      toast('Purchase Order approved successfully!', 'success');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error || 'Failed to approve purchase order';
      toast(message, 'error');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (reason: string) => purchaseOrdersApi.reject(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      setRejectDialogOpen(false);
      toast('Purchase Order rejected', 'info');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error || 'Failed to reject purchase order';
      toast(message, 'error');
    },
  });

  const { hasPermission } = usePermissions();
  
  // Permission checks - Superuser has all permissions
  const isSuperuser = user?.is_superuser ?? false;
  const canApprove = isSuperuser || ((hasPermission('purchase_order', 'approve') ?? false) &&
                     user?.role !== 'procurement_officer' &&
                     user?.role !== 'site_engineer');
  const canReject = isSuperuser || ((hasPermission('purchase_order', 'reject') ?? false) &&
                     user?.role !== 'procurement_officer' &&
                     user?.role !== 'site_engineer');
  const canUpdate = isSuperuser || (hasPermission('purchase_order', 'update') ?? false);
  const canCreateGRNPerm = isSuperuser || (hasPermission('goods_receiving', 'create') ?? false);
  const canCreateInvoicePerm = isSuperuser || (hasPermission('purchase_invoice', 'create') ?? false);
  
  const canEdit = order && canUpdate && (order.status === 'draft' || order.status === 'pending' || order.status === 'rejected');

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

  if (!order) {
    return (
      <MainLayout>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
          <div className="card" style={{ textAlign: 'center', padding: 'var(--spacing-12)' }}>
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Purchase Order not found</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
        <div className="lpo-print">

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
        {/* Header Section - Unified */}
        <div>
          <Link
            href="/purchase-orders"
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
            ← Back to Purchase Orders
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
                Purchase Order: {order.order_number}
              </h1>
              <p style={{ 
                fontSize: 'var(--font-sm)',
                color: 'var(--text-secondary)',
                margin: 0,
              }}>
                View purchase order details
              </p>
            </div>
            <span className={`badge ${statusColors[order.status] || 'badge-info'}`}>
              {statusLabels[order.status] || order.status}
            </span>
          </div>
        </div>

        {/* Linked Documents */}
        <LinkedDocumentsSection
          documents={{
            purchaseRequest: typeof order.purchase_request === 'object' ? order.purchase_request : order.purchase_request ? { id: order.purchase_request } : null,
            purchaseQuotation: typeof order.purchase_quotation === 'object' ? order.purchase_quotation : order.purchase_quotation ? { id: order.purchase_quotation } : null,
            purchaseOrder: { id: order.id, order_number: order.order_number },
          }}
        />

        {/* Details Card - Unified */}
        <DetailCard title="Order Information">
          <DetailField 
            label="Supplier" 
            value={typeof order.supplier === 'object' ? order.supplier.name : 'N/A'} 
          />
          <DetailField 
            label="Order Date" 
            value={new Date(order.order_date).toLocaleDateString('en-US')} 
          />
          {order.delivery_date && (
            <DetailField 
              label="Delivery Date" 
              value={new Date(order.delivery_date).toLocaleDateString('en-US')} 
            />
          )}
          {order.delivery_method && (
            <DetailField 
              label="Delivery Method" 
              value={order.delivery_method === 'pickup' ? 'Pick Up' : 'Delivery'} 
            />
          )}
          {order.purchase_request && (
            <DetailField 
              label="Purchase Request" 
              value={
                <Link
                  href={`/purchase-requests/${typeof order.purchase_request === 'object' ? order.purchase_request.id : order.purchase_request}`}
                  className="text-primary hover:text-orange-500 underline"
                >
                  {typeof order.purchase_request === 'object'
                    ? order.purchase_request.code
                    : 'N/A'}
                </Link>
              } 
            />
          )}
          {order.approved_by_name && (
            <DetailField 
              label="Approved By" 
              value={order.approved_by_name} 
            />
          )}
          {order.approved_at && (
            <DetailField 
              label="Approved At" 
              value={new Date(order.approved_at).toLocaleDateString('en-US')} 
            />
          )}
          {order.payment_terms && (
            <DetailField 
              label="Payment Terms" 
              value={order.payment_terms} 
              span={3}
            />
          )}
          {order.delivery_terms && (
            <DetailField 
              label="Delivery Terms" 
              value={order.delivery_terms} 
              span={3}
            />
          )}
          {order.notes && (
            <DetailField 
              label="Notes" 
              value={order.notes} 
              span={3}
            />
          )}
          {order.rejection_reason && (
            <DetailField 
              label="Rejection Reason" 
              value={
                <div className="p-3 rounded-md" style={{
                  backgroundColor: 'var(--color-error-light)',
                  border: '1px solid var(--color-error)',
                }}>
                  <p className="text-sm" style={{ color: '#991B1B', margin: 0 }}>
                    {order.rejection_reason}
                  </p>
                </div>
              } 
              span={3}
            />
          )}
        </DetailCard>

        {/* Items Section - Unified */}
        <DetailCard title="Products">
          <div className="col-span-3" style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Disc %</th>
                  <th>Tax %</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="font-medium">
                        {item.product?.name || 'N/A'}
                      </div>
                      <div className="text-xs text-secondary">
                        {item.product?.code || ''}
                      </div>
                    </td>
                    <td>{item.quantity}</td>
                    <td className="text-secondary">{formatPrice(item.unit_price)}</td>
                    <td className="text-secondary">{item.discount || 0}%</td>
                    <td className="text-secondary">{item.tax_rate || 0}%</td>
                    <td className="font-semibold">{formatPrice(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DetailCard>

        {/* Summary - Unified */}
        <DetailCard title="Financial Summary">
          <div className="col-span-3 flex justify-end">
            <div className="w-64 flex flex-col gap-2">
              <div className="flex justify-between text-sm">
                <span className="text-secondary">Subtotal:</span>
                <span className="font-semibold">{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-secondary">Discount:</span>
                <span className="font-semibold">{formatPrice(order.discount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-secondary">Tax:</span>
                <span className="font-semibold">{formatPrice(order.tax_amount)}</span>
              </div>
              <div className="flex justify-between border-t border-primary pt-2 text-base">
                <span className="font-bold">Total:</span>
                <span className="font-bold">{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>
        </DetailCard>

        {/* Terms & Conditions Section - For Printing */}
        <div className="card" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
          <h2 
            className="text-base font-semibold mb-5 pb-3 border-b"
            style={{
              color: 'var(--text-primary)',
              borderColor: 'var(--border-primary)',
            }}
          >
            Terms & Conditions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {order.notes && (
            <div className="col-span-3 mb-4">
              <h4 className="text-base font-semibold mb-2">Notes:</h4>
              <p className="text-sm whitespace-pre-wrap">{order.notes}</p>
            </div>
          )}

          {order.terms_and_conditions && (() => {
            const termsLines = (order.terms_and_conditions ?? '').split('\n');
            return (
              <div className="col-span-3 mb-4">
                <div className="text-sm leading-relaxed font-mono">
                  {termsLines.map((line, index) => {
                    if (!line.trim()) {
                      return <div key={index} style={{ marginBottom: '0.5rem' }} />;
                    }
                    // Check if line contains Arabic characters
                    const hasArabic = /[\u0600-\u06FF]/.test(line);
                    return (
                      <div
                        key={index}
                        style={{
                          direction: hasArabic ? 'rtl' : 'ltr',
                          textAlign: hasArabic ? 'right' : 'left',
                          marginBottom: index < termsLines.length - 1 ? '0.5rem' : '0',
                          whiteSpace: 'pre-wrap',
                        }}
                      >
                        {line}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {order.payment_terms && (
            <div className="col-span-3 mb-4">
              <h4 className="text-base font-semibold mb-2">Payment Terms:</h4>
              <p className="text-sm whitespace-pre-wrap">{order.payment_terms}</p>
            </div>
          )}

          {order.delivery_terms && (
            <div className="col-span-3 mb-4">
              <h4 className="text-base font-semibold mb-2">Delivery Terms:</h4>
              <p className="text-sm whitespace-pre-wrap">{order.delivery_terms}</p>
            </div>
          )}

          {/* Signatures Section */}
          <div className="col-span-3 mt-8 pt-6 border-t-2 border-primary grid grid-cols-3 gap-6">
            <div>
              <h4 className="text-base font-semibold mb-4">Submitted by</h4>
              <div className="min-h-[80px] border border-primary rounded-md p-4 flex items-center justify-center bg-primary">
                <p className="text-sm text-secondary text-center m-0">
                  {order.created_by_name || 'N/A'}
                </p>
              </div>
              <p className="text-xs text-secondary mt-2 text-center">
                {order.created_at && new Date(order.created_at).toLocaleDateString('en-US')}
              </p>
            </div>

            <div>
              <h4 className="text-base font-semibold mb-4">Reviewed by</h4>
              <div className="min-h-[80px] border border-primary rounded-md p-4 flex items-center justify-center bg-primary">
                <p className="text-sm text-secondary text-center m-0">
                  {order.approved_by_name || 'Pending'}
                </p>
              </div>
              <p className="text-xs text-secondary mt-2 text-center">
                {order.approved_at ? new Date(order.approved_at).toLocaleDateString('en-US') : '-'}
              </p>
            </div>

            <div>
              <h4 className="text-base font-semibold mb-4">Approved by</h4>
              <div className="min-h-[80px] border border-primary rounded-md p-4 flex items-center justify-center bg-primary">
                <p className="text-sm text-secondary text-center m-0">
                  {order.approved_by_name || 'Pending'}
                </p>
              </div>
              <p className="text-xs text-secondary mt-2 text-center">
                {order.approved_at ? new Date(order.approved_at).toLocaleDateString('en-US') : '-'}
              </p>
            </div>
          </div>
          </div>
        </div>

        {/* Actions - Unified */}
        <div className="flex gap-3">
          <button
            onClick={() => window.print()}
            className="btn btn-secondary"
          >
            Print
          </button>
          {canEdit && (
            <Link href={`/purchase-orders/${id}/edit`} className="btn btn-edit">
              Edit
            </Link>
          )}
          {canApprove && (order.status === 'draft' || order.status === 'pending') && (
            <>
              <button
                onClick={() => approveMutation.mutate()}
                disabled={approveMutation.isPending}
                className="btn btn-success"
                title={!canApprove ? 'You do not have permission to approve' : ''}
              >
                {approveMutation.isPending ? 'Processing...' : 'Approve'}
              </button>
              {canReject && (
                <button
                  onClick={() => setRejectDialogOpen(true)}
                  disabled={rejectMutation.isPending}
                  className="btn btn-destructive"
                  title={!canReject ? 'You do not have permission to reject' : ''}
                >
                  {rejectMutation.isPending ? 'Processing...' : 'Reject'}
                </button>
              )}
            </>
          )}
          {order.status === 'approved' && (
            <>
              {/* Create GRN - Only for Site Engineer and Procurement Officer */}
              {canCreateGRNPerm && (user?.role === 'site_engineer' || user?.role === 'procurement_officer' || user?.is_superuser) && (
                <button
                  onClick={() => {
                    const guard = canCreateGRN(order.status);
                    if (!guard.canProceed) {
                      toast(guard.reason || 'Cannot create GRN', 'error');
                      return;
                    }
                    router.push(`/goods-receiving/new?purchase_order_id=${id}`);
                  }}
                  className="btn btn-primary"
                  title={!canCreateGRNPerm ? 'You do not have permission to create GRN' : ''}
                >
                  Create GRN (Goods Received Note)
                </button>
              )}
              {/* Create Invoice - Only if GRN exists */}
              {canCreateInvoicePerm && order.has_grn && (
                <button
                  onClick={() => {
                    const guard = canCreateInvoice(order.status);
                    if (!guard.canProceed) {
                      toast(guard.reason || 'Cannot create invoice', 'error');
                      return;
                    }
                    if (guard.warning) {
                      if (!confirm(guard.warning + '\n\nDo you want to continue?')) {
                        return;
                      }
                    }
                    router.push(`/purchase-invoices/new?purchase_order_id=${id}`);
                  }}
                  className="btn btn-primary"
                  title={!canCreateInvoicePerm ? 'You do not have permission to create invoice' : !order.has_grn ? 'GRN must be created first before creating invoice' : ''}
                >
                  Create Invoice
                </button>
              )}
              {canCreateInvoicePerm && !order.has_grn && (
                <button
                  disabled
                  className="btn btn-secondary"
                  title="GRN must be created first before creating invoice"
                >
                  Create Invoice (GRN Required)
                </button>
              )}
            </>
          )}
        </div>

        <RejectionReasonDialog
          isOpen={rejectDialogOpen}
          onClose={() => setRejectDialogOpen(false)}
          onConfirm={(reason) => rejectMutation.mutate(reason)}
          title="Reject Purchase Order"
          message="Please provide a reason for rejecting this purchase order. This reason will be saved and visible to the creator."
        />
      </div>
      </div>
    </MainLayout>
  );
}

