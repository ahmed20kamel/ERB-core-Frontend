import apiClient from './client';
import { PaginatedResponse } from '@/types';

export interface PurchaseInvoiceItem {
  id?: number;
  purchase_order_item_id: number;
  product_id: number;
  product?: any;
  quantity: number;
  unit_price: number;
  discount?: number;
  tax_rate?: number;
  total: number;
  notes?: string;
  created_at?: string;
}

export interface PurchaseInvoice {
  id: number;
  purchase_order: number | any;
  purchase_order_id: number;
  grn?: number | any;
  grn_id?: number;
  invoice_number: string;
  invoice_date: string;
  due_date?: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'paid' | 'cancelled';
  subtotal?: number;
  tax_rate?: number;
  tax_amount?: number;
  discount?: number;
  total: number;
  paid_amount?: number;
  remaining_amount?: number;
  is_fully_paid?: boolean;
  items: PurchaseInvoiceItem[];
  approved_by?: number;
  approved_by_name?: string;
  approved_at?: string;
  rejection_reason?: string;
  payment_date?: string;
  payment_method?: string;
  payment_reference?: string;
  notes?: string;
  created_by: number;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
}

export const purchaseInvoicesApi = {
  getAll: async (params?: {
    page?: number;
    search?: string;
    purchase_order?: number;
    status?: string;
    invoice_date_after?: string;
    invoice_date_before?: string;
  }): Promise<PaginatedResponse<PurchaseInvoice>> => {
    const response = await apiClient.get('/purchase-invoices/', { params });
    return response.data;
  },

  getById: async (id: number): Promise<PurchaseInvoice> => {
    const response = await apiClient.get(`/purchase-invoices/${id}/`);
    return response.data;
  },

  create: async (data: {
    purchase_order_id: number;
    grn_id?: number;
    invoice_date: string;
    due_date?: string;
    status?: 'draft' | 'pending' | 'approved' | 'rejected' | 'paid' | 'cancelled';
    tax_rate?: number;
    discount?: number;
    notes?: string;
    items: Omit<PurchaseInvoiceItem, 'id' | 'created_at' | 'product'>[];
  }): Promise<PurchaseInvoice> => {
    const response = await apiClient.post('/purchase-invoices/', data);
    return response.data;
  },

  update: async (id: number, data: Partial<PurchaseInvoice>): Promise<PurchaseInvoice> => {
    const response = await apiClient.patch(`/purchase-invoices/${id}/`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/purchase-invoices/${id}/`);
  },

  approve: async (id: number): Promise<PurchaseInvoice> => {
    const response = await apiClient.post(`/purchase-invoices/${id}/approve/`);
    return response.data;
  },

  reject: async (id: number, rejection_reason: string): Promise<PurchaseInvoice> => {
    const response = await apiClient.post(`/purchase-invoices/${id}/reject/`, { rejection_reason });
    return response.data;
  },

  markPaid: async (
    id: number,
    data: {
      paid_amount?: number;
      payment_date?: string;
      payment_method?: string;
      payment_reference?: string;
    }
  ): Promise<PurchaseInvoice> => {
    const response = await apiClient.post(`/purchase-invoices/${id}/mark_paid/`, data);
    return response.data;
  },
};

