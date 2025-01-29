"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { addCategory,fetchCategories, deleteCategory } from '@/lib/cateogry/CategoryFun';
import { Category } from "@/types/CategoryTypes"
import toast, { Toaster } from 'react-hot-toast';
export function CategoriesTab() {
  const [categories, setCategories] = useState<Category[] >([])

  const [categorieName,setcategorieName] = useState<string>("")
  const [categorieImageUrl,setcategorieImageUrl] = useState<string>("")


  const [categoryId, setCategoryId] = useState('');

  

  const handleAddCategory = async () => {
    if (!categorieName || !categorieImageUrl) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      const result = await addCategory(categorieName, categorieImageUrl);
      if (result !== null) {
        toast.success('Category added successfully');
        setCategories(prevCategories => [...prevCategories, result]);
        setcategorieName("");
        setcategorieImageUrl("");
      } else {
        toast.error('Failed to add category');
      }
    } catch (error) {
      toast.error('An error occurred while adding the category');
    }
  }   

const getCategoryData = async () => {
  try {
    const data = await fetchCategories();
    setCategories(data);
    toast.success('Categories loaded successfully');
  } catch (error) {
    toast.error('Failed to load categories');
  }
}
  useEffect(()=>{
    getCategoryData()
  },[])

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      const success = await deleteCategory(categoryId);
      if (success) {
        setCategories(categories.filter(cat => cat.categoryId !== categoryId));
        toast.success('Category deleted successfully');
      } else {
        toast.error('Failed to delete category');
      }
    } catch (error) {
      toast.error('An error occurred while deleting the category');
    }
  };

  return (
    <div className="space-y-4">
      <Toaster/>
      <h2 className="text-2xl font-bold">Categories</h2>
      <div className="flex gap-2">
        <Input
          placeholder="Category name"
          value={categorieName}
          onChange={(e) => setcategorieName(e.target.value)}
        />
        <Input
          placeholder="Image URL"
          value={categorieImageUrl}
          onChange={(e) => setcategorieImageUrl(e.target.value)}
        />
        <Button onClick={handleAddCategory}>Add Category</Button>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Image</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead>Updated At</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories?.map((category) => (
              <TableRow key={category.categoryId}>
                <TableCell>{category.categoryId}</TableCell>
                <TableCell>{category.name}</TableCell>
                <TableCell>
                  <img
                    src={category.imageUrl || "/placeholder.svg"}
                    alt={category.name}
                    className="w-10 h-10 object-cover"
                  />
                </TableCell>
                <TableCell>{category.createdAt.toLocaleString()}</TableCell>
                <TableCell>{category.updatedAt.toLocaleString()}</TableCell>
                <TableCell>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => handleDeleteCategory(category.$id)}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

