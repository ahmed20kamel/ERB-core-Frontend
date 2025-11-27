/**
 * Unified Form Data Types
 * These types represent form state and are converted to API types before submission
 */

import { 
  Product, 
  PurchaseOrder, 
  PurchaseOrderItem,
  PurchaseInvoice,
  PurchaseInvoiceItem,
  PurchaseRequest,
  PurchaseRequestItem,
  PurchaseQuotation,
  PurchaseQuotationItem,
} from '@/types';
import { GRNItem } from '@/lib/api/goods-receiving';

/**
 * Utility type to convert optional fields from null/empty string to undefined
 */
export type CleanOptional<T> = {
  [K in keyof T]: T[K] extends string
    ? T[K] extends ''
      ? undefined
      : T[K]
    : T[K] extends null
    ? undefined
    : T[K] extends (infer U)[]
    ? U[]
    : T[K];
};

/**
 * Product Form Data
 */
export interface ProductFormData {
  name: string;
  code: string;
  sku: string;
  barcode: string;
  description: string;
  notes: string;
  internal_notes: string;
  brand: string;
  category: string;
  tags: string;
  unit: Product['unit'];
  supplier: number | undefined;
  unit_price: number;
  buy_price: number;
  minimum_price: number;
  discount: number;
  discount_type: 'percentage' | 'fixed';
  tax1: number;
  tax2: number;
  track_stock: boolean;
  stock_balance: number;
  low_stock_threshold: number;
  profit_margin: number;
  status: 'active' | 'inactive' | 'archived';
  is_active: boolean;
}

/**
 * Purchase Order Form Data
 */
export interface PurchaseOrderFormData {
  purchase_request_id: number | null | undefined;
  purchase_quotation_id: number | null | undefined;
  supplier_id: number;
  order_date: string;
  delivery_date: string;
  delivery_method: 'pickup' | 'delivery' | '';
  payment_terms: string;
  delivery_terms: string;
  notes: string;
  terms_and_conditions?: string;
  tax_rate: number;
  discount: number;
  status: PurchaseOrder['status'];
}

/**
 * Purchase Order Update Data (for edit forms)
 */
export interface PurchaseOrderUpdateFormData {
  supplier_id?: number;
  order_date?: string;
  delivery_date?: string;
  delivery_method?: 'pickup' | 'delivery' | '';
  payment_terms?: string;
  delivery_terms?: string;
  notes?: string;
  tax_rate?: number;
  discount?: number;
  status?: PurchaseOrder['status'];
}

/**
 * Purchase Invoice Form Data
 */
export interface PurchaseInvoiceFormData {
  purchase_order_id: number;
  grn_id: number | undefined;
  invoice_date: string;
  due_date: string;
  status: PurchaseInvoice['status'];
  tax_rate: number;
  discount: number;
  notes: string;
}

/**
 * Purchase Request Form Data
 */
export interface PurchaseRequestFormData {
  project_id: number | undefined;
  project_code: string;
  title: string;
  request_date: string;
  required_by: string;
  notes: string;
}

/**
 * Purchase Quotation Form Data
 */
export interface PurchaseQuotationFormData {
  quotation_request_id: number | undefined;
  purchase_request_id: number | undefined;
  supplier_id: number;
  quotation_number: string;
  quotation_date: string;
  valid_until: string;
  payment_terms: string;
  delivery_terms: string;
  delivery_method: 'pickup' | 'delivery' | '';
  notes: string;
  tax_rate: number;
  discount: number;
}

/**
 * GRN Form Data
 */
export interface GRNFormData {
  purchase_order_id: number;
  receipt_date: string;
  status: 'draft' | 'partial' | 'completed' | 'cancelled';
  notes: string;
}

/**
 * Helper function to clean form data before API submission
 * Converts empty strings to undefined and null to undefined
 */
export function cleanFormData<T extends Record<string, any>>(data: T): CleanOptional<T> {
  const cleaned = { ...data };
  
  for (const key in cleaned) {
    const value = cleaned[key];
    
    // Convert empty strings to undefined
    if (value === '') {
      (cleaned as any)[key] = undefined;
    }
    // Convert null to undefined
    else if (value === null) {
      (cleaned as any)[key] = undefined;
    }
    // Handle arrays
    else if (Array.isArray(value)) {
      (cleaned as any)[key] = value;
    }
  }
  
  return cleaned as CleanOptional<T>;
}

/**
 * Convert PurchaseOrderFormData to API format
 */
export function toPurchaseOrderCreateData(
  formData: PurchaseOrderFormData,
  items: Omit<PurchaseOrderItem, 'product' | 'total' | 'created_at'>[]
) {
  return {
    purchase_request_id: formData.purchase_request_id || undefined,
    purchase_quotation_id: formData.purchase_quotation_id || undefined,
    supplier_id: formData.supplier_id,
    order_date: formData.order_date,
    delivery_date: formData.delivery_date || undefined,
    delivery_method: formData.delivery_method || undefined,
    payment_terms: formData.payment_terms || undefined,
    delivery_terms: formData.delivery_terms || undefined,
    notes: formData.notes || undefined,
    terms_and_conditions: formData.terms_and_conditions || undefined,
    tax_rate: formData.tax_rate,
    discount: formData.discount,
    status: formData.status,
    items,
  };
}

/**
 * Convert PurchaseOrderUpdateFormData to API format
 */
export function toPurchaseOrderUpdateData(
  formData: PurchaseOrderUpdateFormData,
  items?: Omit<PurchaseOrderItem, 'product' | 'total' | 'created_at'>[]
): Partial<PurchaseOrder> {
  const result: any = {};
  
  if (formData.supplier_id !== undefined) result.supplier_id = formData.supplier_id;
  if (formData.order_date !== undefined) result.order_date = formData.order_date;
  if (formData.delivery_date !== undefined) result.delivery_date = formData.delivery_date || undefined;
  if (formData.delivery_method !== undefined) result.delivery_method = formData.delivery_method || undefined;
  if (formData.payment_terms !== undefined) result.payment_terms = formData.payment_terms || undefined;
  if (formData.delivery_terms !== undefined) result.delivery_terms = formData.delivery_terms || undefined;
  if (formData.notes !== undefined) result.notes = formData.notes || undefined;
  if (formData.tax_rate !== undefined) result.tax_rate = formData.tax_rate;
  if (formData.discount !== undefined) result.discount = formData.discount;
  if (formData.status !== undefined) result.status = formData.status;
  if (items !== undefined) result.items = items;
  
  return result;
}

/**
 * Convert PurchaseInvoiceFormData to API format
 */
export function toPurchaseInvoiceCreateData(
  formData: PurchaseInvoiceFormData,
  items: Omit<PurchaseInvoiceItem, 'id' | 'created_at' | 'product'>[]
) {
  return {
    purchase_order_id: formData.purchase_order_id,
    grn_id: formData.grn_id || undefined,
    invoice_date: formData.invoice_date,
    due_date: formData.due_date || undefined,
    status: formData.status,
    tax_rate: formData.tax_rate,
    discount: formData.discount,
    notes: formData.notes || undefined,
    items,
  };
}

/**
 * Convert PurchaseRequestFormData to API format
 */
export function toPurchaseRequestCreateData(
  formData: PurchaseRequestFormData,
  items: Omit<PurchaseRequestItem, 'id' | 'created_at' | 'product'>[]
) {
  return {
    project_id: formData.project_id || undefined,
    title: formData.title,
    request_date: formData.request_date,
    required_by: formData.required_by,
    notes: formData.notes || undefined,
    items,
  };
}

/**
 * Convert PurchaseQuotationFormData to API format
 */
export function toPurchaseQuotationCreateData(
  formData: PurchaseQuotationFormData,
  items: Omit<PurchaseQuotationItem, 'id' | 'product' | 'total' | 'created_at'>[]
) {
  return {
    quotation_request: formData.quotation_request_id || undefined,
    purchase_request_id: formData.purchase_request_id || undefined,
    supplier_id: formData.supplier_id,
    quotation_number: formData.quotation_number,
    quotation_date: formData.quotation_date,
    valid_until: formData.valid_until,
    payment_terms: formData.payment_terms || undefined,
    delivery_terms: formData.delivery_terms || undefined,
    delivery_method: formData.delivery_method || undefined,
    notes: formData.notes || undefined,
    tax_rate: formData.tax_rate,
    discount: formData.discount,
    items,
  };
}

/**
 * Convert ProductFormData to API format
 */
export function toProductCreateData(formData: ProductFormData): Partial<Product> {
  return cleanFormData({
    ...formData,
    supplier: formData.supplier || undefined,
    sku: formData.sku || undefined,
    barcode: formData.barcode || undefined,
    notes: formData.notes || undefined,
    internal_notes: formData.internal_notes || undefined,
    brand: formData.brand || undefined,
    tags: formData.tags || undefined,
  });
}

/**
 * Convert GRNFormData to API format
 */
export function toGRNCreateData(
  formData: GRNFormData & { invoice_delivery_status: 'not_delivered' | 'delivered' },
  items: Omit<GRNItem, 'id' | 'created_at' | 'product'>[],
  materialImages?: File[],
  supplierInvoiceFile?: File | null
) {
  return {
    purchase_order_id: formData.purchase_order_id,
    receipt_date: formData.receipt_date,
    status: formData.status,
    notes: formData.notes || undefined,
    invoice_delivery_status: formData.invoice_delivery_status,
    items,
    material_images: materialImages,
    supplier_invoice_file: supplierInvoiceFile || undefined,
  };
}

