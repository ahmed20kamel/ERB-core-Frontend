'use client';

import { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi } from '@/lib/api/products';
import { Product } from '@/types';
import Link from 'next/link';
import { toast } from '@/lib/hooks/use-toast';
import { confirm } from '@/lib/hooks/use-toast';
import { useAuth } from '@/lib/hooks/use-auth';
import FilterPanel, { FilterField } from '@/components/ui/FilterPanel';
import FilterTags from '@/components/ui/FilterTags';
import { Button, TextField, Checkbox, Loader, Badge } from '@/components/ui';

export default function ProductsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [selectMode, setSelectMode] = useState<'page' | 'all'>('page');
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isSuperuser = user?.is_superuser ?? false;
  const isAdmin = isSuperuser || user?.role === 'super_admin' || user?.is_staff;

  const { data, isLoading, error } = useQuery({
    queryKey: ['products', page, search, filters],
    queryFn: () => productsApi.getAll({ page, search, ...filters }),
  });

  // Get all product IDs when selectMode is 'all'
  const { data: allProductsData, isLoading: isLoadingAll } = useQuery({
    queryKey: ['products', 'all-ids', search, filters],
    queryFn: async () => {
      const allIds: number[] = [];
      let currentPage = 1;
      let hasMore = true;
      
      while (hasMore) {
        const response = await productsApi.getAll({ page: currentPage, search, ...filters });
        allIds.push(...response.results.map((p: Product) => p.id));
        hasMore = !!response.next;
        currentPage++;
        if (currentPage > 100) break; // Safety limit
      }
      return allIds;
    },
    enabled: selectMode === 'all' && isAdmin,
  });

  const filterFields: FilterField[] = [
    // Product Info
    { name: 'name', label: 'Name', type: 'text', group: 'Product Info' },
    { name: 'code', label: 'Code', type: 'text', group: 'Product Info' },
    { name: 'sku', label: 'SKU', type: 'text', group: 'Product Info' },
    { name: 'barcode', label: 'Barcode', type: 'text', group: 'Product Info' },
    { name: 'brand', label: 'Brand', type: 'text', group: 'Product Info' },
    { name: 'category', label: 'Category', type: 'text', group: 'Product Info' },
    // Status & Settings
    {
      name: 'unit',
      label: 'Unit',
      type: 'select',
      group: 'Status & Settings',
      options: [
        { value: 'piece', label: 'Piece' },
        { value: 'kg', label: 'Kilogram' },
        { value: 'meter', label: 'Meter' },
        { value: 'liter', label: 'Liter' },
        { value: 'box', label: 'Box' },
        { value: 'pack', label: 'Pack' },
        { value: 'ton', label: 'Ton' },
        { value: 'sqm', label: 'Square Meter' },
      ],
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      group: 'Status & Settings',
      options: [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
        { value: 'archived', label: 'Archived' },
      ],
    },
    { name: 'is_active', label: 'Is Active', type: 'boolean', group: 'Status & Settings' },
    { name: 'track_stock', label: 'Track Stock', type: 'boolean', group: 'Status & Settings' },
    // Pricing
    { name: 'unit_price', label: 'Unit Price', type: 'range', group: 'Pricing' },
    { name: 'buy_price', label: 'Buy Price', type: 'range', group: 'Pricing' },
    // Stock
    { name: 'stock_balance', label: 'Stock Balance', type: 'range', group: 'Stock' },
  ];

  const handleFilterChange = (newFilters: Record<string, any>) => {
    setFilters(newFilters);
    setPage(1); // Reset to first page when filters change
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
    mutationFn: productsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast('Product deleted successfully', 'success');
    },
    onError: () => {
      toast('Failed to delete product', 'error');
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      await Promise.all(ids.map(id => productsApi.delete(id)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      const count = selectedItems.size;
      setSelectedItems(new Set());
      toast(`${count} products deleted successfully`, 'success');
    },
    onError: () => {
      toast('Failed to delete some products', 'error');
    },
  });

  const handleDelete = async (id: number) => {
    const confirmed = await confirm('Are you sure you want to delete this product?');
    if (confirmed) {
      deleteMutation.mutate(id);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      if (selectMode === 'page' && data?.results) {
        // Select all items in current page
        setSelectedItems(new Set(data.results.map((p: Product) => p.id)));
      } else if (selectMode === 'all' && allProductsData) {
        // Select all items in system
        setSelectedItems(new Set(allProductsData));
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
    const confirmed = await confirm(`Are you sure you want to delete ${selectedItems.size} product(s)?`);
    if (confirmed) {
      bulkDeleteMutation.mutate(Array.from(selectedItems));
    }
  };

  // Calculate checkbox state
  const currentPageIds = data?.results?.map((p: Product) => p.id) || [];
  const allPageSelected = currentPageIds.length > 0 && currentPageIds.every(id => selectedItems.has(id));
  const somePageSelected = currentPageIds.some(id => selectedItems.has(id)) && !allPageSelected;
  
  const allSystemSelected = selectMode === 'all' && allProductsData && 
    allProductsData.length > 0 && 
    allProductsData.every(id => selectedItems.has(id));
  const someSystemSelected = selectMode === 'all' && allProductsData && 
    allProductsData.some(id => selectedItems.has(id)) && 
    !allSystemSelected;

  const checkboxChecked = selectMode === 'page' 
    ? allPageSelected 
    : allSystemSelected;
  const checkboxIndeterminate = selectMode === 'page'
    ? somePageSelected
    : (someSystemSelected ?? false);

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Products</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your product catalog
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
            {user?.is_superuser && selectedItems.size > 0 && (
              <Button
                variant="destructive"
                onClick={handleBulkDelete}
                disabled={bulkDeleteMutation.isPending}
                isLoading={bulkDeleteMutation.isPending}
              >
                {bulkDeleteMutation.isPending ? 'Deleting...' : `Delete ${selectedItems.size}`}
              </Button>
            )}
            <Link href="/products/new">
              <Button variant="primary">Add Product</Button>
            </Link>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="card flex items-center gap-4">
          <TextField
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 max-w-md"
          />
          <FilterPanel
            fields={filterFields}
            filters={filters}
            onFilterChange={handleFilterChange}
            onReset={handleFilterReset}
            saveKey="products"
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
            <p className="text-destructive text-sm">Error loading products. Please try again.</p>
          </div>
        ) : !data || !data.results || data.results.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-muted-foreground">No products found</p>
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
                      <th>Code</th>
                      <th>Name</th>
                      <th>Category</th>
                      <th>Unit</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.results.map((product: Product) => (
                      <tr key={product.id}>
                        {isAdmin && (
                          <td>
                            <Checkbox
                              checked={selectedItems.has(product.id)}
                              onChange={(e) => handleSelectItem(product.id, e.target.checked)}
                            />
                          </td>
                        )}
                        <td>
                          <div className="font-medium text-foreground">{product.code}</div>
                        </td>
                        <td>
                          <div className="font-medium text-foreground">{product.name}</div>
                          {product.description && (
                            <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1 max-w-xs">
                              {product.description}
                            </div>
                          )}
                        </td>
                        <td>
                          <div className="text-muted-foreground">{product.category || '-'}</div>
                        </td>
                        <td>
                          <div className="text-muted-foreground uppercase text-xs">{product.unit}</div>
                        </td>
                        <td>
                          <Badge
                            variant={product.is_active ? 'success' : 'error'}
                          >
                            {product.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            <Link href={`/products/view/${product.id}`}>
                              <Button variant="view" size="sm">View</Button>
                            </Link>
                            <Link href={`/products/${product.id}`}>
                              <Button variant="edit" size="sm">Edit</Button>
                            </Link>
                            {user?.is_superuser && (
                              <Button
                                variant="delete"
                                size="sm"
                                onClick={() => handleDelete(product.id)}
                                disabled={deleteMutation.isPending}
                                isLoading={deleteMutation.isPending}
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
                  Showing {((page - 1) * 50) + 1} to {Math.min(page * 50, data.count)} of {data.count} products
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
