// src/lib/Images/ImagesFun.ts
import { appwriteConfig, databases, storage } from "../appwrite";
import { Image } from "@/types/ImageTypes";
import { Query } from "appwrite";

interface PaginatedImagesResponse {
  images: Image[];
  total: number;
}

/**
 * Uploads an image to Appwrite Storage and creates a corresponding document in the database.
 */
export const uploadImage = async (file: File, name: string): Promise<Image> => {
  try {
    const fileResponse = await storage.createFile(
      appwriteConfig.imageBucketId,
      'unique()',
      file
    );

    const fileUrl = storage.getFileView(
      appwriteConfig.imageBucketId,
      fileResponse.$id
    ).toString();

    const documentResponse = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.imagesCollectionId,
      'unique()',
      {
        name,
        imageUrl: fileUrl,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    );

    return {
      $id: documentResponse.$id,
      name: documentResponse.name,
      imageUrl: documentResponse.imageUrl,
      createdAt: new Date(documentResponse.createdAt),
      updatedAt: new Date(documentResponse.updatedAt),
    };
  } catch (error) {
    console.error('Error uploading image:', error);
    throw new Error('Image upload failed. Please check storage and database permissions.');
  }
};

/**
 * Fetches a paginated list of images from the database.
 */
export const fetchImages = async ({ page, limit }: { page: number; limit: number }): Promise<PaginatedImagesResponse> => {
  try {
    const offset = (page - 1) * limit;
    const response = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.imagesCollectionId,
      [
        Query.orderDesc('$createdAt'),
        Query.limit(limit),
        Query.offset(offset)
      ]
    );

    const total = response.total;
    const images: Image[] = response.documents.map((doc) => ({
      $id: doc.$id,
      name: doc.name || 'Unnamed Image',
      imageUrl: doc.imageUrl || '',
      createdAt: new Date(doc.$createdAt),
      updatedAt: new Date(doc.$updatedAt),
    }));

    return { images, total };
  } catch (error) {
    console.error('Error fetching paginated images:', error);
    throw new Error('Failed to fetch images from the database.');
  }
};

/**
 * Deletes an image document from the database and the corresponding file from storage.
 */
export const deleteImage = async (image: Image): Promise<void> => {
  try {
    // Delete the database document first
    await databases.deleteDocument(
      appwriteConfig.databaseId,
      appwriteConfig.imagesCollectionId,
      image.$id
    );

    // Parse the fileId from the imageUrl and delete the file from storage
    try {
      const urlParts = image.imageUrl.split('/files/');
      if (urlParts.length > 1) {
        const fileId = urlParts[1].split('/')[0];
        await storage.deleteFile(appwriteConfig.imageBucketId, fileId);
      }
    } catch (storageError) {
      console.error('Could not delete from storage, maybe file was already removed:', storageError);
      // Do not throw, as the primary goal (deleting DB record) succeeded.
    }
  } catch (error) {
    console.error('Error deleting image:', error);
    throw new Error('Failed to delete the image.');
  }
};