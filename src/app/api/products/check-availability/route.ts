import { NextRequest, NextResponse } from 'next/server';
import { fetchProducts } from '@/lib/product/ProductFun';

// POST /api/products/check-availability - Check if products are available to a retailer
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { retailerCode, productIds } = body;

    if (!retailerCode) {
      return NextResponse.json(
        {
          success: false,
          error: 'Retailer code is required',
          message: 'Please provide a valid retailer code'
        },
        { status: 400 }
      );
    }

    if (!productIds || !Array.isArray(productIds)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Product IDs array is required',
          message: 'Please provide an array of product IDs to check'
        },
        { status: 400 }
      );
    }

    // Fetch all products
    const allProducts = await fetchProducts();

    // Check availability for each product
    const availabilityResults = productIds.map(productId => {
      const product = allProducts.find(p => p.$id === productId || p.productId === productId);
      
      if (!product) {
        return {
          productId,
          available: false,
          reason: 'Product not found'
        };
      }

      // If no retailer restrictions, available to all
      if (!product.retailerAvailability || product.retailerAvailability.length === 0) {
        return {
          productId,
          available: true,
          reason: 'Available to all retailers'
        };
      }

      // Check if retailer code is in availability list
      const isAvailable = product.retailerAvailability.includes(retailerCode);
      
      return {
        productId,
        available: isAvailable,
        reason: isAvailable 
          ? 'Available to this retailer' 
          : 'Not available to this retailer'
      };
    });

    const availableCount = availabilityResults.filter(result => result.available).length;

    return NextResponse.json({
      success: true,
      retailerCode,
      results: availabilityResults,
      summary: {
        total: productIds.length,
        available: availableCount,
        unavailable: productIds.length - availableCount
      },
      message: `Checked availability for ${productIds.length} products for retailer ${retailerCode}`
    });

  } catch (error) {
    console.error('Error checking product availability:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to check product availability',
        message: 'An error occurred while checking product availability'
      },
      { status: 500 }
    );
  }
}