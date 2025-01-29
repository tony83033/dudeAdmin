import { databases,appwriteConfig } from '@/lib/appwrite'; // Adjust the import path as needed
import { ID ,Query} from 'appwrite'; // Import ID for generating unique IDs
import { Category } from '@/types/CategoryTypes';

export async function addCategory(categorieName:string,categorieImageUrl:string){
  try {
    // Generate a unique ID for the new category
    const categoryId = ID.unique();

    // Create the new category document in the Appwrite database
    const response = await databases.createDocument(
      appwriteConfig.databaseId, // Database ID
      appwriteConfig.categoriesCollectionId, // Collection ID for categories
      categoryId, // Use the generated ID as the document ID
      {
        name: categorieName,
        imageUrl: categorieImageUrl,
        categoryId: categoryId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    );

    // Transform the response into the Category type
    const newCategory: Category = {
      $id: response.$id,
      name: response.name,
      imageUrl: response.imageUrl,
      categoryId: response.categoryId,
      createdAt: new Date(response.$createdAt),
      updatedAt: new Date(response.$updatedAt)
    };

    return newCategory;
  } catch (error) {
    console.error('Error adding category:', error);
    return null; // Return null in case of error
  }
}



export async function fetchCategories(): Promise<Category[]> {
    try {
      const response = await databases.listDocuments(
        appwriteConfig.databaseId, // Database ID
        appwriteConfig.categoriesCollectionId, // Collection ID for categories
        [
          Query.limit(100) // Fetch up to 100 categories (adjust as needed)
        ]
      );
  
      // Transform the response into the Category type
      const categories = response.documents.map((doc) => ({
        $id: doc.$id,
        name: doc.name,
        imageUrl: doc.imageUrl,
        categoryId: doc.categoryId,
        createdAt: new Date(doc.$createdAt),
        updatedAt: new Date(doc.$updatedAt)
      }));
  
      return categories;
    } catch (error) {
      console.error('Error fetching categories:', error);
      return []; // Return an empty array in case of error
    }
  }


  export async function deleteCategory(categoryId: string): Promise<boolean> {
    // categoryId is $id 
    try {
      // Delete the category document from the Appwrite database
      await databases.deleteDocument(
        appwriteConfig.databaseId,
        appwriteConfig.categoriesCollectionId,
        categoryId
      );

      return true; // Return true to indicate successful deletion
    } catch (error) {
      console.error('Error deleting category:', error);
      return false; // Return false to indicate deletion failed
    }
  }