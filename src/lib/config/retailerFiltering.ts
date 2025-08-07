// Configuration for retailer product filtering
export const RETAILER_FILTERING_CONFIG = {
  // Enable automatic filtering for mobile app users
  ENABLE_AUTO_FILTERING: true,
  
  // Fallback behavior when user has no retailer code
  FALLBACK_TO_ALL_PRODUCTS: true,
  
  // Admin override parameter name
  ADMIN_OVERRIDE_PARAM: 'includeAll',
  
  // Logging for debugging
  ENABLE_FILTERING_LOGS: true,
  
  // SUPER STRICT MODE: Only show products explicitly assigned to retailer
  // When true: Products with empty retailerAvailability are NOT shown to anyone
  // When false: Products with empty retailerAvailability are shown to everyone
  SUPER_STRICT_MODE: false,
  
  // Default behavior for products with no retailer restrictions
  SHOW_UNRESTRICTED_PRODUCTS_TO_ALL: true,
};

// Helper function to check if filtering should be applied
export const shouldApplyRetailerFiltering = (
  userRetailerCode: string | null,
  isAdminOverride: boolean = false
): boolean => {
  if (!RETAILER_FILTERING_CONFIG.ENABLE_AUTO_FILTERING) {
    return false;
  }
  
  if (isAdminOverride) {
    return false;
  }
  
  return userRetailerCode !== null && userRetailerCode !== '';
};

// Helper function for logging
export const logFilteringAction = (message: string, data?: any) => {
  if (RETAILER_FILTERING_CONFIG.ENABLE_FILTERING_LOGS) {
    console.log(`[RETAILER FILTERING] ${message}`, data || '');
  }
};