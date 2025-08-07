// Auth Cleanup Helper Script
// Run this in browser console to understand your auth situation

async function diagnoseProblem() {
  console.log('🔍 DIAGNOSING AUTH USERS PROBLEM\n');
  
  try {
    // Check what's in the admin database
    const { fetchAdmins } = await import('./src/lib/admin/AdminFunctions.js');
    const admins = await fetchAdmins();
    
    console.log('📊 CURRENT STATE:');
    console.log(`✅ Admin records in database: ${admins.length}`);
    
    if (admins.length > 0) {
      console.log('\n👥 Existing admin emails in database:');
      admins.forEach((admin, index) => {
        console.log(`   ${index + 1}. ${admin.email} (${admin.role})`);
      });
    } else {
      console.log('⚠️  No admin records found in database');
    }
    
    console.log('\n🔍 NEXT STEPS:');
    console.log('1. Go to: Appwrite Console → Auth → Users');
    console.log('2. You will see ALL auth users (including orphaned ones)');
    console.log('3. Delete any users that are NOT in the list above');
    console.log('4. Or use a completely fresh email like: admin-new-' + Date.now() + '@yourcompany.com');
    
    console.log('\n🎯 RECOMMENDED FRESH EMAILS TO TRY:');
    const timestamp = Date.now();
    const freshEmails = [
      `admin-${timestamp}@yourcompany.com`,
      `superadmin-${timestamp}@yourcompany.com`,
      `systemadmin@yourcompany.com`,
      `mainAdmin@yourcompany.com`
    ];
    
    freshEmails.forEach((email, index) => {
      console.log(`   ${index + 1}. ${email}`);
    });
    
    return { admins, freshEmails };
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Function to test email availability (simulation)
function suggestFreshEmail() {
  const timestamp = Date.now();
  const suggestions = [
    `admin-${timestamp}@company.com`,
    `superuser-${timestamp}@company.com`,
    `root-${timestamp}@company.com`,
    `master-admin@company.com`
  ];
  
  console.log('🆕 GUARANTEED FRESH EMAIL SUGGESTIONS:');
  suggestions.forEach((email, index) => {
    console.log(`   ${index + 1}. ${email}`);
  });
  
  return suggestions[0]; // Return the first one
}

// Manual cleanup instructions
function showCleanupInstructions() {
  console.log('\n🧹 MANUAL CLEANUP INSTRUCTIONS:');
  console.log('');
  console.log('1. Open new tab: https://cloud.appwrite.io');
  console.log('2. Go to your project');
  console.log('3. Click: Auth → Users');
  console.log('4. You will see a list like:');
  console.log('   - user1@example.com (Created: today)');
  console.log('   - admin@r.com (Created: today)');
  console.log('   - admin2@r.com (Created: today)');
  console.log('5. DELETE users that you don\'t need');
  console.log('6. Keep only users that should exist');
  console.log('');
  console.log('💡 TIP: If unsure, delete ALL users and start fresh');
}

// Run diagnostics
console.log('🚀 Starting Auth Diagnostics...\n');
diagnoseProblem();
console.log('\n' + '='.repeat(50));
suggestFreshEmail();
console.log('\n' + '='.repeat(50));
showCleanupInstructions(); 