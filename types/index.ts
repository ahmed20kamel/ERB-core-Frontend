// User Types
export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'site_engineer' | 'procurement_manager' | 'procurement_officer' | 'super_admin';
  phone: string;
  job_title?: string;
  avatar?: string;
  avatar_url?: string;
  is_staff: boolean;
  is_active: boolean;
  is_superuser?: boolean;
  permission_set?: number;
  permission_set_id?: number;
}

// Permission Types
export interface Permission {
  id: number;
  category: string;
  action: string;
  name: string;
  description?: string;
}

export interface PermissionSet {
  id: number;
  name: string;
  description?: string;
  permissions?: Permission[];
  permissions_count?: number;
  is_active?: boolean;
  is_system?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AuthResponse {
  user: User;
  tokens: {
    access: string;
    refresh: string;
  };
}

// Pagination
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Notification Types
export interface Notification {
  id: number;
  notification_type: string;
  title: string;
  message: string;
  is_read: boolean;
  related_object_type: string | null;
  related_object_id: number | null;
  created_at: string;
}

// Project Types
export interface Project {
  id: number;
  code: string;
  name: string;
  image?: string;
  image_url?: string;
  location?: string;
  contact_person?: string;
  mobile_number?: string;
  sector?: string;
  plot?: string;
  project_status: 'on_going' | 'completed' | 'on_hold' | 'cancelled';
  consultant?: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Supplier Types
export interface Supplier {
  id: number;
  name: string;
  business_name?: string;
  supplier_number?: string;
  image?: string;
  image_url?: string;
  first_name?: string;
  last_name?: string;
  contact_person: string;
  email: string;
  telephone?: string;
  phone: string;
  mobile?: string;
  street_address_1?: string;
  street_address_2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  address: string;
  tax_id: string;
  trn?: string;
  currency?: string;
  description?: string;
  status?: 'SUPPLIER' | 'SUBCON';
  supplier_history?: boolean;
  bank_name: string;
  bank_account: string;
  notes: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Product Types
export interface Product {
  id: number;
  name: string;
  code: string;
  sku?: string;
  barcode?: string;
  image?: string;
  image_url?: string;
  description: string;
  notes?: string;
  internal_notes?: string;
  brand?: string;
  category: string;
  tags?: string;
  unit: 'piece' | 'pcs' | 'kg' | 'kl' | 'meter' | 'lm' | 'liter' | 'box' | 'pack' | 'pkt' | 'bag' | 'roll' | 'ctn' | 'ton' | 'trip' | 'sqm' | 'cbm' | 'pump' | 'sheet' | 'brd' | 'drm' | 'doz' | 'ls' | 'set' | 'ream';
  product_type?: number;
  supplier?: number | Supplier;
  unit_price?: number;
  buy_price?: number;
  minimum_price?: number;
  average_cost?: number;
  discount?: number;
  discount_type?: 'percentage' | 'fixed';
  tax1?: number;
  tax2?: number;
  track_stock?: boolean;
  stock_balance?: number;
  low_stock_threshold?: number;
  profit_margin?: number;
  service_duration_minutes?: number;
  status?: 'active' | 'inactive' | 'archived';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Purchase Request Types
export interface PurchaseRequestItem {
  id?: number;
  product_id: number;
  product?: Product;
  quantity: number;
  unit: string;
  project_site: string;
  reason: string;
  notes: string;
  created_at?: string;
}

export interface PurchaseRequest {
  id: number;
  code: string;
  title: string;
  project?: Project | number | null;
  project_id?: number | null;
  project_code?: string;
  request_date: string;
  required_by: string;
  status: 'pending' | 'approved' | 'rejected';
  notes: string;
  rejection_reason?: string;
  created_by: number;
  created_by_name?: string;
  approved_by?: number | null;
  approved_by_name?: string | null;
  approved_at?: string | null;
  items: PurchaseRequestItem[];
  total_items?: number;
  has_quotation_requests?: boolean;
  has_purchase_orders?: boolean;
  has_awarded_quotation?: boolean;
  created_at: string;
  updated_at: string;
}

// Quotation Request Types
export interface QuotationRequestItem {
  id?: number;
  product_id: number;
  product?: Product;
  quantity: number;
  notes: string;
}

export interface QuotationRequest {
  id: number;
  purchase_request: number | PurchaseRequest;
  supplier: number | Supplier;
  notes: string;
  created_by: number;
  created_by_name: string;
  created_at: string;
  items: QuotationRequestItem[];
}

// Purchase Quotation Types
export interface PurchaseQuotationItem {
  id?: number;
  product_id: number;
  product?: Product;
  quantity: number;
  unit_price: number;
  discount?: number;
  tax?: number;
  total: number;
}

export interface PurchaseQuotation {
  id: number;
  quotation_number: string;
  quotation_request: number | QuotationRequest;
  quotation_request_id?: number;
  quotation_request_code?: string;
  purchase_request?: number | PurchaseRequest | null;
  purchase_request_id?: number | null;
  purchase_request_code?: string | null;
  has_awarded_quotation?: boolean;
  supplier: number | Supplier;
  quotation_date: string;
  valid_until: string;
  status?: 'pending' | 'awarded' | 'rejected' | 'expired';
  total: number;
  subtotal?: number;
  tax_amount?: number;
  discount?: number;
  tax_rate?: number;
  payment_terms?: string;
  delivery_method?: 'pickup' | 'delivery';
  delivery_terms?: string;
  notes?: string;
  attachments?: string[];
  created_by: number;
  created_by_name: string;
  awarded_by?: number;
  awarded_by_name?: string;
  awarded_at?: string;
  created_at: string;
  items: PurchaseQuotationItem[];
}

// Purchase Order Types
export interface PurchaseOrderItem {
  id?: number;
  product_id: number;
  product?: Product;
  quantity: number;
  unit_price: number;
  discount?: number;
  tax_rate?: number;
  total: number;
  notes?: string;
  created_at?: string;
}

export interface PurchaseOrder {
  terms_and_conditions?: string;
  id: number;
  order_number: string;
  purchase_request?: number | PurchaseRequest;
  purchase_quotation?: number | PurchaseQuotation;
  supplier: number | Supplier;
  order_date: string;
  delivery_date?: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  discount: number;
  total: number;
  payment_terms?: string;
  delivery_method?: 'pickup' | 'delivery';
  delivery_terms?: string;
  notes?: string;
  approved_by?: number;
  approved_by_name?: string;
  approved_at?: string;
  rejection_reason?: string;
  created_by: number;
  created_by_name: string;
  has_grn?: boolean;
  grns_count?: number;
  created_at: string;
  updated_at: string;
  items: PurchaseOrderItem[];
}

// Purchase Invoice Types
export interface PurchaseInvoiceItem {
  id?: number;
  purchase_order_item_id: number;
  product_id: number;
  product?: Product;
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