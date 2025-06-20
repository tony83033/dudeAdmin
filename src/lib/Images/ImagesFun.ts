// src/lib/Images/ImagesFun.ts
import { appwriteConfig, databases, storage } from "../appwrite";
import { Image } from "@/types/ImageTypes";
import { Query } from "appwrite";

// Function to upload an image to Appwrite Storage and store metadata in the database
export const uploadImage = async (file: File, name: string): Promise<Image> => {
  try {
    // Step 1: Upload the image file to Appwrite Storage
    const fileResponse = await storage.createFile(
      appwriteConfig.imageBucketId, // Bucket ID
      'unique()', // Use Appwrite's unique ID generator
      file
    );

    // Step 2: Get the file URL
    const fileUrl = `https://cloud.appwrite.io/v1/storage/buckets/${appwriteConfig.imageBucketId}/files/${fileResponse.$id}/view?project=${appwriteConfig.projectId}`;

    // Step 3: Store the image metadata in the database
    const documentResponse = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.imagesCollectionId,
      'unique()', // Use Appwrite's unique ID generator
      {
        name,
        imageUrl: fileUrl,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    );

    // Return the newly created image object
    return {
      $id: documentResponse.$id,
      name: documentResponse.name,
      imageUrl: documentResponse.imageUrl,
      createdAt: new Date(documentResponse.createdAt),
      updatedAt: new Date(documentResponse.updatedAt),
    };
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error; // Re-throw the error to handle it in the component
  }
};

// Function to fetch images from the Appwrite database
export const fetchImages = async (): Promise<Image[]> => {
  try {
    console.log('Fetching images from collection:', appwriteConfig.imagesCollectionId);
    
    const response = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.imagesCollectionId,
      [
        Query.orderDesc('$createdAt'), // Sort by creation date, newest first
        Query.limit(100) // Limit to 100 images
      ]
    );

    console.log('Raw response from database:', response);
    console.log('Number of documents found:', response.documents.length);

    // Transform the response to match the Image type with better error handling
    const images: Image[] = response.documents.map((doc) => {
      try {
        return {
          $id: doc.$id,
          name: doc.name || 'Unnamed Image',
          imageUrl: doc.imageUrl || '',
          createdAt: doc.createdAt ? new Date(doc.createdAt) : new Date(doc.$createdAt),
          updatedAt: doc.updatedAt ? new Date(doc.updatedAt) : new Date(doc.$updatedAt),
        };
      } catch (error) {
        console.error('Error processing image document:', doc, error);
        // Return a fallback image object
        return {
          $id: doc.$id || 'unknown',
          name: doc.name || 'Error Loading Image',
          imageUrl: doc.imageUrl || '',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }
    });

    console.log('Processed images:', images);
    return images;
  } catch (error) {
    console.error('Error fetching images:', error);
    return [];
  }
};

// Function to delete an image from the Appwrite database
export const deleteImage = async (imageId: string): Promise<void> => {
  try {
    await databases.deleteDocument(
      appwriteConfig.databaseId,
      appwriteConfig.imagesCollectionId,
      imageId
    );
    console.log('Image deleted successfully');
  } catch (error) {
    console.error('Error deleting image:', error);
    throw error; // Re-throw the error to handle it in the component
  }
};