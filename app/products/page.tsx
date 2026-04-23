'use client';

import { useState, useRef } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi } from '@/lib/api/products';
import { Product } from '@/types';
import Link from 'next/link';
import { toast } from '@/lib/hooks/use-toast';
import { confirm } from '@/lib/hooks/use-toast';
import { useAuth } from '@/lib/hooks/use-auth';
import { usePermissions } from '@/lib/hooks/use-permissions';
import FilterPanel, { FilterField } from '@/components/ui/FilterPanel';
import FilterTags from '@/components/ui/FilterTags';
import { Button, TextField, Checkbox, Loader, Badge } from '@/components/ui';
import { formatPrice } from '@/lib/utils/format';
import BilingualName from '@/components/ui/BilingualName';
import { useT } from '@/lib/i18n/useT';

const statusColors: Record<string, string> = {
  active: 'badge-success',
  inactive: 'badge-error',
  archived: 'badge-info',
};

export default function ProductsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [isImporting, setIsImporting] = useState(false);
  const importFileRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const t = useT();
  const { hasPermission } = usePermissions();
  const isSuperuser = user?.is_superuser ?? false;
  const isAdmin = isSuperuser || user?.role === 'super_admin' || user?.is_staff;
  const canCreate = isSuperuser || (hasPermission('product', 'create') ?? false);
  const canDelete = isSuperuser;

  const { data, isLoading, error } = useQuery({
    queryKey: ['products', page, search, filters],
    queryFn: () => productsApi.getAll({ page, search, ...filters }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => productsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast('Product deleted', 'success');
    },
    onError: () => toast('Failed to delete product', 'error'),
  });

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setIsImporting(true);
    try {
      const result = await productsApi.importExcel(file);
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast(`Import done: ${result.created} created, ${result.updated} updated, ${result.skipped} skipped`, 'success');
    } catch {
      toast('Import failed', 'error');
    } finally {
      setIsImporting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (await confirm('Delete this product?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedItems.size) return;
    if (!await confirm(`Delete ${selectedItems.size} selected products?`)) return;
    for (const id of selectedItems) {
      await productsApi.delete(id).catch(() => {});
    }
    queryClient.invalidateQueries({ queryKey: ['products'] });
    setSelectedItems(new Set());
    toast(`Deleted ${selectedItems.size} products`, 'success');
  };

  const filterFields: FilterField[] = [
    { name: 'name', label: 'Name', type: 'text', group: 'Product Info' },
    { name: 'code', label: 'Code', type: 'text', group: 'Product Info' },
    { name: 'category', label: 'Category', type: 'text', group: 'Product Info' },
    { name: 'brand', label: 'Brand', type: 'text', group: 'Product Info' },
    { name: 'status', label: 'Status', type: 'select', group: 'Status',
      options: [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
        { value: 'archived', label: 'Archived' },
      ]
    },
    { name: 'is_active', label: 'Is Active', type: 'boolean', group: 'Status' },
    { name: 'track_stock', label: 'Track Stock', type: 'boolean', group: 'Status' },
    { name: 'unit_price_min', label: 'Min Price', type: 'number', group: 'Pricing' },
    { name: 'unit_price_max', label: 'Max Price', type: 'number', group: 'Pricing' },
    { name: 'stock_balance_min', label: 'Min Stock', type: 'number', group: 'Stock' },
    { name: 'stock_balance_max', label: 'Max Stock', type: 'number', group: 'Stock' },
  ];

  const products = data?.results ?? [];
  const totalCount = data?.count ?? 0;
  const totalPages = Math.ceil(totalCount / 20);

  const toggleSelect = (id: number) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedItems.size === products.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(products.map(p => p.id)));
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Products</h1>
            <p className="text-sm text-muted-foreground mt-1">{totalCount} total products</p>
          </div>
          <div className="flex gap-2">
            {isAdmin && (
              <>
                <input
                  ref={importFileRef}
                  type="file"
                  accept=".xlsx,.xls"
                  style={{ display: 'none' }}
                  onChange={handleImport}
                />
                <Button
                  variant="secondary"
                  onClick={() => importFileRef.current?.click()}
                  disabled={isImporting}
                  isLoading={isImporting}
                >
                  Import Excel
                </Button>
              </>
            )}
            {canCreate && (
              <Link href="/products/new">
                <Button variant="primary">+ New Product</Button>
              </Link>
            )}
          </div>
        </div>

        <div className="flex gap-4 items-start">
          <div className="flex-1">
            <TextField
              placeholder="Search products..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <FilterPanel
            fields={filterFields}
            filters={filters}
            onFilterChange={(f) => { setFilters(f); setPage(1); }}
            onReset={() => { setFilters({}); setPage(1); }}
          />
        </div>

        <FilterTags filters={filters} fields={filterFields} onRemoveFilter={(key) => {
          setFilters(prev => { const n = { ...prev }; delete n[key]; return n; });
        }} onClearAll={() => setFilters({})} />

        {selectedItems.size > 0 && canDelete && (
          <div className="flex gap-2 items-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <span className="text-sm">{selectedItems.size} selected</span>
            <Button variant="destructive" onClick={handleBulkDelete}>Delete Selected</Button>
            <Button variant="secondary" onClick={() => setSelectedItems(new Set())}>Clear</Button>
          </div>
        )}

        {isLoading ? (
          <div className="card text-center py-12"><Loader /></div>
        ) : error ? (
          <div className="card text-center py-12">
            <p className="text-destructive">Failed to load products</p>
          </div>
        ) : products.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-muted-foreground">No products found</p>
            {canCreate && (
              <Link href="/products/new">
                <Button variant="primary" className="mt-4">Create Product</Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="card overflow-x-auto">
            <table>
              <thead>
                <tr>
                  {canDelete && (
                    <th style={{ width: 40 }}>
                      <Checkbox
                        checked={selectedItems.size === products.length && products.length > 0}
                        onChange={toggleSelectAll}
                      />
                    </th>
                  )}
                  <th>Product</th>
                  <th>Code</th>
                  <th>Category</th>
                  <th>Unit Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product: Product) => (
                  <tr key={product.id}>
                    {canDelete && (
                      <td>
                        <Checkbox
                          checked={selectedItems.has(product.id)}
                          onChange={() => toggleSelect(product.id)}
                        />
                      </td>
                    )}
                    <td>
                      <Link href={`/products/view/${product.id}`} className="text-primary hover:underline font-medium">
                        <BilingualName nameEn={product.name} nameAr={product.name_ar} />
                      </Link>
                    </td>
                    <td className="text-muted-foreground">{product.code}</td>
                    <td className="text-muted-foreground">{product.category || '—'}</td>
                    <td>{formatPrice(product.sell_price ?? product.unit_price)}</td>
                    <td>{product.track_stock ? product.stock_balance ?? 0 : '—'}</td>
                    <td>
                      <span className={`badge ${statusColors[product.status ?? ''] || 'badge-info'}`}>
                        {product.status || '—'}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <Link href={`/products/view/${product.id}`}>
                          <Button variant="secondary" size="sm">View</Button>
                        </Link>
                        {canDelete && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(product.id)}
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
