"use client"

import { useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { addCategory, fetchCategories, deleteCategory, updateCategory } from '@/lib/cateogry/CategoryFun'
import { Category } from "@/types/CategoryTypes"
import toast, { Toaster } from 'react-hot-toast'
import { Skeleton } from "@/components/ui/skeleton"
import { Trash2, Plus, Image as ImageIcon, Calendar, RefreshCw, Edit, Save } from "lucide-react"

export function CategoriesTab() {
  const [categories, setCategories] = useState<Category[]>([])
  const [categoryName, setCategoryName] = useState<string>("")
  const [categoryImageUrl, setCategoryImageUrl] = useState<string>("")
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isAdding, setIsAdding] = useState<boolean>(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [imageLoadErrors, setImageLoadErrors] = useState<Set<string>>(new Set())

  // Form validation
  const isFormValid = categoryName.trim() && categoryImageUrl.trim()
  
  const isValidUrl = (url: string) => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  const handleAddCategory = async () => {
    if (!isFormValid) {
      toast.error('Please fill in all fields')
      return
    }

    if (!isValidUrl(categoryImageUrl)) {
      toast.error('Please enter a valid image URL')
      return
    }

    setIsAdding(true)
    try {
      const result = await addCategory(categoryName.trim(), categoryImageUrl.trim())
      if (result !== null) {
        toast.success('Category added successfully')
        setCategories(prevCategories => [...prevCategories, result])
        setCategoryName("")
        setCategoryImageUrl("")
      } else {
        toast.error('Failed to add category')
      }
    } catch (error) {
      console.error('Error adding category:', error)
      toast.error('An error occurred while adding the category')
    } finally {
      setIsAdding(false)
    }
  }

  const getCategoryData = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await fetchCategories()
      setCategories(data || [])
      if (data?.length > 0) {
        toast.success(`${data.length} categories loaded successfully`)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
      toast.error('Failed to load categories')
      setCategories([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    getCategoryData()
  }, [getCategoryData])

  const handleDeleteCategory = async (categoryId: string) => {
    setDeletingId(categoryId)
    try {
      const success = await deleteCategory(categoryId)
      if (success) {
        setCategories(categories.filter(cat => cat.categoryId !== categoryId))
        toast.success('Category deleted successfully')
      } else {
        toast.error('Failed to delete category')
      }
    } catch (error) {
      console.error('Error deleting category:', error)
      toast.error('An error occurred while deleting the category')
    } finally {
      setDeletingId(null)
    }
  }

  const handleImageError = (categoryId: string) => {
    setImageLoadErrors(prev => new Set([...Array.from(prev), categoryId]))
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid Date';
    }
  }

  // Skeleton Loader for Table Rows
  const TableSkeleton = () => (
    <>
      {Array.from({ length: 5 }).map((_, index) => (
        <TableRow key={index}>
          <TableCell className="hidden sm:table-cell">
            <Skeleton className="h-4 w-[100px]" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-[120px]" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-10 w-10 rounded-md" />
          </TableCell>
          <TableCell className="hidden md:table-cell">
            <Skeleton className="h-4 w-[100px]" />
          </TableCell>
          <TableCell className="hidden lg:table-cell">
            <Skeleton className="h-4 w-[100px]" />
          </TableCell>
          <TableCell>
            <div className="flex gap-1">
              <Skeleton className="h-8 w-[60px]" />
              <Skeleton className="h-8 w-[60px]" />
            </div>
          </TableCell>
        </TableRow>
      ))}
    </>
  )

  // Edit Category Dialog Component
  const EditCategoryDialog = ({ category }: { category: Category }) => {
    const [open, setOpen] = useState(false)
    const [localName, setLocalName] = useState(category.name)
    const [localImageUrl, setLocalImageUrl] = useState(category.imageUrl || "")
    const [isUpdating, setIsUpdating] = useState(false)

    const handleSave = async () => {
      if (!localName.trim() || !localImageUrl.trim()) {
        toast.error('Please fill in all fields')
        return
      }

      if (!isValidUrl(localImageUrl)) {
        toast.error('Please enter a valid image URL')
        return
      }

      setIsUpdating(true)
      try {
        const success = await updateCategory(
          category.$id,
          localName.trim(), 
          localImageUrl.trim()
        )
        
        if (success) {
          const updatedAt = new Date().toISOString();
          setCategories(prevCategories =>
            prevCategories.map(cat =>
              cat.$id === category.$id
                ? { ...cat, name: localName.trim(), imageUrl: localImageUrl.trim(), updatedAt }
                : cat
            )
          )
          toast.success('Category updated successfully')
          setOpen(false)
          // Remove from image error set if it was there
          setImageLoadErrors(prev => {
            const newSet = new Set(prev)
            newSet.delete(category.categoryId)
            return newSet
          })
        } else {
          toast.error('Failed to update category')
        }
      } catch (error) {
        console.error('Error updating category:', error)
        toast.error('An error occurred while updating the category')
      } finally {
        setIsUpdating(false)
      }
    }

    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={isUpdating}
            onClick={() => {
              setLocalName(category.name)
              setLocalImageUrl(category.imageUrl || "")
            }}
          >
            {isUpdating ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Edit className="h-4 w-4" />
            )}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>
              Make changes to the category. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Category Name
              </label>
              <Input
                id="name"
                value={localName}
                onChange={(e) => setLocalName(e.target.value)}
                placeholder="Category name"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="imageUrl" className="text-sm font-medium">
                Image URL
              </label>
              <Input
                id="imageUrl"
                value={localImageUrl}
                onChange={(e) => setLocalImageUrl(e.target.value)}
                placeholder="Image URL"
              />
            </div>
            {localImageUrl && isValidUrl(localImageUrl) && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Preview</label>
                <img
                  src={localImageUrl}
                  alt="Preview"
                  className="w-20 h-20 object-cover rounded-md border"
                  onError={() => toast.error('Invalid image URL')}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!localName.trim() || !localImageUrl.trim() || isUpdating}
            >
              {isUpdating ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  // Mobile Card View for small screens
  const MobileCardView = () => (
    <div className="grid gap-4 sm:hidden">
      {categories.map((category) => (
        <Card key={category.categoryId} className="w-full">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{category.name}</CardTitle>
              <div className="flex gap-2">
                <EditCategoryDialog category={category} />
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      disabled={deletingId === category.$id}
                    >
                      {deletingId === category.$id ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Category</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{category.name}"? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => handleDeleteCategory(category.$id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                {imageLoadErrors.has(category.categoryId) ? (
                  <div className="w-12 h-12 bg-muted rounded-md flex items-center justify-center">
                    <ImageIcon className="h-6 w-6 text-muted-foreground" />
                  </div>
                ) : (
                  <img
                    src={category.imageUrl || "/placeholder.svg"}
                    alt={category.name}
                    className="w-12 h-12 object-cover rounded-md"
                    onError={() => handleImageError(category.categoryId)}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <Badge variant="secondary" className="text-xs">
                    ID: {category.categoryId}
                  </Badge>
                </div>
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Created: {formatDate(category.createdAt)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Updated: {formatDate(category.updatedAt)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Categories</h2>
          <p className="text-muted-foreground">
            Manage your product categories
          </p>
        </div>
        <Button 
          onClick={getCategoryData} 
          variant="outline" 
          size="sm"
          disabled={isLoading}
        >
          {isLoading ? (
            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Refresh
        </Button>
      </div>

      {/* Add Category Form */}
      <Card>
        <CardHeader>
          <CardTitle>Add New Category</CardTitle>
          <CardDescription>
            Create a new category with a name and image URL
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="Category name"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              className="flex-1"
              disabled={isAdding}
            />
            <Input
              placeholder="Image URL"
              value={categoryImageUrl}
              onChange={(e) => setCategoryImageUrl(e.target.value)}
              className="flex-1"
              disabled={isAdding}
            />
            <Button 
              onClick={handleAddCategory}
              disabled={!isFormValid || isAdding}
              className="sm:w-auto"
            >
              {isAdding ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Category
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Categories Display */}
      <Card>
        <CardHeader>
          <CardTitle>
            All Categories ({categories.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {/* Mobile View */}
          {!isLoading && categories.length > 0 && <MobileCardView />}
          
          {/* Desktop Table View */}
          <div className="hidden sm:block">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="hidden sm:table-cell">ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Image</TableHead>
                    <TableHead className="hidden md:table-cell">Created At</TableHead>
                    <TableHead className="hidden lg:table-cell">Updated At</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableSkeleton />
                  ) : categories.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className="flex flex-col items-center gap-2">
                          <ImageIcon className="h-8 w-8 text-muted-foreground" />
                          <p className="text-muted-foreground">No categories found</p>
                          <p className="text-sm text-muted-foreground">Add your first category above</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    categories.map((category) => (
                      <TableRow key={category.categoryId}>
                        <TableCell className="hidden sm:table-cell font-mono text-sm">
                          {category.categoryId}
                        </TableCell>
                        <TableCell className="font-medium">{category.name}</TableCell>
                        <TableCell>
                          {imageLoadErrors.has(category.categoryId) ? (
                            <div className="w-10 h-10 bg-muted rounded-md flex items-center justify-center">
                              <ImageIcon className="h-5 w-5 text-muted-foreground" />
                            </div>
                          ) : (
                            <img
                              src={category.imageUrl || "/placeholder.svg"}
                              alt={category.name}
                              className="w-10 h-10 object-cover rounded-md"
                              onError={() => handleImageError(category.categoryId)}
                            />
                          )}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                          {formatDate(category.createdAt)}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                          {formatDate(category.updatedAt)}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <EditCategoryDialog category={category} />
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={deletingId === category.$id}
                                >
                                  {deletingId === category.$id ? (
                                    <RefreshCw className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Category</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{category.name}"? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleDeleteCategory(category.$id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
          
          {/* Loading state for mobile */}
          {isLoading && (
            <div className="sm:hidden space-y-4 p-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <Card key={index}>
                  <CardHeader>
                    <Skeleton className="h-6 w-[150px]" />
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-12 w-12 rounded-md" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-[100px]" />
                        <Skeleton className="h-3 w-[80px]" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Empty state for mobile */}
          {!isLoading && categories.length === 0 && (
            <div className="sm:hidden p-8 text-center">
              <div className="flex flex-col items-center gap-3">
                <ImageIcon className="h-12 w-12 text-muted-foreground" />
                <h3 className="text-lg font-semibold">No categories yet</h3>
                <p className="text-muted-foreground text-sm max-w-[250px]">
                  Start by adding your first category using the form above
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}