'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { goodsReceivingApi } from '@/lib/api/goods-receiving';
import MainLayout from '@/components/layout/MainLayout';
import Link from 'next/link';
import { formatPrice } from '@/lib/utils/format';
import LinkedDocumentsSection from '@/components/ui/LinkedDocumentsSection';
import { canCreateInvoice } from '@/lib/utils/workflow-guards';
import { toast } from '@/lib/hooks/use-toast';
import { useAuth } from '@/lib/hooks/use-auth';
import { usePermissions } from '@/lib/hooks/use-permissions';
import { Button } from '@/components/ui';
import Image from 'next/image';

const statusColors: Record<string, string> = {
  draft: 'badge-info',
  partial: 'badge-warning',
  completed: 'badge-success',
  cancelled: 'badge-error',
};

const statusLabels: Record<string, string> = {
  draft: 'Draft',
  partial: 'Partially Received',
  completed: 'Fully Received',
  cancelled: 'Cancelled',
};

const qualityStatusColors: Record<string, string> = {
  good: 'badge-success',
  damaged: 'badge-error',
  defective: 'badge-error',
  missing: 'badge-warning',
};

const qualityStatusLabels: Record<string, string> = {
  good: 'Good',
  damaged: 'Damaged',
  defective: 'Defective',
  missing: 'Missing',
};

export default function GRNDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  
  // Check if user can mark invoice as delivered (Procurement Officer or Super Admin)
  const isSuperuser = user?.is_superuser ?? false;
  const canMarkInvoice = isSuperuser || 
    (user?.role === 'procurement_officer' && 
     (hasPermission('goods_receiving', 'update') ?? false));
  
  // Check if user can create invoice - Site Engineer should NOT be able to create invoice
  const canCreateInvoicePerm = isSuperuser || 
    ((hasPermission('purchase_invoice', 'create') ?? false) &&
     user?.role !== 'site_engineer');

  const { data: grn, isLoading } = useQuery({
    queryKey: ['goods-receiving', id],
    queryFn: () => goodsReceivingApi.getById(id),
  });

  const markInvoiceDeliveredMutation = useMutation({
    mutationFn: () => goodsReceivingApi.markInvoiceDelivered(id),
    onSuccess: () => {
      toast('Invoice marked as delivered to office', 'success');
      queryClient.invalidateQueries({ queryKey: ['goods-receiving', id] });
    },
    onError: (error: any) => {
      toast(error?.response?.data?.error || 'Failed to mark invoice as delivered', 'error');
    },
  });

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

  if (!grn) {
    return (
      <MainLayout>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
          <div className="card" style={{ textAlign: 'center', padding: 'var(--spacing-12)' }}>
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>GRN not found</p>
            <Link href="/goods-receiving" className="btn btn-primary" style={{ marginTop: 'var(--spacing-4)' }}>
              Back to GRN List
            </Link>
          </div>
        </div>
      </MainLayout>
    );
  }

  const purchaseOrder = typeof grn.purchase_order === 'object' ? grn.purchase_order : null;

  return (
    <MainLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
        {/* Header Section - Unified */}
        <div>
          <Link 
            href="/goods-receiving" 
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
            ← Back to Goods Receiving
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
                GRN: {grn.grn_number}
              </h1>
              <p style={{ 
                fontSize: 'var(--font-sm)',
                color: 'var(--text-secondary)',
                margin: 0,
              }}>
                Goods Received Note Details
              </p>
            </div>
            {grn.status && (
              <span className={`badge ${statusColors[grn.status] || 'badge-info'}`}>
                {statusLabels[grn.status] || grn.status}
              </span>
            )}
          </div>
        </div>

        {/* Linked Documents */}
        <LinkedDocumentsSection
          documents={{
            purchaseOrder: purchaseOrder ? { id: purchaseOrder.id, order_number: purchaseOrder.order_number } : null,
            grn: { id: grn.id, grn_number: grn.grn_number },
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
                Receipt Date
              </label>
              <p style={{ 
                fontSize: 'var(--font-base)',
                color: 'var(--text-primary)',
                margin: 0,
              }}>
                {new Date(grn.receipt_date).toLocaleDateString('en-US')}
              </p>
            </div>
            <div>
              <label style={{ 
                display: 'block',
                fontSize: 'var(--font-sm)',
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--text-secondary)',
                marginBottom: 'var(--spacing-2)',
              }}>
                Received By
              </label>
              <p style={{ 
                fontSize: 'var(--font-base)',
                color: 'var(--text-primary)',
                margin: 0,
              }}>
                {grn.received_by_name || 'N/A'}
              </p>
            </div>
            {grn.notes && (
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
                  {grn.notes}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Material Images and Invoice Section */}
        {((grn.material_images && grn.material_images.length > 0) || grn.supplier_invoice_file_url || grn.invoice_delivery_status) ? (
          <div className="card">
            <h3 style={{ 
              fontSize: 'var(--font-lg)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--text-primary)',
              margin: 0,
              marginBottom: 'var(--spacing-4)',
            }}>
              Material Photos & Supplier Invoice
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
              {/* Material Images */}
              {grn.material_images && grn.material_images.length > 0 && (
                <div>
                  <label style={{ 
                    display: 'block',
                    fontSize: 'var(--font-sm)',
                    fontWeight: 'var(--font-weight-medium)',
                    color: 'var(--text-secondary)',
                    marginBottom: 'var(--spacing-2)',
                  }}>
                    Material Photos (Proof of Delivery)
                  </label>
                  <div style={{ display: 'flex', gap: 'var(--spacing-2)', flexWrap: 'wrap' }}>
                    {grn.material_images.map((imageObj: any, index: number) => (
                      <div key={imageObj.id || index} style={{ position: 'relative', width: '150px', height: '150px' }}>
                        <img
                          src={imageObj.image_url || imageObj.image}
                          alt={`Material ${index + 1}`}
                          style={{ 
                            width: '100%', 
                            height: '100%', 
                            objectFit: 'cover', 
                            borderRadius: '4px',
                            cursor: 'pointer',
                          }}
                          onClick={() => window.open(imageObj.image_url || imageObj.image, '_blank')}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Supplier Invoice */}
              {grn.supplier_invoice_file_url && (
                <div>
                  <label style={{ 
                    display: 'block',
                    fontSize: 'var(--font-sm)',
                    fontWeight: 'var(--font-weight-medium)',
                    color: 'var(--text-secondary)',
                    marginBottom: 'var(--spacing-2)',
                  }}>
                    Supplier Invoice
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                    {grn.supplier_invoice_file_url.endsWith('.pdf') ? (
                      <a
                        href={grn.supplier_invoice_file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-primary"
                      >
                        View PDF Invoice
                      </a>
                    ) : (
                      <img
                        src={grn.supplier_invoice_file_url}
                        alt="Supplier Invoice"
                        style={{ 
                          maxWidth: '300px', 
                          maxHeight: '300px', 
                          objectFit: 'contain', 
                          borderRadius: '4px',
                          cursor: 'pointer',
                        }}
                        onClick={() => window.open(grn.supplier_invoice_file_url!, '_blank')}
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Invoice Delivery Status */}
              <div>
                <label style={{ 
                  display: 'block',
                  fontSize: 'var(--font-sm)',
                  fontWeight: 'var(--font-weight-medium)',
                  color: 'var(--text-secondary)',
                  marginBottom: 'var(--spacing-2)',
                }}>
                  Invoice Delivery Status
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)' }}>
                  <span className={`badge ${grn.invoice_delivery_status === 'delivered' ? 'badge-success' : 'badge-warning'}`}>
                    {grn.invoice_delivery_status === 'delivered' 
                      ? 'Invoice Delivered to Office' 
                      : 'Invoice Not Delivered to Office'}
                  </span>
                  {grn.invoice_delivery_status === 'not_delivered' && canMarkInvoice && (
                    <Button
                      variant="primary"
                      onClick={() => markInvoiceDeliveredMutation.mutate()}
                      disabled={markInvoiceDeliveredMutation.isPending}
                    >
                      {markInvoiceDeliveredMutation.isPending ? 'Processing...' : 'Mark Invoice as Delivered to Office'}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* Items Section - Unified */}
        <div className="card">
          <h3 style={{ 
            fontSize: 'var(--font-lg)',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--text-primary)',
            margin: 0,
            marginBottom: 'var(--spacing-4)',
          }}>
            Received Items
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Ordered Qty</th>
                  <th>Received Qty</th>
                  <th>Rejected Qty</th>
                  <th>Quality Status</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {grn.items && grn.items.length > 0 ? (
                  grn.items.map((item) => (
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
                        <div style={{ color: 'var(--text-primary)' }}>{item.ordered_quantity}</div>
                      </td>
                      <td>
                        <div style={{ 
                          color: 'var(--color-success)',
                          fontWeight: 'var(--font-weight-semibold)',
                        }}>
                          {item.received_quantity}
                        </div>
                      </td>
                      <td>
                        <div style={{ color: 'var(--color-error)' }}>{item.rejected_quantity}</div>
                      </td>
                      <td>
                        <span className={`badge ${qualityStatusColors[item.quality_status] || 'badge-info'}`}>
                          {qualityStatusLabels[item.quality_status] || item.quality_status}
                        </span>
                      </td>
                      <td>
                        <div style={{ 
                          fontSize: 'var(--font-sm)',
                          color: 'var(--text-secondary)',
                        }}>
                          {item.notes || '-'}
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
                Total Items
              </label>
              <p style={{ 
                fontSize: 'var(--font-2xl)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'var(--text-primary)',
                margin: 0,
              }}>
                {grn.total_items || 0}
              </p>
            </div>
            <div>
              <label style={{ 
                display: 'block',
                fontSize: 'var(--font-sm)',
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--text-secondary)',
                marginBottom: 'var(--spacing-2)',
              }}>
                Total Received Quantity
              </label>
              <p style={{ 
                fontSize: 'var(--font-2xl)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'var(--color-success)',
                margin: 0,
              }}>
                {grn.total_received_quantity || 0}
              </p>
            </div>
            <div>
              <label style={{ 
                display: 'block',
                fontSize: 'var(--font-sm)',
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--text-secondary)',
                marginBottom: 'var(--spacing-2)',
              }}>
                Created At
              </label>
              <p style={{ 
                fontSize: 'var(--font-base)',
                color: 'var(--text-primary)',
                margin: 0,
              }}>
                {new Date(grn.created_at).toLocaleDateString('en-US')}
              </p>
            </div>
          </div>
        </div>

        {/* Actions - Unified */}
        <div className="flex gap-3">
          {grn.invoices && grn.invoices.length > 0 ? (
            <Link 
              href={`/purchase-invoices/${grn.invoices[0].id}`}
              className="btn btn-primary"
            >
              View Invoice
            </Link>
          ) : (
            purchaseOrder && purchaseOrder.status === 'approved' && canCreateInvoicePerm && (
              <button
                onClick={() => {
                  const guard = canCreateInvoice(purchaseOrder.status);
                  if (!guard.canProceed) {
                    toast(guard.reason || 'Cannot create invoice', 'error');
                    return;
                  }
                  if (guard.warning) {
                    if (!confirm(guard.warning + '\n\nDo you want to continue?')) {
                      return;
                    }
                  }
                  router.push(`/purchase-invoices/new?purchase_order_id=${purchaseOrder.id}&grn_id=${id}`);
                }}
                className="btn btn-primary"
                title={!canCreateInvoicePerm ? 'You do not have permission to create invoice' : ''}
              >
                Create Invoice
              </button>
            )
          )}
        </div>
      </div>
    </MainLayout>
  );
}

