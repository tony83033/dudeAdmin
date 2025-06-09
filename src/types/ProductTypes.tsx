// Define the Product interface

export interface Flavour {
  name: string; // Name of the flavour (e.g., "Vanilla", "Chocolate")
  quantity: number; // Quantity available for this flavour
}


// /types/ProductTypes.ts
export interface Product {
  $id: string;
  $collectionId: string;
  $databaseId: string;
  $createdAt: string;
  $updatedAt: string;
  $permissions: string[];
  productId: string;
  name: string;
  description: string;
  price: number; // Will be converted from integer cents to decimal
  mrp: number | null;
  discount: number | null;
  imageUrl: string;
  stock: number;
  unit: string; // Add this field
  isFeatured: boolean;
  categoryId: string;
  createdAt: string;
  updatedAt: string;
}
