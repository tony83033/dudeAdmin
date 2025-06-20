// src/types/CategoryTypes.tsx
export interface Image {
    $id: string; // Appwrite document ID
    name: string; // Image  name
    imageUrl: string; //  image URL
    createdAt: Date; // Created at timestamp
    updatedAt: Date; // Updated at timestamp
    originalSize?: number; // Original file size in bytes
    compressedSize?: number; // Compressed file size in bytes
    compressionRatio?: string; // Compression ratio as percentage
}