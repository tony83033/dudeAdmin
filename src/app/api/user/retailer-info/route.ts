import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserRetailerInfo } from '@/lib/auth/auth';

// GET /api/user/retailer-info - Get current user's retailer information
export async function GET(request: NextRequest) {
  try {
    const userInfo = await getCurrentUserRetailerInfo();

    if (!userInfo) {
      return NextResponse.json(
        {
          success: false,
          error: 'User not found',
          message: 'No retailer information found for the current user'
        },
        { status: 404 }
      );
    }

    // Return user info without sensitive data
    const safeUserInfo = {
      $id: userInfo.$id,
      userId: userInfo.userId,
      email: userInfo.email,
      name: userInfo.name,
      phone: userInfo.phone,
      retailCode: userInfo.retailCode,
      address: userInfo.address,
      shopName: userInfo.shopName,
      pincode: userInfo.pincode,
      profileUrl: userInfo.profileUrl,
      createdAt: userInfo.createdAt,
      updatedAt: userInfo.updatedAt
    };

    return NextResponse.json({
      success: true,
      data: safeUserInfo,
      message: 'Retailer information retrieved successfully'
    });

  } catch (error) {
    console.error('Error fetching retailer info:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch retailer information',
        message: 'An error occurred while retrieving retailer information'
      },
      { status: 500 }
    );
  }
}