// Setup script for first Super Admin
// Run this in your browser console after logging in to your app

async function setupFirstSuperAdmin() {
  const { createAdmin } = await import('./src/lib/admin/AdminFunctions.js');
  
  const adminData = {
    email: 'your-email@company.com', // 👈 Change this to your email
    name: 'Super Admin',
    role: 'super_admin',
    password: 'temporary-password-123', // 👈 Change this password
    phone: '+1234567890' // Optional
  };
  
  try {
    console.log('Creating first Super Admin...');
    const admin = await createAdmin(adminData, 'system-setup');
    console.log('✅ Super Admin created successfully:', admin);
    console.log('🔑 You can now login with:', adminData.email);
    console.log('🔒 Password:', adminData.password);
    console.log('⚠️ Please change this password after first login');
  } catch (error) {
    console.error('❌ Failed to create Super Admin:', error);
  }
}

// Run the setup
setupFirstSuperAdmin(); 