import { databases, appwriteConfig } from "../appwrite";
import { RetailerPricing, CreateRetailerPricing, UpdateRetailerPricing, RetailerPricingDisplay } from "@/types/RetailerPricingTypes";
import { fetchProducts } from "@/lib/product/ProductFun";
import { fetchUsers } from "@/lib/product/HandleUsers";
import { ID, Query } from "appwrite";

// Fetch all retailer pricing records
export async function fetchRetailerPricing(): Promise<RetailerPricing[]> {
  try {
    const response = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.retailerPricingCollectionId,
      [
        Query.orderDesc("$createdAt"),
        Query.limit(100)
      ]
    );
    return response.documents as RetailerPricing[];
  } catch (error) {
    console.error("Error fetching retailer pricing:", error);
    throw new Error("Failed to fetch retailer pricing");
  }
}

// Fetch retailer pricing with product and retailer details
export async function fetchRetailerPricingWithDetails(): Promise<RetailerPricingDisplay[]> {
  try {
    const [pricingRecords, products, users] = await Promise.all([
      fetchRetailerPricing(),
      fetchProducts(),
      fetchUsers()
    ]);

    // Create maps for faster lookup
    const productMap = new Map(products.map(p => [p.$id, p]));
    const userMap = new Map(users.map(u => [u.retailCode, u]));

    const pricingWithDetails: RetailerPricingDisplay[] = pricingRecords.map(pricing => {
      const product = productMap.get(pricing.productId);
      const retailer = userMap.get(pricing.retailerCode);
      
      const originalPrice = pricing.originalPrice / 100; // Convert from cents
      const newPrice = pricing.newPrice / 100; // Convert from cents
      const discountPercentage = originalPrice > 0 
        ? ((originalPrice - newPrice) / originalPrice) * 100 
        : 0;

      return {
        ...pricing,
        productName: product?.name || 'Unknown Product',
        productCode: product?.productId || 'Unknown',
        retailerName: retailer?.name || pricing.retailerCode,
        originalPriceFormatted: `₹${originalPrice.toFixed(2)}`,
        newPriceFormatted: `₹${newPrice.toFixed(2)}`,
        discountPercentage: Math.round(discountPercentage * 100) / 100
      };
    });

    return pricingWithDetails;
  } catch (error) {
    console.error("Error fetching retailer pricing with details:", error);
    throw new Error("Failed to fetch retailer pricing with details");
  }
}

// Add new retailer pricing
export async function addRetailerPricing(pricingData: CreateRetailerPricing): Promise<RetailerPricing> {
  try {
    const now = new Date().toISOString();
    
    const response = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.retailerPricingCollectionId,
      ID.unique(),
      {
        ...pricingData,
        originalPrice: Math.round(pricingData.originalPrice * 100), // Store in cents
        newPrice: Math.round(pricingData.newPrice * 100), // Store in cents
        isActive: pricingData.isActive ?? true,
        createdAt: now,
        updatedAt: now
      }
    );
    
    return response as RetailerPricing;
  } catch (error) {
    console.error("Error adding retailer pricing:", error);
    throw new Error("Failed to add retailer pricing");
  }
}

// Update retailer pricing
export async function updateRetailerPricing(pricingId: string, updateData: UpdateRetailerPricing): Promise<boolean> {
  try {
    const updatePayload: any = {
      updatedAt: new Date().toISOString()
    };

    if (updateData.newPrice !== undefined) {
      updatePayload.newPrice = Math.round(updateData.newPrice * 100); // Store in cents
    }
    
    if (updateData.multiplierValue !== undefined) {
      updatePayload.multiplierValue = updateData.multiplierValue;
    }
    
    if (updateData.isActive !== undefined) {
      updatePayload.isActive = updateData.isActive;
    }

    await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.retailerPricingCollectionId,
      pricingId,
      updatePayload
    );
    
    return true;
  } catch (error) {
    console.error("Error updating retailer pricing:", error);
    throw new Error("Failed to update retailer pricing");
  }
}

// Delete retailer pricing
export async function deleteRetailerPricing(pricingId: string): Promise<boolean> {
  try {
    await databases.deleteDocument(
      appwriteConfig.databaseId,
      appwriteConfig.retailerPricingCollectionId,
      pricingId
    );
    return true;
  } catch (error) {
    console.error("Error deleting retailer pricing:", error);
    throw new Error("Failed to delete retailer pricing");
  }
}

// Get retailer pricing for a specific product and retailer
export async function getRetailerPricing(productId: string, retailerCode: string): Promise<RetailerPricing | null> {
  try {
    const response = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.retailerPricingCollectionId,
      [
        Query.equal("productId", productId),
        Query.equal("retailerCode", retailerCode),
        Query.equal("isActive", true)
      ]
    );
    
    if (response.documents.length > 0) {
      return response.documents[0] as RetailerPricing;
    }
    
    return null;
  } catch (error) {
    console.error("Error getting retailer pricing:", error);
    throw new Error("Failed to get retailer pricing");
  }
}

// Get all pricing for a specific retailer
export async function getRetailerPricingByRetailer(retailerCode: string): Promise<RetailerPricing[]> {
  try {
    const response = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.retailerPricingCollectionId,
      [
        Query.equal("retailerCode", retailerCode),
        Query.equal("isActive", true),
        Query.orderDesc("$createdAt")
      ]
    );
    
    return response.documents as RetailerPricing[];
  } catch (error) {
    console.error("Error getting retailer pricing by retailer:", error);
    throw new Error("Failed to get retailer pricing by retailer");
  }
}

// Get all pricing for a specific product
export async function getRetailerPricingByProduct(productId: string): Promise<RetailerPricing[]> {
  try {
    const response = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.retailerPricingCollectionId,
      [
        Query.equal("productId", productId),
        Query.equal("isActive", true),
        Query.orderDesc("$createdAt")
      ]
    );
    
    return response.documents as RetailerPricing[];
  } catch (error) {
    console.error("Error getting retailer pricing by product:", error);
    throw new Error("Failed to get retailer pricing by product");
  }
}

// Calculate price for a retailer (returns custom price if exists, otherwise original price)
export async function calculateRetailerPrice(productId: string, retailerCode: string, originalPrice: number): Promise<number> {
  try {
    const retailerPricing = await getRetailerPricing(productId, retailerCode);
    
    if (retailerPricing) {
      return retailerPricing.newPrice / 100; // Convert from cents
    }
    
    return originalPrice; // Return original price if no custom pricing found
  } catch (error) {
    console.error("Error calculating retailer price:", error);
    return originalPrice; // Return original price on error
  }
}

// Check if retailer has custom pricing for a product
export async function hasCustomPricing(productId: string, retailerCode: string): Promise<boolean> {
  try {
    const pricing = await getRetailerPricing(productId, retailerCode);
    return pricing !== null;
  } catch (error) {
    console.error("Error checking custom pricing:", error);
    return false;
  }
}