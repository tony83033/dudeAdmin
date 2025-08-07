// Utility script to find and clean up orphaned auth users
// Run this in your browser console after logging in as admin

async function findOrphanedAuthUsers() {
  console.log('🔍 Checking for orphaned auth users...\n');
  
  try {
    // Import necessary functions
    const { databases, appwriteConfig } = await import('./src/lib/appwrite.js');
    const { fetchAdmins } = await import('./src/lib/admin/AdminFunctions.js');
    
    // Get all admin records from database
    console.log('📋 Fetching admin records from database...');
    const admins = await fetchAdmins();
    console.log(`Found ${admins.length} admin records in database`);
    
    // Extract adminIds (these are the auth user IDs)
    const adminUserIds = admins.map(admin => admin.adminId);
    console.log('Admin user IDs in database:', adminUserIds);
    
    console.log('\n🎯 To check for orphaned users:');
    console.log('1. Go to Appwrite Console → Auth → Users');
    console.log('2. Look for users that are NOT in this list:', adminUserIds);
    console.log('3. Those are likely orphaned auth accounts');
    
    console.log('\n📧 If you want to create admin for existing email:');
    console.log('1. Find the user ID in Auth → Users');
    console.log('2. Use the createAdminFromExistingUser function');
    
    return { admins, adminUserIds };
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Function to create admin from existing auth user
async function createAdminFromExistingAuthUser(userEmail, userName, userRole = 'sales_admin') {
  console.log(`🔧 Creating admin record for existing user: ${userEmail}`);
  
  try {
    const { createAdminFromExistingUser } = await import('./src/lib/admin/AdminFunctions.js');
    const { getCurrentUser } = await import('./src/lib/auth/auth.js');
    
    // You'll need to manually get the user ID from Appwrite Console
    const userId = prompt('Enter the User ID from Appwrite Console → Auth → Users:');
    if (!userId) {
      console.log('❌ User ID is required');
      return;
    }
    
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      console.log('❌ You need to be logged in');
      return;
    }
    
    const adminData = {
      email: userEmail,
      name: userName,
      role: userRole,
      phone: '' // Optional
    };
    
    const admin = await createAdminFromExistingUser(userId, adminData, currentUser.$id);
    console.log('✅ Admin created successfully:', admin);
    
  } catch (error) {
    console.error('❌ Error creating admin:', error);
  }
}

// Usage examples:
console.log('📖 Available functions:');
console.log('1. findOrphanedAuthUsers() - Check for orphaned users');
console.log('2. createAdminFromExistingAuthUser("email@example.com", "Name", "super_admin") - Create admin from existing user');

// Run the check
findOrphanedAuthUsers(); 