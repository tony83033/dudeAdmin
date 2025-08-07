# Retailer Pricing Setup Guide

This guide explains how to set up the new **Retailer Pricing** feature that allows admins to set custom prices for specific retailers.

## 🗄️ **Required Appwrite Database Schema**

You need to create a new collection in your Appwrite database:

### **Collection: `retailerPricing`**

```json
{
  "name": "retailerPricing",
  "collectionId": "retailerPricing",
  "attributes": [
    {
      "key": "productId",
      "type": "string",
      "size": 255,
      "required": true,
      "array": false
    },
    {
      "key": "retailerCode",
      "type": "string",
      "size": 100,
      "required": true,
      "array": false
    },
    {
      "key": "originalPrice",
      "type": "integer",
      "required": true,
      "array": false,
      "min": 0,
      "max": 999999999
    },
    {
      "key": "newPrice",
      "type": "integer",
      "required": true,
      "array": false,
      "min": 0,
      "max": 999999999
    },
    {
      "key": "multiplierValue",
      "type": "float",
      "required": true,
      "array": false,
      "min": 0,
      "max": 1000
    },
    {
      "key": "isActive",
      "type": "boolean",
      "required": true,
      "array": false,
      "default": true
    },
    {
      "key": "createdAt",
      "type": "datetime",
      "required": true,
      "array": false
    },
    {
      "key": "updatedAt",
      "type": "datetime",
      "required": true,
      "array": false
    }
  ],
  "indexes": [
    {
      "key": "productId_retailerCode",
      "type": "unique",
      "attributes": ["productId", "retailerCode"]
    },
    {
      "key": "retailerCode",
      "type": "key",
      "attributes": ["retailerCode"]
    },
    {
      "key": "productId",
      "type": "key",
      "attributes": ["productId"]
    },
    {
      "key": "isActive",
      "type": "key",
      "attributes": ["isActive"]
    }
  ]
}
```

### **Steps to Create the Collection in Appwrite Console:**

1. **Open Appwrite Console** → Go to your project
2. **Navigate to Databases** → Select your database
3. **Create Collection** → Click "Create Collection"
4. **Collection Details:**
   - Collection ID: `retailerPricing`
   - Name: `Retailer Pricing`

5. **Add Attributes:**
   ```
   productId     | String  | Size: 255   | Required: Yes
   retailerCode  | String  | Size: 100   | Required: Yes
   originalPrice | Integer | Min: 0      | Required: Yes
   newPrice      | Integer | Min: 0      | Required: Yes
   multiplierValue | Float | Min: 0      | Required: Yes
   isActive      | Boolean | Default: true | Required: Yes
   createdAt     | DateTime | Required: Yes
   updatedAt     | DateTime | Required: Yes
   ```

6. **Create Indexes:**
   - **Unique Index:** `productId_retailerCode` (productId + retailerCode)
   - **Index:** `retailerCode`
   - **Index:** `productId`
   - **Index:** `isActive`

7. **Set Permissions:** Configure read/write permissions as needed

## 🔧 **Integration Steps**

### **1. Add to Admin Panel**

Update your `AdminHome.tsx` to include the new Retailer Pricing tab:

```typescript
// In AdminHome.tsx
import { RetailerPricingTab } from '../categoriTab/RetailerPricingTab'

// Add to your tab definitions
const allTabs: TabItem[] = [
  // ... existing tabs ...
  {
    value: "retailer-pricing",
    label: "Retailer Pricing",
    icon: <DollarSign className="w-4 h-4" />
  },
  // ... other tabs ...
]

// Add to your tab content
<TabsContent value="retailer-pricing" className="p-6 m-0">
  <ProtectedTabContent admin={currentAdmin} tabValue="retailer-pricing">
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Retailer Pricing Management</h2>
        <Badge variant="outline">Custom Pricing</Badge>
      </div>
      <RetailerPricingTab />
    </div>
  </ProtectedTabContent>
</TabsContent>
```

### **2. Update Permissions (Optional)**

If you're using the permission system, add retailer pricing permissions in `permissions.ts`:

```typescript
// Add to PERMISSIONS constant
RETAILER_PRICING_VIEW: 'retailer_pricing.view' as Permission,
RETAILER_PRICING_CREATE: 'retailer_pricing.create' as Permission,
RETAILER_PRICING_UPDATE: 'retailer_pricing.update' as Permission,
RETAILER_PRICING_DELETE: 'retailer_pricing.delete' as Permission,
```

### **3. Update Appwrite Collection ID**

In `src/lib/appwrite.ts`, update the retailer pricing collection ID with the actual ID from Appwrite Console:

```typescript
export const appwriteConfig: AppwriteConfig = {
  // ... other config ...
  retailerPricingCollectionId: "YOUR_ACTUAL_COLLECTION_ID_FROM_APPWRITE", // Replace this
  // ... rest of config ...
};
```

## 🎯 **Features**

### **Admin Capabilities:**

1. **Add Custom Pricing:**
   - Select any product
   - Select any retailer (by retailer code)
   - Set price multiplier or direct price
   - View original vs new price comparison

2. **Manage Pricing:**
   - Edit existing pricing
   - Activate/deactivate pricing
   - Delete pricing records
   - View pricing history

3. **Price Display:**
   - Original product price
   - New custom price
   - Price multiplier used
   - Discount/markup percentage
   - Active/inactive status

### **How It Works:**

1. **Admin sets custom pricing** for specific retailer-product combinations
2. **System stores** both original and new prices
3. **Mobile app/API** can check for custom pricing when displaying products
4. **Fallback** to original price if no custom pricing exists

## 📱 **API Integration for Mobile Apps**

You can create API endpoints to get retailer-specific pricing:

```typescript
// Example API usage
import { calculateRetailerPrice } from '@/lib/retailer-pricing/RetailerPricingFun';

// Get price for specific retailer
const finalPrice = await calculateRetailerPrice(productId, retailerCode, originalPrice);

// Check if custom pricing exists
const hasCustom = await hasCustomPricing(productId, retailerCode);
```

## 🔄 **Migration from Price Multiplier**

If you're migrating from the old pincode-based price multiplier system:

1. **Keep both systems** running simultaneously during transition
2. **Export existing data** from price multipliers
3. **Convert pincode-based** pricing to retailer-based pricing
4. **Gradually migrate** users to new system
5. **Deprecate old system** once migration is complete

## 🧪 **Testing**

### **Test Scenarios:**

1. **Add pricing** for Product A + Retailer R001
2. **Verify** original price vs new price calculation
3. **Test multiplier** changes and price updates
4. **Check API responses** for retailer-specific pricing
5. **Verify fallback** to original price when no custom pricing exists

### **Sample Test Data:**

```json
{
  "productId": "product_123",
  "retailerCode": "R001",
  "originalPrice": 10000,  // ₹100.00 in cents
  "newPrice": 8500,        // ₹85.00 in cents  
  "multiplierValue": 0.85,
  "isActive": true
}
```

## 🎉 **Benefits**

- **Flexible Pricing:** Set different prices for different retailers
- **Easy Management:** Admin-friendly interface
- **Backward Compatible:** Works alongside existing pricing
- **Scalable:** Easy to add new retailers and products
- **Trackable:** Full audit trail of pricing changes

The Retailer Pricing system is now ready to use! 🚀