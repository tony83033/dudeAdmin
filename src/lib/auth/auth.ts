import { Client, Account, Models } from 'appwrite';

import {account, databases, appwriteConfig} from "../appwrite"
import { getAdminById, syncAdminWithAuthUser } from '../admin/AdminFunctions';
import { Admin, Permission } from '../../types/AdminTypes';
import { User } from '../../types/UsersTypes';
import { hasPermission } from '../admin/AdminFunctions';
import { Query } from 'appwrite';

// Function to log in a user
export const login = async (email: string, password: string): Promise<Models.Session> => {
  try {
    const session = await account.createEmailPasswordSession(email, password);
    
    // Auto-sync admin record if this user has an admin account
    try {
      const user = await getCurrentUser();
      if (user) {
        await syncAdminWithAuthUser(user.email, user.$id);
      }
    } catch (syncError) {
      // Don't fail login if sync fails, just log the error
      console.log('Admin sync on login:', syncError);
    }
    
    return session;
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
};

// Function to get the current user
export const getCurrentUser = async (): Promise<Models.User<Models.Preferences> | null> => {
  try {
    const user = await account.get();
    return user;
  } catch (error) {
    console.error('Failed to fetch current user:', error);
    return null;
  }
};

// Function to get the current admin with full admin data
export const getCurrentAdmin = async (): Promise<Admin | null> => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      console.log('🔍 getCurrentAdmin: No current user found');
      return null;
    }
    
    console.log('🔍 getCurrentAdmin: Current user found:', { email: user.email, id: user.$id });
    
    const admin = await getAdminById(user.$id);
    
    if (admin) {
      console.log('🔍 getCurrentAdmin: Admin found:', { 
        email: admin.email, 
        role: admin.role, 
        permissions: admin.permissions,
        isActive: admin.isActive 
      });
      
      // Test the permission directly
      try {
        const { hasPermission } = await import('../admin/AdminFunctions');
        const { PERMISSIONS } = await import('./permissions');
        const canCreate = hasPermission(admin, PERMISSIONS.USERS_CREATE);
        console.log('🔍 getCurrentAdmin: Direct permission check for users.create:', canCreate);
      } catch (error) {
        console.log('🔍 getCurrentAdmin: Error testing permission:', error);
      }
    } else {
      console.log('🔍 getCurrentAdmin: No admin found for user:', user.$id);
    }
    
    return admin;
  } catch (error) {
    console.error('Failed to fetch current admin:', error);
    return null;
  }
};

// Function to get the current user's retailer information
export const getCurrentUserRetailerInfo = async (): Promise<User | null> => {
  try {
    const authUser = await getCurrentUser();
    if (!authUser) return null;
    
    // Search for user in the users collection by userId (which matches auth user ID)
    const response = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      [Query.equal('userId', authUser.$id), Query.limit(1)]
    );
    
    if (response.documents.length === 0) {
      // Also try searching by email as fallback
      const emailResponse = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.userCollectionId,
        [Query.equal('email', authUser.email), Query.limit(1)]
      );
      
      if (emailResponse.documents.length === 0) {
        console.log('User not found in users collection');
        return null;
      }
      
      const doc = emailResponse.documents[0];
      return {
        $id: doc.$id,
        userId: doc.userId,
        email: doc.email,
        name: doc.name,
        phone: doc.phone,
        retailCode: doc.retailCode,
        address: doc.address,
        shopName: doc.shopName,
        password: doc.password,
        profileUrl: doc.profileUrl,
        pincode: doc.pincode,
        createdAt: doc.$createdAt,
        updatedAt: doc.$updatedAt,
      };
    }
    
    const doc = response.documents[0];
    return {
      $id: doc.$id,
      userId: doc.userId,
      email: doc.email,
      name: doc.name,
      phone: doc.phone,
      retailCode: doc.retailCode,
      address: doc.address,
      shopName: doc.shopName,
      password: doc.password,
      profileUrl: doc.profileUrl,
      pincode: doc.pincode,
      createdAt: doc.$createdAt,
      updatedAt: doc.$updatedAt,
    };
  } catch (error) {
    console.error('Failed to fetch current user retailer info:', error);
    return null;
  }
};

// Function to log out a user
export const logout = async (): Promise<void> => {
  try {
    await account.deleteSession('current');
  } catch (error) {
    console.error('Logout failed:', error);
    throw error;
  }
};

// Permission validation middleware for API calls
export const validatePermission = async (requiredPermission: Permission): Promise<{
  isValid: boolean;
  admin: Admin | null;
  error?: string;
}> => {
  try {
    const admin = await getCurrentAdmin();
    
    if (!admin) {
      return {
        isValid: false,
        admin: null,
        error: 'No authenticated admin found'
      };
    }
    
    if (!admin.isActive) {
      return {
        isValid: false,
        admin,
        error: 'Admin account is inactive'
      };
    }
    
    const hasRequiredPermission = hasPermission(admin, requiredPermission);
    
    return {
      isValid: hasRequiredPermission,
      admin,
      error: hasRequiredPermission ? undefined : `Missing required permission: ${requiredPermission}`
    };
  } catch (error) {
    console.error('Permission validation failed:', error);
    return {
      isValid: false,
      admin: null,
      error: 'Permission validation failed'
    };
  }
};

// Multiple permission validation
export const validateAnyPermission = async (requiredPermissions: Permission[]): Promise<{
  isValid: boolean;
  admin: Admin | null;
  error?: string;
}> => {
  try {
    const admin = await getCurrentAdmin();
    
    if (!admin) {
      return {
        isValid: false,
        admin: null,
        error: 'No authenticated admin found'
      };
    }
    
    if (!admin.isActive) {
      return {
        isValid: false,
        admin,
        error: 'Admin account is inactive'
      };
    }
    
    // Super admin has all permissions
    if (admin.role === 'super_admin') {
      return {
        isValid: true,
        admin,
      };
    }
    
    const hasAnyPermission = requiredPermissions.some(permission => 
      hasPermission(admin, permission)
    );
    
    return {
      isValid: hasAnyPermission,
      admin,
      error: hasAnyPermission ? undefined : `Missing required permissions: ${requiredPermissions.join(', ')}`
    };
  } catch (error) {
    console.error('Permission validation failed:', error);
    return {
      isValid: false,
      admin: null,
      error: 'Permission validation failed'
    };
  }
};

// Helper function for API protection
export const withPermissionCheck = async <T>(
  requiredPermission: Permission,
  operation: (admin: Admin) => Promise<T>
): Promise<T> => {
  const validation = await validatePermission(requiredPermission);
  
  if (!validation.isValid) {
    throw new Error(validation.error || 'Permission denied');
  }
  
  return operation(validation.admin!);
};

// Helper function for API protection with multiple permissions
export const withAnyPermissionCheck = async <T>(
  requiredPermissions: Permission[],
  operation: (admin: Admin) => Promise<T>
): Promise<T> => {
  const validation = await validateAnyPermission(requiredPermissions);
  
  if (!validation.isValid) {
    throw new Error(validation.error || 'Permission denied');
  }
  
  return operation(validation.admin!);
};