import { databases, appwriteConfig, account } from '../appwrite';
import { ID, Query } from 'appwrite';
import { Admin, CreateAdminPayload, UpdateAdminPayload, Permission, AdminRole, ROLE_PERMISSIONS } from '../../types/AdminTypes';

/**
 * Fetch all admins from the database
 */
export async function fetchAdmins(): Promise<Admin[]> {
  try {
    const response = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.adminsCollectionId,
      [Query.limit(100), Query.orderDesc('$createdAt')]
    );

    const admins = response.documents.map((doc) => {
      const role = doc.role as AdminRole;
      
      // Use getEffectivePermissions logic to handle empty permissions arrays
      const hasCustomPermissions = doc.permissions && Array.isArray(doc.permissions) && doc.permissions.length > 0;
      const effectivePermissions = hasCustomPermissions ? doc.permissions : ROLE_PERMISSIONS[role];

      return {
        $id: doc.$id,
        adminId: doc.adminId,
        email: doc.email,
        name: doc.name,
        role: role,
        permissions: effectivePermissions,
        isActive: doc.isActive,
        createdBy: doc.createdBy,
        createdAt: doc.$createdAt,
        updatedAt: doc.$updatedAt,
        lastLogin: doc.lastLogin,
        phone: doc.phone,
        avatarUrl: doc.avatarUrl,
      };
    });

    return admins;
  } catch (error) {
    console.error('Error fetching admins:', error);
    return [];
  }
}

/**
 * Get admin by ID
 */
export async function getAdminById(adminId: string): Promise<Admin | null> {
  try {
    console.log('🔍 getAdminById: Searching for admin with ID:', adminId);
    
    // First try to find by adminId
    let response = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.adminsCollectionId,
      [Query.equal('adminId', adminId)]
    );

    console.log('🔍 getAdminById: Found documents by adminId:', response.documents.length);

    // If not found by adminId, try to find by email (as fallback)
    if (response.documents.length === 0) {
      console.log('🔍 getAdminById: Trying to find by email as fallback...');
      
      // Get current user to get email
      try {
        const { getCurrentUser } = await import('../auth/auth');
        const currentUser = await getCurrentUser();
        if (currentUser) {
          response = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.adminsCollectionId,
            [Query.equal('email', currentUser.email)]
          );
          console.log('🔍 getAdminById: Found documents by email:', response.documents.length);
        }
      } catch (error) {
        console.log('🔍 getAdminById: Error getting current user for email search:', error);
      }
    }

    if (response.documents.length === 0) {
      console.log('🔍 getAdminById: No admin found for ID:', adminId);
      return null;
    }

    const doc = response.documents[0];
    const role = doc.role as AdminRole;
    
    console.log('🔍 getAdminById: Found admin:', {
      email: doc.email,
      role: role,
      permissions: doc.permissions,
      isActive: doc.isActive
    });
    
    // Use getEffectivePermissions logic to handle empty permissions arrays
    const hasCustomPermissions = doc.permissions && Array.isArray(doc.permissions) && doc.permissions.length > 0;
    const effectivePermissions = hasCustomPermissions ? doc.permissions : ROLE_PERMISSIONS[role];

    console.log('🔍 getAdminById: Effective permissions:', effectivePermissions);

    return {
      $id: doc.$id,
      adminId: doc.adminId,
      email: doc.email,
      name: doc.name,
      role: role,
      permissions: effectivePermissions,
      isActive: doc.isActive,
      createdBy: doc.createdBy,
      createdAt: doc.$createdAt,
      updatedAt: doc.$updatedAt,
      lastLogin: doc.lastLogin,
      phone: doc.phone,
      avatarUrl: doc.avatarUrl,
    };
  } catch (error) {
    console.error('Error fetching admin by ID:', error);
    return null;
  }
}

/**
 * Create admin from existing auth user
 */
export async function createAdminFromExistingUser(
  userId: string,
  adminData: Omit<CreateAdminPayload, 'password'>,
  createdBy: string
): Promise<Admin> {
  try {
    console.log('Creating admin from existing user ID:', userId);

    // Validate admin data first
    const validation = validateAdminData(adminData);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    // Set default permissions based on role if not provided
    const permissions = adminData.permissions || ROLE_PERMISSIONS[adminData.role];
    console.log('Permissions for role', adminData.role, ':', permissions);

    // Create the admin document in the database
    console.log('Creating admin document in database...');
    const adminDoc = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.adminsCollectionId,
      ID.unique(),
      {
        adminId: userId,
        email: adminData.email,
        name: adminData.name,
        role: adminData.role,
        permissions: permissions,
        isActive: true,
        createdBy: createdBy,
        phone: adminData.phone || null,
        avatarUrl: null,
        lastLogin: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    );
    console.log('Admin document created with ID:', adminDoc.$id);

    return {
      $id: adminDoc.$id,
      adminId: adminDoc.adminId,
      email: adminDoc.email,
      name: adminDoc.name,
      role: adminDoc.role as AdminRole,
      permissions: adminDoc.permissions,
      isActive: adminDoc.isActive,
      createdBy: adminDoc.createdBy,
      createdAt: adminDoc.$createdAt,
      updatedAt: adminDoc.$updatedAt,
      lastLogin: adminDoc.lastLogin,
      phone: adminDoc.phone,
      avatarUrl: adminDoc.avatarUrl,
    };
  } catch (error: any) {
    console.error('Error creating admin from existing user:', error);
    throw new Error(error.message || 'Failed to create admin from existing user');
  }
}

/**
 * Create a new admin account
 */
export async function createAdmin(
  adminData: CreateAdminPayload,
  createdBy: string
): Promise<Admin> {
  try {
    console.log('Starting admin creation process...');
    console.log('Admin data:', { ...adminData, password: '[REDACTED]' });
    console.log('Database ID:', appwriteConfig.databaseId);
    console.log('Admins Collection ID:', appwriteConfig.adminsCollectionId);

    // Validate admin data first
    const validation = validateAdminData(adminData);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    let userResponse;
    
    try {
      // First, create the user account in Appwrite Auth
      console.log('Creating user in Appwrite Auth...');
      userResponse = await account.create(
        ID.unique(),
        adminData.email,
        adminData.password,
        adminData.name
      );
      console.log('User created in Auth with ID:', userResponse.$id);
    } catch (authError: any) {
      if (authError.code === 409 && authError.message.includes('email')) {
        throw new Error(`Email '${adminData.email}' already exists in Auth. Please use a different email or check Auth users in Appwrite Console.`);
      }
      throw authError;
    }

    // Set default permissions based on role if not provided
    const permissions = adminData.permissions || ROLE_PERMISSIONS[adminData.role];
    console.log('Permissions for role', adminData.role, ':', permissions);

    // Create the admin document in the database
    console.log('Creating admin document in database...');
    const adminDoc = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.adminsCollectionId,
      ID.unique(),
      {
        adminId: userResponse.$id,
        email: adminData.email,
        name: adminData.name,
        role: adminData.role,
        permissions: permissions,
        isActive: true,
        createdBy: createdBy,
        phone: adminData.phone || null,
        avatarUrl: null,
        lastLogin: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    );
    console.log('Admin document created with ID:', adminDoc.$id);

    return {
      $id: adminDoc.$id,
      adminId: adminDoc.adminId,
      email: adminDoc.email,
      name: adminDoc.name,
      role: adminDoc.role as AdminRole,
      permissions: adminDoc.permissions,
      isActive: adminDoc.isActive,
      createdBy: adminDoc.createdBy,
      createdAt: adminDoc.$createdAt,
      updatedAt: adminDoc.$updatedAt,
      lastLogin: adminDoc.lastLogin,
      phone: adminDoc.phone,
      avatarUrl: adminDoc.avatarUrl,
    };
  } catch (error: any) {
    console.error('Error creating admin:', error);
    
    // Provide more specific error messages
    if (error.code === 409) {
      if (error.message.includes('email')) {
        throw new Error('An account with this email already exists');
      }
      throw new Error('Conflict: ' + error.message);
    }
    
    if (error.code === 401) {
      throw new Error('Unauthorized: You do not have permission to create admin accounts');
    }
    
    if (error.code === 404) {
      throw new Error('Collection not found: Please ensure the admins collection exists in your Appwrite database');
    }
    
    if (error.message?.includes('Collection with the requested ID could not be found')) {
      throw new Error('Admins collection not found. Please create the collection in your Appwrite database first.');
    }
    
    if (error.message?.includes('Invalid document structure')) {
      throw new Error('Invalid data structure. Please check the admin data format.');
    }
    
    // Pass through validation errors
    if (error.message?.includes('Validation failed')) {
      throw error;
    }
    
    throw new Error(error.message || 'Failed to create admin account');
  }
}

/**
 * Update an admin account
 */
export async function updateAdmin(
  adminDocumentId: string,
  updateData: UpdateAdminPayload,
  updatedBy: string
): Promise<boolean> {
  try {
    const updatePayload: any = {
      updatedAt: new Date().toISOString(),
    };

    // Add only the fields that are being updated
    if (updateData.name !== undefined) updatePayload.name = updateData.name;
    if (updateData.role !== undefined) {
      updatePayload.role = updateData.role;
      // Update permissions based on new role if no custom permissions provided
      if (updateData.permissions === undefined) {
        updatePayload.permissions = ROLE_PERMISSIONS[updateData.role];
      }
    }
    if (updateData.permissions !== undefined) updatePayload.permissions = updateData.permissions;
    if (updateData.isActive !== undefined) updatePayload.isActive = updateData.isActive;
    if (updateData.phone !== undefined) updatePayload.phone = updateData.phone;
    if (updateData.avatarUrl !== undefined) updatePayload.avatarUrl = updateData.avatarUrl;

    await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.adminsCollectionId,
      adminDocumentId,
      updatePayload
    );

    return true;
  } catch (error) {
    console.error('Error updating admin:', error);
    return false;
  }
}

/**
 * Delete an admin account
 */
export async function deleteAdmin(adminDocumentId: string, adminId: string): Promise<boolean> {
  try {
    // First, delete the admin document from the database
    await databases.deleteDocument(
      appwriteConfig.databaseId,
      appwriteConfig.adminsCollectionId,
      adminDocumentId
    );

    // Note: We don't delete the user from Appwrite Auth to maintain audit trail
    // Instead, we could deactivate the account or let it be handled separately
    
    return true;
  } catch (error) {
    console.error('Error deleting admin:', error);
    return false;
  }
}

/**
 * Update admin's last login time
 */
export async function updateLastLogin(adminId: string): Promise<boolean> {
  try {
    const response = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.adminsCollectionId,
      [Query.equal('adminId', adminId)]
    );

    if (response.documents.length === 0) {
      return false;
    }

    await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.adminsCollectionId,
      response.documents[0].$id,
      {
        lastLogin: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    );

    return true;
  } catch (error) {
    console.error('Error updating last login:', error);
    return false;
  }
}

/**
 * Check if admin has a specific permission
 */
export function hasPermission(admin: Admin, permission: Permission): boolean {
  if (!admin.isActive) {
    console.log('🔍 hasPermission: Admin is inactive', { admin: admin.email, isActive: admin.isActive });
    return false;
  }

  // Super admin has all permissions
  if (admin.role === 'super_admin') {
    console.log('🔍 hasPermission: Super admin has all permissions', { admin: admin.email, permission });
    return true;
  }

  // Get effective permissions (role-based + custom)
  const effectivePermissions = getEffectivePermissions(admin);
  
  // Check if permission is in effective permissions
  const hasPermission = effectivePermissions.includes(permission);
  
  console.log('🔍 hasPermission Debug:', {
    adminEmail: admin.email,
    adminRole: admin.role,
    adminPermissions: admin.permissions,
    effectivePermissions: effectivePermissions,
    requiredPermission: permission,
    hasPermission: hasPermission
  });
  
  return hasPermission;
}

/**
 * Check if admin has any of the specified permissions
 */
export function hasAnyPermission(admin: Admin, permissions: Permission[]): boolean {
  if (!admin.isActive) {
    return false;
  }

  // Super admin has all permissions
  if (admin.role === 'super_admin') {
    return true;
  }

  // Get effective permissions (role-based + custom)
  const effectivePermissions = getEffectivePermissions(admin);
  
  // Check if any permission is in effective permissions
  return permissions.some(permission => effectivePermissions.includes(permission));
}

/**
 * Check if admin has all of the specified permissions
 */
export function hasAllPermissions(admin: Admin, permissions: Permission[]): boolean {
  if (!admin.isActive) {
    return false;
  }

  // Super admin has all permissions
  if (admin.role === 'super_admin') {
    return true;
  }

  // Get effective permissions (role-based + custom)
  const effectivePermissions = getEffectivePermissions(admin);
  
  // Check if all permissions are in effective permissions
  return permissions.every(permission => effectivePermissions.includes(permission));
}

/**
 * Get admin's effective permissions (combine role permissions with custom permissions)
 */
export function getEffectivePermissions(admin: Admin): Permission[] {
  if (!admin.isActive) {
    console.log('🔍 getEffectivePermissions: Admin is inactive', { admin: admin.email, isActive: admin.isActive });
    return [];
  }

  // Super admin has all permissions
  if (admin.role === 'super_admin') {
    console.log('🔍 getEffectivePermissions: Super admin - returning all permissions', { admin: admin.email });
    return ROLE_PERMISSIONS.super_admin;
  }

  // Check if admin has custom permissions set (not empty array)
  const hasCustomPermissions = admin.permissions && Array.isArray(admin.permissions) && admin.permissions.length > 0;
  
  // Debug ROLE_PERMISSIONS access
  console.log('🔍 getEffectivePermissions ROLE_PERMISSIONS Debug:', {
    adminRole: admin.role,
    availableRoles: Object.keys(ROLE_PERMISSIONS),
    rolePermissions: ROLE_PERMISSIONS[admin.role],
    hasCustomPermissions: hasCustomPermissions,
    adminPermissions: admin.permissions
  });
  
  // Return custom permissions if set, otherwise role permissions
  const effectivePermissions = hasCustomPermissions ? admin.permissions : ROLE_PERMISSIONS[admin.role];
  
  console.log('🔍 getEffectivePermissions Debug:', {
    adminEmail: admin.email,
    adminRole: admin.role,
    adminPermissions: admin.permissions,
    hasCustomPermissions: hasCustomPermissions,
    rolePermissions: ROLE_PERMISSIONS[admin.role],
    effectivePermissions: effectivePermissions
  });
  
  return effectivePermissions;
}

/**
 * Validate admin role and permissions
 */
export function validateAdminData(adminData: CreateAdminPayload | UpdateAdminPayload): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Validate role
  if ('role' in adminData && adminData.role) {
    if (!Object.keys(ROLE_PERMISSIONS).includes(adminData.role)) {
      errors.push('Invalid admin role');
    }
  }

  // Validate permissions
  if ('permissions' in adminData && adminData.permissions) {
    const validPermissions = Object.values(ROLE_PERMISSIONS).flat();
    const invalidPermissions = adminData.permissions.filter(
      permission => !validPermissions.includes(permission)
    );
    if (invalidPermissions.length > 0) {
      errors.push(`Invalid permissions: ${invalidPermissions.join(', ')}`);
    }
  }

  // Validate email format
  if ('email' in adminData && adminData.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(adminData.email)) {
      errors.push('Invalid email format');
    }
  }

  // Validate name
  if ('name' in adminData && adminData.name) {
    if (adminData.name.trim().length < 2) {
      errors.push('Name must be at least 2 characters long');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Search admins by name or email
 */
export async function searchAdmins(searchTerm: string): Promise<Admin[]> {
  try {
    const response = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.adminsCollectionId,
      [
        Query.search('name', searchTerm),
        Query.limit(50)
      ]
    );

    const admins = response.documents.map((doc) => {
      const role = doc.role as AdminRole;
      
      // Use getEffectivePermissions logic to handle empty permissions arrays
      const hasCustomPermissions = doc.permissions && Array.isArray(doc.permissions) && doc.permissions.length > 0;
      const effectivePermissions = hasCustomPermissions ? doc.permissions : ROLE_PERMISSIONS[role];

      return {
        $id: doc.$id,
        adminId: doc.adminId,
        email: doc.email,
        name: doc.name,
        role: role,
        permissions: effectivePermissions,
        isActive: doc.isActive,
        createdBy: doc.createdBy,
        createdAt: doc.$createdAt,
        updatedAt: doc.$updatedAt,
        lastLogin: doc.lastLogin,
        phone: doc.phone,
        avatarUrl: doc.avatarUrl,
      };
    });

    return admins;
  } catch (error) {
    console.error('Error searching admins:', error);
    return [];
  }
}

/**
 * Get admin statistics
 */
export async function getAdminStats(): Promise<{
  totalAdmins: number;
  activeAdmins: number;
  roleDistribution: Record<AdminRole, number>;
}> {
  try {
    const admins = await fetchAdmins();
    
    const stats = {
      totalAdmins: admins.length,
      activeAdmins: admins.filter(admin => admin.isActive).length,
      roleDistribution: {
        super_admin: 0,
        sales_admin: 0,
        inventory_admin: 0,
        customer_admin: 0,
        finance_admin: 0
      } as Record<AdminRole, number>
    };

    // Count role distribution
    admins.forEach(admin => {
      stats.roleDistribution[admin.role]++;
    });

    return stats;
  } catch (error) {
    console.error('Error getting admin stats:', error);
    return {
      totalAdmins: 0,
      activeAdmins: 0,
      roleDistribution: {
        super_admin: 0,
        sales_admin: 0,
        inventory_admin: 0,
        customer_admin: 0,
        finance_admin: 0
      }
    };
  }
} 

/**
 * Check if admin already exists in database by email
 */
export async function checkAdminExists(email: string): Promise<{
  exists: boolean;
  admin?: Admin;
  authUserExists?: boolean;
}> {
  try {
    // Check if admin exists in database
    const response = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.adminsCollectionId,
      [Query.equal('email', email)]
    );

    if (response.documents.length > 0) {
      const doc = response.documents[0];
      const admin: Admin = {
        $id: doc.$id,
        adminId: doc.adminId,
        email: doc.email,
        name: doc.name,
        role: doc.role as AdminRole,
        permissions: doc.permissions || ROLE_PERMISSIONS[doc.role as AdminRole],
        isActive: doc.isActive,
        createdBy: doc.createdBy,
        createdAt: doc.$createdAt,
        updatedAt: doc.$updatedAt,
        lastLogin: doc.lastLogin,
        phone: doc.phone,
        avatarUrl: doc.avatarUrl,
      };
      
      return { exists: true, admin };
    }

    // Check if auth user exists by trying to create with same email
    try {
      await account.create(ID.unique(), email, 'temp-password-check', 'Temp User');
      // If we reach here, email doesn't exist in auth
      return { exists: false, authUserExists: false };
    } catch (authError: any) {
      if (authError.code === 409) {
        // Email exists in auth but not in admin database
        return { exists: false, authUserExists: true };
      }
      throw authError;
    }
  } catch (error) {
    console.error('Error checking admin existence:', error);
    return { exists: false };
  }
}

/**
 * Get auth user ID by email (requires session with appropriate permissions)
 */
export async function findAuthUserByEmail(email: string): Promise<string | null> {
  try {
    // Unfortunately, Appwrite doesn't provide a direct way to search users by email from client
    // This would need to be done from server-side or admin panel
    console.log('To find auth user ID, check Appwrite Console → Auth → Users for email:', email);
    return null;
  } catch (error) {
    console.error('Error finding auth user:', error);
    return null;
  }
}

/**
 * Smart admin creation that handles existing emails
 */
export async function smartCreateAdmin(
  adminData: CreateAdminPayload,
  createdBy: string,
  options: {
    handleExistingAuth?: boolean;
    forceRecreate?: boolean;
  } = {}
): Promise<{
  success: boolean;
  admin?: Admin;
  error?: string;
  action?: 'created' | 'linked' | 'exists' | 'error';
  authUserId?: string;
}> {
  try {
    console.log('🔍 Smart admin creation for:', adminData.email);
    
    // Step 1: Check if admin already exists
    const existsCheck = await checkAdminExists(adminData.email);
    
    if (existsCheck.exists) {
      return {
        success: false,
        admin: existsCheck.admin,
        error: `Admin with email ${adminData.email} already exists in database`,
        action: 'exists'
      };
    }

    // Step 2: Handle auth user existence
    if (existsCheck.authUserExists) {
      if (!options.handleExistingAuth) {
        return {
          success: false,
          error: `Email ${adminData.email} exists in Auth. Use handleExistingAuth option or different email.`,
          action: 'error'
        };
      }

      // Need user ID to link existing auth user
      return {
        success: false,
        error: `Email exists in Auth. Please provide the User ID from Appwrite Console → Auth → Users to link this account.`,
        action: 'error'
      };
    }

    // Step 3: Create fresh admin (no conflicts)
    const admin = await createAdmin(adminData, createdBy);
    return {
      success: true,
      admin,
      action: 'created'
    };

  } catch (error: any) {
    console.error('Smart admin creation failed:', error);
    return {
      success: false,
      error: error.message || 'Failed to create admin',
      action: 'error'
    };
  }
}

/**
 * Link existing auth user to admin role
 */
export async function linkAuthUserToAdmin(
  authUserId: string,
  adminData: Omit<CreateAdminPayload, 'password'>,
  createdBy: string
): Promise<{
  success: boolean;
  admin?: Admin;
  error?: string;
}> {
  try {
    console.log('🔗 Linking existing auth user to admin role:', authUserId);
    
    // Check if this auth user is already linked to an admin
    const existingAdmin = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.adminsCollectionId,
      [Query.equal('adminId', authUserId)]
    );

    if (existingAdmin.documents.length > 0) {
      return {
        success: false,
        error: 'This auth user is already linked to an admin account'
      };
    }

    // Create admin record for existing auth user
    const admin = await createAdminFromExistingUser(authUserId, adminData, createdBy);
    
    return {
      success: true,
      admin
    };
  } catch (error: any) {
    console.error('Error linking auth user to admin:', error);
    return {
      success: false,
      error: error.message || 'Failed to link auth user to admin'
    };
  }
}

/**
 * Auto-recovery: Try to automatically handle email conflicts
 */
export async function autoRecoverAdminCreation(
  adminData: CreateAdminPayload,
  createdBy: string
): Promise<{
  success: boolean;
  admin?: Admin;
  error?: string;
  suggestions?: string[];
}> {
  console.log('🔄 Auto-recovery for admin creation:', adminData.email);
  
  const suggestions: string[] = [];
  
  try {
    // First, try smart creation
    const smartResult = await smartCreateAdmin(adminData, createdBy);
    
    if (smartResult.success) {
      return {
        success: true,
        admin: smartResult.admin
      };
    }

    // If email exists in auth, provide suggestions
    if (smartResult.error?.includes('exists in Auth')) {
      suggestions.push(
        `Go to Appwrite Console → Auth → Users and search for "${adminData.email}"`,
        'Copy the User ID from that user',
        'Use the "Link Existing User" option in the admin panel',
        'Or delete the orphaned auth user and try again'
      );
    }

    // Generate alternative email suggestions
    const timestamp = Date.now();
    const emailParts = adminData.email.split('@');
    const alternatives = [
      `${emailParts[0]}-admin@${emailParts[1]}`,
      `${emailParts[0]}-${timestamp}@${emailParts[1]}`,
      `admin-${emailParts[0]}@${emailParts[1]}`,
      `system-${emailParts[0]}@${emailParts[1]}`
    ];

    suggestions.push('Alternative emails you can try:');
    alternatives.forEach(email => suggestions.push(`• ${email}`));

    return {
      success: false,
      error: smartResult.error,
      suggestions
    };

  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Auto-recovery failed',
      suggestions: ['Check console logs for detailed error information']
    };
  }
}

/**
 * Get orphaned auth users (exists in auth but not in admin database)
 */
export async function getOrphanedAuthUsers(): Promise<{
  instructions: string[];
  adminEmails: string[];
}> {
  try {
    const admins = await fetchAdmins();
    const adminEmails = admins.map(admin => admin.email);
    
    const instructions = [
      '🔍 FINDING ORPHANED AUTH USERS:',
      '',
      '1. Go to: https://cloud.appwrite.io',
      '2. Navigate to: Your Project → Auth → Users',
      '3. Look for emails that are NOT in this list:',
      ...adminEmails.map(email => `   ✅ ${email}`),
      '',
      '4. Any other emails you see are orphaned auth users',
      '5. You can either:',
      '   • Delete the orphaned auth users',
      '   • Link them to admin accounts using their User ID',
      '',
      '💡 TIP: Safe emails that should exist as admins are listed above'
    ];

    return {
      instructions,
      adminEmails
    };
  } catch (error) {
    console.error('Error getting orphaned auth users:', error);
    return {
      instructions: ['Error fetching admin data. Check console for details.'],
      adminEmails: []
    };
  }
} 

/**
 * Link existing auth user to admin role by email
 */
export async function linkAuthUserByEmail(
  email: string,
  adminData: Omit<CreateAdminPayload, 'password' | 'email'>,
  createdBy: string
): Promise<{
  success: boolean;
  admin?: Admin;
  error?: string;
  action?: 'linked' | 'not_found' | 'already_linked' | 'error';
}> {
  try {
    console.log('🔗 Linking existing auth user by email:', email);
    
    // First check if this email is already linked to an admin
    const existingAdminCheck = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.adminsCollectionId,
      [Query.equal('email', email)]
    );

    if (existingAdminCheck.documents.length > 0) {
      return {
        success: false,
        error: `Email ${email} is already linked to an admin account`,
        action: 'already_linked'
      };
    }

    // Note: We can't directly check if a user exists in Appwrite auth from client-side
    // So we'll proceed with creating the admin record and let the user login to sync
    // If the user doesn't exist, they simply won't be able to log in as admin

    // Since we can't get the user ID directly from client-side Appwrite,
    // we'll create the admin record using email as identifier
    // The user will need to have an active session or we'll need server-side approach
    
    // For now, let's create admin record with email and handle user ID linking later
    const adminRecord = await createAdminRecordByEmail(email, adminData, createdBy);
    
    return {
      success: true,
      admin: adminRecord,
      action: 'linked'
    };

  } catch (error: any) {
    console.error('Error linking auth user by email:', error);
    return {
      success: false,
      error: error.message || 'Failed to link auth user by email',
      action: 'error'
    };
  }
}

/**
 * Create admin record using email (for linking existing auth users)
 */
export async function createAdminRecordByEmail(
  email: string,
  adminData: Omit<CreateAdminPayload, 'password' | 'email'>,
  createdBy: string
): Promise<Admin> {
  try {
    // Generate a unique admin ID for the database record
    const adminId = ID.unique();
    
    // Only include required fields and optional fields with values
    const currentTime = new Date().toISOString();
    const payload: any = {
      adminId: adminId, // This will be updated when user logs in
      email: email,
      name: adminData.name,
      role: adminData.role,
      permissions: ROLE_PERMISSIONS[adminData.role],
      isActive: true,
      createdBy: createdBy,
      createdAt: currentTime,
      updatedAt: currentTime
    };

    // Only add optional fields if they have values
    if (adminData.phone && adminData.phone.trim()) {
      payload.phone = adminData.phone.trim();
    }

    console.log('Creating admin record with payload:', payload);

    const response = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.adminsCollectionId,
      ID.unique(),
      payload
    );

    const admin: Admin = {
      $id: response.$id,
      adminId: response.adminId,
      email: response.email,
      name: response.name,
      role: response.role as AdminRole,
      permissions: response.permissions || ROLE_PERMISSIONS[response.role as AdminRole],
      isActive: response.isActive,
      createdBy: response.createdBy,
      createdAt: response.$createdAt,
      updatedAt: response.$updatedAt,
      lastLogin: response.lastLogin || null,
      phone: response.phone || '',
      avatarUrl: response.avatarUrl || '',
    };

    console.log('✅ Admin record created successfully:', admin.email);
    return admin;

  } catch (error: any) {
    console.error('❌ Failed to create admin record:', error);
    
    // Enhanced error handling
    if (error.code === 409) {
      throw new Error(`Admin record with this email already exists`);
    } else if (error.code === 401) {
      throw new Error('Unauthorized. Check your permissions.');
    } else if (error.code === 404) {
      throw new Error('Admins collection not found. Check your database setup.');
    } else {
      throw new Error(error.message || 'Failed to create admin record');
    }
  }
}

/**
 * Update admin record with actual user ID when user logs in
 */
export async function syncAdminWithAuthUser(email: string, userId: string): Promise<void> {
  try {
    const adminQuery = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.adminsCollectionId,
      [Query.equal('email', email)]
    );

    if (adminQuery.documents.length > 0) {
      const adminDoc = adminQuery.documents[0];
      
      // Only update if adminId is different (avoid unnecessary updates)
      if (adminDoc.adminId !== userId) {
        const updatePayload: any = {
          adminId: userId,
          updatedAt: new Date().toISOString()
        };

        // Only set lastLogin if the field exists and is not already set
        updatePayload.lastLogin = new Date().toISOString();
        
        await databases.updateDocument(
          appwriteConfig.databaseId,
          appwriteConfig.adminsCollectionId,
          adminDoc.$id,
          updatePayload
        );
        
        console.log('✅ Admin record synced with auth user:', email);
      }
    }
  } catch (error) {
    console.error('Failed to sync admin with auth user:', error);
  }
} 