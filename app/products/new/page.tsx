'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { productsApi } from '@/lib/api/products';
import { suppliersApi } from '@/lib/api/suppliers';
import MainLayout from '@/components/layout/MainLayout';
import Link from 'next/link';
import SearchableDropdown, { DropdownOption } from '@/components/ui/SearchableDropdown';
import FormField from '@/components/ui/FormField';

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

export default function NewProductPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
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
    supplier: undefined as number | undefined,
    unit_price: 0,
    buy_price: 0,
    minimum_price: 0,
    discount: 0,
    discount_type: 'percentage' as 'percentage' | 'fixed',
    tax1: 0,
    tax2: 0,
    track_stock: false,
    stock_balance: 0,
    low_stock_threshold: 0,
    profit_margin: 0,
    status: 'active' as 'active' | 'inactive' | 'archived',
    is_active: true,
  });

  const { data: suppliers } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => suppliersApi.getAll({ page: 1 }),
  });

  const mutation = useMutation({
    mutationFn: productsApi.create,
    onSuccess: () => {
      router.push('/products');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      ...formData,
      supplier: formData.supplier || undefined,
    });
  };

  return (
    <MainLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
        {/* Header Section - Unified */}
        <div>
          <Link 
            href="/products" 
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
            ← Back to Products
          </Link>
          <h1 style={{ 
            fontSize: 'var(--font-2xl)',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--text-primary)',
            margin: 0,
            marginBottom: 'var(--spacing-1)',
          }}>
            Add New Product
          </h1>
          <p style={{ 
            fontSize: 'var(--font-sm)',
            color: 'var(--text-secondary)',
            margin: 0,
          }}>
            Create a new product in your catalog
          </p>
        </div>

        {/* Form Card - Unified */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
          {/* Item Details Section */}
          <div className="card">
            <h2 style={{ 
              fontSize: 'var(--font-lg)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--text-primary)',
              margin: 0,
              marginBottom: 'var(--spacing-4)',
            }}>
              Item Details
            </h2>
            <div style={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: 'var(--spacing-4)',
            }}>
              <FormField label="Name" required>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                />
              </FormField>

              <FormField label="Item SKU">
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  className="input"
                />
              </FormField>

              <FormField label="Code" required>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="input"
                />
              </FormField>

              <div style={{ gridColumn: '1 / -1' }}>
                <FormField label="Description">
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="input"
                  />
                </FormField>
              </div>

              <FormField label="Category">
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="input"
                />
              </FormField>

              <FormField label="Brand">
                <input
                  type="text"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  className="input"
                />
              </FormField>

              <div>
                <SearchableDropdown
                  label="Unit Template"
                  required
                  options={units.map((unit) => ({
                    value: unit.value,
                    label: unit.label,
                  }))}
                  value={formData.unit}
                  onChange={(val) => setFormData({ ...formData, unit: val as any })}
                  placeholder="Select Unit"
                />
              </div>

              <div>
                <SearchableDropdown
                  label="Supplier"
                  options={[
                    { value: '', label: 'Select Supplier' },
                    ...(suppliers?.results
                      .filter((s) => s.is_active)
                      .map((supplier) => ({
                        value: supplier.id,
                        label: supplier.business_name || supplier.name,
                        searchText: `${supplier.business_name || ''} ${supplier.name || ''} ${supplier.contact_person || ''}`,
                      })) || []),
                  ]}
                  value={formData.supplier || ''}
                  onChange={(val) => setFormData({ ...formData, supplier: val ? Number(val) : null })}
                  placeholder="Select Supplier"
                  allowClear
                />
              </div>

              <FormField label="Barcode">
                <input
                  type="text"
                  value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  className="input"
                />
              </FormField>

              <FormField label="Tags">
                <input
                  type="text"
                  placeholder="Comma-separated tags"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  className="input"
                />
              </FormField>
            </div>
          </div>

          {/* Pricing Details Section */}
          <div className="card">
            <h2 style={{ 
              fontSize: 'var(--font-lg)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--text-primary)',
              margin: 0,
              marginBottom: 'var(--spacing-4)',
            }}>
              Pricing Details
            </h2>
            <div style={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: 'var(--spacing-4)',
            }}>
              <FormField label="Purchase Price">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.buy_price}
                  onChange={(e) => setFormData({ ...formData, buy_price: Number(e.target.value) })}
                  className="input"
                />
              </FormField>

              <FormField label="Selling Price">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.unit_price}
                  onChange={(e) => setFormData({ ...formData, unit_price: Number(e.target.value) })}
                  className="input"
                />
              </FormField>

              <FormField label="Tax 1">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.tax1}
                  onChange={(e) => setFormData({ ...formData, tax1: Number(e.target.value) })}
                  className="input"
                />
              </FormField>

              <FormField label="Tax 2">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.tax2}
                  onChange={(e) => setFormData({ ...formData, tax2: Number(e.target.value) })}
                  className="input"
                />
              </FormField>

              <FormField label="Minimum Price">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.minimum_price}
                  onChange={(e) => setFormData({ ...formData, minimum_price: Number(e.target.value) })}
                  className="input"
                />
              </FormField>

              <FormField label="Discount">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.discount}
                  onChange={(e) => setFormData({ ...formData, discount: Number(e.target.value) })}
                  className="input"
                />
              </FormField>

              <div>
                <SearchableDropdown
                  label="Discount Type"
                  options={discountTypes.map((type) => ({
                    value: type.value,
                    label: type.label,
                  }))}
                  value={formData.discount_type}
                  onChange={(val) => setFormData({ ...formData, discount_type: val as 'percentage' | 'fixed' })}
                  placeholder="Select Discount Type"
                />
              </div>

              <FormField label="Profit Margin (%)">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.profit_margin}
                  onChange={(e) => setFormData({ ...formData, profit_margin: Number(e.target.value) })}
                  className="input"
                />
              </FormField>
            </div>
          </div>

          {/* Inventory Management Section */}
          <div className="card">
            <h2 style={{ 
              fontSize: 'var(--font-lg)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--text-primary)',
              margin: 0,
              marginBottom: 'var(--spacing-4)',
            }}>
              Inventory Management
            </h2>
            <div style={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: 'var(--spacing-4)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                <input
                  type="checkbox"
                  checked={formData.track_stock}
                  onChange={(e) => setFormData({ ...formData, track_stock: e.target.checked })}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <label style={{ 
                  fontSize: 'var(--font-sm)',
                  fontWeight: 'var(--font-weight-medium)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                }}>
                  Track Stock
                </label>
              </div>

              {formData.track_stock && (
                <>
                  <FormField label="Stock Balance">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.stock_balance}
                      onChange={(e) => setFormData({ ...formData, stock_balance: Number(e.target.value) })}
                      className="input"
                    />
                  </FormField>

                  <FormField label="Low Stock Threshold">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.low_stock_threshold}
                      onChange={(e) => setFormData({ ...formData, low_stock_threshold: Number(e.target.value) })}
                      className="input"
                    />
                  </FormField>
                </>
              )}
            </div>
          </div>

          {/* More Details Section */}
          <div className="card">
            <h2 style={{ 
              fontSize: 'var(--font-lg)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--text-primary)',
              margin: 0,
              marginBottom: 'var(--spacing-4)',
            }}>
              More Details
            </h2>
            <div style={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: 'var(--spacing-4)',
            }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <FormField label="Internal Notes">
                  <textarea
                    value={formData.internal_notes}
                    onChange={(e) => setFormData({ ...formData, internal_notes: e.target.value })}
                    rows={4}
                    className="input"
                  />
                </FormField>
              </div>

              <FormField label="Status">
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' | 'archived' })}
                  className="input"
                >
                  {statusOptions.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </FormField>

              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <label style={{ 
                  fontSize: 'var(--font-sm)',
                  fontWeight: 'var(--font-weight-medium)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                }}>
                  Active
                </label>
              </div>
            </div>
          </div>

          {/* Form Actions - Unified */}
          <div style={{ display: 'flex', gap: 'var(--spacing-3)' }}>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="btn btn-primary"
            >
              {mutation.isPending ? 'Saving...' : 'Save Product'}
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
