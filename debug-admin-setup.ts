// Debug script for admin setup issues
// Run this in your browser console or create a temporary page to test

import { databases, appwriteConfig, account } from './src/lib/appwrite';
import { getCurrentUser } from './src/lib/auth/auth';

export async function debugAdminSetup() {
  console.log('🔍 Starting Admin Setup Diagnostics...\n');

  // 1. Check Appwrite Configuration
  console.log('📋 Appwrite Configuration:');
  console.log('  Project ID:', appwriteConfig.projectId);
  console.log('  Database ID:', appwriteConfig.databaseId);
  console.log('  Admins Collection ID:', appwriteConfig.adminsCollectionId);
  console.log('  Endpoint:', appwriteConfig.endpoint);
  console.log('');

  // 2. Check Authentication
  console.log('🔐 Authentication Check:');
  try {
    const currentUser = await getCurrentUser();
    if (currentUser) {
      console.log('  ✅ User authenticated:', currentUser.email);
      console.log('  User ID:', currentUser.$id);
    } else {
      console.log('  ❌ No authenticated user');
      return;
    }
  } catch (error) {
    console.log('  ❌ Authentication error:', error);
    return;
  }
  console.log('');

  // 3. Check Database Connection
  console.log('💾 Database Connection:');
  try {
    // Test basic database access by trying to list documents from any collection
    await databases.listDocuments(appwriteConfig.databaseId, appwriteConfig.userCollectionId, []);
    console.log('  ✅ Database accessible');
  } catch (error: any) {
    console.log('  ❌ Database error:', error.message);
    return;
  }
  console.log('');

  // 4. Check Admins Collection
  console.log('👥 Admins Collection Check:');
  try {
    const adminsCollection = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.adminsCollectionId,
      []
    );
    console.log('  ✅ Admins collection accessible');
    console.log('  Total admins:', adminsCollection.total);
    
    if (adminsCollection.documents.length > 0) {
      console.log('  Existing admins:');
      adminsCollection.documents.forEach(admin => {
        console.log(`    - ${admin.name} (${admin.email}) - Role: ${admin.role}`);
      });
    } else {
      console.log('  ⚠️ No admins found - you need to create the first admin');
    }
  } catch (error: any) {
    console.log('  ❌ Admins collection error:', error.message);
    if (error.code === 404) {
      console.log('  📝 Solution: Create the admins collection in your Appwrite dashboard');
      console.log('     or deploy the collection using: npx appwrite deploy collection');
    }
  }
  console.log('');

  // 5. Test Document Creation (if collection exists)
  console.log('🧪 Testing Document Creation:');
  try {
    // Try to create a test document (then delete it)
    const testDoc = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.adminsCollectionId,
      'test-doc-id',
      {
        adminId: 'test-admin-id',
        email: 'test@example.com',
        name: 'Test Admin',
        role: 'sales_admin',
        permissions: ['users.view'],
        isActive: true,
        createdBy: 'system-test',
        phone: null,
        avatarUrl: null,
        lastLogin: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    );
    
    // Delete the test document
    await databases.deleteDocument(
      appwriteConfig.databaseId,
      appwriteConfig.adminsCollectionId,
      'test-doc-id'
    );
    
    console.log('  ✅ Document creation/deletion successful');
  } catch (error: any) {
    console.log('  ❌ Document creation failed:', error.message);
    if (error.code === 401) {
      console.log('  📝 Solution: Check collection permissions in Appwrite dashboard');
    }
  }
  console.log('');

  // 6. Check Auth Account Creation
  console.log('🔑 Testing Auth Account Creation:');
  try {
    // Try to create a test account (then delete it)
    const testUser = await account.create(
      'test-user-id-' + Date.now(),
      'test-' + Date.now() + '@example.com',
      'test-password-123',
      'Test User'
    );
    
    console.log('  ✅ Auth account creation successful');
    
    // Note: We can't easily delete the test user from client side
    // This is expected behavior
  } catch (error: any) {
    console.log('  ❌ Auth account creation failed:', error.message);
  }
  console.log('');

  console.log('🎯 Diagnostics Complete!');
  console.log('');
  console.log('📋 Next Steps:');
  console.log('1. If admins collection is missing, create it using the appwrite.json config');
  console.log('2. Ensure your user has proper permissions on the collection');
  console.log('3. Try creating an admin again with better error logging');
}

// Usage:
// debugAdminSetup(); 