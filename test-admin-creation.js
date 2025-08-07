// 🧪 TEST ADMIN CREATION
// Quick test to verify the email-based admin system works
// Run this in browser console after logging in

console.log(`
🧪 ADMIN CREATION TEST
======================

This script will test the admin creation system to make sure
it works without database errors.
`);

async function testAdminCreation() {
  console.log('🧪 Testing admin creation system...\n');

  try {
    // Import functions
    const { getCurrentUser } = await import('./src/lib/auth/auth.js');
    const { linkAuthUserByEmail } = await import('./src/lib/admin/AdminFunctions.js');

    // Get current user
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      console.error('❌ Please log in first');
      return;
    }

    console.log('✅ Logged in as:', currentUser.email);
    
    // Create a test email (modify current user's email)
    const testEmail = currentUser.email.replace('@', '+admin-test@');
    
    console.log('🧪 Testing with email:', testEmail);
    console.log('📝 Note: This will likely fail with "user not found" but should NOT have database errors');
    
    // Test the creation
    const result = await linkAuthUserByEmail(
      testEmail,
      {
        name: 'Test Admin User',
        role: 'sales_admin',
        phone: '+1234567890'
      },
      currentUser.$id
    );

    if (result.success) {
      console.log('🎉 Unexpected success! Admin was created:');
      console.log(JSON.stringify(result.admin, null, 2));
    } else {
      console.log('📋 Expected result - user not found:');
      console.log('Error:', result.error);
      console.log('Action:', result.action);
      
      if (result.action === 'not_found') {
        console.log('✅ PERFECT! System working correctly - no database errors');
        console.log('✅ The "user not found" error is expected for test email');
      } else if (result.action === 'already_linked') {
        console.log('✅ System working - email already linked to admin');
      } else {
        console.log('⚠️  Unexpected action:', result.action);
      }
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error);
    
    if (error.message.includes('avatarUrl')) {
      console.log('🔧 STILL HAVING AVATAR URL ERROR - needs more fixes');
    } else if (error.message.includes('Invalid document structure')) {
      console.log('🔧 DOCUMENT STRUCTURE ERROR - check database schema');
    } else {
      console.log('🔧 OTHER ERROR - check console for details');
    }
  }
}

// Test with actual user email (if they want to create real admin)
async function testWithRealUser() {
  const email = prompt('Enter email of existing user to link to admin role:');
  if (!email) {
    console.log('❌ Test cancelled');
    return;
  }

  try {
    const { getCurrentUser } = await import('./src/lib/auth/auth.js');
    const { linkAuthUserByEmail } = await import('./src/lib/admin/AdminFunctions.js');

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      console.error('❌ Please log in first');
      return;
    }

    console.log('🔗 Attempting to link real user:', email);

    const result = await linkAuthUserByEmail(
      email,
      {
        name: prompt('Enter name for this admin:') || 'Admin User',
        role: 'sales_admin',
        phone: prompt('Enter phone (optional):') || ''
      },
      currentUser.$id
    );

    if (result.success) {
      console.log('🎉 SUCCESS! Real admin created:');
      console.log('Email:', result.admin?.email);
      console.log('Role:', result.admin?.role);
      console.log('✅ They can now access admin features!');
    } else {
      console.log('❌ Failed to create admin:');
      console.log('Error:', result.error);
      console.log('Action:', result.action);
    }

  } catch (error) {
    console.error('❌ Real user test failed:', error);
  }
}

console.log(`
📖 AVAILABLE TESTS:
===================

1. testAdminCreation()  - Safe test with fake email (recommended first)
2. testWithRealUser()   - Test with real user email

💡 Run testAdminCreation() first to verify system works!
`);

// Auto-run test
console.log('🚀 Running test in 2 seconds...'); 