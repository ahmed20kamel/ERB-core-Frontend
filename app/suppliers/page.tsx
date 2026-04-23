'use client';

import { useState, useRef } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { suppliersApi } from '@/lib/api/suppliers';
import { Supplier } from '@/types';
import Link from 'next/link';
import { toast } from '@/lib/hooks/use-toast';
import { confirm } from '@/lib/hooks/use-toast';
import { useAuth } from '@/lib/hooks/use-auth';
import FilterPanel, { FilterField } from '@/components/ui/FilterPanel';
import FilterTags from '@/components/ui/FilterTags';
import { Button, TextField, Checkbox, Loader, Badge } from '@/components/ui';
import { exportToExcel, fetchAllPages } from '@/lib/utils/export-excel';
import BilingualName from '@/components/ui/BilingualName';
import { useT } from '@/lib/i18n/useT';

export default function SuppliersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [selectMode, setSelectMode] = useState<'page' | 'all'>('page');
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const importFileRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const t = useT();
  const isSuperuser = user?.is_superuser ?? false;
  const isAdmin = isSuperuser || user?.role === 'super_admin' || user?.is_staff;

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const allSuppliers = await fetchAllPages<Supplier>(
        (p, ps) => suppliersApi.getAll({ page: p, page_size: ps, search, ...filters }),
      );
      exportToExcel<Supplier>(
        allSuppliers,
        [
          { header: 'Supplier Number',  key: 'supplier_number',  width: 18 },
          { header: 'Business Name',    key: 'business_name',    width: 40 },
          { header: 'Contact Person',   key: 'contact_person',   width: 25 },
          { header: 'Phone',            key: 'phone',            width: 18 },
          { header: 'Mobile',           key: 'mobile',           width: 18 },
          { header: 'Email',            key: 'email',            width: 30 },
          { header: 'Address',          key: 'address',          width: 40 },
          { header: 'City',             key: 'city',             width: 15 },
          { header: 'Country',          key: 'country',          width: 15 },
          { header: 'TRN',              key: 'trn',              width: 18 },
          { header: 'Bank Name',        key: 'bank_name',        width: 20 },
          { header: 'Bank Account',     key: 'bank_account',     width: 20 },
          { header: 'Status',           key: 'status',           width: 12 },
          { header: 'Active',           key: (r) => r.is_active ? 'Yes' : 'No', width: 10 },
          { header: 'Description',      key: 'description',      width: 40 },
          { header: 'Notes',            key: 'notes',            width: 40 },
        ],
        `Suppliers_Export_${new Date().toISOString().slice(0, 10)}`,
        'Suppliers',
      );
      toast(`Exported ${allSuppliers.length} suppliers`, 'success');
    } catch {
      toast('Export failed', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setIsImporting(true);
    try {
      const result = await suppliersApi.importExcel(file);
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast(`Import done: ${result.created} created, ${result.updated} updated, ${result.skipped} skipped`, 'success');
    } catch {
      toast('Import failed', 'error');
    } finally {
      setIsImporting(false);
    }
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ['suppliers', page, search, filters],
    queryFn: () => suppliersApi.getAll({ page, search, ...filters }),
  });

  // Get all supplier IDs when selectMode is 'all'
  const { data: allSuppliersData, isLoading: isLoadingAll } = useQuery({
    queryKey: ['suppliers', 'all-ids', search, filters],
    queryFn: async () => {
      const allIds: number[] = [];
      let currentPage = 1;
      let hasMore = true;
      
      while (hasMore) {
        const response = await suppliersApi.getAll({ page: currentPage, search, ...filters });
        allIds.push(...response.results.map((s: Supplier) => s.id));
        hasMore = !!response.next;
        currentPage++;
        if (currentPage > 100) break; // Safety limit
      }
      return allIds;
    },
    enabled: selectMode === 'all' && isAdmin,
  });

  const filterFields: FilterField[] = [
    // Supplier Info
    { name: 'name', label: 'Name', type: 'text', group: 'Supplier Info' },
    { name: 'business_name', label: 'Business Name', type: 'text', group: 'Supplier Info' },
    { name: 'supplier_number', label: 'Supplier Number', type: 'text', group: 'Supplier Info' },
    { name: 'contact_person', label: 'Contact Person', type: 'text', group: 'Supplier Info' },
    // Contact
    { name: 'email', label: 'Email', type: 'text', group: 'Contact' },
    { name: 'phone', label: 'Phone', type: 'text', group: 'Contact' },
    { name: 'city', label: 'City', type: 'text', group: 'Contact' },
    { name: 'country', label: 'Country', type: 'text', group: 'Contact' },
    // Settings
    {
      name: 'currency',
      label: 'Currency',
      type: 'select',
      group: 'Settings',
      options: [
        { value: 'AED', label: 'AED - UAE Dirham' },
      ],
    },
    { name: 'is_active', label: 'Is Active', type: 'boolean', group: 'Settings' },
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
    mutationFn: suppliersApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast('Supplier deleted successfully', 'success');
    },
    onError: () => {
      toast('Failed to delete supplier', 'error');
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      await Promise.all(ids.map(id => suppliersApi.delete(id)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      const count = selectedItems.size;
      setSelectedItems(new Set());
      toast(`${count} suppliers deleted successfully`, 'success');
    },
    onError: () => {
      toast('Failed to delete some suppliers', 'error');
    },
  });

  const handleDelete = async (id: number) => {
    const confirmed = await confirm('Are you sure you want to delete this supplier?');
    if (confirmed) {
      deleteMutation.mutate(id);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      if (selectMode === 'page' && data?.results) {
        // Select all items in current page
        setSelectedItems(new Set(data.results.map((s: Supplier) => s.id)));
      } else if (selectMode === 'all' && allSuppliersData) {
        // Select all items in system
        setSelectedItems(new Set(allSuppliersData));
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
    const confirmed = await confirm(`Are you sure you want to delete ${selectedItems.size} supplier(s)?`);
    if (confirmed) {
      bulkDeleteMutation.mutate(Array.from(selectedItems));
    }
  };

  // Calculate checkbox state
  const currentPageIds = data?.results?.map((s: Supplier) => s.id) || [];
  const allPageSelected = currentPageIds.length > 0 && currentPageIds.every(id => selectedItems.has(id));
  const somePageSelected = currentPageIds.some(id => selectedItems.has(id)) && !allPageSelected;
  
  const allSystemSelected = selectMode === 'all' && allSuppliersData && 
    allSuppliersData.length > 0 && 
    allSuppliersData.every(id => selectedItems.has(id));
  const someSystemSelected = selectMode === 'all' && allSuppliersData && 
    allSuppliersData.some(id => selectedItems.has(id)) && 
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
            <h1 className="text-2xl font-semibold text-foreground">{t('page', 'suppliers')}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {t('page', 'suppliersSubtitle')}
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
            {user?.is_superuser && selectedItems.size > 0 && (
              <Button
                variant="destructive"
                onClick={handleBulkDelete}
                disabled={bulkDeleteMutation.isPending}
                isLoading={bulkDeleteMutation.isPending}
              >
                {bulkDeleteMutation.isPending ? t('btn', 'deleting') : `${t('btn', 'delete')} ${selectedItems.size}`}
              </Button>
            )}
            <Button
              variant="secondary"
              onClick={handleExport}
              isLoading={isExporting}
              disabled={isExporting}
            >
              {isExporting ? t('btn', 'exporting') : `⬇ ${t('btn', 'export')}`}
            </Button>
            {isAdmin && (
              <>
                <input
                  ref={importFileRef}
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={handleImport}
                />
                <Button
                  variant="secondary"
                  onClick={() => importFileRef.current?.click()}
                  isLoading={isImporting}
                  disabled={isImporting}
                >
                  {isImporting ? t('btn', 'importing') : `⬆ ${t('btn', 'import')}`}
                </Button>
              </>
            )}
            <Link href="/suppliers/new">
              <Button variant="primary">{t('btn', 'addSupplier')}</Button>
            </Link>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="card flex items-center gap-4">
          <TextField
            type="text"
            placeholder={t('misc', 'searchSuppliers')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 max-w-md"
          />
          <FilterPanel
            fields={filterFields}
            filters={filters}
            onFilterChange={handleFilterChange}
            onReset={handleFilterReset}
            saveKey="suppliers"
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
            <p className="text-muted-foreground">{t('empty', 'noSuppliers')}</p>
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
                              if (input) input.indeterminate = checkboxIndeterminate ?? false;
                            }}
                            onChange={(e) => handleSelectAll(e.target.checked)}
                            disabled={selectMode === 'all' && isLoadingAll}
                            title={selectMode === 'page' ? 'Select all in page' : 'Select all in system'}
                          />
                        </th>
                      )}
                      <th>{t('col', 'name')}</th>
                      <th>{t('col', 'email')}</th>
                      <th>{t('col', 'phone')}</th>
                      <th>{t('col', 'status')}</th>
                      <th>{t('col', 'actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.results.map((supplier: Supplier) => (
                      <tr key={supplier.id}>
                        {isAdmin && (
                          <td>
                            <Checkbox
                              checked={selectedItems.has(supplier.id)}
                              onChange={(e) => handleSelectItem(supplier.id, e.target.checked)}
                            />
                          </td>
                        )}
                        <td>
                          <BilingualName
                            nameEn={supplier.business_name || supplier.name}
                            nameAr={supplier.business_name_ar}
                          />
                        </td>
                        <td>
                          <div className="text-muted-foreground">{supplier.email}</div>
                        </td>
                        <td>
                          <div className="text-muted-foreground">{supplier.phone}</div>
                        </td>
                        <td>
                          <Badge
                            variant={supplier.is_active ? 'success' : 'error'}
                          >
                            {supplier.is_active ? t('status', 'active') : t('status', 'inactive')}
                          </Badge>
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            <Link href={`/suppliers/view/${supplier.id}`}>
                              <Button variant="view" size="sm">{t('btn', 'view')}</Button>
                            </Link>
                            <Link href={`/suppliers/${supplier.id}`}>
                              <Button variant="edit" size="sm">{t('btn', 'edit')}</Button>
                            </Link>
                            {user?.is_superuser && (
                              <Button
                                variant="delete"
                                size="sm"
                                onClick={() => handleDelete(supplier.id)}
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
                  {t('misc', 'showing')} {((page - 1) * 50) + 1} {t('misc', 'pageTo')} {Math.min(page * 50, data.count)} {t('misc', 'pageOf')} {data.count} {t('page', 'suppliers').toLowerCase()}
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
    </MainLayout>
  );
}
