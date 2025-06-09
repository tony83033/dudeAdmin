// /lib/product/ProductFun.ts
import { databases, appwriteConfig } from '@/lib/appwrite';
import { ID, Query } from 'appwrite';
import { Product } from '@/types/ProductTypes';

export async function fetchProducts(): Promise<Product[]> {
  try {
    const response = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.productscollectionId,
      [Query.limit(100)]
    );

    const products = response.documents.map((doc) => ({
      $id: doc.$id,
      $collectionId: doc.$collectionId,
      $databaseId: doc.$databaseId,
      $createdAt: doc.$createdAt,
      $updatedAt: doc.$updatedAt,
      $permissions: doc.$permissions,
      productId: doc.productId,
      name: doc.name,
      description: doc.description,
      price: doc.price / 100, // Convert from cents to main currency unit
      mrp: doc.mrp ? doc.mrp / 100 : null, // Convert from cents to main currency unit
      discount: doc.discount, // Keep discount as percentage (don't divide by 100)
      imageUrl: doc.imageUrl,
      stock: doc.stock,
      unit: doc.unit,
      isFeatured: doc.isFeatured,
      categoryId: doc.categoryId,
      createdAt: doc.$createdAt,
      updatedAt: doc.$updatedAt
    }));

    return products;
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

export async function addProduct(productData: any) {
  try {
    const response = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.productscollectionId,
      ID.unique(),
      {
        productId: productData.productId,
        name: productData.name,
        description: productData.description || '',
        price: Math.round(productData.price * 100), // Store in cents
        mrp: productData.mrp ? Math.round(productData.mrp * 100) : null, // Store in cents
        discount: productData.discount || null, // Store as percentage (don't multiply by 100)
        imageUrl: productData.imageUrl || '',
        stock: productData.stock || 0,
        unit: productData.unit,
        isFeatured: productData.isFeatured || false,
        categoryId: productData.categoryId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    );
    
    return {
      ...response,
      price: response.price / 100, // Convert back to main currency unit for frontend
      mrp: response.mrp ? response.mrp / 100 : null, // Convert back to main currency unit for frontend
      discount: response.discount, // Keep as percentage
    };
  } catch (error) {
    console.error('Error adding product:', error);
    throw error;
  }
}

export const updateProduct = async (documentId: string, productData: any): Promise<boolean> => {
  try {
    const updateData: any = {
      updatedAt: new Date().toISOString(),
    };

    if (productData.name !== undefined) updateData.name = productData.name;
    if (productData.productId !== undefined) updateData.productId = productData.productId;
    if (productData.description !== undefined) updateData.description = productData.description;
    if (productData.price !== undefined) updateData.price = Math.round(productData.price * 100); // Store in cents
    if (productData.mrp !== undefined) updateData.mrp = productData.mrp ? Math.round(productData.mrp * 100) : null; // Store in cents
    if (productData.discount !== undefined) updateData.discount = productData.discount; // Store as percentage (don't multiply by 100)
    if (productData.imageUrl !== undefined) updateData.imageUrl = productData.imageUrl;
    if (productData.stock !== undefined) updateData.stock = productData.stock;
    if (productData.unit !== undefined) updateData.unit = productData.unit;
    if (productData.isFeatured !== undefined) updateData.isFeatured = productData.isFeatured;
    if (productData.categoryId !== undefined) updateData.categoryId = productData.categoryId;

    await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.productscollectionId,
      documentId,
      updateData
    );
    return true;
  } catch (error) {
    console.error('Error updating product:', error);
    return false;
  }
};






export async function deleteProduct(documentId: string): Promise<boolean> {
  try {
    await databases.deleteDocument(
      appwriteConfig.databaseId,
      appwriteConfig.productscollectionId,
      documentId
    );
    return true;
  } catch (error) {
    console.error('Error deleting product:', error);
    return false;
  }
}

// Fetch categories for product form
export async function fetchCategories() {
  try {
    const response = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.categoriesCollectionId,
      [Query.limit(100)]
    );
    return response.documents;
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}