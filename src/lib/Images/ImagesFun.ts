// src/lib/Images/ImagesFun.ts
import { appwriteConfig, databases, storage } from "../appwrite";
import { Image } from "@/types/ImageTypes";
import { Query } from "appwrite";
import { compressImage, formatFileSize } from "../utils";

interface PaginatedImagesResponse {
  images: Image[];
  total: number;
}

interface CompressionOptions {
  quality?: number; // 0.1 to 1.0
  maxWidth?: number;
  maxHeight?: number;
  format?: 'jpeg' | 'png' | 'webp';
  enableCompression?: boolean;
}

/**
 * Uploads an image to Appwrite Storage and creates a corresponding document in the database.
 * Optionally compresses the image before upload.
 */
export const uploadImage = async (
  file: File, 
  name: string, 
  compressionOptions: CompressionOptions = {}
): Promise<Image> => {
  try {
    let fileToUpload = file;
    const originalSize = file.size;
    let compressedSize = file.size;

    // Compress image if enabled
    if (compressionOptions.enableCompression !== false) {
      try {
        console.log(`Original file size: ${formatFileSize(originalSize)}`);
        fileToUpload = await compressImage(file, {
          quality: compressionOptions.quality || 0.8,
          maxWidth: compressionOptions.maxWidth || 1920,
          maxHeight: compressionOptions.maxHeight || 1080,
          format: compressionOptions.format || 'jpeg'
        });
        compressedSize = fileToUpload.size;
        console.log(`Compressed file size: ${formatFileSize(compressedSize)}`);
        console.log(`Compression ratio: ${((1 - compressedSize / originalSize) * 100).toFixed(1)}%`);
      } catch (compressionError) {
        console.warn('Image compression failed, uploading original:', compressionError);
        // Continue with original file if compression fails
      }
    }

    const fileResponse = await storage.createFile(
      appwriteConfig.imageBucketId,
      'unique()',
      fileToUpload
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
        // Temporarily commented out until database schema is updated
        // originalSize,
        // compressedSize,
        // compressionRatio: originalSize > 0 ? ((1 - compressedSize / originalSize) * 100).toFixed(1) : 0,
      }
    );

    return {
      $id: documentResponse.$id,
      name: documentResponse.name,
      imageUrl: documentResponse.imageUrl,
      createdAt: new Date(documentResponse.createdAt),
      updatedAt: new Date(documentResponse.updatedAt),
      // Temporarily commented out until database schema is updated
      // originalSize: documentResponse.originalSize || originalSize,
      // compressedSize: documentResponse.compressedSize || compressedSize,
      // compressionRatio: documentResponse.compressionRatio || 0,
    };
  } catch (error) {
    console.error('Error uploading image:', error);
    throw new Error('Image upload failed. Please check storage and database permissions.');
  }
};

/**
 * Uploads an image with default compression settings (recommended for most use cases)
 */
export const uploadImageWithCompression = async (file: File, name: string): Promise<Image> => {
  return uploadImage(file, name, {
    enableCompression: true,
    quality: 0.8,
    maxWidth: 1920,
    maxHeight: 1080,
    format: 'jpeg'
  });
};

/**
 * Uploads an image without compression (for high-quality images)
 */
export const uploadImageWithoutCompression = async (file: File, name: string): Promise<Image> => {
  return uploadImage(file, name, { enableCompression: false });
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
      // Temporarily commented out until database schema is updated
      // originalSize: doc.originalSize || undefined,
      // compressedSize: doc.compressedSize || undefined,
      // compressionRatio: doc.compressionRatio || undefined,
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