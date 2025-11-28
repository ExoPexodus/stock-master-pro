export interface User {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'manager' | 'viewer';
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  parent_id?: number;
  created_at: string;
}

export interface Warehouse {
  id: number;
  name: string;
  location?: string;
  capacity?: number;
  created_at: string;
}

export interface Supplier {
  id: number;
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  created_at: string;
}

export interface Item {
  id: number;
  sku: string;
  name: string;
  description?: string;
  category_id?: number;
  unit_price: number;
  reorder_level: number;
  custom_data?: Record<string, any>;
  created_at: string;
  updated_at: string;
  stock?: Stock[];
}

export interface Stock {
  id: number;
  item_id: number;
  warehouse_id: number;
  quantity: number;
  last_updated: string;
}

export interface PurchaseOrder {
  id: number;
  po_number: string;
  supplier_id: number;
  warehouse_id: number;
  status: 'pending' | 'approved' | 'received' | 'cancelled';
  order_date: string;
  expected_date?: string;
  total_amount: number;
  created_by: number;
}

export interface SalesOrder {
  id: number;
  so_number: string;
  customer_name: string;
  warehouse_id: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  order_date: string;
  total_amount: number;
  created_by: number;
}

export interface AuditLog {
  id: number;
  user_id: number;
  action: string;
  entity_type?: string;
  entity_id?: number;
  details?: string;
  timestamp: string;
}

export interface ImportJob {
  id: number;
  filename: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  total_rows: number;
  processed_rows: number;
  success_count: number;
  error_count: number;
  error_details?: string;
  created_by: number;
  created_at: string;
  completed_at?: string;
}

export interface DashboardStats {
  total_items: number;
  total_stock: number;
  low_stock_items: number;
  recent_activities: AuditLog[];
}

export interface PaginatedResponse<T> {
  items?: T[];
  jobs?: T[];
  logs?: T[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}
