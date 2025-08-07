import { NextRequest, NextResponse } from 'next/server';
import { debugRetailerFiltering, debugCurrentUserFiltering } from '@/lib/product/ProductDebugFun';

// GET /api/debug/retailer-filtering - Debug retailer filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const retailerCode = searchParams.get('retailerCode');

    let debugResults;

    if (retailerCode) {
      // Debug specific retailer
      debugResults = await debugRetailerFiltering(retailerCode);
    } else {
      // Debug current user
      debugResults = await debugCurrentUserFiltering();
    }

    if (!debugResults) {
      return NextResponse.json(
        {
          success: false,
          error: 'Debug failed',
          message: 'Unable to debug retailer filtering'
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      debug: debugResults,
      message: retailerCode 
        ? `Debug results for retailer: ${retailerCode}`
        : 'Debug results for current user'
    });

  } catch (error) {
    console.error('Error in debug endpoint:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Debug failed',
        message: 'An error occurred during debugging'
      },
      { status: 500 }
    );
  }
}