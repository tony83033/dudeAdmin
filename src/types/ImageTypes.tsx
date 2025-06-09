// src/types/ImageTypes.tsx
export interface Image {
    $id: string; // Appwrite document ID
    name: string; // Image name
    imageUrl: string; // Image URL
    createdAt: string; // Created at timestamp
    updatedAt: string; // Updated at timestamp
}