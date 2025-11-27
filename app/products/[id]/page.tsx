'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi } from '@/lib/api/products';
import { suppliersApi } from '@/lib/api/suppliers';
import { ProductFormData, toProductCreateData } from '@/lib/types/form-data';
import { Product } from '@/types';
import MainLayout from '@/components/layout/MainLayout';
import Link from 'next/link';
import SearchableDropdown from '@/components/ui/SearchableDropdown';

const units = [
  { value: 'piece', label: 'Piece' },
  { value: 'pcs', label: 'Number / Pieces' },
  { value: 'kg', label: 'Kilogram' },
  { value: 'kl', label: 'Kilo' },
  { value: 'meter', label: 'Meter' },
  { value: 'lm', label: 'Linear Meter' },
  { value: 'liter', label: 'Liter' },
  { value: 'box', label: 'Box' },
  { value: 'pack', label: 'Pack' },
  { value: 'pkt', label: 'Packet' },
  { value: 'bag', label: 'Bag' },
  { value: 'roll', label: 'Roll' },
  { value: 'ctn', label: 'Carton' },
  { value: 'ton', label: 'Ton' },
  { value: 'trip', label: 'Trip' },
  { value: 'sqm', label: 'Square Meter' },
  { value: 'cbm', label: 'Cubic Metre (cbm / m3)' },
  { value: 'pump', label: 'Pump' },
  { value: 'sheet', label: 'Sheet' },
  { value: 'brd', label: 'Board' },
  { value: 'drm', label: 'Drum' },
  { value: 'doz', label: 'Dozen' },
  { value: 'ls', label: 'Lump Sum' },
  { value: 'set', label: 'Set' },
  { value: 'ream', label: 'Ream' },
];

const discountTypes = [
  { value: 'percentage', label: '%' },
  { value: 'fixed', label: 'Fixed Amount' },
];

const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'archived', label: 'Archived' },
];

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);
  const queryClient = useQueryClient();

  const { data: product, isLoading } = useQuery({
    queryKey: ['products', id],
    queryFn: () => productsApi.getById(id),
  });

  const { data: suppliers } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => suppliersApi.getAll({ page: 1 }),
  });

  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    code: '',
    sku: '',
    barcode: '',
    description: '',
    notes: '',
    internal_notes: '',
    brand: '',
    category: '',
    tags: '',
    unit: 'piece',
    supplier: undefined,
    unit_price: 0,
    buy_price: 0,
    minimum_price: 0,
    discount: 0,
    discount_type: 'percentage',
    tax1: 0,
    tax2: 0,
    track_stock: false,
    stock_balance: 0,
    low_stock_threshold: 0,
    profit_margin: 0,
    status: 'active',
    is_active: true,
  });

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        code: product.code || '',
        sku: product.sku || '',
        barcode: product.barcode || '',
        description: product.description || '',
        notes: product.notes || '',
        internal_notes: product.internal_notes || '',
        brand: product.brand || '',
        category: product.category || '',
        tags: product.tags || '',
        unit: product.unit || 'piece',
        supplier: typeof product.supplier === 'object' && product.supplier !== null 
          ? (product.supplier as any).id 
          : (product.supplier as number | undefined) || undefined,
        unit_price: product.unit_price || 0,
        buy_price: product.buy_price || 0,
        minimum_price: product.minimum_price || 0,
        discount: product.discount || 0,
        discount_type: product.discount_type || 'percentage',
        tax1: product.tax1 || 0,
        tax2: product.tax2 || 0,
        track_stock: product.track_stock ?? false,
        stock_balance: product.stock_balance || 0,
        low_stock_threshold: product.low_stock_threshold || 0,
        profit_margin: product.profit_margin || 0,
        status: product.status || 'active',
        is_active: product.is_active ?? true,
      });
    }
  }, [product]);

  const mutation = useMutation({
    mutationFn: (data: ProductFormData) => productsApi.update(id, toProductCreateData(data)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      router.push('/products');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div className="card text-center py-12">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <Link href="/products" className="text-sm text-muted-foreground hover:text-foreground mb-2 inline-block">
            ← Back to Products
          </Link>
          <h1 className="text-2xl font-semibold text-foreground">Edit Product</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Update product information
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Item Details Section */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4 text-foreground">Item Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Item SKU
                </label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Code *
                </label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full"
                />
              </div>

              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Category
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Brand
                </label>
                <input
                  type="text"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Unit Template *
                </label>
                <select
                  required
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value as Product['unit'] })}
                  className="w-full"
                >
                  {units.map((unit) => (
                    <option key={unit.value} value={unit.value}>
                      {unit.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Supplier
                </label>
                <select
                  value={formData.supplier || ''}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value ? Number(e.target.value) : undefined })}
                  className="w-full"
                >
                  <option value="">Select Supplier</option>
                  {suppliers?.results
                    .filter((s) => s.is_active)
                    .map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.business_name || supplier.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Barcode
                </label>
                <input
                  type="text"
                  value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Tags
                </label>
                <input
                  type="text"
                  placeholder="Comma-separated tags"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Pricing Details Section */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4 text-foreground">Pricing Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Purchase Price
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.buy_price}
                  onChange={(e) => setFormData({ ...formData, buy_price: Number(e.target.value) })}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Selling Price
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.unit_price}
                  onChange={(e) => setFormData({ ...formData, unit_price: Number(e.target.value) })}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Tax 1
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.tax1}
                  onChange={(e) => setFormData({ ...formData, tax1: Number(e.target.value) })}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Tax 2
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.tax2}
                  onChange={(e) => setFormData({ ...formData, tax2: Number(e.target.value) })}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Minimum Price
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.minimum_price}
                  onChange={(e) => setFormData({ ...formData, minimum_price: Number(e.target.value) })}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Discount
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.discount}
                  onChange={(e) => setFormData({ ...formData, discount: Number(e.target.value) })}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Discount Type
                </label>
                <select
                  value={formData.discount_type}
                  onChange={(e) => setFormData({ ...formData, discount_type: e.target.value as 'percentage' | 'fixed' })}
                  className="w-full"
                >
                  {discountTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Profit Margin (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.profit_margin}
                  onChange={(e) => setFormData({ ...formData, profit_margin: Number(e.target.value) })}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Inventory Management Section */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4 text-foreground">Inventory Management</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.track_stock}
                    onChange={(e) => setFormData({ ...formData, track_stock: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium text-foreground">Track Stock</span>
                </label>
              </div>

              {formData.track_stock && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Stock Balance
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.stock_balance}
                      onChange={(e) => setFormData({ ...formData, stock_balance: Number(e.target.value) })}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Low Stock Threshold
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.low_stock_threshold}
                      onChange={(e) => setFormData({ ...formData, low_stock_threshold: Number(e.target.value) })}
                      className="w-full"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* More Details Section */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4 text-foreground">More Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Internal Notes
                </label>
                <textarea
                  value={formData.internal_notes}
                  onChange={(e) => setFormData({ ...formData, internal_notes: e.target.value })}
                  rows={4}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' | 'archived' })}
                  className="w-full"
                >
                  {statusOptions.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium text-foreground">Active</span>
                </label>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={mutation.isPending}
              className="btn btn-primary"
            >
              {mutation.isPending ? 'Saving...' : 'Save Changes'}
            </button>
            <Link href="/products" className="btn btn-secondary">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </MainLayout>
  );
}
