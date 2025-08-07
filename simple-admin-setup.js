// 🎯 SIMPLE EMAIL-BASED ADMIN SETUP
// Easy way to link existing users to admin roles
// Run this in your browser console after logging in

console.log(`
🎯 SIMPLE ADMIN SETUP
=====================

This script helps you link existing user accounts to admin roles.
No more email conflicts - just simple email-based linking!

⚠️  REQUIREMENTS:
1. You must be logged in to your app
2. The user whose email you want to link must already have an account
3. You need Super Admin permissions to create admins

📖 HOW IT WORKS:
- Enter email of existing user
- Choose their admin role
- System links their account to admin permissions
- They can immediately access admin features
`);

async function linkUserToAdmin() {
  console.log('🔗 Starting email-based admin linking...\n');

  try {
    // Import necessary functions
    const { getCurrentUser } = await import('./src/lib/auth/auth.js');
    const { linkAuthUserByEmail } = await import('./src/lib/admin/AdminFunctions.js');

    // Step 1: Check authentication
    console.log('Step 1: Checking authentication...');
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      console.error('❌ ERROR: You must be logged in first!');
      console.log('\n📋 TO FIX:');
      console.log('1. Go to your app login page');
      console.log('2. Log in with any existing account');
      console.log('3. Come back and run this script again');
      return;
    }
    console.log('✅ Authenticated as:', currentUser.email);

    // Step 2: Get user details
    const email = prompt('Enter email of user to make admin (they must already have an account):');
    if (!email) {
      console.log('❌ Setup cancelled - email required');
      return;
    }

    const name = prompt('Enter full name for this admin:') || 'Admin User';
    
    // Step 3: Choose role
    console.log('\n📋 AVAILABLE ROLES:');
    console.log('1. super_admin - Full access to everything');
    console.log('2. sales_admin - Access to orders and customers');
    console.log('3. inventory_admin - Access to products and inventory');
    console.log('4. customer_admin - Access to customers and orders');
    console.log('5. finance_admin - Access to financial reports and pricing');
    
    const roleChoice = prompt('Choose role (1-5):');
    const roles = {
      '1': 'super_admin',
      '2': 'sales_admin',
      '3': 'inventory_admin',
      '4': 'customer_admin',
      '5': 'finance_admin'
    };
    
    const role = roles[roleChoice] || 'sales_admin';
    
    const phone = prompt('Enter phone number (optional):') || '';

    console.log('\n🔄 Linking user to admin role...');
    console.log('Email:', email);
    console.log('Name:', name);
    console.log('Role:', role);

    // Step 4: Link user
    const result = await linkAuthUserByEmail(
      email,
      { name, role, phone },
      currentUser.$id
    );

    if (result.success) {
      console.log('\n🎉 SUCCESS! User linked to admin role!');
      console.log('='.repeat(50));
      console.log('✅ Email:', email);
      console.log('✅ Name:', name);
      console.log('✅ Role:', role);
      console.log('\n🎯 WHAT HAPPENS NEXT:');
      console.log('1. User can now access admin features');
      console.log('2. They will see admin tabs based on their role');
      console.log('3. No password change needed - they use existing credentials');
      console.log('4. Admin permissions are active immediately');
      console.log('\n🚀 Setup complete!');
    } else {
      console.log('\n❌ Failed to link user to admin role');
      console.log('Error:', result.error);
      
      if (result.action === 'not_found') {
        console.log('\n💡 SOLUTION:');
        console.log('1. Ask the user to create an account first');
        console.log('2. Have them go to your app and sign up');
        console.log('3. Then run this script again with their email');
      } else if (result.action === 'already_linked') {
        console.log('\n💡 SOLUTION:');
        console.log('1. This email is already an admin');
        console.log('2. Check your admin panel to see their current role');
        console.log('3. You can update their role from the admin interface');
      }
      
      console.log('\n🔧 ALTERNATIVE SOLUTIONS:');
      console.log('• Try a different email address');
      console.log('• Check spelling of the email');
      console.log('• Verify the user has created an account');
    }

  } catch (error) {
    console.error('❌ Setup failed:', error);
    console.log('\n🔧 TROUBLESHOOTING:');
    console.log('1. Make sure you\'re logged in to your app');
    console.log('2. Check that the admins collection exists in Appwrite');
    console.log('3. Verify you have Super Admin permissions');
    console.log('4. Check browser console for detailed errors');
  }
}

// Quick setup function for testing
async function quickTestAdmin() {
  const currentUser = await import('./src/lib/auth/auth.js').then(m => m.getCurrentUser());
  const user = await currentUser();
  
  if (!user) {
    console.log('❌ Please log in first');
    return;
  }
  
  // Use current user's email with a test suffix
  const testEmail = user.email.replace('@', '-test@');
  
  console.log('🧪 QUICK TEST SETUP');
  console.log('This will try to link a test email to admin role');
  console.log('Test email:', testEmail);
  console.log('Note: This will likely fail since test email probably doesn\'t exist');
  console.log('But it demonstrates the process!');
  
  const { linkAuthUserByEmail } = await import('./src/lib/admin/AdminFunctions.js');
  
  const result = await linkAuthUserByEmail(
    testEmail,
    {
      name: 'Test Admin',
      role: 'sales_admin',
      phone: '+1234567890'
    },
    user.$id
  );
  
  console.log('Result:', result);
}

// Show available functions
console.log(`
📖 AVAILABLE FUNCTIONS:
========================

1. linkUserToAdmin()     - Interactive setup to link user to admin role
2. quickTestAdmin()      - Quick test (will likely fail, but shows process)

💡 RECOMMENDED: Run linkUserToAdmin()

Example: linkUserToAdmin()
`);

// Auto-run interactive setup
console.log('🎯 Starting interactive setup in 3 seconds...');
console.log('Press Ctrl+C or close this if you want to run manually');

setTimeout(() => {
  linkUserToAdmin();
}, 3000); 