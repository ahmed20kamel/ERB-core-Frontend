'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { quotationRequestsApi } from '@/lib/api/quotation-requests';
import MainLayout from '@/components/layout/MainLayout';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/use-auth';

export default function QuotationRequestDetailPage() {
  const params = useParams();
  const id = Number(params.id);
  const { user } = useAuth();

  const { data: request, isLoading } = useQuery({
    queryKey: ['quotation-requests', id],
    queryFn: () => quotationRequestsApi.getById(id),
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

  if (!request) {
    return (
      <MainLayout>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
          <div className="card" style={{ textAlign: 'center', padding: 'var(--spacing-12)' }}>
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Quotation request not found</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
        {/* Header Section - Unified */}
        <div>
          <Link 
            href="/quotation-requests" 
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
            ← Back to Quotation Requests
          </Link>
          <h1 style={{ 
            fontSize: 'var(--font-2xl)',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--text-primary)',
            margin: 0,
            marginBottom: 'var(--spacing-1)',
          }}>
            Quotation Request Details
          </h1>
          <p style={{ 
            fontSize: 'var(--font-sm)',
            color: 'var(--text-secondary)',
            margin: 0,
          }}>
            View quotation request information
          </p>
        </div>

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
                Purchase Request
              </label>
              <p style={{ 
                fontSize: 'var(--font-base)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--text-primary)',
                margin: 0,
              }}>
                {request.purchase_request?.code || 'N/A'}
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
                Supplier
              </label>
              <p style={{ 
                fontSize: 'var(--font-base)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--text-primary)',
                margin: 0,
              }}>
                {request.supplier?.name || 'N/A'}
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
                {new Date(request.created_at).toLocaleDateString('en-US')}
              </p>
            </div>
            {request.notes && (
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
                  {request.notes}
                </p>
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
            Products
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Code</th>
                  <th>Quantity</th>
                </tr>
              </thead>
              <tbody>
                {request.items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div style={{ 
                        fontWeight: 'var(--font-weight-medium)',
                        color: 'var(--text-primary)',
                      }}>
                        {item.product.name}
                      </div>
                    </td>
                    <td>
                      <div style={{ color: 'var(--text-secondary)' }}>
                        {item.product.code}
                      </div>
                    </td>
                    <td>
                      <div style={{ color: 'var(--text-primary)' }}>{item.quantity}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Actions - Unified */}
        {/* Only Procurement Officer and Super Admin can create Purchase Quotation */}
        {(user?.role === 'procurement_officer' || user?.role === 'super_admin' || user?.is_superuser) && (
          <div style={{ display: 'flex', gap: 'var(--spacing-3)' }}>
            <Link
              href={`/purchase-quotations/new?quotation_request_id=${id}`}
              className="btn btn-primary"
            >
              Create Purchase Quotation
            </Link>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
