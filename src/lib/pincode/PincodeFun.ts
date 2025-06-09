import { databases } from "../appwrite";
import { appwriteConfig } from "../appwrite";
import { Pincode } from "@/types/PincodeTypes";
import { ID, Query } from "appwrite";

// Fetch all pincodes
export async function fetchPincodes(): Promise<Pincode[]> {
  try {
    console.log("Fetching pincodes from collection:", appwriteConfig.pincodesCollectionId);
    const response = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.pincodesCollectionId,
      [
        Query.orderDesc("$createdAt"),
        Query.limit(100)
      ]
    );
    console.log("Fetched pincodes:", response.documents);
    return response.documents as Pincode[];
  } catch (error) {
    console.error("Error fetching pincodes:", error);
    throw new Error("Failed to fetch pincodes");
  }
}

// Add a new pincode
export async function addPincode(pincodeData: Omit<Pincode, "$id" | "$collectionId" | "$databaseId" | "$createdAt" | "$updatedAt" | "$permissions">): Promise<Pincode> {
  try {
    console.log("Adding new pincode:", pincodeData);
    const response = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.pincodesCollectionId,
      ID.unique(),
      {
        ...pincodeData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    );
    console.log("Added pincode:", response);
    return response as Pincode;
  } catch (error) {
    console.error("Error adding pincode:", error);
    throw new Error("Failed to add pincode");
  }
}

// Update a pincode
export async function updatePincode(pincodeId: string, updateData: Partial<Omit<Pincode, "$id" | "$collectionId" | "$databaseId" | "$createdAt" | "$updatedAt" | "$permissions">>): Promise<boolean> {
  try {
    console.log("Updating pincode:", pincodeId, updateData);
    await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.pincodesCollectionId,
      pincodeId,
      {
        ...updateData,
        updatedAt: new Date().toISOString()
      }
    );
    console.log("Updated pincode successfully");
    return true;
  } catch (error) {
    console.error("Error updating pincode:", error);
    throw new Error("Failed to update pincode");
  }
}

// Delete a pincode
export async function deletePincode(pincodeId: string): Promise<boolean> {
  try {
    console.log("Deleting pincode:", pincodeId);
    await databases.deleteDocument(
      appwriteConfig.databaseId,
      appwriteConfig.pincodesCollectionId,
      pincodeId
    );
    console.log("Deleted pincode successfully");
    return true;
  } catch (error) {
    console.error("Error deleting pincode:", error);
    throw new Error("Failed to delete pincode");
  }
}

// Fetch active pincodes only
export async function fetchActivePincodes(): Promise<Pincode[]> {
  try {
    console.log("Fetching active pincodes");
    const response = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.pincodesCollectionId,
      [
        Query.equal("isActive", true),
        Query.orderDesc("$createdAt")
      ]
    );
    console.log("Fetched active pincodes:", response.documents);
    return response.documents as Pincode[];
  } catch (error) {
    console.error("Error fetching active pincodes:", error);
    throw new Error("Failed to fetch active pincodes");
  }
}

// Check if pincode is serviceable
export async function checkPincodeServiceability(pincode: string): Promise<Pincode | null> {
  try {
    console.log("Checking pincode serviceability:", pincode);
    const response = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.pincodesCollectionId,
      [
        Query.equal("pincode", pincode),
        Query.equal("isActive", true)
      ]
    );
    
    if (response.documents.length > 0) {
      console.log("Found serviceable pincode:", response.documents[0]);
      return response.documents[0] as Pincode;
    }
    
    console.log("Pincode not serviceable");
    return null;
  } catch (error) {
    console.error("Error checking pincode serviceability:", error);
    throw new Error("Failed to check pincode serviceability");
  }
}