// Admin roles available in the system
export type AdminRole = 'super_admin' | 'sales_admin' | 'inventory_admin' | 'customer_admin' | 'finance_admin';

// Permission categories
export type Permission = 
  // User Management
  | 'users.view' 
  | 'users.create' 
  | 'users.update' 
  | 'users.delete' 
  | 'users.manage_retail_codes'
  
  // Product Management
  | 'products.view' 
  | 'products.create' 
  | 'products.update' 
  | 'products.delete' 
  | 'products.manage_inventory'
  

  
  // Order Management
  | 'orders.view' 
  | 'orders.create' 
  | 'orders.update' 
  | 'orders.delete' 
  | 'orders.manage_status'
  | 'orders.edit_items'
  | 'orders.delete_items'
  
  // Category Management
  | 'categories.view' 
  | 'categories.create' 
  | 'categories.update' 
  | 'categories.delete'
  
  // Admin Management
  | 'admins.view' 
  | 'admins.create' 
  | 'admins.update' 
  | 'admins.delete' 
  | 'admins.manage_roles'
  
  // Financial Management
  | 'finance.view_reports' 
  | 'finance.manage_pricing' 
  | 'finance.manage_discounts'
  
  // System Management
  | 'system.view_analytics' 
  | 'system.manage_settings' 
  | 'system.manage_images'
  | 'system.manage_pincodes';

// Role-based permissions mapping
export const ROLE_PERMISSIONS: Record<AdminRole, Permission[]> = {
  super_admin: [
    // Full access to everything
    'users.view', 'users.create', 'users.update', 'users.delete', 'users.manage_retail_codes',
    'products.view', 'products.create', 'products.update', 'products.delete', 'products.manage_inventory',
    'orders.view', 'orders.create', 'orders.update', 'orders.delete', 'orders.manage_status', 'orders.edit_items', 'orders.delete_items',
    'categories.view', 'categories.create', 'categories.update', 'categories.delete',
    'admins.view', 'admins.create', 'admins.update', 'admins.delete', 'admins.manage_roles',
    'finance.view_reports', 'finance.manage_pricing', 'finance.manage_discounts',
    'system.view_analytics', 'system.manage_settings', 'system.manage_images', 'system.manage_pincodes'
  ],
  
  sales_admin: [
    'users.view', 'users.create', 'users.update', 'users.manage_retail_codes',
    'products.view',
    'orders.view', 'orders.create', 'orders.update', 'orders.manage_status', 'orders.edit_items', 'orders.delete_items',
    'categories.view',
    'finance.view_reports'
  ],
  
  inventory_admin: [
    'products.view', 'products.create', 'products.update', 'products.delete', 'products.manage_inventory',
    'orders.view', 'orders.edit_items', 'orders.delete_items',
    'categories.view', 'categories.create', 'categories.update', 'categories.delete',
    'system.manage_images'
  ],
  
  customer_admin: [
    'users.view', 'users.create', 'users.update', 'users.manage_retail_codes',
    'orders.view', 'orders.update', 'orders.manage_status'
  ],
  
  finance_admin: [
    'users.view',
    'products.view',
    'orders.view',
    'finance.view_reports', 'finance.manage_pricing', 'finance.manage_discounts',
    'system.view_analytics'
  ]
};

// Admin interface
export interface Admin {
  $id: string; // Appwrite document ID
  adminId: string; // Unique admin ID from Appwrite Auth
  email: string; // Admin's email (used for login)
  name: string; // Full name
  role: AdminRole; // Admin role
  permissions: Permission[]; // Specific permissions (can override role defaults)
  isActive: boolean; // Whether admin account is active
  createdBy: string; // ID of the admin who created this account
  createdAt: string; // Timestamp when admin was created
  updatedAt: string; // Timestamp when admin was last updated
  lastLogin?: string; // Timestamp of last login
  phone?: string; // Optional phone number
  avatarUrl?: string; // Optional avatar image URL
}

// Admin creation payload
export interface CreateAdminPayload {
  email: string;
  name: string;
  role: AdminRole;
  permissions?: Permission[]; // Optional custom permissions
  phone?: string;
  password: string; // Temporary password for first login
}

// Admin update payload
export interface UpdateAdminPayload {
  name?: string;
  role?: AdminRole;
  permissions?: Permission[];
  isActive?: boolean;
  phone?: string;
  avatarUrl?: string;
}

// Permission check result
export interface PermissionCheckResult {
  hasPermission: boolean;
  reason?: string;
}

// Admin session info
export interface AdminSession {
  admin: Admin;
  sessionId: string;
  expiresAt: string;
}

// Role display information
export interface RoleInfo {
  role: AdminRole;
  label: string;
  description: string;
  color: string;
  icon: string;
}

export const ROLE_INFO: Record<AdminRole, RoleInfo> = {
  super_admin: {
    role: 'super_admin',
    label: 'Super Admin',
    description: 'Full access to all system features and admin management',
    color: 'red',
    icon: 'Crown'
  },
  sales_admin: {
    role: 'sales_admin',
    label: 'Sales Admin',
    description: 'Manage customers, orders, and sales-related features',
    color: 'blue',
    icon: 'TrendingUp'
  },
  inventory_admin: {
    role: 'inventory_admin',
    label: 'Inventory Admin',
    description: 'Manage products, categories, and inventory',
    color: 'green',
    icon: 'Package'
  },
  customer_admin: {
    role: 'customer_admin',
    label: 'Customer Admin',
    description: 'Manage customer accounts and basic order operations',
    color: 'purple',
    icon: 'Users'
  },
  finance_admin: {
    role: 'finance_admin',
    label: 'Finance Admin',
    description: 'View financial reports, manage pricing and discounts',
    color: 'yellow',
    icon: 'DollarSign'
  }
};

// Utility type for permission groups
export type PermissionGroup = {
  label: string;
  permissions: Permission[];
  description: string;
};

export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    label: 'User Management',
    description: 'Manage customer accounts and retail codes',
    permissions: ['users.view', 'users.create', 'users.update', 'users.delete', 'users.manage_retail_codes']
  },
  {
    label: 'Product Management',
    description: 'Manage products, inventory, and categories',
    permissions: ['products.view', 'products.create', 'products.update', 'products.delete', 'products.manage_inventory']
  },

  {
    label: 'Order Management',
    description: 'View and manage customer orders',
    permissions: ['orders.view', 'orders.create', 'orders.update', 'orders.delete', 'orders.manage_status']
  },
  {
    label: 'Category Management',
    description: 'Manage product categories',
    permissions: ['categories.view', 'categories.create', 'categories.update', 'categories.delete']
  },
  {
    label: 'Admin Management',
    description: 'Manage admin accounts and roles',
    permissions: ['admins.view', 'admins.create', 'admins.update', 'admins.delete', 'admins.manage_roles']
  },
  {
    label: 'Financial Management',
    description: 'View reports and manage pricing',
    permissions: ['finance.view_reports', 'finance.manage_pricing', 'finance.manage_discounts']
  },
  {
    label: 'System Management',
    description: 'System settings and configuration',
    permissions: ['system.view_analytics', 'system.manage_settings', 'system.manage_images', 'system.manage_pincodes']
  }
]; 