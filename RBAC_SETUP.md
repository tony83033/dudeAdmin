# Role-Based Access Control (RBAC) Setup Guide

## Overview

This admin panel implements a comprehensive role-based access control system with 5 distinct admin roles, each with specific permissions and access levels.

## Admin Roles & Permissions

### 🔴 **Super Admin**
- **Full system access** - Can manage everything
- **Capabilities:**
  - View all tabs and sections
  - Create, update, and delete other admin accounts
  - Manage admin roles and permissions
  - Access all business functions
- **Use Case:** System administrators, technical leads

### 🔵 **Sales Admin**  
- **Sales & Customer focused**
- **Accessible Tabs:** Dashboard, Orders, Users, Products, Categories
- **Capabilities:**
  - Manage customer orders and status
  - View, create, and update customer information
  - Manage retail codes
  - View products and categories
- **Use Case:** Sales managers, customer service leads

### 🟢 **Inventory Admin**
- **Product & Inventory focused**  
- **Accessible Tabs:** Dashboard, Products, Categories, Top Categories, Images, Flavours, Featured Products
- **Capabilities:**
  - Full product management (CRUD)
  - Manage inventory levels
  - Handle product categories and variants
  - Manage product images and media
- **Use Case:** Inventory managers, product managers

### 🟣 **Customer Admin**
- **Customer service focused**
- **Accessible Tabs:** Dashboard, Users, Orders  
- **Capabilities:**
  - Manage customer accounts
  - Update order status
  - Handle customer support issues
  - Manage retail codes
- **Use Case:** Customer service representatives

### 🟡 **Finance Admin**
- **Financial oversight**
- **Accessible Tabs:** Dashboard, Orders, Price Multiplier, Ratana Cash, Users, Products
- **Capabilities:**
  - View financial reports
  - Manage pricing and discounts  
  - Handle Ratana Cash rewards
  - View order and user data for analysis
- **Use Case:** Finance managers, accountants

## Setup Instructions

### 1. Deploy Appwrite Collection

The `admins` collection needs to be created in your Appwrite database. The configuration has been added to `appwrite.json`.

**Option A: Using Appwrite CLI**
```bash
npx appwrite deploy collection
```

**Option B: Manual Setup**
1. Go to your Appwrite Console
2. Navigate to your database
3. Create a new collection called `admins` 
4. Add the attributes as defined in `appwrite.json`

### 2. Create Your First Super Admin

Since you need a Super Admin to create other admins, you'll need to manually create the first one:

**Option A: Direct Database Insert**
```javascript
// Run this in your Appwrite console or a setup script
await databases.createDocument(
  'your-database-id',
  'admins', 
  'unique-id',
  {
    adminId: 'your-appwrite-user-id',
    email: 'admin@yourcompany.com',
    name: 'Super Admin',
    role: 'super_admin',
    permissions: [], // Super admin gets all permissions automatically
    isActive: true,
    createdBy: 'system',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
);
```

**Option B: Setup Script**
Create a setup script in your project:

```typescript
// scripts/setup-admin.ts
import { createAdmin } from '../src/lib/admin/AdminFunctions';

const setupFirstAdmin = async () => {
  const adminData = {
    email: 'admin@yourcompany.com',
    name: 'Super Admin',
    role: 'super_admin' as AdminRole,
    password: 'temporary-password-123',
    phone: '+1234567890'
  };
  
  try {
    const admin = await createAdmin(adminData, 'system');
    console.log('First admin created:', admin);
  } catch (error) {
    console.error('Error creating admin:', error);
  }
};

setupFirstAdmin();
```

### 3. Update Environment Configuration

Ensure your Appwrite configuration is correct in `src/lib/appwrite.ts`:

```typescript
export const appwriteConfig: AppwriteConfig = {
  // ... other config
  adminsCollectionId: "admins", // Make sure this matches your collection ID
};
```

## Usage Guide

### Creating New Admins

The system uses **Email-Based Admin Linking** - simple and conflict-free!

1. **Login as Super Admin**
2. **Navigate to Admin Management**
   - Go to the "Admins" tab (only visible to Super Admins)
3. **Click "Link User to Admin Role"**
4. **Fill out the form:**
   - Enter email of existing user (they must already have an account)
   - Enter their full name
   - Select appropriate role
   - Add phone number (optional)
   - Review permissions preview
5. **Benefits:**
   - No email conflicts (uses existing accounts)
   - No password management needed
   - User keeps their existing credentials
   - Instant admin access
   - Auto-syncs on next login

### Emergency Admin Creation

If you need to quickly create admins, use the simple script:

**Copy `simple-admin-setup.js` into browser console**
```javascript
// Interactive email-based admin linking
linkUserToAdmin()
```

**Requirements:**
- User must already have an account in your app
- You must be logged in as Super Admin
- User can immediately access admin features

### Role Assignment Best Practices

**Super Admin:**
- Limit to 1-2 people
- Only assign to technical leads or company owners
- Use for system setup and emergency access

**Sales Admin:**  
- Sales managers who need customer and order oversight
- Customer service leads
- Business development managers

**Inventory Admin:**
- Product managers
- Inventory coordinators  
- Content managers (for product info/images)

**Customer Admin:**
- Customer service representatives
- Support staff
- Account managers

**Finance Admin:**
- Finance team members
- Accounting staff
- Business analysts who need financial data access

### Security Features

**Frontend Protection:**
- Tabs automatically hide based on role
- Permission checks before component rendering
- Role-based navigation filtering

**Backend Protection:**
- API calls validate permissions
- Session-based authentication
- Admin account status verification

**Audit Trail:**
- All admin actions are logged
- Creation and modification timestamps
- Admin account activity tracking

## Customization

### Adding New Permissions

1. **Define new permission in `AdminTypes.ts`:**
```typescript
export type Permission = 
  | 'existing.permissions'
  | 'new.permission.name'
```

2. **Add to role mapping:**
```typescript
export const ROLE_PERMISSIONS: Record<AdminRole, Permission[]> = {
  inventory_admin: [
    // existing permissions
    'new.permission.name'
  ],
}
```

3. **Update tab permissions if needed:**
```typescript
export const TAB_PERMISSIONS: Record<string, Permission[]> = {
  'new-tab': ['new.permission.name'],
}
```

### Adding New Roles

1. **Add role to AdminTypes.ts:**
```typescript
export type AdminRole = 'super_admin' | 'sales_admin' | 'inventory_admin' | 'customer_admin' | 'finance_admin' | 'new_role';
```

2. **Define permissions:**
```typescript
export const ROLE_PERMISSIONS: Record<AdminRole, Permission[]> = {
  new_role: ['specific.permissions'],
}
```

3. **Add role info:**
```typescript
export const ROLE_INFO: Record<AdminRole, RoleInfo> = {
  new_role: {
    role: 'new_role',
    label: 'New Role',
    description: 'Description of the new role',
    color: 'blue',
    icon: 'IconName'
  },
}
```

4. **Update tab access:**
```typescript
export const ROLE_TAB_ACCESS: Record<AdminRole, string[]> = {
  new_role: ['dashboard', 'allowed-tabs'],
}
```

## Troubleshooting

### Common Issues

**1. "Access Denied" errors**
- Check if admin account is active
- Verify role permissions are correctly assigned
- Ensure admin is logged in with valid session

**2. Tabs not showing**
- Verify tab permissions in `TAB_PERMISSIONS`
- Check role access in `ROLE_TAB_ACCESS`
- Ensure admin role is spelled correctly

**3. User not found error when linking**
- **SOLUTION**: User must create an account first before being linked to admin role
- **Process**: Have user sign up → then link their email to admin role
- **No conflicts**: Email-based linking eliminates all auth conflicts

**4. Collection not found errors**
- Check Appwrite permissions on admins collection
- Verify collection exists and matches schema
- Update `adminsCollectionId` in `src/lib/appwrite.ts` with correct collection ID

**5. Permission validation fails**
- Check if admin record exists in database
- Verify admin account is active
- Ensure permissions array is properly formatted

**6. No Super Admin exists**
- **SOLUTION**: Run `simple-admin-setup.js` script
- **Process**: Link your own account to Super Admin role
- **Easy**: Just enter your email and select super_admin role

### Debug Mode

Add this to see current admin permissions:

```typescript
// In AdminHome component
console.log('Current Admin:', currentAdmin);
console.log('Accessible Tabs:', accessibleTabs);
console.log('Current Role Permissions:', ROLE_PERMISSIONS[currentAdmin?.role]);
```

## Best Practices

1. **Principle of Least Privilege:** Give users only the minimum permissions they need
2. **Regular Audits:** Review admin accounts and permissions regularly  
3. **Strong Passwords:** Enforce strong temporary passwords for new admins
4. **Account Deactivation:** Deactivate rather than delete when admins leave
5. **Role Documentation:** Keep role descriptions up-to-date as business needs change

## Security Considerations

- Always validate permissions on both frontend and backend
- Use HTTPS in production
- Implement session timeouts
- Regular security audits of admin accounts
- Monitor admin activity logs
- Use environment variables for sensitive configuration

---

For technical support or questions about the RBAC system, consult the development team or refer to the permission utilities in `src/lib/auth/permissions.ts`. 