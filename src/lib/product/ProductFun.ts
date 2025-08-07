// /lib/product/ProductFun.ts
import { databases, appwriteConfig } from '@/lib/appwrite';
import { ID, Query } from 'appwrite';
import { Product } from '@/types/ProductTypes';
import { getCurrentUserRetailerInfo } from '@/lib/auth/auth';
import { RETAILER_FILTERING_CONFIG } from '@/lib/config/retailerFiltering';

export async function fetchProducts(): Promise<Product[]> {
  try {
    const response = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.productscollectionId,
      [Query.limit(100)]
    );

    const products = response.documents.map((doc) => ({
      $id: doc.$id,
      $collectionId: doc.$collectionId,
      $databaseId: doc.$databaseId,
      $createdAt: doc.$createdAt,
      $updatedAt: doc.$updatedAt,
      $permissions: doc.$permissions,
      productId: doc.productId,
      name: doc.name,
      description: doc.description,
      price: doc.price / 100, // Convert from cents to main currency unit
      mrp: doc.mrp ? doc.mrp / 100 : null, // Convert from cents to main currency unit
      discount: doc.discount, // Keep discount as percentage
      gst: doc.gst || 0, // Include GST percentage
      imageUrl: doc.imageUrl,
      stock: doc.stock,
      unit: doc.unit,
      isFeatured: doc.isFeatured,
      categoryId: doc.categoryId,
      createdAt: doc.$createdAt,
      updatedAt: doc.$updatedAt,
      retailerAvailability: doc.retailerAvailability || [] // Default to empty array if not set
    }));

    return products;
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

export async function addProduct(productData: any) {
  try {
    const response = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.productscollectionId,
      ID.unique(),
      {
        productId: productData.productId,
        name: productData.name,
        description: productData.description || '',
        price: Math.round(productData.price * 100), // Store in cents
        mrp: productData.mrp ? Math.round(productData.mrp * 100) : null, // Store in cents
        discount: productData.discount || null, // Store as percentage
        gst: productData.gst || 0, // Store GST percentage
        imageUrl: productData.imageUrl || '',
        stock: productData.stock || 0,
        unit: productData.unit,
        isFeatured: productData.isFeatured || false,
        categoryId: productData.categoryId,
        retailerAvailability: productData.retailerAvailability || [], // Store retailer codes array

        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    );
    
    return {
      ...response,
      price: response.price / 100, // Convert back to main currency unit for frontend
      mrp: response.mrp ? response.mrp / 100 : null, // Convert back to main currency unit for frontend
      discount: response.discount, // Keep as percentage
      gst: response.gst, // Keep as percentage
    };
  } catch (error) {
    console.error('Error adding product:', error);
    throw error;
  }
}

export const updateProduct = async (documentId: string, productData: any): Promise<boolean> => {
  try {
    const updateData: any = {
      updatedAt: new Date().toISOString(),
    };

    if (productData.name !== undefined) updateData.name = productData.name;
    if (productData.productId !== undefined) updateData.productId = productData.productId;
    if (productData.description !== undefined) updateData.description = productData.description;
    if (productData.price !== undefined) updateData.price = Math.round(productData.price * 100); // Store in cents
    if (productData.mrp !== undefined) updateData.mrp = productData.mrp ? Math.round(productData.mrp * 100) : null; // Store in cents
    if (typeof productData.discount === 'number' && !isNaN(productData.discount)) {
      updateData.discount = Math.max(0, Math.min(999995, Math.round(productData.discount)));
    } else {
      updateData.discount = 0;
    }
    if (productData.gst !== undefined) updateData.gst = productData.gst; // Store GST percentage
    if (productData.imageUrl !== undefined) updateData.imageUrl = productData.imageUrl;
    if (productData.stock !== undefined) updateData.stock = productData.stock;
    if (productData.unit !== undefined) updateData.unit = productData.unit;
    if (productData.isFeatured !== undefined) updateData.isFeatured = productData.isFeatured;
    if (productData.categoryId !== undefined) updateData.categoryId = productData.categoryId;
    if (productData.retailerAvailability !== undefined) updateData.retailerAvailability = productData.retailerAvailability;

    await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.productscollectionId,
      documentId,
      updateData
    );
    return true;
  } catch (error) {
    console.error('Error updating product:', error);
    return false;
  }
};

export async function deleteProduct(documentId: string): Promise<boolean> {
  try {
    await databases.deleteDocument(
      appwriteConfig.databaseId,
      appwriteConfig.productscollectionId,
      documentId
    );
    return true;
  } catch (error) {
    console.error('Error deleting product:', error);
    return false;
  }
}

// Fetch categories for product form
export async function fetchCategories() {
  try {
    const response = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.categoriesCollectionId,
      [Query.limit(100)]
    );
    return response.documents;
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

// Function to fetch products filtered by current user's retailer availability
export async function fetchProductsForRetailer(): Promise<Product[]> {
  try {
    // Get current user's retailer information
    const userInfo = await getCurrentUserRetailerInfo();
    
    // If no user info found, return empty array (user not authenticated as retailer)
    if (!userInfo || !userInfo.retailCode) {
      console.log('No retailer info found for current user');
      return [];
    }
    
    // Fetch all products first
    const allProducts = await fetchProducts();
    
    // CONFIGURABLE STRICT FILTERING: Based on configuration settings
    const filteredProducts = allProducts.filter(product => {
      const hasRestrictions = product.retailerAvailability && product.retailerAvailability.length > 0;
      
      if (!hasRestrictions) {
        // Product has no retailer restrictions
        if (RETAILER_FILTERING_CONFIG.SUPER_STRICT_MODE) {
          // SUPER STRICT: Only show products explicitly assigned to retailers
          return false; // Don't show unrestricted products
        } else {
          // NORMAL MODE: Show unrestricted products to everyone
          return RETAILER_FILTERING_CONFIG.SHOW_UNRESTRICTED_PRODUCTS_TO_ALL;
        }
      }
      
      // Product has restrictions - only show if retailer code is explicitly listed
      return product.retailerAvailability.includes(userInfo.retailCode);
    });
    
    console.log(`🔍 STRICT FILTERING: Found ${filteredProducts.length} products for retailer ${userInfo.retailCode} out of ${allProducts.length} total products`);
    return filteredProducts;
    
  } catch (error) {
    console.error('Error fetching products for retailer:', error);
    return [];
  }
}

// Function to fetch products filtered for a specific retailer code with pricing
export async function fetchProductsForSpecificRetailer(retailerCode: string): Promise<Product[]> {
  try {
    // Fetch all products first
    const allProducts = await fetchProducts();
    
    // CONFIGURABLE STRICT FILTERING: Based on configuration settings
    const filteredProducts = allProducts.filter(product => {
      const hasRestrictions = product.retailerAvailability && product.retailerAvailability.length > 0;
      
      if (!hasRestrictions) {
        // Product has no retailer restrictions
        if (RETAILER_FILTERING_CONFIG.SUPER_STRICT_MODE) {
          // SUPER STRICT: Only show products explicitly assigned to retailers
          return false; // Don't show unrestricted products
        } else {
          // NORMAL MODE: Show unrestricted products to everyone
          return RETAILER_FILTERING_CONFIG.SHOW_UNRESTRICTED_PRODUCTS_TO_ALL;
        }
      }
      
      // Product has restrictions - only show if retailer code is explicitly listed
      return product.retailerAvailability.includes(retailerCode);
    });
    
    console.log(`🔍 STRICT FILTERING: Found ${filteredProducts.length} products for retailer ${retailerCode} out of ${allProducts.length} total products`);
    console.log(`📋 Retailer ${retailerCode} can see:`, {
      totalProducts: allProducts.length,
      availableProducts: filteredProducts.length,
      restrictedProducts: allProducts.length - filteredProducts.length
    });
    
    // Apply pricing calculations for the retailer
    const productsWithPricing = await applyRetailerPricingToProducts(filteredProducts, retailerCode);
    
    return productsWithPricing;
    
  } catch (error) {
    console.error('Error fetching products for specific retailer:', error);
    return [];
  }
}

// Helper function to apply retailer pricing to products
async function applyRetailerPricingToProducts(products: Product[], retailerCode: string): Promise<Product[]> {
  try {
    // For now, let's implement a simplified version that checks for multipliers and custom pricing
    const productsWithPricing = await Promise.all(
      products.map(async (product) => {
        try {
          // Check for retailer-specific custom pricing
          const customPricing = await getRetailerCustomPricing(product.$id, retailerCode);
          
          if (customPricing) {
            // Apply custom pricing
            const newPrice = customPricing.newPrice / 100; // Convert from cents
            const scaleFactor = newPrice / product.price;
            const newMrp = product.mrp ? Math.round(product.mrp * scaleFactor * 100) / 100 : null;
            
            return {
              ...product,
              price: newPrice,
              mrp: newMrp,
              originalPrice: product.price,
              customPricing: {
                hasCustomPrice: true,
                originalPrice: product.price,
                newPrice: newPrice,
                multiplierValue: customPricing.multiplierValue,
                pricingType: 'retailer_custom' as const,
                savings: product.mrp ? (product.mrp - newPrice) : 0
              }
            };
          }
          
          // Check for retailer multiplier
          const multiplier = await getRetailerMultiplier(retailerCode);
          
          if (multiplier) {
            const newPrice = Math.round(product.price * multiplier.multiplierValue * 100) / 100;
            const newMrp = product.mrp ? Math.round(product.mrp * multiplier.multiplierValue * 100) / 100 : null;
            
            return {
              ...product,
              price: newPrice,
              mrp: newMrp,
              originalPrice: product.price,
              customPricing: {
                hasCustomPrice: true,
                originalPrice: product.price,
                newPrice: newPrice,
                multiplierValue: multiplier.multiplierValue,
                pricingType: 'multiplier' as const,
                savings: newMrp ? (newMrp - newPrice) : 0
              }
            };
          }
          
          // No custom pricing or multiplier found
          return product;
          
        } catch (error) {
          console.error(`Error applying pricing to product ${product.$id}:`, error);
          return product;
        }
      })
    );
    
    return productsWithPricing;
    
  } catch (error) {
    console.error('Error applying retailer pricing:', error);
    return products; // Return original products on error
  }
}

// Helper function to get retailer custom pricing
async function getRetailerCustomPricing(productId: string, retailerCode: string) {
  try {
    const response = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.retailerPricingCollectionId,
      [
        Query.equal('productId', productId),
        Query.equal('retailerCode', retailerCode),
        Query.equal('isActive', true)
      ]
    );
    
    return response.documents[0] || null;
  } catch (error) {
    console.error('Error fetching retailer custom pricing:', error);
    return null;
  }
}

// Helper function to get retailer multiplier
async function getRetailerMultiplier(retailerCode: string) {
  try {
    const response = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.priceMultipliersCollectionId,
      [
        Query.equal('retailerCode', retailerCode),
        Query.equal('isActive', true)
      ]
    );
    
    return response.documents[0] || null;
  } catch (error) {
    console.error('Error fetching retailer multiplier:', error);
    return null;
  }
}

// Function to check if a specific product is available to current retailer
export async function isProductAvailableToCurrentRetailer(productId: string): Promise<boolean> {
  try {
    const userInfo = await getCurrentUserRetailerInfo();
    
    // If no user info, not available
    if (!userInfo || !userInfo.retailCode) {
      return false;
    }
    
    // Fetch the specific product
    const allProducts = await fetchProducts();
    const product = allProducts.find(p => p.$id === productId || p.productId === productId);
    
    if (!product) {
      return false;
    }
    
    // If product has no retailer restrictions, it's available to all
    if (!product.retailerAvailability || product.retailerAvailability.length === 0) {
      return true;
    }
    
    // Check if current retailer code is in the availability list
    return product.retailerAvailability.includes(userInfo.retailCode);
    
  } catch (error) {
    console.error('Error checking product availability for retailer:', error);
    return false;
  }
}