'use client';

import { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { goodsReceivingApi, GoodsReceivedNote } from '@/lib/api/goods-receiving';
import Link from 'next/link';
import { toast } from '@/lib/hooks/use-toast';
import { confirm } from '@/lib/hooks/use-toast';
import { useAuth } from '@/lib/hooks/use-auth';
import { usePermissions } from '@/lib/hooks/use-permissions';
import { Button, TextField, Loader } from '@/components/ui';
import { useT } from '@/lib/i18n/useT';

const statusColors: Record<string, string> = {
  draft: 'badge-info',
  partial: 'badge-warning',
  completed: 'badge-success',
  cancelled: 'badge-error',
};

const statusLabels: Record<string, string> = {
  draft: 'Draft',
  partial: 'Partial',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export default function GoodsReceivingPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const t = useT();
  const { hasPermission } = usePermissions();
  const isSuperuser = user?.is_superuser ?? false;
  const canCreate = isSuperuser || (hasPermission('goods_receiving', 'create') ?? false);
  const canDelete = isSuperuser;

  const { data, isLoading, error } = useQuery({
    queryKey: ['grns', page, search],
    queryFn: () => goodsReceivingApi.getAll({ page, search }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => goodsReceivingApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grns'] });
      toast('GRN deleted', 'success');
    },
    onError: () => toast('Failed to delete GRN', 'error'),
  });

  const handleDelete = async (id: number) => {
    if (await confirm('Delete this GRN?')) {
      deleteMutation.mutate(id);
    }
  };

  const grns = data?.results ?? [];
  const totalCount = data?.count ?? 0;
  const totalPages = Math.ceil(totalCount / 20);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Goods Receiving Notes</h1>
            <p className="text-sm text-muted-foreground mt-1">{totalCount} total GRNs</p>
          </div>
          {canCreate && (
            <Link href="/goods-receiving/new">
              <Button variant="primary">+ New GRN</Button>
            </Link>
          )}
        </div>

        <TextField
          placeholder="Search GRNs..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />

        {isLoading ? (
          <div className="card text-center py-12"><Loader /></div>
        ) : error ? (
          <div className="card text-center py-12">
            <p className="text-destructive">Failed to load GRNs</p>
          </div>
        ) : grns.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-muted-foreground">No goods receiving notes found</p>
            {canCreate && (
              <Link href="/goods-receiving/new">
                <Button variant="primary" className="mt-4">Create GRN</Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="card overflow-x-auto">
            <table>
              <thead>
                <tr>
                  <th>GRN Number</th>
                  <th>Purchase Order</th>
                  <th>Receipt Date</th>
                  <th>Total Items</th>
                  <th>Status</th>
                  <th>Invoice</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {grns.map((grn: GoodsReceivedNote) => (
                  <tr key={grn.id}>
                    <td className="font-mono text-sm font-semibold">{grn.grn_number}</td>
                    <td className="text-muted-foreground">
                      {typeof grn.purchase_order === 'object' && grn.purchase_order
                        ? (grn.purchase_order as any).order_number
                        : grn.purchase_order_id}
                    </td>
                    <td className="text-muted-foreground">
                      {new Date(grn.receipt_date).toLocaleDateString('en-US')}
                    </td>
                    <td>{grn.total_items ?? grn.items?.length ?? 0}</td>
                    <td>
                      <span className={`badge ${statusColors[grn.status] || 'badge-info'}`}>
                        {statusLabels[grn.status] || grn.status}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${grn.invoice_delivery_status === 'delivered' ? 'badge-success' : 'badge-warning'}`}>
                        {grn.invoice_delivery_status === 'delivered' ? 'Delivered' : 'Pending'}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <Link href={`/goods-receiving/${grn.id}`}>
                          <Button variant="secondary" size="sm">View</Button>
                        </Link>
                        <Link href={`/print/grn/${grn.id}`} target="_blank">
                          <Button variant="secondary" size="sm">Print</Button>
                        </Link>
                        {canDelete && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(grn.id)}
                          >
                            Delete
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center gap-2">
            <Button variant="secondary" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
            <span className="flex items-center px-4 text-sm text-muted-foreground">Page {page} of {totalPages}</span>
            <Button variant="secondary" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
