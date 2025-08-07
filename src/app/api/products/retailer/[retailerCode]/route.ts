import { NextRequest, NextResponse } from 'next/server';
import { fetchProductsForSpecificRetailer } from '@/lib/product/ProductFun';

// GET /api/products/retailer/[retailerCode] - Fetch products for specific retailer
export async function GET(
  request: NextRequest,
  { params }: { params: { retailerCode: string } }
) {
  try {
    const { retailerCode } = params;

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

    // Fetch products filtered for the specific retailer
    const products = await fetchProductsForSpecificRetailer(retailerCode);

    return NextResponse.json({
      success: true,
      data: products,
      count: products.length,
      retailerCode: retailerCode,
      message: `Found ${products.length} products available for retailer ${retailerCode}`
    });

  } catch (error) {
    console.error('Error fetching products for retailer:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch products for retailer',
        message: 'An error occurred while retrieving products for the specified retailer'
      },
      { status: 500 }
    );
  }
}