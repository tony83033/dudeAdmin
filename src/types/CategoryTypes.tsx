export interface Category {
  $id: string; // Appwrite document ID
  name: string; // Category name
  imageUrl: string; // Category image URL
  categoryId: string; // Custom category ID (if needed)
  createdAt: Date; // Created at timestamp
  updatedAt: Date; // Updated at timestamp
   }



  // export interface Category = {
  //   $id: string; // Appwrite document ID
  //   name: string; // Category name
  //   imageUrl: string; // Category image URL
  //   categoryId: string; // Custom category ID (if needed)
  //   createdAt: Date; // Created at timestamp
  //   updatedAt: Date; // Updated at timestamp
  // };
