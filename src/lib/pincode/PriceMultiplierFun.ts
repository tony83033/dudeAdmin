import { databases } from "../appwrite";
import { appwriteConfig } from "../appwrite";
import { PriceMultiplier, ProductPriceMultiplier, CreateProductPriceMultiplier, UpdateProductPriceMultiplier, ProductPriceMultiplierDisplay } from "@/types/PriceMultiplierTypes";
import { ID, Query } from "appwrite";

// Fetch all price multipliers
export async function fetchPriceMultipliers(): Promise<PriceMultiplier[]> {
  try {
    const response = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.priceMultipliersCollectionId,
      [
        Query.orderDesc("$createdAt"),
        Query.limit(100)
      ]
    );
    return response.documents as PriceMultiplier[];
  } catch (error) {
    console.error("Error fetching price multipliers:", error);
    throw new Error("Failed to fetch price multipliers");
  }
}

// Add a new price multiplier
export async function addPriceMultiplier(multiplierData: Omit<PriceMultiplier, "$id" | "$collectionId" | "$databaseId" | "$createdAt" | "$updatedAt" | "$permissions">): Promise<PriceMultiplier> {
  try {
    const response = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.priceMultipliersCollectionId,
      ID.unique(),
      multiplierData
    );
    return response as PriceMultiplier;
  } catch (error) {
    console.error("Error adding price multiplier:", error);
    throw new Error("Failed to add price multiplier");
  }
}

// Update a price multiplier
export async function updatePriceMultiplier(multiplierId: string, updateData: Partial<Omit<PriceMultiplier, "$id" | "$collectionId" | "$databaseId" | "$createdAt" | "$updatedAt" | "$permissions">>): Promise<boolean> {
  try {
    await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.priceMultipliersCollectionId,
      multiplierId,
      updateData
    );
    return true;
  } catch (error) {
    console.error("Error updating price multiplier:", error);
    throw new Error("Failed to update price multiplier");
  }
}

// Delete a price multiplier
export async function deletePriceMultiplier(multiplierId: string): Promise<boolean> {
  try {
    await databases.deleteDocument(
      appwriteConfig.databaseId,
      appwriteConfig.priceMultipliersCollectionId,
      multiplierId
    );
    return true;
  } catch (error) {
    console.error("Error deleting price multiplier:", error);
    throw new Error("Failed to delete price multiplier");
  }
}

// Fetch active price multipliers only
export async function fetchActivePriceMultipliers(): Promise<PriceMultiplier[]> {
  try {
    const response = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.priceMultipliersCollectionId,
      [
        Query.equal("isActive", true),
        Query.orderDesc("$createdAt")
      ]
    );
    return response.documents as PriceMultiplier[];
  } catch (error) {
    console.error("Error fetching active price multipliers:", error);
    throw new Error("Failed to fetch active price multipliers");
  }
}

// Get price multiplier for a specific retailer code
export async function getPriceMultiplierByRetailerCode(retailerCode: string): Promise<PriceMultiplier | null> {
  try {
    const response = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.priceMultipliersCollectionId,
      [
        Query.equal("retailerCode", retailerCode),
        Query.equal("isActive", true)
      ]
    );
    
    return response.documents[0] as PriceMultiplier || null;
  } catch (error) {
    console.error("Error fetching price multiplier by retailer code:", error);
    return null;
  }
}

// ===== PRODUCT-SPECIFIC PRICE MULTIPLIERS =====

// Fetch all product price multipliers
export async function fetchProductPriceMultipliers(): Promise<ProductPriceMultiplier[]> {
  try {
    const response = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.productPriceMultipliersCollectionId,
      [
        Query.orderDesc("$createdAt"),
        Query.limit(100)
      ]
    );
    return response.documents as ProductPriceMultiplier[];
  } catch (error) {
    console.error("Error fetching product price multipliers:", error);
    throw new Error("Failed to fetch product price multipliers");
  }
}

// Fetch product price multipliers with details
export async function fetchProductPriceMultipliersWithDetails(): Promise<ProductPriceMultiplierDisplay[]> {
  try {
    const [multipliers, products, users] = await Promise.all([
      fetchProductPriceMultipliers(),
      import("@/lib/product/ProductFun").then(m => m.fetchProducts()),
      import("@/lib/product/HandleUsers").then(m => m.fetchUsers())
    ]);

    // Create maps for faster lookup
    const productMap = new Map(products.map(p => [p.$id, p]));
    const userMap = new Map(users.map(u => [u.retailCode, u]));

    const multipliersWithDetails: ProductPriceMultiplierDisplay[] = multipliers.map(multiplier => {
      const product = productMap.get(multiplier.productId);
      const retailer = userMap.get(multiplier.retailerCode);
      
      const originalPrice = product?.price || 0;
      const calculatedPrice = originalPrice * multiplier.multiplierValue;
      const priceDifference = calculatedPrice - originalPrice;

      return {
        ...multiplier,
        productName: product?.name || 'Unknown Product',
        productCode: product?.productId || 'Unknown',
        retailerName: retailer?.name || multiplier.retailerCode,
        originalPrice,
        calculatedPrice,
        priceDifference
      };
    });

    return multipliersWithDetails;
  } catch (error) {
    console.error("Error fetching product price multipliers with details:", error);
    throw new Error("Failed to fetch product price multipliers with details");
  }
}

// Test if productPriceMultipliers collection exists
export async function testProductPriceMultipliersCollection(): Promise<boolean> {
  try {
    // Try to list documents from the collection
    await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.productPriceMultipliersCollectionId
    );
    console.log('Product price multipliers collection exists and is accessible');
    return true;
  } catch (error: any) {
    console.error('Product price multipliers collection test failed:', error);
    if (error?.code === 404 || error?.message?.includes('not found')) {
      console.error('Collection does not exist. Please create it first using the deployment script.');
      return false;
    }
    throw error;
  }
}

// Add new product price multiplier
export async function addProductPriceMultiplier(multiplierData: CreateProductPriceMultiplier): Promise<ProductPriceMultiplier> {
  try {
    const now = new Date().toISOString();
    
    console.log('Adding product price multiplier:', {
      databaseId: appwriteConfig.databaseId,
      collectionId: appwriteConfig.productPriceMultipliersCollectionId,
      data: multiplierData
    });
    
    const response = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.productPriceMultipliersCollectionId,
      ID.unique(),
      {
        ...multiplierData,
        isActive: multiplierData.isActive ?? true,
        createdAt: now,
        updatedAt: now
      }
    );
    
    console.log('Product price multiplier added successfully:', response);
    return response as ProductPriceMultiplier;
  } catch (error: any) {
    console.error("Error adding product price multiplier:", error);
    console.error("Error details:", {
      message: error?.message || 'Unknown error',
      code: error?.code || 'No code',
      response: error?.response || 'No response'
    });
    throw new Error(`Failed to add product price multiplier: ${error?.message || 'Unknown error'}`);
  }
}

// Update product price multiplier
export async function updateProductPriceMultiplier(multiplierId: string, updateData: UpdateProductPriceMultiplier): Promise<boolean> {
  try {
    const updatePayload: any = {
      updatedAt: new Date().toISOString()
    };

    if (updateData.multiplierValue !== undefined) {
      updatePayload.multiplierValue = updateData.multiplierValue;
    }

    if (updateData.isActive !== undefined) {
      updatePayload.isActive = updateData.isActive;
    }

    await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.productPriceMultipliersCollectionId,
      multiplierId,
      updatePayload
    );
    
    return true;
  } catch (error) {
    console.error("Error updating product price multiplier:", error);
    throw new Error("Failed to update product price multiplier");
  }
}

// Delete product price multiplier
export async function deleteProductPriceMultiplier(multiplierId: string): Promise<boolean> {
  try {
    await databases.deleteDocument(
      appwriteConfig.databaseId,
      appwriteConfig.productPriceMultipliersCollectionId,
      multiplierId
    );
    return true;
  } catch (error) {
    console.error("Error deleting product price multiplier:", error);
    throw new Error("Failed to delete product price multiplier");
  }
}

// Get product price multiplier for specific product and retailer
export async function getProductPriceMultiplier(productId: string, retailerCode: string): Promise<ProductPriceMultiplier | null> {
  try {
    const response = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.productPriceMultipliersCollectionId,
      [
        Query.equal("productId", productId),
        Query.equal("retailerCode", retailerCode),
        Query.equal("isActive", true)
      ]
    );
    
    return response.documents[0] as ProductPriceMultiplier || null;
  } catch (error) {
    console.error("Error fetching product price multiplier:", error);
    return null;
  }
}

// Calculate price for a product with retailer-specific multiplier
export async function calculateProductPriceWithMultiplier(productId: string, retailerCode: string, originalPrice: number): Promise<number> {
  try {
    const multiplier = await getProductPriceMultiplier(productId, retailerCode);
    if (multiplier && multiplier.isActive) {
      return originalPrice * multiplier.multiplierValue;
    }
    return originalPrice;
  } catch (error) {
    console.error("Error calculating product price with multiplier:", error);
    return originalPrice;
  }
}