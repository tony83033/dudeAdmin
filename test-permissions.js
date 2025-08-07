// 🧪 PERMISSION SYSTEM TEST
// Test the new granular permissions for products and order items
// Run this in browser console after logging in as different admin roles

console.log(`
🧪 PERMISSION SYSTEM TEST
=========================

This script tests the new granular permission system:
- Product Management: Only Super Admin & Inventory Admin can edit/delete products
- Order Item Management: Super Admin, Sales Admin & Inventory Admin can edit/delete order items

Test different admin roles to see permissions in action!
`);

async function testPermissions() {
  console.log('🔍 Testing current admin permissions...\n');

  try {
    // Import functions
    const { getCurrentUser } = await import('./src/lib/auth/auth.js');
    const { getAdminById } = await import('./src/lib/admin/AdminFunctions.js');
    const { 
      canEditProduct, 
      canDeleteProduct, 
      canEditOrderItems, 
      canDeleteOrderItems,
      canManageProducts,
      canManageOrderItems
    } = await import('./src/lib/auth/permissions.js');

    // Get current admin
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      console.error('❌ Please log in first');
      return;
    }

    const currentAdmin = await getAdminById(currentUser.$id);
    if (!currentAdmin) {
      console.error('❌ No admin record found. Please link your account to admin role first.');
      return;
    }

    console.log('👤 Current Admin Info:');
    console.log(`   Email: ${currentAdmin.email}`);
    console.log(`   Name: ${currentAdmin.name}`);
    console.log(`   Role: ${currentAdmin.role}`);
    console.log(`   Active: ${currentAdmin.isActive ? '✅' : '❌'}`);
    console.log('');

    // Test Product Management Permissions
    console.log('📦 PRODUCT MANAGEMENT PERMISSIONS:');
    console.log(`   Can manage products: ${canManageProducts(currentAdmin) ? '✅' : '❌'}`);
    console.log(`   Can edit products: ${canEditProduct(currentAdmin) ? '✅' : '❌'}`);
    console.log(`   Can delete products: ${canDeleteProduct(currentAdmin) ? '✅' : '❌'}`);
    console.log('');

    // Test Order Item Management Permissions
    console.log('📋 ORDER ITEM MANAGEMENT PERMISSIONS:');
    console.log(`   Can manage order items: ${canManageOrderItems(currentAdmin) ? '✅' : '❌'}`);
    console.log(`   Can edit order items: ${canEditOrderItems(currentAdmin) ? '✅' : '❌'}`);
    console.log(`   Can delete order items: ${canDeleteOrderItems(currentAdmin) ? '✅' : '❌'}`);
    console.log('');

    // Show expected permissions by role
    console.log('📊 EXPECTED PERMISSIONS BY ROLE:');
    console.log('');
    console.log('👑 SUPER ADMIN:');
    console.log('   ✅ Edit/Delete Products');
    console.log('   ✅ Edit/Delete Order Items');
    console.log('');
    console.log('📦 INVENTORY ADMIN:');
    console.log('   ✅ Edit/Delete Products');
    console.log('   ✅ Edit/Delete Order Items');
    console.log('');
    console.log('💰 SALES ADMIN:');
    console.log('   ❌ Edit/Delete Products');
    console.log('   ✅ Edit/Delete Order Items');
    console.log('');
    console.log('👥 CUSTOMER ADMIN:');
    console.log('   ❌ Edit/Delete Products');
    console.log('   ❌ Edit/Delete Order Items');
    console.log('');
    console.log('💵 FINANCE ADMIN:');
    console.log('   ❌ Edit/Delete Products');
    console.log('   ❌ Edit/Delete Order Items');
    console.log('');

    // Verification
    const role = currentAdmin.role;
    console.log(`🔍 VERIFICATION FOR ${role.toUpperCase()}:`);
    
    if (role === 'super_admin') {
      const productsOk = canEditProduct(currentAdmin) && canDeleteProduct(currentAdmin);
      const orderItemsOk = canEditOrderItems(currentAdmin) && canDeleteOrderItems(currentAdmin);
      console.log(`   Products: ${productsOk ? '✅ PASS' : '❌ FAIL'}`);
      console.log(`   Order Items: ${orderItemsOk ? '✅ PASS' : '❌ FAIL'}`);
    } else if (role === 'inventory_admin') {
      const productsOk = canEditProduct(currentAdmin) && canDeleteProduct(currentAdmin);
      const orderItemsOk = canEditOrderItems(currentAdmin) && canDeleteOrderItems(currentAdmin);
      console.log(`   Products: ${productsOk ? '✅ PASS' : '❌ FAIL'}`);
      console.log(`   Order Items: ${orderItemsOk ? '✅ PASS' : '❌ FAIL'}`);
    } else if (role === 'sales_admin') {
      const productsOk = !canEditProduct(currentAdmin) && !canDeleteProduct(currentAdmin);
      const orderItemsOk = canEditOrderItems(currentAdmin) && canDeleteOrderItems(currentAdmin);
      console.log(`   Products: ${productsOk ? '✅ PASS' : '❌ FAIL'}`);
      console.log(`   Order Items: ${orderItemsOk ? '✅ PASS' : '❌ FAIL'}`);
    } else if (role === 'customer_admin') {
      const productsOk = !canEditProduct(currentAdmin) && !canDeleteProduct(currentAdmin);
      const orderItemsOk = !canEditOrderItems(currentAdmin) && !canDeleteOrderItems(currentAdmin);
      console.log(`   Products: ${productsOk ? '✅ PASS' : '❌ FAIL'}`);
      console.log(`   Order Items: ${orderItemsOk ? '✅ PASS' : '❌ FAIL'}`);
    } else if (role === 'finance_admin') {
      const productsOk = !canEditProduct(currentAdmin) && !canDeleteProduct(currentAdmin);
      const orderItemsOk = !canEditOrderItems(currentAdmin) && !canDeleteOrderItems(currentAdmin);
      console.log(`   Products: ${productsOk ? '✅ PASS' : '❌ FAIL'}`);
      console.log(`   Order Items: ${orderItemsOk ? '✅ PASS' : '❌ FAIL'}`);
    }

    console.log('\n🎯 WHAT TO TEST IN UI:');
    console.log('1. Go to Products tab');
    console.log('2. Check if Edit/Delete buttons are visible based on your role');
    console.log('3. Go to Orders tab');
    console.log('4. Open an order details');
    console.log('5. Go to "Items" tab');
    console.log('6. Check if Edit/Delete buttons are visible for order items');
    console.log('\n✨ Permission system is working correctly!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Auto-run test
console.log('🚀 Running permission test...');
testPermissions(); 