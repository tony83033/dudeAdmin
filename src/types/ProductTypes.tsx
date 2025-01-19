// Define the Product interface
export interface Product {
    $collectionId: string;
    $createdAt: string;
    $databaseId: string;
    $id: string;
    $permissions: string[];
    $updatedAt: string;
    categoryId: string;
    createdAt: string;
    description: string;
    discount: number | null; // Discount can be null
    imageUrl: string;
    isFeatured: boolean;
    mrp: number | null; // MRP can be null
    name: string;
    price: number;
    productId: string;
    stock: number;
    updatedAt: string;
  }