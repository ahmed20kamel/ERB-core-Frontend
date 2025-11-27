'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { purchaseOrdersApi } from '@/lib/api/purchase-orders';
import { suppliersApi } from '@/lib/api/suppliers';
import { productsApi } from '@/lib/api/products';
import MainLayout from '@/components/layout/MainLayout';
import Link from 'next/link';
import { PurchaseOrder, PurchaseOrderItem } from '@/types';
import { PurchaseOrderUpdateFormData, toPurchaseOrderUpdateData } from '@/lib/types/form-data';
import { toast } from '@/lib/hooks/use-toast';
import SearchableDropdown from '@/components/ui/SearchableDropdown';
import { formatPrice } from '@/lib/utils/format';
import RouteGuard from '@/components/auth/RouteGuard';
import { useAuth } from '@/lib/hooks/use-auth';

export default function EditPurchaseOrderPage() {
  const params = useParams();
  const id = Number(params.id);
  
  return (
    <RouteGuard
      requiredPermission={{ category: 'purchase_order', action: 'update' }}
      redirectTo={`/purchase-orders/${id}`}
    >
      <EditPurchaseOrderPageContent />
    </RouteGuard>
  );
}

function EditPurchaseOrderPageContent() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: order, isLoading } = useQuery({
    queryKey: ['purchase-orders', id],
    queryFn: () => purchaseOrdersApi.getById(id),
  });

  const [formData, setFormData] = useState<PurchaseOrderUpdateFormData>({
    supplier_id: 0,
    order_date: new Date().toISOString().split('T')[0],
    delivery_date: '',
    delivery_method: '',
    payment_terms: '',
    delivery_terms: '',
    notes: '',
    tax_rate: 0,
    discount: 0,
    status: 'draft',
  });

  const [items, setItems] = useState<
    Omit<PurchaseOrderItem, 'product' | 'total' | 'created_at'>[]
  >([]);
  const [currentItem, setCurrentItem] = useState({
    product_id: 0,
    quantity: 0,
    unit_price: 0,
    discount: 0,
    tax_rate: 0,
    notes: '',
  });

  const { data: suppliers } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => suppliersApi.getAll({ page: 1 }),
  });

  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: () => productsApi.getAll({ page: 1 }),
  });

  useEffect(() => {
    if (order) {
      const supplierId = typeof order.supplier === 'object' ? order.supplier.id : order.supplier;
      setFormData({
        supplier_id: supplierId,
        order_date: order.order_date,
        delivery_date: order.delivery_date || '',
        delivery_method: order.delivery_method || '',
        payment_terms: order.payment_terms || '',
        delivery_terms: order.delivery_terms || '',
        notes: order.notes || '',
        tax_rate: order.tax_rate || 0,
        discount: order.discount || 0,
        status: order.status,
      });
      setItems(
        order.items.map((item) => ({
          id: item.id,
          product_id: item.product?.id || item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount: item.discount ?? 0,
          tax_rate: item.tax_rate ?? 0,
          notes: item.notes || '',
        }))
      );
    }
  }, [order]);

  const mutation = useMutation({
    mutationFn: (data: PurchaseOrderUpdateFormData) =>
      purchaseOrdersApi.update(id, toPurchaseOrderUpdateData(data, items) as Partial<PurchaseOrder>),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      toast('Purchase Order updated successfully!', 'success');
      router.push(`/purchase-orders/${id}`);
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error || 'Failed to update purchase order';
      toast(message, 'error');
    },
  });

  const handleAddItem = () => {
    if (currentItem.product_id && currentItem.quantity > 0 && currentItem.unit_price > 0) {
      setItems([...items, { ...currentItem }]);
      setCurrentItem({
        product_id: 0,
        quantity: 0,
        unit_price: 0,
        discount: 0,
        tax_rate: 0,
        notes: '',
      });
    }
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleUpdateItem = (index: number, field: string, value: any) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setItems(updatedItems);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.supplier_id) {
      toast('Please select a supplier', 'warning');
      return;
    }
    if (items.length === 0) {
      toast('Please add at least one product', 'warning');
      return;
    }
    mutation.mutate(formData);
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => {
      const itemSubtotal = item.quantity * item.unit_price;
      const discountAmount = itemSubtotal * ((item.discount ?? 0) / 100) || 0;
      return sum + itemSubtotal - discountAmount;
    }, 0);
  };

  const calculateTaxAmount = () => {
    const subtotal = calculateSubtotal();
    const discountAmount = subtotal * (formData.discount / 100) || 0;
    const afterDiscount = subtotal - discountAmount;
    return afterDiscount * (formData.tax_rate / 100) || 0;
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const discountAmount = subtotal * (formData.discount / 100) || 0;
    const afterDiscount = subtotal - discountAmount;
    const taxAmount = afterDiscount * (formData.tax_rate / 100) || 0;
    return afterDiscount + taxAmount;
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

  if (!order) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div className="card text-center py-12">
            <p className="text-muted-foreground">Purchase Order not found</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Prevent editing if order is approved or completed
  if (order.status === 'approved' || order.status === 'completed') {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div className="card text-center py-12">
            <p className="text-muted-foreground mb-4">
              This purchase order cannot be edited because it is {order.status}.
            </p>
            <Link href={`/purchase-orders/${id}`} className="btn btn-primary">
              Back to Order Details
            </Link>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <Link
            href={`/purchase-orders/${id}`}
            className="text-sm text-muted-foreground hover:text-foreground mb-2 inline-block"
          >
            ← Back to Purchase Order
          </Link>
          <h1 className="text-2xl font-semibold text-foreground">
            Edit Purchase Order: {order.order_number}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Update purchase order details
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <SearchableDropdown
                label="Supplier"
                required
                options={
                  suppliers?.results.map((supplier) => ({
                    value: supplier.id,
                    label: supplier.name,
                    searchText: `${supplier.name} ${supplier.business_name || ''} ${supplier.contact_person || ''}`,
                  })) || []
                }
                value={formData.supplier_id}
                onChange={(val) => setFormData({ ...formData, supplier_id: val ? Number(val) : 0 })}
                placeholder="Select Supplier"
                searchPlaceholder="Search suppliers..."
              />
            </div>

            <div>
              <label className="form-label">
                Order Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.order_date}
                onChange={(e) => setFormData({ ...formData, order_date: e.target.value })}
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">Delivery Date (Optional)</label>
              <input
                type="date"
                value={formData.delivery_date}
                onChange={(e) => setFormData({ ...formData, delivery_date: e.target.value })}
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">Delivery Method (Optional)</label>
              <select
                value={formData.delivery_method}
                onChange={(e) => setFormData({ ...formData, delivery_method: e.target.value as 'pickup' | 'delivery' | '' })}
                className="form-input"
              >
                <option value="">-- Select Delivery Method --</option>
                <option value="pickup">Pick Up</option>
                <option value="delivery">Delivery</option>
              </select>
            </div>

            <div>
              <label className="form-label">Status</label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as typeof formData.status,
                  })
                }
                className="form-input"
              >
                <option value="draft">Draft</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Items Section */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4 text-foreground">Products</h3>

            {/* Add Item Form */}
            <div className="grid grid-cols-1 md:grid-cols-6 gap-3 mb-4 p-4 bg-[var(--muted)] rounded-md">
              <div className="md:col-span-2">
                <SearchableDropdown
                  options={
                    products?.results.map((product) => ({
                      value: product.id,
                      label: `${product.name} (${product.code})`,
                      searchText: `${product.name} ${product.code} ${product.category || ''}`,
                    })) || []
                  }
                  value={currentItem.product_id}
                  onChange={(val) =>
                    setCurrentItem({ ...currentItem, product_id: val ? Number(val) : 0 })
                  }
                  placeholder="Select Product"
                  searchPlaceholder="Search products..."
                />
              </div>

              <div>
                <label className="form-label">Quantity</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={currentItem.quantity || ''}
                  onChange={(e) =>
                    setCurrentItem({ ...currentItem, quantity: parseFloat(e.target.value) || 0 })
                  }
                  className="form-input"
                />
              </div>

              <div>
                <label className="form-label">Unit Price</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={currentItem.unit_price || ''}
                  onChange={(e) =>
                    setCurrentItem({ ...currentItem, unit_price: parseFloat(e.target.value) || 0 })
                  }
                  className="form-input"
                />
              </div>

              <div>
                <label className="form-label">Discount (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={currentItem.discount || ''}
                  onChange={(e) =>
                    setCurrentItem({ ...currentItem, discount: parseFloat(e.target.value) || 0 })
                  }
                  className="form-input"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleAddItem}
                  disabled={!currentItem.product_id || currentItem.quantity <= 0 || currentItem.unit_price <= 0}
                  className="btn btn-primary w-full"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Items Table */}
            {items.length > 0 && (
              <div className="overflow-x-auto">
                <table>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Quantity</th>
                      <th>Unit Price</th>
                      <th>Discount %</th>
                      <th>Tax %</th>
                      <th>Total</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => {
                      const product = products?.results.find((p) => p.id === item.product_id);
                      const itemSubtotal = item.quantity * item.unit_price;
                      const discountAmount = itemSubtotal * ((item.discount ?? 0) / 100) || 0;
                      const afterDiscount = itemSubtotal - discountAmount;
                      const taxAmount = afterDiscount * ((item.tax_rate ?? 0) / 100) || 0;
                      const itemTotal = afterDiscount + taxAmount;

                      return (
                        <tr key={index}>
                          <td>
                            <div className="font-medium text-foreground">{product?.name || 'N/A'}</div>
                            <div className="text-xs text-muted-foreground">{product?.code || ''}</div>
                          </td>
                          <td>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.quantity}
                              onChange={(e) =>
                                handleUpdateItem(index, 'quantity', parseFloat(e.target.value) || 0)
                              }
                              className="form-input w-20"
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.unit_price}
                              onChange={(e) =>
                                handleUpdateItem(index, 'unit_price', parseFloat(e.target.value) || 0)
                              }
                              className="form-input w-24"
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.01"
                              value={item.discount ?? 0}
                              onChange={(e) =>
                                handleUpdateItem(index, 'discount', parseFloat(e.target.value) || 0)
                              }
                              className="form-input w-20"
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.01"
                              value={item.tax_rate ?? 0}
                              onChange={(e) =>
                                handleUpdateItem(index, 'tax_rate', parseFloat(e.target.value) || 0)
                              }
                              className="form-input w-20"
                            />
                          </td>
                          <td>
                            <div className="font-semibold text-foreground">
                              {formatPrice(itemTotal)}
                            </div>
                          </td>
                          <td>
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(index)}
                              className="btn btn-ghost text-red-600 hover:text-red-700"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Summary Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-4">
              <div>
                <label className="form-label">Payment Terms</label>
                <textarea
                  value={formData.payment_terms}
                  onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
                  className="form-input"
                  rows={3}
                  placeholder="Enter payment terms..."
                />
              </div>

              <div>
                <label className="form-label">Delivery Terms (Optional)</label>
                <textarea
                  value={formData.delivery_terms}
                  onChange={(e) => setFormData({ ...formData, delivery_terms: e.target.value })}
                  className="form-input"
                  rows={3}
                  placeholder="Enter delivery terms..."
                />
              </div>

              <div>
                <label className="form-label">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="form-input"
                  rows={3}
                  placeholder="Enter any additional notes..."
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="form-label">Discount (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.discount}
                  onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value) || 0 })}
                  className="form-input"
                />
              </div>

              <div>
                <label className="form-label">Tax Rate (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.tax_rate}
                  onChange={(e) => setFormData({ ...formData, tax_rate: parseFloat(e.target.value) || 0 })}
                  className="form-input"
                />
              </div>

              <div className="card bg-[var(--muted)] p-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span className="font-semibold text-foreground">
                      {formatPrice(calculateSubtotal())}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Discount:</span>
                    <span className="font-semibold text-foreground">
                      {formatPrice(calculateSubtotal() * (formData.discount / 100) || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax:</span>
                    <span className="font-semibold text-foreground">
                      {formatPrice(calculateTaxAmount())}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-border pt-2 text-base">
                    <span className="font-bold text-foreground">Total:</span>
                    <span className="font-bold text-foreground">{formatPrice(calculateTotal())}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={mutation.isPending}
              className="btn btn-primary"
            >
              {mutation.isPending ? 'Updating...' : 'Update Purchase Order'}
            </button>
            <Link href={`/purchase-orders/${id}`} className="btn btn-secondary">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </MainLayout>
  );
}

