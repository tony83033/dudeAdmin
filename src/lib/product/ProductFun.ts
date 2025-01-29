import {databases,appwriteConfig} from "@/lib/appwrite"
import { Product } from "@/types/ProductTypes";
export async function fetchProducts(): Promise<Product[]> {
    try {
      const response = await databases.listDocuments(
        appwriteConfig.databaseId, // Database ID
        appwriteConfig.productscollectionId, // Collection ID

      );
  
      // Cast the documents to Product[]
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
        updatedAt: doc.updatedAt,
      }));
  
      return products;
    } catch (error) {
      console.error('Error fetching products:', error);
      return []; // Return an empty array in case of error
    }
  }