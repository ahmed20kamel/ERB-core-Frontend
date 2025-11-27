'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { goodsReceivingApi, GoodsReceivedNote } from '@/lib/api/goods-receiving';
import MainLayout from '@/components/layout/MainLayout';
import Link from 'next/link';
import { formatPrice } from '@/lib/utils/format';
import { toast } from '@/lib/hooks/use-toast';
import { confirm } from '@/lib/hooks/use-toast';
import { useAuth } from '@/lib/hooks/use-auth';
import { usePermissions } from '@/lib/hooks/use-permissions';
import FilterPanel, { FilterField } from '@/components/ui/FilterPanel';
import FilterTags from '@/components/ui/FilterTags';
import { Button, TextField, Checkbox, Loader } from '@/components/ui';

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

export default function GoodsReceivingPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [selectMode, setSelectMode] = useState<'page' | 'all'>('page');
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const isAdmin = user?.role === 'super_admin' || user?.is_staff;
  
  // Permission checks - Superuser has all permissions
  const isSuperuser = user?.is_superuser ?? false;
  const canCreate = isSuperuser || (hasPermission('goods_receiving', 'create') ?? false);
  const canView = isSuperuser || (hasPermission('goods_receiving', 'view') ?? false);
  const canDelete = isSuperuser; // Only superuser can delete

  const { data, isLoading, error } = useQuery({
    queryKey: ['goods-receiving', page, search, filters],
    queryFn: () => goodsReceivingApi.getAll({ page, search, ...filters }),
  });

  // Get all GRN IDs when selectMode is 'all'
  const { data: allGrnsData, isLoading: isLoadingAll } = useQuery({
    queryKey: ['goods-receiving', 'all-ids', search, filters],
    queryFn: async () => {
      const allIds: number[] = [];
      let currentPage = 1;
      let hasMore = true;
      
      while (hasMore) {
        const response = await goodsReceivingApi.getAll({ page: currentPage, search, ...filters });
        allIds.push(...response.results.map((g: GoodsReceivedNote) => g.id));
        hasMore = !!response.next;
        currentPage++;
        if (currentPage > 100) break; // Safety limit
      }
      return allIds;
    },
    enabled: selectMode === 'all' && isAdmin,
  });

  const filterFields: FilterField[] = [
    { name: 'grn_number', label: 'GRN Number', type: 'text', group: 'GRN Info' },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      group: 'Status',
      options: [
        { value: 'draft', label: 'Draft' },
        { value: 'partial', label: 'Partially Received' },
        { value: 'completed', label: 'Fully Received' },
        { value: 'cancelled', label: 'Cancelled' },
      ],
    },
    {
      name: 'invoice_delivery_status',
      label: 'Invoice Delivery Status',
      type: 'select',
      group: 'Invoice Status',
      options: [
        { value: 'not_delivered', label: 'Invoice Not Delivered' },
        { value: 'delivered', label: 'Invoice Delivered' },
      ],
    },
    { name: 'receipt_date_after', label: 'Receipt Date From', type: 'date', group: 'Dates' },
    { name: 'receipt_date_before', label: 'Receipt Date To', type: 'date', group: 'Dates' },
  ];

  const handleFilterChange = (newFilters: Record<string, any>) => {
    setFilters(newFilters);
    setPage(1);
  };

  const handleFilterReset = () => {
    setFilters({});
    setPage(1);
  };

  const handleRemoveFilter = (key: string) => {
    const newFilters = { ...filters };
    delete newFilters[key];
    setFilters(newFilters);
    setPage(1);
  };

  const handleClearAllFilters = () => {
    setFilters({});
    setPage(1);
  };

  const deleteMutation = useMutation({
    mutationFn: goodsReceivingApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goods-receiving'] });
      toast('GRN deleted successfully', 'success');
    },
    onError: () => {
      toast('Failed to delete GRN', 'error');
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      await Promise.all(ids.map(id => goodsReceivingApi.delete(id)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goods-receiving'] });
      const count = selectedItems.size;
      setSelectedItems(new Set());
      toast(`${count} GRN(s) deleted successfully`, 'success');
    },
    onError: () => {
      toast('Failed to delete some GRNs', 'error');
    },
  });

  const handleDelete = async (id: number) => {
    const confirmed = await confirm('Are you sure you want to delete this GRN?');
    if (confirmed) {
      deleteMutation.mutate(id);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      if (selectMode === 'page' && data?.results) {
        setSelectedItems(new Set(data.results.map((g: GoodsReceivedNote) => g.id)));
      } else if (selectMode === 'all' && allGrnsData) {
        setSelectedItems(new Set(allGrnsData));
      }
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleSelectItem = (id: number, checked: boolean) => {
    const newSelected = new Set(selectedItems);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedItems(newSelected);
  };

  const handleBulkDelete = async () => {
    if (selectedItems.size === 0) return;
    const confirmed = await confirm(`Are you sure you want to delete ${selectedItems.size} GRN(s)?`);
    if (confirmed) {
      bulkDeleteMutation.mutate(Array.from(selectedItems));
    }
  };

  // Calculate checkbox state
  const currentPageIds = data?.results?.map((g: GoodsReceivedNote) => g.id) || [];
  const allPageSelected = currentPageIds.length > 0 && currentPageIds.every(id => selectedItems.has(id));
  const somePageSelected = currentPageIds.some(id => selectedItems.has(id)) && !allPageSelected;
  
  const allSystemSelected = selectMode === 'all' && allGrnsData && 
    allGrnsData.length > 0 && 
    allGrnsData.every(id => selectedItems.has(id));
  const someSystemSelected = selectMode === 'all' && allGrnsData && 
    allGrnsData.some(id => selectedItems.has(id)) && 
    !allSystemSelected;

  const checkboxChecked = selectMode === 'page' 
    ? allPageSelected 
    : (allSystemSelected ?? false);
  const checkboxIndeterminate = selectMode === 'page'
    ? somePageSelected
    : (someSystemSelected ?? false);

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Goods Received Notes (GRN)</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage goods receiving and delivery notes
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <div className="flex items-center gap-2 border-r border-border pr-2 mr-2">
                <span className="text-xs text-muted-foreground">Select:</span>
                <Button
                  variant={selectMode === 'page' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => {
                    setSelectMode('page');
                    setSelectedItems(new Set());
                  }}
                >
                  Page
                </Button>
                <Button
                  variant={selectMode === 'all' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => {
                    setSelectMode('all');
                    setSelectedItems(new Set());
                  }}
                >
                  All
                </Button>
              </div>
            )}
            {isAdmin && selectedItems.size > 0 && (
              <Button
                variant="destructive"
                onClick={handleBulkDelete}
                disabled={bulkDeleteMutation.isPending}
                isLoading={bulkDeleteMutation.isPending}
              >
                {bulkDeleteMutation.isPending ? 'Deleting...' : `Delete ${selectedItems.size}`}
              </Button>
            )}
            {canCreate && (
              <Link href="/goods-receiving/new">
                <Button variant="primary">Create GRN</Button>
              </Link>
            )}
          </div>
        </div>

        {/* Search and Filters */}
        <div className="card flex items-center gap-4">
          <TextField
            type="text"
            placeholder="Search by GRN number, PO number, or notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 max-w-md"
          />
          <FilterPanel
            fields={filterFields}
            filters={filters}
            onFilterChange={handleFilterChange}
            onReset={handleFilterReset}
            saveKey="goods-receiving"
          />
        </div>

        {/* Filter Tags */}
        {Object.keys(filters).length > 0 && (
          <FilterTags
            filters={filters}
            fields={filterFields}
            onRemoveFilter={handleRemoveFilter}
            onClearAll={handleClearAllFilters}
          />
        )}

        {/* Content */}
        {isLoading ? (
          <div className="card text-center py-12">
            <Loader className="mx-auto mb-4" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        ) : error ? (
          <div className="card border-destructive bg-destructive/10">
            <p className="text-destructive text-sm">Error loading GRNs. Please try again.</p>
          </div>
        ) : !data || !data.results || data.results.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-muted-foreground">No GRNs found</p>
          </div>
        ) : (
          <>
            <div className="card p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table>
                  <thead>
                    <tr>
                      {isAdmin && (
                        <th className="w-12">
                          <Checkbox
                            checked={checkboxChecked || false}
                            ref={(input) => {
                              if (input) input.indeterminate = checkboxIndeterminate || false;
                            }}
                            onChange={(e) => handleSelectAll(e.target.checked)}
                            disabled={selectMode === 'all' && isLoadingAll}
                            title={selectMode === 'page' ? 'Select all in page' : 'Select all in system'}
                          />
                        </th>
                      )}
                      <th>GRN Number</th>
                      <th>Purchase Order</th>
                      <th>Receipt Date</th>
                      <th>Status</th>
                      <th>Invoice Delivery Status</th>
                      <th>Received By</th>
                      <th>Total Items</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.results.map((grn: GoodsReceivedNote) => (
                      <tr key={grn.id}>
                        {isAdmin && (
                          <td>
                            <Checkbox
                              checked={selectedItems.has(grn.id)}
                              onChange={(e) => handleSelectItem(grn.id, e.target.checked)}
                            />
                          </td>
                        )}
                        <td>
                          <div className="font-medium text-foreground">{grn.grn_number}</div>
                        </td>
                        <td>
                          <div className="text-foreground">
                            {typeof grn.purchase_order === 'object'
                              ? grn.purchase_order.order_number
                              : 'N/A'}
                          </div>
                        </td>
                        <td>
                          <div className="text-muted-foreground">
                            {new Date(grn.receipt_date).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${statusColors[grn.status] || 'badge-info'}`}>
                            {statusLabels[grn.status] || grn.status}
                          </span>
                        </td>
                        <td>
                          {grn.invoice_delivery_status === 'delivered' ? (
                            <span className="badge badge-success">Invoice Delivered</span>
                          ) : (
                            <span className="badge badge-warning">Invoice Not Delivered</span>
                          )}
                        </td>
                        <td>
                          <div className="text-foreground">{grn.received_by_name || 'N/A'}</div>
                        </td>
                        <td>
                          <div className="text-foreground">{grn.total_items || 0}</div>
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            {canView && (
                              <Link href={`/goods-receiving/${grn.id}`}>
                                <Button variant="view" size="sm">View</Button>
                              </Link>
                            )}
                            {canDelete && (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDelete(grn.id)}
                                disabled={deleteMutation.isPending}
                                isLoading={deleteMutation.isPending}
                                title={!canDelete ? 'You do not have permission to delete' : ''}
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
            </div>

            {/* Pagination */}
            {data && data.count > 50 && (
              <div className="flex items-center justify-between card">
                <div className="text-sm text-muted-foreground">
                  Showing {((page - 1) * 50) + 1} to {Math.min(page * 50, data.count)} of {data.count} GRNs
                  {selectMode === 'all' && selectedItems.size > 0 && (
                    <span className="ml-2 text-foreground font-medium">
                      ({selectedItems.size} selected)
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={!data.previous || page === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setPage(p => p + 1)}
                    disabled={!data.next}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </MainLayout>
  );
}
