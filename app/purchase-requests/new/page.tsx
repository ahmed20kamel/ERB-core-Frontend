'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { purchaseRequestsApi } from '@/lib/api/purchase-requests';
import { productsApi } from '@/lib/api/products';
import { projectsApi } from '@/lib/api/projects';
import MainLayout from '@/components/layout/MainLayout';
import Link from 'next/link';
import { PurchaseRequestItem, Product, Project } from '@/types';
import { PurchaseRequestFormData, toPurchaseRequestCreateData } from '@/lib/types/form-data';
import { toast } from '@/lib/hooks/use-toast';
import ProductSelector from '@/components/ui/ProductSelector';
import QuantityInput from '@/components/ui/QuantityInput';
import SearchableDropdown, { DropdownOption } from '@/components/ui/SearchableDropdown';
import FormField from '@/components/ui/FormField';
import { formatPrice } from '@/lib/utils/format';
import RouteGuard from '@/components/auth/RouteGuard';

export default function NewPurchaseRequestPage() {
  return (
    <RouteGuard
      requiredPermission={{ category: 'purchase_request', action: 'create' }}
      redirectTo="/purchase-requests"
    >
      <NewPurchaseRequestPageContent />
    </RouteGuard>
  );
}

function NewPurchaseRequestPageContent() {
  const router = useRouter();
  const [formData, setFormData] = useState<PurchaseRequestFormData>({
    project_id: undefined,
    project_code: '',
    title: '',
    request_date: new Date().toISOString().split('T')[0],
    required_by: '',
    notes: '',
  });

  const [items, setItems] = useState<Array<{
    product_id: number;
    product?: Product;
    quantity: number;
    unit: string;
    reason: string;
    notes: string;
  }>>([]);
  
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [currentItem, setCurrentItem] = useState({
    quantity: 1,
    unit: '',
    reason: '',
    notes: '',
  });

  // Fetch projects
  const { data: projectsData } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsApi.getAll({ page: 1, page_size: 1000, is_active: true }),
  });

  // Fetch products for table display (when needed)
  const { data: productsData } = useQuery({
    queryKey: ['products-for-table'],
    queryFn: () => productsApi.getAll({ page: 1, page_size: 1000 }),
  });

  // Handle project selection
  const handleProjectChange = (projectId: number | null) => {
    if (projectId) {
      const selectedProject = projectsData?.results.find((p: Project) => p.id === projectId);
      if (selectedProject) {
        setFormData({
          ...formData,
          project_id: projectId,
          project_code: selectedProject.code,
          title: selectedProject.name, // Auto-fill title from project name
        });
      }
    } else {
      setFormData({
        ...formData,
        project_id: null,
        project_code: '',
        title: '',
      });
    }
  };

  // Handle project code input (reverse lookup)
  const handleProjectCodeChange = (code: string) => {
    setFormData({ ...formData, project_code: code });
    
    // Find project by code
    if (code && projectsData?.results) {
      const project = projectsData.results.find((p: Project) => p.code.toLowerCase() === code.toLowerCase());
      if (project) {
        setFormData({
          ...formData,
          project_id: project.id,
          project_code: project.code,
          title: project.name, // Auto-fill title from project name
        });
      }
    } else if (!code) {
      setFormData({
        ...formData,
        project_id: null,
        project_code: '',
        title: '',
      });
    }
  };

  const mutation = useMutation({
    mutationFn: purchaseRequestsApi.create,
    onSuccess: () => {
      toast('Purchase request created successfully!', 'success');
      router.push('/purchase-requests');
    },
    onError: (error: any) => {
      toast(error?.response?.data?.detail || 'Failed to create purchase request', 'error');
    },
  });

  // Unit options from Product.UNIT_CHOICES
  const unitOptions: DropdownOption[] = [
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

  const handleProductSelect = (product: Product | null) => {
    setSelectedProduct(product);
    if (product) {
      setCurrentItem({
        ...currentItem,
        unit: product.unit || '',
      });
    } else {
      setCurrentItem({
        quantity: 1,
        unit: '',
        reason: '',
        notes: '',
      });
    }
  };

  const handleAddItem = () => {
    if (!selectedProduct) {
      toast('Please select a product first', 'warning');
      return;
    }
    if (currentItem.quantity <= 0 || !Number.isInteger(currentItem.quantity)) {
      toast('Please enter a valid whole number quantity', 'warning');
      return;
    }

    const newItem = {
      product_id: selectedProduct.id,
      product: selectedProduct,
      quantity: Math.floor(currentItem.quantity),
      unit: currentItem.unit || selectedProduct.unit || '',
      reason: currentItem.reason,
      notes: currentItem.notes,
    };

    setItems([...items, newItem]);
    
    // Reset form
    setSelectedProduct(null);
    setCurrentItem({
      quantity: 1,
      unit: '',
      reason: '',
      notes: '',
    });
    
    toast('Product added successfully!', 'success');
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
    toast('Product removed', 'info');
  };

  const handleUpdateItem = (index: number, field: string, value: any) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setItems(updatedItems);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      toast('Please add at least one product', 'warning');
      return;
    }
    
    const itemsToSubmit = items.map((item) => ({
      product_id: item.product_id,
      quantity: item.quantity,
      unit: item.unit,
      reason: item.reason,
      notes: item.notes,
    }));
    
    mutation.mutate(toPurchaseRequestCreateData(formData, itemsToSubmit));
  };

  return (
    <MainLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
        {/* Header Section - Unified */}
        <div>
          <Link 
            href="/purchase-requests" 
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
            ← Back to Purchase Requests
          </Link>
          <h1 style={{ 
            fontSize: 'var(--font-2xl)',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--text-primary)',
            margin: 0,
            marginBottom: 'var(--spacing-1)',
          }}>
            Create New Purchase Request
          </h1>
          <p style={{ 
            fontSize: 'var(--font-sm)',
            color: 'var(--text-secondary)',
            margin: 0,
          }}>
            Create a new purchase request with required products
          </p>
        </div>

        {/* Form Card - Unified */}
        <form onSubmit={handleSubmit} className="card">
          {/* Form Fields Grid - Unified Spacing */}
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: 'var(--spacing-4)',
            marginBottom: 'var(--spacing-6)',
          }}>
            {/* Project Selection */}
            <FormField
              label="Project"
              required
            >
              <SearchableDropdown
                options={
                  projectsData?.results.map((project: Project) => ({
                    value: project.id,
                    label: `${project.name} (${project.code})`,
                    searchText: `${project.name} ${project.code} ${project.location || ''}`,
                  })) || []
                }
                value={formData.project_id}
                onChange={(val) => handleProjectChange(val ? Number(val) : null)}
                placeholder="Select Project"
                searchPlaceholder="Search by name or code..."
                allowClear
              />
            </FormField>

            {/* Project Code */}
            <FormField
              label="Project Code"
            >
              <input
                type="text"
                placeholder="Enter project code"
                value={formData.project_code}
                onChange={(e) => handleProjectCodeChange(e.target.value)}
                className="input"
              />
            </FormField>

            {/* Title */}
            <FormField
              label="Title"
              required
            >
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Auto-filled from project name"
                className="input"
              />
            </FormField>

            {/* Request Date */}
            <FormField
              label="Request Date"
              required
            >
              <input
                type="date"
                required
                value={formData.request_date}
                onChange={(e) => setFormData({ ...formData, request_date: e.target.value })}
                className="input"
              />
            </FormField>

            {/* Required By */}
            <FormField
              label="Required By"
              required
            >
              <input
                type="date"
                required
                value={formData.required_by}
                onChange={(e) => setFormData({ ...formData, required_by: e.target.value })}
                className="input"
              />
            </FormField>

            {/* General Notes - Full Width */}
            <div style={{ gridColumn: '1 / -1' }}>
              <FormField
                label="General Notes"
              >
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  placeholder="Additional notes..."
                  className="input"
                />
              </FormField>
            </div>

            {/* Info Note - Full Width */}
            <div style={{ gridColumn: '1 / -1' }}>
              <div 
                className="card"
                style={{ 
                  padding: 'var(--spacing-3)',
                  backgroundColor: 'var(--bg-tertiary)',
                  borderColor: 'var(--border-primary)',
                }}
              >
                <p style={{ 
                  fontSize: 'var(--font-xs)',
                  color: 'var(--text-secondary)',
                  margin: 0,
                }}>
                  <strong>Note:</strong> Request Code will be auto-generated based on the selected project (e.g., {formData.project_code || 'PROJ'}-001, {formData.project_code || 'PROJ'}-002...)
                </p>
              </div>
            </div>
          </div>

          {/* Items Section - Unified */}
          <div style={{ marginBottom: 'var(--spacing-6)' }}>
            <h3 style={{ 
              fontSize: 'var(--font-lg)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--text-primary)',
              margin: 0,
              marginBottom: 'var(--spacing-4)',
            }}>
              Required Products
            </h3>
            
            {/* Add Item Form - Unified Card */}
            <div className="card" style={{ marginBottom: 'var(--spacing-4)' }}>
              {/* Product Selection */}
              <div style={{ marginBottom: 'var(--spacing-4)' }}>
                <ProductSelector
                  selectedProductId={selectedProduct?.id || null}
                  onProductSelect={handleProductSelect}
                  selectedCategory={selectedCategory}
                  onCategoryChange={setSelectedCategory}
                />
              </div>

              {/* Product Details Form */}
              {selectedProduct && (
                <div style={{ 
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--spacing-4)',
                  paddingTop: 'var(--spacing-4)',
                  borderTop: `1px solid var(--border-primary)`,
                }}>
                  <div style={{ 
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: 'var(--spacing-4)',
                  }}>
                    <FormField label="Quantity" required>
                      <QuantityInput
                        value={currentItem.quantity}
                        onChange={(value) => setCurrentItem({ ...currentItem, quantity: Math.floor(value) })}
                        min={1}
                        step={1}
                      />
                    </FormField>
                    <FormField label="Unit">
                      <SearchableDropdown
                        options={unitOptions}
                        value={currentItem.unit}
                        onChange={(val) => setCurrentItem({ ...currentItem, unit: val || '' })}
                        placeholder="Select Unit"
                        searchPlaceholder="Search unit..."
                        allowClear
                      />
                    </FormField>
                  </div>

                  <div style={{ 
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: 'var(--spacing-4)',
                  }}>
                    <FormField label="Reason/Purpose">
                      <textarea
                        placeholder="Why is this needed?"
                        value={currentItem.reason}
                        onChange={(e) => setCurrentItem({ ...currentItem, reason: e.target.value })}
                        rows={2}
                        className="input"
                      />
                    </FormField>
                    <FormField label="Notes">
                      <textarea
                        placeholder="Additional notes"
                        value={currentItem.notes}
                        onChange={(e) => setCurrentItem({ ...currentItem, notes: e.target.value })}
                        rows={2}
                        className="input"
                      />
                    </FormField>
                  </div>

                  <div style={{ display: 'flex', gap: 'var(--spacing-3)', paddingTop: 'var(--spacing-2)' }}>
                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="btn btn-primary"
                    >
                      Add Product
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedProduct(null);
                        setCurrentItem({
                          quantity: 1,
                          unit: '',
                          reason: '',
                          notes: '',
                        });
                      }}
                      className="btn btn-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Items Table - Unified */}
            {items.length > 0 && (
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Qty</th>
                        <th>Unit</th>
                        <th>Purpose</th>
                        <th>Notes</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, index) => {
                        const product = item.product || productsData?.results.find((p) => p.id === item.product_id);
                        return (
                          <tr key={index}>
                            <td>
                              <div style={{ 
                                fontWeight: 'var(--font-weight-medium)',
                                color: 'var(--text-primary)',
                              }}>
                                {product?.name || 'Unknown Product'}
                              </div>
                              <div style={{ 
                                fontSize: 'var(--font-xs)',
                                color: 'var(--text-secondary)',
                                marginTop: 'var(--spacing-1)',
                              }}>
                                {product?.code || 'N/A'}
                              </div>
                              {product?.category && (
                                <div style={{ 
                                  fontSize: 'var(--font-xs)',
                                  color: 'var(--text-tertiary)',
                                  marginTop: 'var(--spacing-1)',
                                }}>
                                  {product.category}
                                </div>
                              )}
                            </td>
                            <td>
                              <input
                                type="number"
                                min="1"
                                step="1"
                                value={item.quantity}
                                onChange={(e) => handleUpdateItem(index, 'quantity', Math.floor(Number(e.target.value)) || 1)}
                                className="input"
                                style={{ width: '100px' }}
                              />
                            </td>
                            <td>
                              <SearchableDropdown
                                options={unitOptions}
                                value={item.unit || ''}
                                onChange={(val) => handleUpdateItem(index, 'unit', val || '')}
                                placeholder="Select Unit"
                                searchPlaceholder="Search unit..."
                                allowClear
                                className="w-32"
                              />
                            </td>
                            <td>
                              <textarea
                                value={item.reason || ''}
                                onChange={(e) => handleUpdateItem(index, 'reason', e.target.value)}
                                placeholder="Purpose"
                                rows={2}
                                className="input"
                                style={{ width: '160px' }}
                              />
                            </td>
                            <td>
                              <textarea
                                value={item.notes || ''}
                                onChange={(e) => handleUpdateItem(index, 'notes', e.target.value)}
                                placeholder="Notes"
                                rows={2}
                                className="input"
                                style={{ width: '160px' }}
                              />
                            </td>
                            <td>
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(index)}
                                className="btn btn-primary"
                                style={{
                                  backgroundColor: 'var(--color-error)',
                                  borderColor: 'var(--color-error)',
                                  color: '#FFFFFF',
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = '#DC2626';
                                  e.currentTarget.style.borderColor = '#DC2626';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = 'var(--color-error)';
                                  e.currentTarget.style.borderColor = 'var(--color-error)';
                                }}
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Form Actions - Unified */}
          <div style={{ display: 'flex', gap: 'var(--spacing-3)' }}>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="btn btn-primary"
            >
              {mutation.isPending ? 'Saving...' : 'Save Purchase Request'}
            </button>
            <Link href="/purchase-requests" className="btn btn-secondary">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </MainLayout>
  );
}
