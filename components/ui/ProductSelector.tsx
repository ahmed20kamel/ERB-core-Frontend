'use client';

import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { productsApi } from '@/lib/api/products';
import { Product } from '@/types';
import { formatPrice, formatNumber } from '@/lib/utils/format';
import CategorySelector from './CategorySelector';

interface ProductSelectorProps {
  selectedProductId: number | null;
  onProductSelect: (product: Product | null) => void;
  selectedCategory?: string;
  onCategoryChange?: (category: string) => void;
}

export default function ProductSelector({
  selectedProductId,
  onProductSelect,
  selectedCategory,
  onCategoryChange,
}: ProductSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search query - Reduced to 150ms for faster response
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 150);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch products with category filter
  const { data: productsData, isLoading } = useQuery({
    queryKey: ['products', selectedCategory, debouncedSearch],
    queryFn: async () => {
      const params: any = { page: 1, page_size: 1000 }; // Maximum page size for better performance
      if (selectedCategory) {
        params.category = selectedCategory;
      }
      // Use search parameter for server-side filtering (faster)
      if (debouncedSearch && debouncedSearch.trim()) {
        params.search = debouncedSearch.trim();
      }
      return productsApi.getAll(params);
    },
    enabled: !!selectedCategory, // Only fetch when category is selected
    staleTime: 30000, // Cache for 30 seconds
  });


  const filteredProducts = useMemo(() => {
    if (!productsData?.results) return [];
    let products = productsData.results;
    
    // Client-side filtering for instant results while typing
    // This provides immediate feedback before server search completes
    if (searchQuery && searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      products = products.filter((p) => {
        const nameMatch = p.name?.toLowerCase().includes(query);
        const codeMatch = p.code?.toLowerCase().includes(query);
        const skuMatch = p.sku?.toLowerCase().includes(query);
        const barcodeMatch = p.barcode?.toLowerCase().includes(query);
        return nameMatch || codeMatch || skuMatch || barcodeMatch;
      });
    }
    
    return products;
  }, [productsData, searchQuery]);

  const selectedProduct = useMemo(() => {
    if (!selectedProductId || !productsData?.results) return null;
    return productsData.results.find((p) => p.id === selectedProductId) || null;
  }, [selectedProductId, productsData]);

  const handleProductClick = (product: Product) => {
    onProductSelect(product);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div className="space-y-4">
      {/* Category Selector */}
      <CategorySelector
        selectedCategory={selectedCategory || ''}
        onCategoryChange={(category) => {
          onCategoryChange?.(category);
          onProductSelect(null);
          setSearchQuery('');
          setIsOpen(false);
        }}
      />

      {/* Product Searchable Dropdown */}
      {selectedCategory && (
        <div>
          <label className="form-label">
            Product * <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="Search by name, code, SKU, or barcode..."
              value={selectedProduct ? `${selectedProduct.name} (${selectedProduct.code})` : searchQuery}
              onChange={(e) => {
                if (!selectedProduct) {
                  setSearchQuery(e.target.value);
                  setIsOpen(true);
                }
              }}
              onFocus={() => {
                if (!selectedProduct) {
                  setIsOpen(true);
                }
              }}
              onClick={() => {
                if (selectedProduct) {
                  onProductSelect(null);
                  setSearchQuery('');
                }
              }}
              className="w-full"
            />
            {isLoading && (
              <div className="absolute right-3 top-2.5">
                <div className="w-4 h-4 border-2 border-[var(--brand-orange)] border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
            {selectedProduct && !isLoading && (
              <button
                type="button"
                onClick={() => {
                  onProductSelect(null);
                  setSearchQuery('');
                }}
                className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
            
            {/* Dropdown Results */}
            {isOpen && (
              <>
                {/* Invisible overlay to detect outside clicks */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsOpen(false)}
                  style={{ backgroundColor: 'transparent' }}
                />
                <div className="dropdown-container absolute z-50 w-full mt-1 max-h-60 overflow-hidden">
                {isLoading ? (
                  <div className="px-4 py-3 text-sm text-muted-foreground text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-[var(--brand-orange)] border-t-transparent rounded-full animate-spin"></div>
                      <span>Searching...</span>
                    </div>
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-muted-foreground text-center">
                    No products found{searchQuery ? ` for "${searchQuery}"` : ''}
                  </div>
                ) : (
                  <div className="max-h-60 overflow-y-auto">
                    <div className="px-3 py-2 text-xs text-muted-foreground border-b bg-[var(--table-header-bg)] sticky top-0" style={{ borderColor: 'var(--border)' }}>
                      {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} found
                    </div>
                    {filteredProducts.map((product) => (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => handleProductClick(product)}
                        className="dropdown-item w-full text-left"
                      >
                        <div className="font-medium" style={{ color: 'var(--foreground)' }}>
                          {product.name}
                        </div>
                        <div className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                          Code: {product.code} {product.sku && `| SKU: ${product.sku}`}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Product Preview */}
      {selectedProduct && (
        <div className="p-4 border rounded-md" style={{ backgroundColor: 'var(--accent)', borderColor: 'var(--border)' }}>
          <div className="flex items-start justify-between mb-3">
            <h4 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
              Product Information
            </h4>
            <button
              type="button"
              onClick={() => {
                onProductSelect(null);
                setSearchQuery('');
              }}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span style={{ color: 'var(--muted-foreground)' }}>Unit:</span>
              <span className="ml-2 font-medium" style={{ color: 'var(--foreground)' }}>
                {selectedProduct.unit || 'N/A'}
              </span>
            </div>
            <div>
              <span style={{ color: 'var(--muted-foreground)' }}>Category:</span>
              <span className="ml-2 font-medium" style={{ color: 'var(--foreground)' }}>
                {selectedProduct.category || 'N/A'}
              </span>
            </div>
            <div>
              <span style={{ color: 'var(--muted-foreground)' }}>Current Stock:</span>
              <span className="ml-2 font-medium" style={{ color: 'var(--foreground)' }}>
                {formatNumber(selectedProduct.stock_balance || 0)}
              </span>
            </div>
            <div>
              <span style={{ color: 'var(--muted-foreground)' }}>Last Price:</span>
              <span className="ml-2 font-medium" style={{ color: 'var(--foreground)' }}>
                {formatPrice(selectedProduct.buy_price || selectedProduct.unit_price || 0)}
              </span>
            </div>
            {selectedProduct.supplier && (
              <div className="col-span-2">
                <span style={{ color: 'var(--muted-foreground)' }}>Supplier:</span>
                <span className="ml-2 font-medium" style={{ color: 'var(--foreground)' }}>
                  {typeof selectedProduct.supplier === 'object'
                    ? selectedProduct.supplier.name
                    : 'N/A'}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

