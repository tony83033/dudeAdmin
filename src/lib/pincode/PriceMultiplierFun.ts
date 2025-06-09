import { databases } from "../appwrite";
import { appwriteConfig } from "../appwrite";
import { PriceMultiplier } from "@/types/PriceMultiplierTypes";
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

// Get price multiplier for a specific pincode
export async function getPriceMultiplierByPincode(pincodeId: string): Promise<PriceMultiplier | null> {
  try {
    const response = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.priceMultipliersCollectionId,
      [
        Query.equal("pincodeId", pincodeId),
        Query.equal("isActive", true)
      ]
    );
    
    if (response.documents.length > 0) {
      return response.documents[0] as PriceMultiplier;
    }
    
    return null;
  } catch (error) {
    console.error("Error getting price multiplier by pincode:", error);
    throw new Error("Failed to get price multiplier by pincode");
  }
}

// Calculate multiplied price for a pincode
export async function calculateMultipliedPrice(basePrice: number, pincodeId: string): Promise<number> {
  try {
    const multiplier = await getPriceMultiplierByPincode(pincodeId);
    
    if (multiplier) {
      return basePrice * multiplier.multiplierValue;
    }
    
    return basePrice; // Return original price if no multiplier found
  } catch (error) {
    console.error("Error calculating multiplied price:", error);
    return basePrice; // Return original price on error
  }
}