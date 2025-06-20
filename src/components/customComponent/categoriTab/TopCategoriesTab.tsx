'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { databases, appwriteConfig } from '@/lib/appwrite'
import { ID, Query, Models } from 'appwrite'
import { Category } from '@/types/CategoryTypes'
import toast, { Toaster } from 'react-hot-toast'
import { Skeleton } from "@/components/ui/skeleton"
import { fetchCategories } from '@/lib/cateogry/CategoryFun'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RefreshCw, Image as ImageIcon, Trash2 } from 'lucide-react'

interface TopCategory extends Models.Document {
  categoryDocumentId: string;
  rank: number;
  createdAt: string;
  updatedAt: string;
}

export function TopCategoriesTab() {
  const [topCategories, setTopCategories] = useState<TopCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [rank, setRank] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [imageLoadErrors, setImageLoadErrors] = useState<Set<string>>(new Set());

  // Fetch both top categories and all categories
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        // Fetch all categories
        const allCategories = await fetchCategories();
        setCategories(allCategories);

        // Fetch top categories
        const response = await databases.listDocuments(
          appwriteConfig.databaseId,
          appwriteConfig.topCategoriesCollectionId,
          [Query.orderAsc('rank')]
        );
        setTopCategories(response.documents as TopCategory[]);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to fetch categories');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleAddTopCategory = async () => {
    if (!selectedCategory || !rank) {
      toast.error('Please select a category and specify the rank');
      return;
    }

    // Find the selected category details
    const category = categories.find(cat => cat.$id === selectedCategory);
    if (!category) {
      toast.error('Selected category not found');
      return;
    }

    try {
      setIsAdding(true);
      // Check if the rank number is already taken
      const existingWithRank = topCategories.find(tc => tc.rank === parseInt(rank));
      if (existingWithRank) {
        toast.error('This rank number is already taken');
        return;
      }

      // Check if the category is already a top category
      const existingCategory = topCategories.find(tc => tc.categoryDocumentId === category.$id);
      if (existingCategory) {
        toast.error('This category is already in top categories');
        return;
      }

      const response = await databases.createDocument(
        appwriteConfig.databaseId,
        appwriteConfig.topCategoriesCollectionId,
        ID.unique(),
        {
          categoryDocumentId: category.$id,
          rank: parseInt(rank),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      );

      setTopCategories([...topCategories, response as TopCategory]);
      setSelectedCategory('');
      setRank('');
      toast.success('Top category added successfully');
    } catch (error) {
      console.error('Error adding top category:', error);
      toast.error('Failed to add top category');
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteTopCategory = async (topCategoryId: string) => {
    try {
      await databases.deleteDocument(
        appwriteConfig.databaseId,
        appwriteConfig.topCategoriesCollectionId,
        topCategoryId
      );

      setTopCategories(topCategories.filter(tc => tc.$id !== topCategoryId));
      toast.success('Top category removed successfully');
    } catch (error) {
      console.error('Error deleting top category:', error);
      toast.error('Failed to remove top category');
    }
  };

  const handleImageError = (categoryId: string) => {
    setImageLoadErrors(prev => new Set([...Array.from(prev), categoryId]));
  };

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />
      
      <Card>
        <CardHeader>
          <CardTitle>Add New Top Category</CardTitle>
          <CardDescription>
            Select a category and specify its rank in the featured list
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
              disabled={isAdding}
            >
              <SelectTrigger className="w-full sm:w-[300px]">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.$id} value={category.$id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              type="number"
              placeholder="Display Rank (1, 2, 3...)"
              value={rank}
              onChange={(e) => setRank(e.target.value)}
              min="1"
              className="w-full sm:w-[200px]"
              disabled={isAdding}
            />

            <Button 
              onClick={handleAddTopCategory}
              disabled={!selectedCategory || !rank || isAdding}
              className="sm:w-auto"
            >
              {isAdding ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  Adding...
                </>
              ) : (
                'Add to Top Categories'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Featured Categories ({topCategories.length})
          </CardTitle>
          <CardDescription>
            Categories that appear in the featured section of the mobile app
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rank</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Image</TableHead>
                  <TableHead className="hidden sm:table-cell">Category ID</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24">
                      <div className="flex items-center justify-center">
                        <RefreshCw className="h-6 w-6 animate-spin" />
                      </div>
                    </TableCell>
                  </TableRow>
                ) : topCategories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <ImageIcon className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">No featured categories found</p>
                        <p className="text-sm text-muted-foreground">Add your first featured category above</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  topCategories
                    .sort((a, b) => a.rank - b.rank)
                    .map((category) => (
                      <TableRow key={category.$id}>
                        <TableCell className="font-medium">{category.rank}</TableCell>
                        <TableCell>{category.name}</TableCell>
                        <TableCell>
                          {imageLoadErrors.has(category.$id) ? (
                            <div className="w-10 h-10 bg-muted rounded-md flex items-center justify-center">
                              <ImageIcon className="h-5 w-5 text-muted-foreground" />
                            </div>
                          ) : (
                            <img
                              src={category.imageUrl}
                              alt={category.name}
                              className="w-10 h-10 rounded-md object-cover"
                              onError={() => handleImageError(category.$id)}
                            />
                          )}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell font-mono text-sm">
                          {category.categoryDocumentId}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteTopCategory(category.$id)}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="ml-2 hidden sm:inline">Remove</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

