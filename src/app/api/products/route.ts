import { NextRequest, NextResponse } from 'next/server';
import { fetchProducts, fetchProductsForSpecificRetailer } from '@/lib/product/ProductFun';
import { getCurrentUserRetailerInfo } from '@/lib/auth/auth';
import { shouldApplyRetailerFiltering, logFilteringAction } from '@/lib/config/retailerFiltering';

// GET /api/products - Fetch products with automatic retailer filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeAll = searchParams.get('includeAll') === 'true';
    const forceRetailerCode = searchParams.get('retailerCode'); // For admin override

    let products;
    let filterMessage = 'Products retrieved successfully';

    if (includeAll) {
      // Return all products (for admin use only)
      products = await fetchProducts();
      filterMessage = 'All products retrieved (admin mode)';
    } else if (forceRetailerCode) {
      // Admin can force a specific retailer code
      products = await fetchProductsForSpecificRetailer(forceRetailerCode);
      filterMessage = `Products filtered for retailer: ${forceRetailerCode}`;
    } else {
      // AUTOMATIC FILTERING: Try to get products for current authenticated user
      try {
        const userInfo = await getCurrentUserRetailerInfo();
        const shouldFilter = shouldApplyRetailerFiltering(userInfo?.retailCode || null, includeAll);
        
        if (shouldFilter && userInfo && userInfo.retailCode) {
          // User is a retailer - filter products automatically
          products = await fetchProductsForSpecificRetailer(userInfo.retailCode);
          filterMessage = `Products automatically filtered for retailer: ${userInfo.retailCode}`;
          logFilteringAction(`Auto-filtering products for retailer: ${userInfo.retailCode}`, { count: products.length });
        } else {
          // User exists but no retailer code OR filtering is disabled - show all products
          products = await fetchProducts();
          filterMessage = userInfo?.retailCode 
            ? 'All products (filtering disabled)' 
            : 'All products (user has no retailer restrictions)';
          logFilteringAction('Showing all products', { reason: userInfo?.retailCode ? 'filtering disabled' : 'no retailer code' });
        }
      } catch (authError) {
        // No authenticated user or error - show all products as fallback
        logFilteringAction('No authenticated user found, showing all products');
        products = await fetchProducts();
        filterMessage = 'All products (no authentication)';
      }
    }

    return NextResponse.json({
      success: true,
      data: products,
      count: products.length,
      message: filterMessage,
      filtered: products.length < await fetchProducts().then(all => all.length)
    });

  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch products',
        message: 'An error occurred while retrieving products'
      },
      { status: 500 }
    );
  }
}