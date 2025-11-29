const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class ApiClient {
  private getToken(): string | null {
    return localStorage.getItem('token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    console.log('🔵 API Request:', {
      endpoint,
      method: options.method || 'GET',
      hasToken: !!token,
      tokenPreview: token ? `${token.substring(0, 20)}...` : 'none',
      headers: { ...headers, Authorization: token ? 'Bearer [hidden]' : 'none' }
    });

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    console.log('🔵 API Response:', {
      endpoint,
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      console.error('❌ API Error:', {
        endpoint,
        status: response.status,
        errorMessage: error.error || error.message || 'Unknown error',
        fullError: error
      });
      throw new Error(error.error || error.message || 'Request failed');
    }

    return response.json();
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint);
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }

  async uploadFile<T>(endpoint: string, file: File): Promise<T> {
    const token = this.getToken();
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(error.error || 'Upload failed');
    }

    return response.json();
  }

  async downloadFile(endpoint: string): Promise<Blob> {
    const token = this.getToken();
    const response = await fetch(`${API_URL}${endpoint}`, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      throw new Error('Download failed');
    }

    return response.blob();
  }
}

export const api = new ApiClient();

// Auth API
export const authApi = {
  login: (username: string, password: string) =>
    api.post<{ access_token: string; user: any }>('/auth/login', { username, password }),
  register: (data: { username: string; email: string; password: string; role?: string }) =>
    api.post<{ message: string }>('/auth/register', data),
  getCurrentUser: () => api.get<any>('/auth/me'),
};

// Items API
export const itemsApi = {
  getAll: (params?: { page?: number; per_page?: number; search?: string }) =>
    api.get<any>(`/items?${new URLSearchParams(params as any).toString()}`),
  getById: (id: number) => api.get<any>(`/items/${id}`),
  create: (data: any) => api.post<any>('/items', data),
  update: (id: number, data: any) => api.put<any>(`/items/${id}`, data),
  delete: (id: number) => api.delete<any>(`/items/${id}`),
  adjustStock: (id: number, data: { warehouse_id: number; quantity: number; adjustment_type: string }) =>
    api.post<any>(`/items/${id}/stock-adjustment`, data),
};

// Categories API
export const categoriesApi = {
  getAll: () => api.get<any[]>('/categories'),
  getById: (id: number) => api.get<any>(`/categories/${id}`),
  create: (data: { name: string; description?: string; parent_id?: number }) =>
    api.post<any>('/categories', data),
  update: (id: number, data: any) => api.put<any>(`/categories/${id}`, data),
  delete: (id: number) => api.delete<any>(`/categories/${id}`),
};

// Warehouses API
export const warehousesApi = {
  getAll: () => api.get<any[]>('/warehouses'),
  getById: (id: number) => api.get<any>(`/warehouses/${id}`),
  create: (data: { name: string; location?: string; capacity?: number }) =>
    api.post<any>('/warehouses', data),
  update: (id: number, data: any) => api.put<any>(`/warehouses/${id}`, data),
  delete: (id: number) => api.delete<any>(`/warehouses/${id}`),
};

// Suppliers API
export const suppliersApi = {
  getAll: () => api.get<any[]>('/suppliers'),
  getById: (id: number) => api.get<any>(`/suppliers/${id}`),
  create: (data: { name: string; contact_person?: string; email?: string; phone?: string; address?: string }) =>
    api.post<any>('/suppliers', data),
  update: (id: number, data: any) => api.put<any>(`/suppliers/${id}`, data),
  delete: (id: number) => api.delete<any>(`/suppliers/${id}`),
  getOrders: (id: number) => api.get<any>(`/suppliers/${id}/orders`),
  exportOrders: (id: number) => api.downloadFile(`/suppliers/${id}/orders/export`),
};

// Orders API
export const ordersApi = {
  getPurchaseOrders: () => api.get<any[]>('/orders/purchase'),
  getPurchaseOrderById: (id: number) => api.get<any>(`/orders/purchase/${id}`),
  createPurchaseOrder: (data: any) => api.post<any>('/orders/purchase', data),
  getSalesOrders: () => api.get<any[]>('/orders/sales'),
  getSalesOrderById: (id: number) => api.get<any>(`/orders/sales/${id}`),
  createSalesOrder: (data: any) => api.post<any>('/orders/sales', data),
};

// Approvals API
export const approvalsApi = {
  submitForApproval: (orderId: number, comments?: string) =>
    api.post<any>(`/approvals/purchase-order/${orderId}/submit`, { comments }),
  approveOrder: (orderId: number, comments?: string) =>
    api.post<any>(`/approvals/purchase-order/${orderId}/approve`, { comments }),
  rejectOrder: (orderId: number, comments?: string) =>
    api.post<any>(`/approvals/purchase-order/${orderId}/reject`, { comments }),
  sendToVendor: (orderId: number, comments?: string) =>
    api.post<any>(`/approvals/purchase-order/${orderId}/send`, { comments }),
  markDelivered: (orderId: number, comments?: string) =>
    api.post<any>(`/approvals/purchase-order/${orderId}/deliver`, { comments }),
  getApprovalHistory: (orderId: number) =>
    api.get<any[]>(`/approvals/purchase-order/${orderId}/history`),
};

// Locations API
export const locationsApi = {
  getAll: () => api.get<any[]>('/locations'),
  getById: (id: number) => api.get<any>(`/locations/${id}`),
  create: (data: { name: string; address?: string; capacity?: number }) =>
    api.post<any>('/locations', data),
  update: (id: number, data: any) => api.put<any>(`/locations/${id}`, data),
  getLocationStock: (locationId: number, params?: { search?: string; min_qty?: number; max_qty?: number; page?: number }) =>
    api.get<any>(`/locations/${locationId}/stock?${new URLSearchParams(params as any).toString()}`),
  getItemStockLocations: (itemId: number) =>
    api.get<any[]>(`/locations/stock/${itemId}`),
  setStockLocation: (data: { item_id: number; location_id: number; quantity: number; min_threshold?: number }) =>
    api.post<any>('/locations/stock', data),
  transferStock: (data: { item_id: number; from_location_id?: number; to_location_id: number; quantity: number; notes?: string }) =>
    api.post<any>('/locations/transfer', data),
  getTransfers: (params?: { item_id?: number; location_id?: number; page?: number }) =>
    api.get<any>(`/locations/transfers?${new URLSearchParams(params as any).toString()}`),
};

// Reports API
export const reportsApi = {
  getDashboard: () => api.get<any>('/reports/dashboard'),
  getLowStock: (threshold?: number) =>
    api.get<any[]>(`/reports/low-stock${threshold ? `?threshold=${threshold}` : ''}`),
  getAuditLogs: (params?: { 
    page?: number; 
    per_page?: number;
    user_id?: string;
    action?: string;
    entity_type?: string;
    entity_id?: string;
    start_date?: string;
    end_date?: string;
  }) =>
    api.get<any>(`/reports/audit-logs?${new URLSearchParams(params as any).toString()}`),
  exportAuditLogs: (params?: {
    user_id?: string;
    action?: string;
    entity_type?: string;
    entity_id?: string;
    start_date?: string;
    end_date?: string;
  }) =>
    api.downloadFile(`/reports/audit-logs/export?${new URLSearchParams(params as any).toString()}`),
};

// Imports API
export const importsApi = {
  uploadFile: (file: File) => api.uploadFile<any>('/imports/upload', file),
  getJobs: (params?: { page?: number; per_page?: number }) =>
    api.get<any>(`/imports/jobs?${new URLSearchParams(params as any).toString()}`),
  getJobStatus: (jobId: number) => api.get<any>(`/imports/jobs/${jobId}`),
  exportItems: () => api.downloadFile('/imports/export'),
};
