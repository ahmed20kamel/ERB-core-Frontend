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
import type { PurchaseOrder } from '@/types';
import Image from 'next/image';

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


const PrintableLPO = ({ order }: { order: PurchaseOrder }) => {
  const company = {
    name: 'PRINT EDIT TRADING LLC',
    address: 'P.O. Box 12345, Dubai, UAE',
    phone: '+971 4 123 4567',
    email: 'info@printedit.ae',
    trn: '100123456789012'
  };

  return (
    <div className="print-document">
      <header className="print-header">
        <div className="company-logo">
          <Image src="/logo-dark.png" alt="Company Logo" width={140} height={40} />
        </div>
        <div className="company-details">
          <h2>{company.name}</h2>
          <p>{company.address}</p>
          <p>Phone: {company.phone} | Email: {company.email}</p>
          <p>TRN: {company.trn}</p>
        </div>
      </header>

      <div className="lpo-title">
        <h1>PURCHASE ORDER</h1>
      </div>

      <div className="lpo-meta-info">
        <div className="lpo-meta-item">
          <strong>PO Number:</strong> {order.order_number}
        </div>
        <div className="lpo-meta-item">
          <strong>PO Date:</strong> {new Date(order.order_date).toLocaleDateString('en-GB')}
        </div>
        <div className="lpo-meta-item">
          <strong>Status:</strong> <span className="status-text">{statusLabels[order.status]}</span>
        </div>
      </div>

      <div className="lpo-parties">
        <div className="card vendor-info">
          <h3>VENDOR</h3>
          <p><strong>{typeof order.supplier === 'object' ? order.supplier.name : 'N/A'}</strong></p>
          <p>{typeof order.supplier === 'object' ? order.supplier.address : ''}</p>
          <p>{typeof order.supplier === 'object' ? order.supplier.phone : ''}</p>
          <p>{typeof order.supplier === 'object' ? order.supplier.email : ''}</p>
        </div>
        <div className="card ship-to-info">
          <h3>SHIP TO</h3>
          <p><strong>PRINT EDIT TRADING LLC</strong></p>
          <p>Attn: {order.created_by_name}</p>
          <p>{order.delivery_address || company.address}</p>
          <p>Delivery Date: {order.delivery_date ? new Date(order.delivery_date).toLocaleDateString('en-GB') : 'As per agreement'}</p>
        </div>
      </div>

      <div className="lpo-items">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Item Description</th>
              <th>Qty</th>
              <th>Unit Price</th>
              <th>Discount</th>
              <th>Tax</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, index) => (
              <tr key={item.id}>
                <td>{index + 1}</td>
                <td>
                  <strong>{item.product?.name || 'N/A'}</strong>
                  <br />
                  <span className="item-code">{item.product?.code || ''}</span>
                </td>
                <td className="num">{item.quantity}</td>
                <td className="num">{formatPrice(item.unit_price)}</td>
                <td className="num">{item.discount || 0}%</td>
                <td className="num">{item.tax_rate || 0}%</td>
                <td className="num">{formatPrice(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="lpo-summary">
        <div className="summary-notes">
          {order.notes && (
            <>
              <strong>Notes:</strong>
              <p>{order.notes}</p>
            </>
          )}
        </div>
        <div className="summary-totals">
          <div className="total-row">
            <span>Subtotal</span>
            <span>{formatPrice(order.subtotal)}</span>
          </div>
          <div className="total-row">
            <span>Discount</span>
            <span>-{formatPrice(order.discount)}</span>
          </div>
          <div className="total-row">
            <span>Tax</span>
            <span>{formatPrice(order.tax_amount)}</span>
          </div>
          <div className="total-row grand-total">
            <span>TOTAL</span>
            <span>{formatPrice(order.total)}</span>
          </div>
        </div>
      </div>
      
      <div className="lpo-terms">
        <div className="card">
          <h3>Terms & Conditions</h3>
          {order.terms_and_conditions && (
             <div className="terms-content">
               {order.terms_and_conditions.split('\n').map((line, i) => <p key={i}>{line}</p>)}
             </div>
           )}
          <p><strong>Payment Terms:</strong> {order.payment_terms || 'As per agreement'}</p>
          <p><strong>Delivery Terms:</strong> {order.delivery_terms || 'As per agreement'}</p>
        </div>
      </div>

      <footer className="lpo-footer">
        <div className="signature-area">
          <div className="signature-line"></div>
          <strong>Authorized Signature</strong>
          <p>PRINT EDIT TRADING LLC</p>
        </div>
        <div className="footer-thank-you">
          <p>Thank you for your business!</p>
        </div>
      </footer>
       <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 1cm;
          }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .no-print {
            display: none !important;
          }
          .print-document {
            display: block !important;
            font-family: 'Arial', sans-serif;
            font-size: 10px;
            color: #000;
            background: #fff;
          }
          .print-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            padding-bottom: 12px;
            border-bottom: 2px solid #000;
            margin-bottom: 12px;
          }
          .company-logo {
            flex-shrink: 0;
          }
          .company-details {
            text-align: right;
          }
          .company-details h2 {
            font-size: 16px;
            margin: 0;
            font-weight: bold;
          }
          .company-details p {
            margin: 1px 0 0;
            font-size: 9.5px;
          }
          .lpo-title {
            text-align: center;
            margin: 16px 0;
          }
          .lpo-title h1 {
            font-size: 24px;
            font-weight: bold;
            display: inline-block;
            padding: 4px 12px;
            border: 2px solid #000;
            border-radius: 8px;
            margin: 0;
          }
          .lpo-meta-info {
            display: flex;
            justify-content: space-around;
            background-color: #f2f2f2;
            padding: 6px;
            border-radius: 4px;
            margin-bottom: 16px;
          }
          .lpo-meta-item {
            font-size: 10.5px;
          }
          .status-text {
            font-weight: bold;
          }
          .lpo-parties {
            display: flex;
            gap: 16px;
            margin-bottom: 16px;
          }
          .lpo-parties .card {
            flex: 1;
            padding: 10px;
            border-radius: 4px;
            border: 1px solid #ccc;
          }
          .lpo-parties h3 {
            font-size: 11px;
            font-weight: bold;
            margin: 0 0 6px;
            border-bottom: 1px solid #ccc;
            padding-bottom: 4px;
          }
          .lpo-parties p {
            margin: 0 0 4px;
            font-size: 9.5px;
          }
          .lpo-items table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10px;
          }
          .lpo-items th, .lpo-items td {
            border: 1px solid #999;
            padding: 5px;
            text-align: left;
            vertical-align: top;
          }
          .lpo-items th {
            font-weight: bold;
            background-color: #f2f2f2;
            text-align: center;
          }
          .lpo-items .num {
            text-align: right;
          }
          .lpo-items .item-code {
            color: #555;
            font-size: 9px;
          }
          .lpo-summary {
            margin-top: 16px;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
          }
          .summary-notes {
            flex: 1;
            font-size: 9px;
          }
          .summary-totals {
            width: 40%;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            padding: 5px 8px;
            font-size: 10.5px;
          }
          .total-row span:first-child {
            font-weight: medium;
            color: #333;
          }
          .total-row span:last-child {
            font-weight: bold;
          }
          .total-row.grand-total {
            background-color: #f2f2f2;
            font-weight: bold;
            font-size: 12px;
            border-top: 2px solid #000;
          }
          .lpo-terms {
            margin-top: 20px;
          }
          .lpo-terms .card {
            border: 1px solid #ccc;
            padding: 10px;
          }
          .lpo-terms h3 {
             font-size: 11px;
            font-weight: bold;
            margin: 0 0 6px;
          }
          .lpo-terms p {
            margin: 0 0 4px;
            font-size: 9.5px;
          }
          .terms-content {
            font-size: 9px;
            margin-bottom: 8px;
            max-height: 100px;
            overflow: hidden;
          }
          .lpo-footer {
            margin-top: 40px;
            padding-top: 10px;
            border-top: 1px solid #ccc;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            page-break-inside: avoid;
          }
          .signature-area {
            text-align: center;
          }
          .signature-line {
            border-bottom: 1px solid #000;
            height: 40px;
            margin-bottom: 6px;
          }
          .signature-area strong, .signature-area p {
            font-size: 10px;
            margin: 0;
          }
          .footer-thank-you {
            font-style: italic;
            font-size: 10px;
          }
        }
        .print-document {
          display: none;
        }
      `}</style>
    </div>
  );
}


export default function PurchaseOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);

  const { data: order, isLoading } = useQuery<PurchaseOrder>({
    queryKey: ['purchase-orders', id],
    queryFn: () => purchaseOrdersApi.getById(id),
  });

  const approveMutation = useMutation({
    mutationFn: () => purchaseOrdersApi.approve(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders', id] });
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
      queryClient.invalidateQueries({ queryKey: ['purchase-orders', id] });
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
  
  const isSuperuser = user?.is_superuser ?? false;
  const canApprove = isSuperuser || (hasPermission('purchase_order', 'approve') ?? false);
  const canReject = isSuperuser || (hasPermission('purchase_order', 'reject') ?? false);
  const canUpdate = isSuperuser || (hasPermission('purchase_order', 'update') ?? false);
  const canCreateGRNPerm = isSuperuser || (hasPermission('goods_receiving', 'create') ?? false);
  const canCreateInvoicePerm = isSuperuser || (hasPermission('purchase_invoice', 'create') ?? false);
  
  const canEdit = order && canUpdate && ['draft', 'pending', 'rejected'].includes(order.status);

  if (isLoading) {
    return <MainLayout><div className="card text-center p-12"><p className="text-secondary m-0">Loading...</p></div></MainLayout>;
  }

  if (!order) {
    return <MainLayout><div className="card text-center p-12"><p className="text-secondary m-0">Purchase Order not found</p></div></MainLayout>;
  }

  return (
    <MainLayout>
      <div className="no-print">
        <div className="flex flex-col gap-6">
          {/* Header Section */}
          <div>
            <Link href="/purchase-orders" className="text-sm text-secondary hover:text-primary mb-2 inline-block">
              ← Back to Purchase Orders
            </Link>
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-semibold text-primary mb-1">
                  Purchase Order: {order.order_number}
                </h1>
                <p className="text-sm text-secondary">
                  View purchase order details and manage its lifecycle.
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

          {/* Details Card */}
          <DetailCard title="Order Information">
            <DetailField label="Supplier" value={typeof order.supplier === 'object' ? order.supplier.name : 'N/A'} />
            <DetailField label="Order Date" value={new Date(order.order_date).toLocaleDateString()} />
            {order.delivery_date && <DetailField label="Delivery Date" value={new Date(order.delivery_date).toLocaleDateString()} />}
            {order.delivery_method && <DetailField label="Delivery Method" value={order.delivery_method === 'pickup' ? 'Pick Up' : 'Delivery'} />}
            {order.purchase_request && <DetailField label="Purchase Request" value={<Link href={`/purchase-requests/${typeof order.purchase_request === 'object' ? order.purchase_request.id : order.purchase_request}`} className="text-primary hover:text-orange-500 underline">{typeof order.purchase_request === 'object' ? order.purchase_request.code : 'N/A'}</Link>} />}
            {order.approved_by_name && <DetailField label="Approved By" value={order.approved_by_name} />}
            {order.approved_at && <DetailField label="Approved At" value={new Date(order.approved_at).toLocaleDateString()} />}
            {order.payment_terms && <DetailField label="Payment Terms" value={order.payment_terms} span={3} />}
            {order.delivery_terms && <DetailField label="Delivery Terms" value={order.delivery_terms} span={3} />}
            {order.notes && <DetailField label="Notes" value={order.notes} span={3} />}
            {order.rejection_reason && <DetailField label="Rejection Reason" value={<div className="p-3 rounded-md bg-error-light border border-error"><p className="text-sm text-red-800 m-0">{order.rejection_reason}</p></div>} span={3} />}
          </DetailCard>

          {/* Items Section */}
          <DetailCard title="Products">
            <div className="col-span-3 overflow-x-auto">
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
                        <div className="font-medium">{item.product?.name || 'N/A'}</div>
                        <div className="text-xs text-secondary">{item.product?.code || ''}</div>
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

          {/* Summary */}
          <DetailCard title="Financial Summary">
            <div className="col-span-3 flex justify-end">
              <div className="w-64 flex flex-col gap-2">
                <div className="flex justify-between text-sm"><span className="text-secondary">Subtotal:</span><span className="font-semibold">{formatPrice(order.subtotal)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-secondary">Discount:</span><span className="font-semibold">{formatPrice(order.discount)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-secondary">Tax:</span><span className="font-semibold">{formatPrice(order.tax_amount)}</span></div>
                <div className="flex justify-between border-t border-primary pt-2 text-base"><span className="font-bold">Total:</span><span className="font-bold">{formatPrice(order.total)}</span></div>
              </div>
            </div>
          </DetailCard>
          
          {/* Actions */}
          <div className="flex gap-3">
            <button onClick={() => window.print()} className="btn btn-secondary">Print</button>
            {canEdit && <Link href={`/purchase-orders/${id}/edit`} className="btn btn-edit">Edit</Link>}
            {canApprove && (order.status === 'draft' || order.status === 'pending') && (
              <>
                <button onClick={() => approveMutation.mutate()} disabled={approveMutation.isPending} className="btn btn-success">
                  {approveMutation.isPending ? 'Processing...' : 'Approve'}
                </button>
                {canReject && (
                  <button onClick={() => setRejectDialogOpen(true)} disabled={rejectMutation.isPending} className="btn btn-destructive">
                    {rejectMutation.isPending ? 'Processing...' : 'Reject'}
                  </button>
                )}
              </>
            )}
            {order.status === 'approved' && (
              <>
                {canCreateGRNPerm && (
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
                  >
                    Create GRN
                  </button>
                )}
                {canCreateInvoicePerm && order.has_grn && (
                   <button
                    onClick={() => {
                      const guard = canCreateInvoice(order.status);
                      if (!guard.canProceed) {
                        toast(guard.reason || 'Cannot create invoice', 'error');
                        return;
                      }
                      if (guard.warning && !confirm(guard.warning + '\n\nDo you want to continue?')) {
                        return;
                      }
                      router.push(`/purchase-invoices/new?purchase_order_id=${id}`);
                    }}
                    className="btn btn-primary"
                  >
                    Create Invoice
                  </button>
                )}
                 {canCreateInvoicePerm && !order.has_grn && (
                  <button disabled className="btn btn-secondary" title="GRN must be created first">
                    Create Invoice (GRN Required)
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        <RejectionReasonDialog
          isOpen={rejectDialogOpen}
          onClose={() => setRejectDialogOpen(false)}
          onConfirm={(reason) => rejectMutation.mutate(reason)}
          title="Reject Purchase Order"
          message="Please provide a reason for rejecting this purchase order. This reason will be saved and visible to the creator."
        />
      </div>
      <PrintableLPO order={order} />
    </MainLayout>
  );
}

