'use client';

import { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { purchaseRequestsApi } from '@/lib/api/purchase-requests';
import { projectsApi } from '@/lib/api/projects';
import { PurchaseRequest, Project } from '@/types';
import Link from 'next/link';
import { toast } from '@/lib/hooks/use-toast';
import { confirm } from '@/lib/hooks/use-toast';
import { useAuth } from '@/lib/hooks/use-auth';
import { usePermissions } from '@/lib/hooks/use-permissions';
import FilterPanel, { FilterField } from '@/components/ui/FilterPanel';
import FilterTags from '@/components/ui/FilterTags';
import RejectionReasonDialog from '@/components/ui/RejectionReasonDialog';
import { Button, TextField, Checkbox, Badge, Loader } from '@/components/ui';
import { useT } from '@/lib/i18n/useT';

const statusColors: Record<string, string> = {
  pending: 'badge-warning',
  approved: 'badge-success',
  rejected: 'badge-error',
};

const statusLabels: Record<string, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
};

export default function PurchaseRequestsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [selectMode, setSelectMode] = useState<'page' | 'all'>('page');
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const t = useT();
  const { hasPermission } = usePermissions();
  const isAdmin = user?.role === 'super_admin' || user?.is_staff;
  
  // Permission checks - Superuser has all permissions
  const isSuperuser = user?.is_superuser ?? false;
  const canCreate = isSuperuser || (hasPermission('purchase_request', 'create') ?? false);
  const canView = isSuperuser || (hasPermission('purchase_request', 'view') ?? false);
  const canUpdate = isSuperuser || (hasPermission('purchase_request', 'update') ?? false);
  const canDelete = isSuperuser; // Only superuser can delete
  // Only Procurement Manager, Super Admin, and Superuser can approve/reject
  const canApprove = isSuperuser || ((hasPermission('purchase_request', 'approve') ?? false) && 
                     user?.role !== 'procurement_officer' && 
                     user?.role !== 'site_engineer');
  const canReject = isSuperuser || ((hasPermission('purchase_request', 'reject') ?? false) && 
                    user?.role !== 'procurement_officer' && 
                    user?.role !== 'site_engineer');

  // Fetch projects for filter dropdown
  const { data: projectsData } = useQuery({
    queryKey: ['projects-for-filter'],
    queryFn: () => projectsApi.getAll({ page: 1, page_size: 1000, is_active: true }),
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['purchase-requests', page, search, filters],
    queryFn: () => purchaseRequestsApi.getAll({ page, search, ...filters }),
  });

  // Get all request IDs when selectMode is 'all'
  const { data: allRequestsData, isLoading: isLoadingAll } = useQuery({
    queryKey: ['purchase-requests', 'all-ids', search, filters],
    queryFn: async () => {
      const allIds: number[] = [];
      let currentPage = 1;
      let hasMore = true;
      
      while (hasMore) {
        const response = await purchaseRequestsApi.getAll({ page: currentPage, search, ...filters });
        allIds.push(...response.results.map((r: PurchaseRequest) => r.id));
        hasMore = !!response.next;
        currentPage++;
        if (currentPage > 100) break; // Safety limit
      }
      return allIds;
    },
    enabled: selectMode === 'all' && isAdmin,
  });

  const filterFields: FilterField[] = [
    // Request Info
    { name: 'code', label: 'Code', type: 'text', group: 'Request Info' },
    { name: 'title', label: 'Title', type: 'text', group: 'Request Info' },
    {
      name: 'project',
      label: 'Project',
      type: 'select',
      group: 'Request Info',
      options: projectsData?.results?.map((p: Project) => ({
        value: p.id,
        label: `${p.name} (${p.code})`,
      })) || [],
    },
    { name: 'project_code', label: 'Project Code', type: 'text', group: 'Request Info' },
    // Status
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      group: 'Status',
      options: [
        { value: 'pending', label: 'Pending' },
        { value: 'approved', label: 'Approved' },
        { value: 'rejected', label: 'Rejected' },
      ],
    },
    // Dates
    { name: 'request_date_after', label: 'Request Date From', type: 'date', group: 'Dates' },
    { name: 'request_date_before', label: 'Request Date To', type: 'date', group: 'Dates' },
    { name: 'required_by_after', label: 'Required By From', type: 'date', group: 'Dates' },
    { name: 'required_by_before', label: 'Required By To', type: 'date', group: 'Dates' },
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

  const approveMutation = useMutation({
    mutationFn: purchaseRequestsApi.approve,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-requests'] });
      toast('Request approved successfully', 'success');
    },
    onError: () => {
      toast('Failed to approve request', 'error');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => purchaseRequestsApi.reject(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-requests'] });
      toast('Request rejected', 'info');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error || 'Failed to reject request';
      toast(message, 'error');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: purchaseRequestsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-requests'] });
      toast('Request deleted successfully', 'success');
    },
    onError: () => {
      toast('Failed to delete request', 'error');
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      await Promise.all(ids.map(id => purchaseRequestsApi.delete(id)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-requests'] });
      const count = selectedItems.size;
      setSelectedItems(new Set());
      toast(`${count} request(s) deleted successfully`, 'success');
    },
    onError: () => {
      toast('Failed to delete some requests', 'error');
    },
  });

  const handleApprove = async (id: number) => {
    const confirmed = await confirm('Are you sure you want to approve this request?');
    if (confirmed) {
      approveMutation.mutate(id);
    }
  };

  const handleReject = (id: number) => {
    setRejectingId(id);
    setRejectDialogOpen(true);
  };

  const handleRejectConfirm = (reason: string) => {
    if (rejectingId) {
      rejectMutation.mutate({ id: rejectingId, reason });
      setRejectDialogOpen(false);
      setRejectingId(null);
    }
  };

  const handleDelete = async (id: number) => {
    const confirmed = await confirm('Are you sure you want to delete this request?');
    if (confirmed) {
      deleteMutation.mutate(id);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      if (selectMode === 'page' && data?.results) {
        setSelectedItems(new Set(data.results.map((r: PurchaseRequest) => r.id)));
      } else if (selectMode === 'all' && allRequestsData) {
        setSelectedItems(new Set(allRequestsData));
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
    const confirmed = await confirm(`Are you sure you want to delete ${selectedItems.size} request(s)?`);
    if (confirmed) {
      bulkDeleteMutation.mutate(Array.from(selectedItems));
    }
  };

  // Calculate checkbox state
  const currentPageIds = data?.results?.map((r: PurchaseRequest) => r.id) || [];
  const allPageSelected = currentPageIds.length > 0 && currentPageIds.every(id => selectedItems.has(id));
  const somePageSelected = currentPageIds.some(id => selectedItems.has(id)) && !allPageSelected;
  
  const allSystemSelected = selectMode === 'all' && allRequestsData && 
    allRequestsData.length > 0 && 
    allRequestsData.every(id => selectedItems.has(id));
  const someSystemSelected = selectMode === 'all' && allRequestsData && 
    allRequestsData.some(id => selectedItems.has(id)) && 
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
            <h1 className="text-2xl font-semibold text-foreground">{t('page', 'purchaseRequests')}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {t('page', 'prSubtitle')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <div className="flex items-center gap-2 border-r border-border pr-2 mr-2">
                <span className="text-xs text-muted-foreground">{t('btn', 'selectAll')}:</span>
                <Button
                  variant={selectMode === 'page' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => {
                    setSelectMode('page');
                    setSelectedItems(new Set());
                  }}
                >
                  {t('btn', 'selectPage')}
                </Button>
                <Button
                  variant={selectMode === 'all' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => {
                    setSelectMode('all');
                    setSelectedItems(new Set());
                  }}
                >
                  {t('btn', 'selectAllSys')}
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
                {bulkDeleteMutation.isPending ? t('btn', 'deleting') : `${t('btn', 'delete')} ${selectedItems.size}`}
              </Button>
            )}
            <Link href="/purchase-requests/new">
              <Button variant="primary">{t('btn', 'create')} {t('page', 'purchaseRequests')}</Button>
            </Link>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="card flex items-center gap-4">
          <TextField
            type="text"
            placeholder={t('misc', 'searchPR')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 max-w-md"
          />
          <FilterPanel
            fields={filterFields}
            filters={filters}
            onFilterChange={handleFilterChange}
            onReset={handleFilterReset}
            saveKey="purchase-requests"
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
            <p className="text-muted-foreground">{t('btn', 'loading')}</p>
          </div>
        ) : error ? (
          <div className="card border-destructive bg-destructive/10">
            <p className="text-destructive text-sm">{t('toast', 'saveFailed')}</p>
          </div>
        ) : !data || !data.results || data.results.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-muted-foreground">{t('empty', 'noPR')}</p>
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
                      <th>{t('col', 'code')}</th>
                      <th>{t('col', 'project')}</th>
                      <th>{t('col', 'title')}</th>
                      <th>{t('col', 'requester')}</th>
                      <th>{t('col', 'requestDate')}</th>
                      <th>{t('col', 'requiredBy')}</th>
                      <th>{t('col', 'status')}</th>
                      <th>{t('col', 'actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.results.map((request: PurchaseRequest) => (
                      <tr key={request.id}>
                        {isAdmin && (
                          <td>
                            <Checkbox
                              checked={selectedItems.has(request.id)}
                              onChange={(e) => handleSelectItem(request.id, e.target.checked)}
                            />
                          </td>
                        )}
                        <td>
                          <div className="font-medium text-foreground">{request.code}</div>
                        </td>
                        <td>
                          <div className="text-foreground">
                            {request.project ? (
                              typeof request.project === 'object' ? (
                                <div>
                                  <div className="font-medium">{request.project.name}</div>
                                  <div className="text-xs text-muted-foreground">{request.project.code}</div>
                                </div>
                              ) : (
                                request.project_code || '—'
                              )
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="text-foreground max-w-md truncate" title={request.title}>
                            {request.title}
                          </div>
                        </td>
                        <td>
                          <div className="text-foreground">
                            {request.created_by_name || '—'}
                          </div>
                        </td>
                        <td>
                          <div className="text-muted-foreground">
                            {new Date(request.request_date).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </div>
                        </td>
                        <td>
                          <div className="text-muted-foreground">
                            {new Date(request.required_by).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </div>
                        </td>
                        <td>
                          <Badge
                            variant={
                              request.status === 'approved'
                                ? 'success'
                                : request.status === 'rejected'
                                ? 'error'
                                : request.status === 'pending'
                                ? 'warning'
                                : 'info'
                            }
                          >
                            {t('status', request.status as any) || statusLabels[request.status] || request.status}
                          </Badge>
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            {canView && (
                              <Link href={`/purchase-requests/${request.id}`}>
                                <Button variant="view" size="sm">{t('btn', 'view')}</Button>
                              </Link>
                            )}
                            {request.status === 'pending' && (
                              <>
                                {canApprove && (
                                  <Button
                                    variant="success"
                                    size="sm"
                                    onClick={() => handleApprove(request.id)}
                                    disabled={approveMutation.isPending}
                                    isLoading={approveMutation.isPending}
                                  >
                                    {t('btn', 'approve')}
                                  </Button>
                                )}
                                {canReject && (
                                  <Button
                                    variant="delete"
                                    size="sm"
                                    onClick={() => handleReject(request.id)}
                                    disabled={rejectMutation.isPending}
                                    isLoading={rejectMutation.isPending}
                                  >
                                    {t('btn', 'reject')}
                                  </Button>
                                )}
                              </>
                            )}
                            {canDelete && (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDelete(request.id)}
                                disabled={deleteMutation.isPending}
                                isLoading={deleteMutation.isPending}
                              >
                                {t('btn', 'delete')}
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
                  {t('misc', 'showing')} {((page - 1) * 50) + 1} {t('misc', 'pageTo')} {Math.min(page * 50, data.count)} {t('misc', 'pageOf')} {data.count}
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
                    {t('btn', 'previous')}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setPage(p => p + 1)}
                    disabled={!data.next}
                  >
                    {t('btn', 'next')}
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <RejectionReasonDialog
        isOpen={rejectDialogOpen}
        onClose={() => {
          setRejectDialogOpen(false);
          setRejectingId(null);
        }}
        onConfirm={handleRejectConfirm}
        title="Reject Purchase Request"
        message="Please provide a reason for rejecting this request. This reason will be saved and visible to the requester."
      />
    </MainLayout>
  );
}
