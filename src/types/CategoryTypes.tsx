
// /types/CategoryTypes.ts
export interface Category {
  $id: string;
  $collectionId: string;
  $databaseId: string;
  $createdAt: string;
  $updatedAt: string;
  $permissions: string[];
  categoryId: string;
  name: string;
  imageUrl: string;
  createdAt: string;
  updatedAt: string;
}