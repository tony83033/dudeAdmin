// Debug functions for retailer product filtering
import { fetchProducts } from './ProductFun';
import { getCurrentUserRetailerInfo } from '@/lib/auth/auth';

// Debug function to analyze product filtering for a specific retailer
export async function debugRetailerFiltering(retailerCode: string) {
  try {
    console.log(`🔍 DEBUGGING RETAILER FILTERING FOR: ${retailerCode}`);
    console.log('='.repeat(60));
    
    // Fetch all products
    const allProducts = await fetchProducts();
    console.log(`📦 Total products in database: ${allProducts.length}`);
    
    // Analyze each product
    const analysis = allProducts.map(product => {
      const hasRestrictions = product.retailerAvailability && product.retailerAvailability.length > 0;
      const isAvailableToRetailer = hasRestrictions 
        ? product.retailerAvailability.includes(retailerCode)
        : true; // No restrictions means available to all
      
      return {
        productId: product.productId,
        name: product.name,
        retailerAvailability: product.retailerAvailability || [],
        hasRestrictions,
        isAvailableToRetailer,
        reason: hasRestrictions 
          ? (isAvailableToRetailer ? 'Explicitly allowed' : 'Not in allowed list')
          : 'No restrictions (available to all)'
      };
    });
    
    // Filter for available products
    const availableProducts = analysis.filter(p => p.isAvailableToRetailer);
    const restrictedProducts = analysis.filter(p => !p.isAvailableToRetailer);
    
    console.log(`✅ Products available to ${retailerCode}: ${availableProducts.length}`);
    console.log(`❌ Products restricted from ${retailerCode}: ${restrictedProducts.length}`);
    console.log('');
    
    console.log('📋 AVAILABLE PRODUCTS:');
    availableProducts.forEach(p => {
      console.log(`  • ${p.productId} (${p.name}) - ${p.reason}`);
      if (p.hasRestrictions) {
        console.log(`    Allowed retailers: [${p.retailerAvailability.join(', ')}]`);
      }
    });
    
    console.log('');
    console.log('🚫 RESTRICTED PRODUCTS:');
    restrictedProducts.forEach(p => {
      console.log(`  • ${p.productId} (${p.name}) - ${p.reason}`);
      console.log(`    Allowed retailers: [${p.retailerAvailability.join(', ')}]`);
    });
    
    console.log('='.repeat(60));
    
    return {
      totalProducts: allProducts.length,
      availableProducts: availableProducts.length,
      restrictedProducts: restrictedProducts.length,
      availableList: availableProducts,
      restrictedList: restrictedProducts
    };
    
  } catch (error) {
    console.error('Error in debug function:', error);
    return null;
  }
}

// Function to test current user's filtering
export async function debugCurrentUserFiltering() {
  try {
    const userInfo = await getCurrentUserRetailerInfo();
    if (!userInfo || !userInfo.retailCode) {
      console.log('❌ No current user or retailer code found');
      return null;
    }
    
    console.log(`👤 Current user: ${userInfo.name} (${userInfo.email})`);
    console.log(`🏪 Retailer code: ${userInfo.retailCode}`);
    
    return await debugRetailerFiltering(userInfo.retailCode);
  } catch (error) {
    console.error('Error debugging current user filtering:', error);
    return null;
  }
}

// Function to verify a specific product's availability
export async function debugProductAvailability(productId: string, retailerCode: string) {
  try {
    const allProducts = await fetchProducts();
    const product = allProducts.find(p => p.$id === productId || p.productId === productId);
    
    if (!product) {
      console.log(`❌ Product ${productId} not found`);
      return null;
    }
    
    const hasRestrictions = product.retailerAvailability && product.retailerAvailability.length > 0;
    const isAvailable = hasRestrictions 
      ? product.retailerAvailability.includes(retailerCode)
      : true;
    
    console.log(`🔍 PRODUCT AVAILABILITY CHECK`);
    console.log(`Product: ${product.name} (${product.productId})`);
    console.log(`Retailer: ${retailerCode}`);
    console.log(`Has restrictions: ${hasRestrictions}`);
    console.log(`Retailer availability: [${(product.retailerAvailability || []).join(', ')}]`);
    console.log(`Is available: ${isAvailable ? '✅ YES' : '❌ NO'}`);
    
    return {
      product,
      retailerCode,
      hasRestrictions,
      retailerAvailability: product.retailerAvailability || [],
      isAvailable
    };
    
  } catch (error) {
    console.error('Error debugging product availability:', error);
    return null;
  }
}