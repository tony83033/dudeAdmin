export interface PriceMultiplier {
    $id: string;
    $collectionId: string;
    $databaseId: string;
    $createdAt: string;
    $updatedAt: string;
    $permissions: string[];
    retailerCode: string;
    multiplierValue: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  }

// New interface for product-specific price multipliers
export interface ProductPriceMultiplier {
  $id: string;
  $collectionId: string;
  $databaseId: string;
  $createdAt: string;
  $updatedAt: string;
  $permissions: string[];
  productId: string; // Product document ID
  retailerCode: string; // Retailer code
  multiplierValue: number; // Multiplier value for this product-retailer combination
  isActive: boolean; // Whether this multiplier is active
  createdAt: string;
  updatedAt: string;
}

// Interface for creating new product price multiplier
export interface CreateProductPriceMultiplier {
  productId: string;
  retailerCode: string;
  multiplierValue: number;
  isActive?: boolean;
}

// Interface for updating product price multiplier
export interface UpdateProductPriceMultiplier {
  multiplierValue?: number;
  isActive?: boolean;
}

// Interface for product price multiplier display
export interface ProductPriceMultiplierDisplay extends ProductPriceMultiplier {
  productName: string;
  productCode: string;
  retailerName?: string;
  originalPrice: number;
  calculatedPrice: number;
  priceDifference: number;
}