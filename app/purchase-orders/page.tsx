'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { purchaseOrdersApi } from '@/lib/api/purchase-orders';
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
import { PurchaseOrder } from '@/types';

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

export default function PurchaseOrdersPage() {
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
  const canCreate = isSuperuser || (hasPermission('purchase_order', 'create') ?? false);
  const canView = isSuperuser || (hasPermission('purchase_order', 'view') ?? false);
  const canUpdate = isSuperuser || (hasPermission('purchase_order', 'update') ?? false);
  const canDelete = isSuperuser; // Only superuser can delete

  const { data, isLoading, error } = useQuery({
    queryKey: ['purchase-orders', page, search, filters],
    queryFn: () => purchaseOrdersApi.getAll({ page, search: search || undefined, ...filters }),
  });

  // Get all order IDs when selectMode is 'all'
  const { data: allOrdersData, isLoading: isLoadingAll } = useQuery({
    queryKey: ['purchase-orders', 'all-ids', search, filters],
    queryFn: async () => {
      const allIds: number[] = [];
      let currentPage = 1;
      let hasMore = true;
      
      while (hasMore) {
        const response = await purchaseOrdersApi.getAll({ page: currentPage, search, ...filters });
        allIds.push(...response.results.map((o: PurchaseOrder) => o.id));
        hasMore = !!response.next;
        currentPage++;
        if (currentPage > 100) break; // Safety limit
      }
      return allIds;
    },
    enabled: selectMode === 'all' && isAdmin,
  });

  const filterFields: FilterField[] = [
    { name: 'order_number', label: 'Order Number', type: 'text', group: 'Order Info' },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      group: 'Status',
      options: [
        { value: 'draft', label: 'Draft' },
        { value: 'pending', label: 'Pending' },
        { value: 'approved', label: 'Approved' },
        { value: 'rejected', label: 'Rejected' },
        { value: 'completed', label: 'Completed' },
        { value: 'cancelled', label: 'Cancelled' },
      ],
    },
    { name: 'order_date_after', label: 'Order Date From', type: 'date', group: 'Dates' },
    { name: 'order_date_before', label: 'Order Date To', type: 'date', group: 'Dates' },
    { name: 'delivery_date_after', label: 'Delivery Date From', type: 'date', group: 'Dates' },
    { name: 'delivery_date_before', label: 'Delivery Date To', type: 'date', group: 'Dates' },
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
    mutationFn: purchaseOrdersApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      toast('Order deleted successfully', 'success');
    },
    onError: () => {
      toast('Failed to delete order', 'error');
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      await Promise.all(ids.map(id => purchaseOrdersApi.delete(id)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      const count = selectedItems.size;
      setSelectedItems(new Set());
      toast(`${count} order(s) deleted successfully`, 'success');
    },
    onError: () => {
      toast('Failed to delete some orders', 'error');
    },
  });

  const handleDelete = async (id: number) => {
    const confirmed = await confirm('Are you sure you want to delete this order?');
    if (confirmed) {
      deleteMutation.mutate(id);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      if (selectMode === 'page' && data?.results) {
        setSelectedItems(new Set(data.results.map((o: PurchaseOrder) => o.id)));
      } else if (selectMode === 'all' && allOrdersData) {
        setSelectedItems(new Set(allOrdersData));
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
    const confirmed = await confirm(`Are you sure you want to delete ${selectedItems.size} order(s)?`);
    if (confirmed) {
      bulkDeleteMutation.mutate(Array.from(selectedItems));
    }
  };

  // Calculate checkbox state
  const currentPageIds = data?.results?.map((o: PurchaseOrder) => o.id) || [];
  const allPageSelected = currentPageIds.length > 0 && currentPageIds.every(id => selectedItems.has(id));
  const somePageSelected = currentPageIds.some(id => selectedItems.has(id)) && !allPageSelected;
  
  const allSystemSelected = selectMode === 'all' && allOrdersData && 
    allOrdersData.length > 0 && 
    allOrdersData.every(id => selectedItems.has(id));
  const someSystemSelected = selectMode === 'all' && allOrdersData && 
    allOrdersData.some(id => selectedItems.has(id)) && 
    !allSystemSelected;

  const checkboxChecked = selectMode === 'page' 
    ? allPageSelected 
    : allSystemSelected;
  const checkboxIndeterminate = selectMode === 'page'
    ? somePageSelected
    : someSystemSelected;

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Purchase Orders (LPO)</h1>
            <p className="text-sm text-muted-foreground mt-1">
              View and manage purchase orders
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
              <Link href="/purchase-orders/new">
                <Button variant="primary">New Purchase Order</Button>
              </Link>
            )}
          </div>
        </div>

        {/* Search and Filters */}
        <div className="card flex items-center gap-4">
          <TextField
            type="text"
            placeholder="Search by order number, supplier name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 max-w-md"
          />
          <FilterPanel
            fields={filterFields}
            filters={filters}
            onFilterChange={handleFilterChange}
            onReset={handleFilterReset}
            saveKey="purchase-orders"
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
            <p className="text-destructive text-sm">Error loading purchase orders. Please try again.</p>
          </div>
        ) : !data || !data.results || data.results.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-muted-foreground">No purchase orders found</p>
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
                            checked={checkboxChecked}
                            ref={(input) => {
                              if (input) input.indeterminate = checkboxIndeterminate;
                            }}
                            onChange={(e) => handleSelectAll(e.target.checked)}
                            disabled={selectMode === 'all' && isLoadingAll}
                            title={selectMode === 'page' ? 'Select all in page' : 'Select all in system'}
                          />
                        </th>
                      )}
                      <th>Order Number</th>
                      <th>Supplier</th>
                      <th>Order Date</th>
                      <th>Delivery Method</th>
                      <th>Status</th>
                      <th>Total</th>
                      <th>Created By</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.results.map((order: PurchaseOrder) => (
                      <tr key={order.id}>
                        {isAdmin && (
                          <td>
                            <Checkbox
                              checked={selectedItems.has(order.id)}
                              onChange={(e) => handleSelectItem(order.id, e.target.checked)}
                            />
                          </td>
                        )}
                        <td>
                          <div className="font-medium text-foreground">{order.order_number}</div>
                        </td>
                        <td>
                          <div className="text-foreground">
                            {typeof order.supplier === 'object' ? order.supplier.name : 'N/A'}
                          </div>
                        </td>
                        <td>
                          <div className="text-muted-foreground">
                            {new Date(order.order_date).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </div>
                        </td>
                        <td>
                          <div className="text-foreground">
                            {order.delivery_method ? (
                              order.delivery_method === 'pickup' ? 'Pick Up' : 'Delivery'
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${statusColors[order.status] || 'badge-info'}`}>
                            {statusLabels[order.status] || order.status}
                          </span>
                        </td>
                        <td>
                          <div className="font-semibold text-foreground">
                            {formatPrice(order.total)}
                          </div>
                        </td>
                        <td>
                          <div className="text-muted-foreground">{order.created_by_name}</div>
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            {canView && (
                              <Link href={`/purchase-orders/${order.id}`}>
                                <Button variant="view" size="sm">View</Button>
                              </Link>
                            )}
                            {canUpdate && (order.status === 'draft' || order.status === 'pending' || order.status === 'rejected') && (
                              <Link href={`/purchase-orders/${order.id}/edit`}>
                                <Button variant="edit" size="sm">Edit</Button>
                              </Link>
                            )}
                            {canDelete && (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDelete(order.id)}
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
                  Showing {((page - 1) * 50) + 1} to {Math.min(page * 50, data.count)} of {data.count} orders
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

