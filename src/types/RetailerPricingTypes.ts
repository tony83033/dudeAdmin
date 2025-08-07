// Types for retailer-specific pricing system

export interface RetailerPricing {
  $id: string;
  $collectionId: string;
  $databaseId: string;
  $createdAt: string;
  $updatedAt: string;
  $permissions: string[];
  productId: string; // Product document ID
  retailerCode: string; // Retailer code
  originalPrice: number; // Original product price (stored in cents)
  newPrice: number; // New price for this retailer (stored in cents)
  multiplierValue: number; // Multiplier used to calculate new price
  isActive: boolean; // Whether this pricing is active
  createdAt: string;
  updatedAt: string;
}

// Interface for creating new retailer pricing
export interface CreateRetailerPricing {
  productId: string;
  retailerCode: string;
  originalPrice: number;
  newPrice: number;
  multiplierValue: number;
  isActive?: boolean;
}

// Interface for updating retailer pricing
export interface UpdateRetailerPricing {
  newPrice?: number;
  multiplierValue?: number;
  isActive?: boolean;
}

// Interface for retailer pricing display
export interface RetailerPricingDisplay extends RetailerPricing {
  productName: string;
  productCode: string;
  retailerName?: string;
  originalPriceFormatted: string;
  newPriceFormatted: string;
  discountPercentage: number;
}