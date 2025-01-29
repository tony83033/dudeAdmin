// src/types/CategoryTypes.tsx
export interface Image {
    $id: string; // Appwrite document ID
    name: string; // Image  name
    imageUrl: string; //  image URL
    createdAt: Date; // Created at timestamp
    updatedAt: Date; // Updated at timestamp
     }