import React from 'react';
import { Admin, Permission, AdminRole } from '../../types/AdminTypes';
import { hasPermission, hasAnyPermission, hasAllPermissions } from '../admin/AdminFunctions';

/**
 * Permission utility class for checking admin permissions
 */
export class PermissionChecker {
  private admin: Admin | null;

  constructor(admin: Admin | null) {
    this.admin = admin;
  }

  /**
   * Check if current admin has a specific permission
   */
  can(permission: Permission): boolean {
    if (!this.admin) return false;
    return hasPermission(this.admin, permission);
  }

  /**
   * Check if current admin has any of the specified permissions
   */
  canAny(permissions: Permission[]): boolean {
    if (!this.admin) return false;
    return hasAnyPermission(this.admin, permissions);
  }

  /**
   * Check if current admin has all of the specified permissions
   */
  canAll(permissions: Permission[]): boolean {
    if (!this.admin) return false;
    return hasAllPermissions(this.admin, permissions);
  }

  /**
   * Check if current admin cannot perform an action
   */
  cannot(permission: Permission): boolean {
    return !this.can(permission);
  }

  /**
   * Check if current admin is a super admin
   */
  isSuperAdmin(): boolean {
    return this.admin?.role === 'super_admin' && this.admin?.isActive === true;
  }

  /**
   * Check if current admin is active
   */
  isActive(): boolean {
    return this.admin?.isActive === true;
  }

  /**
   * Get current admin's role
   */
  getRole(): string | null {
    return this.admin?.role || null;
  }

  /**
   * Get current admin info
   */
  getAdmin(): Admin | null {
    return this.admin;
  }
}

/**
 * Helper function to create permission checker
 */
export function createPermissionChecker(admin: Admin | null): PermissionChecker {
  return new PermissionChecker(admin);
}

/**
 * Permission-based route guard
 */
export function requirePermission(admin: Admin | null, permission: Permission): boolean {
  const checker = createPermissionChecker(admin);
  return checker.can(permission);
}

/**
 * Permission-based route guard for multiple permissions (any)
 */
export function requireAnyPermission(admin: Admin | null, permissions: Permission[]): boolean {
  const checker = createPermissionChecker(admin);
  return checker.canAny(permissions);
}

/**
 * Permission-based route guard for multiple permissions (all)
 */
export function requireAllPermissions(admin: Admin | null, permissions: Permission[]): boolean {
  const checker = createPermissionChecker(admin);
  return checker.canAll(permissions);
}

/**
 * Higher-order function to wrap components with permission checks
 */
export function withPermissions<T extends object>(
  WrappedComponent: React.ComponentType<T>,
  requiredPermissions: Permission | Permission[],
  fallbackComponent?: React.ComponentType<T>
) {
  return function PermissionWrappedComponent(props: T & { admin?: Admin | null }) {
    const { admin, ...restProps } = props;
    const checker = createPermissionChecker(admin || null);
    
    const hasRequiredPermissions = Array.isArray(requiredPermissions)
      ? checker.canAny(requiredPermissions)
      : checker.can(requiredPermissions);

    if (!hasRequiredPermissions) {
      if (fallbackComponent) {
        return React.createElement(fallbackComponent, restProps as T);
      }
      return null;
    }

    return React.createElement(WrappedComponent, restProps as T);
  };
}

/**
 * Permission constants for common operations
 */
export const PERMISSIONS = {
  // User Management
  USERS_VIEW: 'users.view' as Permission,
  USERS_CREATE: 'users.create' as Permission,
  USERS_UPDATE: 'users.update' as Permission,
  USERS_DELETE: 'users.delete' as Permission,
  USERS_MANAGE_RETAIL_CODES: 'users.manage_retail_codes' as Permission,

  // Product Management
  PRODUCTS_VIEW: 'products.view' as Permission,
  PRODUCTS_CREATE: 'products.create' as Permission,
  PRODUCTS_UPDATE: 'products.update' as Permission,
  PRODUCTS_DELETE: 'products.delete' as Permission,
  PRODUCTS_MANAGE_INVENTORY: 'products.manage_inventory' as Permission,



  // Order Management
  ORDERS_VIEW: 'orders.view' as Permission,
  ORDERS_CREATE: 'orders.create' as Permission,
  ORDERS_UPDATE: 'orders.update' as Permission,
  ORDERS_DELETE: 'orders.delete' as Permission,
  ORDERS_MANAGE_STATUS: 'orders.manage_status' as Permission,
  ORDERS_EDIT_ITEMS: 'orders.edit_items' as Permission,
  ORDERS_DELETE_ITEMS: 'orders.delete_items' as Permission,

  // Category Management
  CATEGORIES_VIEW: 'categories.view' as Permission,
  CATEGORIES_CREATE: 'categories.create' as Permission,
  CATEGORIES_UPDATE: 'categories.update' as Permission,
  CATEGORIES_DELETE: 'categories.delete' as Permission,

  // Admin Management
  ADMINS_VIEW: 'admins.view' as Permission,
  ADMINS_CREATE: 'admins.create' as Permission,
  ADMINS_UPDATE: 'admins.update' as Permission,
  ADMINS_DELETE: 'admins.delete' as Permission,
  ADMINS_MANAGE_ROLES: 'admins.manage_roles' as Permission,

  // Financial Management
  FINANCE_VIEW_REPORTS: 'finance.view_reports' as Permission,
  FINANCE_MANAGE_PRICING: 'finance.manage_pricing' as Permission,
  FINANCE_MANAGE_DISCOUNTS: 'finance.manage_discounts' as Permission,

  // System Management
  SYSTEM_VIEW_ANALYTICS: 'system.view_analytics' as Permission,
  SYSTEM_MANAGE_SETTINGS: 'system.manage_settings' as Permission,
  SYSTEM_MANAGE_IMAGES: 'system.manage_images' as Permission,
  SYSTEM_MANAGE_PINCODES: 'system.manage_pincodes' as Permission,
} as const;

/**
 * Common permission groups for easier management
 */
export const PERMISSION_GROUPS = {
  USER_MANAGEMENT: [
    PERMISSIONS.USERS_VIEW,
    PERMISSIONS.USERS_CREATE,
    PERMISSIONS.USERS_UPDATE,
    PERMISSIONS.USERS_DELETE,
    PERMISSIONS.USERS_MANAGE_RETAIL_CODES
  ],
  PRODUCT_MANAGEMENT: [
    PERMISSIONS.PRODUCTS_VIEW,
    PERMISSIONS.PRODUCTS_CREATE,
    PERMISSIONS.PRODUCTS_UPDATE,
    PERMISSIONS.PRODUCTS_DELETE,
    PERMISSIONS.PRODUCTS_MANAGE_INVENTORY
  ],
  ORDER_MANAGEMENT: [
    PERMISSIONS.ORDERS_VIEW,
    PERMISSIONS.ORDERS_CREATE,
    PERMISSIONS.ORDERS_UPDATE,
    PERMISSIONS.ORDERS_DELETE,
    PERMISSIONS.ORDERS_MANAGE_STATUS,
    PERMISSIONS.ORDERS_EDIT_ITEMS,
    PERMISSIONS.ORDERS_DELETE_ITEMS
  ],
  ADMIN_MANAGEMENT: [
    PERMISSIONS.ADMINS_VIEW,
    PERMISSIONS.ADMINS_CREATE,
    PERMISSIONS.ADMINS_UPDATE,
    PERMISSIONS.ADMINS_DELETE,
    PERMISSIONS.ADMINS_MANAGE_ROLES
  ],
  FINANCIAL_MANAGEMENT: [
    PERMISSIONS.FINANCE_VIEW_REPORTS,
    PERMISSIONS.FINANCE_MANAGE_PRICING,
    PERMISSIONS.FINANCE_MANAGE_DISCOUNTS
  ],
  SYSTEM_MANAGEMENT: [
    PERMISSIONS.SYSTEM_VIEW_ANALYTICS,
    PERMISSIONS.SYSTEM_MANAGE_SETTINGS,
    PERMISSIONS.SYSTEM_MANAGE_IMAGES,
    PERMISSIONS.SYSTEM_MANAGE_PINCODES
  ]
} as const;

/**
 * Tab permission mappings - defines which permissions are required for each tab
 */
export const TAB_PERMISSIONS: Record<string, Permission[]> = {
  // Dashboard is accessible to all authenticated admins
  dashboard: [],
  
  // Product Management
  products: [PERMISSIONS.PRODUCTS_VIEW],
  categories: [PERMISSIONS.CATEGORIES_VIEW],
  'top-categories': [PERMISSIONS.CATEGORIES_VIEW],
  images: [PERMISSIONS.SYSTEM_MANAGE_IMAGES],
  flavour: [PERMISSIONS.PRODUCTS_VIEW],
  'product-of-the-day': [PERMISSIONS.PRODUCTS_VIEW],

  
  // Order Management
  orders: [PERMISSIONS.ORDERS_VIEW],
  
  // User Management
  users: [PERMISSIONS.USERS_VIEW],
  
  // Location & Pricing
  pincodes: [PERMISSIONS.SYSTEM_MANAGE_PINCODES],
  'price-multiplier': [PERMISSIONS.FINANCE_MANAGE_PRICING],
  
  // Financial
  'ratana-cash': [PERMISSIONS.FINANCE_VIEW_REPORTS],
  
  // Admin Management (Super Admin only)
  admins: [PERMISSIONS.ADMINS_VIEW],
};

/**
 * Role-based tab access mapping
 */
export const ROLE_TAB_ACCESS: Record<AdminRole, string[]> = {
  super_admin: [
    'dashboard', 'products', 'categories', 'top-categories', 'orders', 
    'users', 'pincodes', 'price-multiplier', 'images', 'flavour', 
    'product-of-the-day', 'ratana-cash', 'admins'
  ],
  sales_admin: [
    'dashboard', 'orders', 'users', 'products', 'categories'
  ],
  inventory_admin: [
    'dashboard', 'products', 'categories', 'top-categories', 'images', 
    'flavour', 'product-of-the-day'
  ],
  customer_admin: [
    'dashboard', 'users', 'orders'
  ],
  finance_admin: [
    'dashboard', 'orders', 'price-multiplier', 'ratana-cash', 'users', 'products'
  ]
};

/**
 * Check if admin has access to a specific tab
 */
export function hasTabAccess(admin: Admin | null, tabValue: string): boolean {
  if (!admin || !admin.isActive) return false;
  
  // Super admin has access to everything
  if (admin.role === 'super_admin') return true;
  
  // Check if tab is in role's allowed tabs
  const allowedTabs = ROLE_TAB_ACCESS[admin.role] || [];
  if (!allowedTabs.includes(tabValue)) return false;
  
  // Check specific permissions for the tab
  const requiredPermissions = TAB_PERMISSIONS[tabValue];
  if (!requiredPermissions || requiredPermissions.length === 0) return true;
  
  const checker = createPermissionChecker(admin);
  return checker.canAny(requiredPermissions);
}

/**
 * Get accessible tabs for an admin based on their role and permissions
 */
export function getAccessibleTabs(admin: Admin | null): string[] {
  if (!admin || !admin.isActive) return ['dashboard'];
  
  // Super admin gets all tabs
  if (admin.role === 'super_admin') {
    return [...ROLE_TAB_ACCESS.super_admin];
  }
  
  // Get role-based tabs and filter by permissions
  const roleTabs = ROLE_TAB_ACCESS[admin.role] || ['dashboard'];
  return roleTabs.filter(tab => hasTabAccess(admin, tab));
}

/**
 * Permission-based component wrapper that shows/hides based on tab access
 */
export function withTabAccess<T extends object>(
  WrappedComponent: React.ComponentType<T>,
  tabValue: string,
  fallbackComponent?: React.ComponentType<T>
) {
  return function TabAccessWrappedComponent(props: T & { admin?: Admin | null }) {
    const { admin, ...restProps } = props;
    
    if (!hasTabAccess(admin || null, tabValue)) {
      if (fallbackComponent) {
        return React.createElement(fallbackComponent, restProps as T);
      }
      return null;
    }
    
    return React.createElement(WrappedComponent, restProps as T);
  };
}

/**
 * Higher-order component for protecting entire tab content
 */
export function ProtectedTabContent({ 
  children, 
  admin, 
  tabValue, 
  fallback 
}: {
  children: React.ReactNode;
  admin: Admin | null;
  tabValue: string;
  fallback?: React.ReactNode;
}): React.ReactNode {
  if (!hasTabAccess(admin, tabValue)) {
    return fallback || React.createElement('div', {
      className: "flex items-center justify-center h-64"
    }, React.createElement('div', {
      className: "text-center"
    }, [
      React.createElement('div', { 
        key: 'icon',
        className: "text-gray-400 mb-2" 
      }, '🔒'),
      React.createElement('h3', { 
        key: 'title',
        className: "text-lg font-medium text-gray-900 mb-2" 
      }, 'Access Restricted'),
      React.createElement('p', { 
        key: 'desc',
        className: "text-gray-500" 
      }, "You don't have permission to access this section.")
    ]));
  }
  
  return children;
}

/**
 * Specific permission checkers for business requirements
 */

/**
 * Check if admin can edit/delete products
 * Only Super Admin and Inventory Admin can edit/delete products
 */
export function canManageProducts(admin: Admin | null): boolean {
  if (!admin || !admin.isActive) return false;
  
  // Super Admin and Inventory Admin can manage products
  return admin.role === 'super_admin' || admin.role === 'inventory_admin';
}

/**
 * Check if admin can edit product
 * Only Super Admin and Inventory Admin can edit products
 */
export function canEditProduct(admin: Admin | null): boolean {
  if (!admin || !admin.isActive) return false;
  
  const checker = createPermissionChecker(admin);
  return checker.can(PERMISSIONS.PRODUCTS_UPDATE) && canManageProducts(admin);
}

/**
 * Check if admin can delete product
 * Only Super Admin and Inventory Admin can delete products
 */
export function canDeleteProduct(admin: Admin | null): boolean {
  if (!admin || !admin.isActive) return false;
  
  const checker = createPermissionChecker(admin);
  return checker.can(PERMISSIONS.PRODUCTS_DELETE) && canManageProducts(admin);
}

/**
 * Check if admin can edit/delete order items
 * Only Super Admin, Sales Admin, and Inventory Admin can edit/delete order items
 */
export function canManageOrderItems(admin: Admin | null): boolean {
  if (!admin || !admin.isActive) return false;
  
  // Super Admin, Sales Admin, and Inventory Admin can manage order items
  return admin.role === 'super_admin' || 
         admin.role === 'sales_admin' || 
         admin.role === 'inventory_admin';
}

/**
 * Check if admin can edit order items
 * Only Super Admin, Sales Admin, and Inventory Admin can edit order items
 */
export function canEditOrderItems(admin: Admin | null): boolean {
  if (!admin || !admin.isActive) return false;
  
  const checker = createPermissionChecker(admin);
  return checker.can(PERMISSIONS.ORDERS_EDIT_ITEMS) && canManageOrderItems(admin);
}

/**
 * Check if admin can delete order items
 * Only Super Admin, Sales Admin, and Inventory Admin can delete order items
 */
export function canDeleteOrderItems(admin: Admin | null): boolean {
  if (!admin || !admin.isActive) return false;

  const checker = createPermissionChecker(admin);
  return checker.can(PERMISSIONS.ORDERS_DELETE_ITEMS) && canManageOrderItems(admin);
}

/**
 * Check if admin can create users
 * Super Admin, Sales Admin, and Customer Admin can create users
 */
export function canCreateUsers(admin: Admin | null): boolean {
  if (!admin || !admin.isActive) {
    console.log('🔍 canCreateUsers: Admin is null or inactive', { admin: admin?.email, isActive: admin?.isActive });
    return false;
  }

  // Direct role-based check for common roles that can create users
  if (admin.role === 'super_admin' || admin.role === 'sales_admin' || admin.role === 'customer_admin') {
    console.log('🔍 canCreateUsers: Role-based check passed', { admin: admin.email, role: admin.role });
    return true;
  }

  // Fallback to permission-based check
  const checker = createPermissionChecker(admin);
  const hasPermission = checker.can(PERMISSIONS.USERS_CREATE);
  
  console.log('🔍 canCreateUsers Debug:', {
    adminEmail: admin.email,
    adminRole: admin.role,
    adminPermissions: admin.permissions,
    requiredPermission: PERMISSIONS.USERS_CREATE,
    hasPermission: hasPermission
  });
  
  return hasPermission;
}

/**
 * Check if admin can create orders for users
 * Only Super Admin and Sales Admin can create orders
 */
export function canCreateOrdersForUsers(admin: Admin | null): boolean {
  if (!admin || !admin.isActive) return false;

  const checker = createPermissionChecker(admin);
  return checker.can(PERMISSIONS.ORDERS_CREATE);
}

/**
 * Check if admin can edit/delete categories
 * Only Super Admin and Inventory Admin can edit/delete categories
 */
export function canManageCategories(admin: Admin | null): boolean {
  if (!admin || !admin.isActive) return false;
  
  // Super Admin and Inventory Admin can manage categories
  return admin.role === 'super_admin' || admin.role === 'inventory_admin';
}

/**
 * Check if admin can edit categories
 * Only Super Admin and Inventory Admin can edit categories
 */
export function canEditCategory(admin: Admin | null): boolean {
  if (!admin || !admin.isActive) return false;
  
  const checker = createPermissionChecker(admin);
  return checker.can(PERMISSIONS.CATEGORIES_UPDATE) && canManageCategories(admin);
}

/**
 * Check if admin can delete categories
 * Only Super Admin and Inventory Admin can delete categories
 */
export function canDeleteCategory(admin: Admin | null): boolean {
  if (!admin || !admin.isActive) return false;
  
  const checker = createPermissionChecker(admin);
  return checker.can(PERMISSIONS.CATEGORIES_DELETE) && canManageCategories(admin);
}

 