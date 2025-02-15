// src/lib/product/ProductFun.ts
import {databases,appwriteConfig} from "@/lib/appwrite"
import { Product } from "@/types/ProductTypes";
import { ID ,Query} from 'appwrite'; 
import { Category } from "@/types/CategoryTypes";

export async function fetchProducts(queries: Query[] = []): Promise<Product[]> { // Add queries parameter
    try {
        const response = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.productscollectionId,

        );

        const products = response.documents.map((doc) => ({
            $collectionId: doc.$collectionId,
            $createdAt: doc.$createdAt,
            $databaseId: doc.$databaseId,
            $id: doc.$id,
            $permissions: doc.$permissions,
            $updatedAt: doc.$updatedAt,
            categoryId: doc.categoryId,
            createdAt: doc.createdAt,
            description: doc.description,
            discount: doc.discount,
            imageUrl: doc.imageUrl,
            isFeatured: doc.isFeatured,
            mrp: doc.mrp,
            name: doc.name,
            price: doc.price,
            productId: doc.productId,
            stock: doc.stock,
            unit: doc.unit,
            
            updatedAt: doc.updatedAt,

        }));

        return products;
    } catch (error) {
        console.error('Error fetching products:', error);
        return [];
    }
}


 export async function addProduct(product: Omit<Product, "$id" | "$collectionId" | "$databaseId" | "$createdAt" | "$updatedAt" | "$permissions">): Promise<Product> {

  try {
    // Ensure discount is an integer before sending to Appwrite
    const discount = product.discount ? parseInt(product.discount.toString(), 10) : null;

 
    const response = await databases.createDocument(
 
      appwriteConfig.databaseId,
 
      appwriteConfig.productscollectionId,
 
      ID.unique(),
 
      {
        ...product,
        discount: discount, // Use the converted discount
    }
 
    );
 
 
 
    // More robust mapping with optional chaining and nullish coalescing:
 
    // let discount: number | null = null;
    // if (product.discount !== null && product.discount !== undefined) {
    //     discount = parseInt(product.discount.toString(), 10);
    // }
 
    
 
    const createdProduct: Product = {
 
      $collectionId: response.$collectionId,
 
      $createdAt: response.$createdAt,
 
      $databaseId: response.$databaseId,
 
      $id: response.$id,
 
      $permissions: response.$permissions,
 
      $updatedAt: response.$updatedAt,
 
      categoryId: response.categoryId,
 
      createdAt: response.createdAt,
 
      description: response.description,
      // todo convert this to integer
      discount: response.discount,
 
      imageUrl: response.imageUrl,
 
      isFeatured: response.isFeatured,
 
      mrp: response.mrp,
 
      name: response.name,
 
      price: response.price,
 
      productId: response.productId,
 
      stock: response.stock,
 
      unit: response.unit,
 
      updatedAt: response.updatedAt,

 
    };
 
 
 
    return createdProduct;
 
  } catch (error) {
 
    console.error("Error adding product:", error);
 
    throw new Error("Failed to add product. Please try again.");
 
  }
 
 }




export async function fetchCategories(): Promise<Category[]> {
  try {
    const response = await databases.listDocuments(
      appwriteConfig.databaseId, // Database ID
      appwriteConfig.categoriesCollectionId // Collection ID for categories
    );

    // Map the response to the Category type
    const categories: Category[] = response.documents.map((doc) => ({
      $id: doc.$id,
      name: doc.name,
      imageUrl: doc.imageUrl,
      categoryId: doc.categoryId,
      createdAt: new Date(doc.$createdAt),
      updatedAt: new Date(doc.$updatedAt),
    }));

    return categories;
  } catch (error) {
    console.error("Error fetching categories:", error);
    throw new Error("Failed to fetch categories. Please try again.");
  }
}


export async function deleteProduct(productId: string): Promise<void> {
  try {
    await databases.deleteDocument(
      appwriteConfig.databaseId, // Database ID
      appwriteConfig.productscollectionId, // Collection ID
      productId // Product ID
    );
  } catch (error) {
    console.error("Error deleting product: in backend", error);
    throw new Error("Failed to delete product. Please try again.");
  }
}


