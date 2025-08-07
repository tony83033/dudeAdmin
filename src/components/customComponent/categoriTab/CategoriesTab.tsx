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
import { fetchImages } from '@/lib/Images/ImagesFun'
import { Category } from "@/types/CategoryTypes"
import { Image } from "@/types/ImageTypes"
import { Admin } from "@/types/AdminTypes"
import { canEditCategory, canDeleteCategory } from "@/lib/auth/permissions"
import toast, { Toaster } from 'react-hot-toast'
import { Skeleton } from "@/components/ui/skeleton"
import { Trash2, Plus, Image as ImageIcon, Calendar, RefreshCw, Edit, Save, Search, FolderOpen } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

interface CategoriesTabProps {
  currentAdmin: Admin | null;
}

// Add the ImageSelector component before the CategoriesTab component
const ImageSelector = ({ 
  open, 
  onOpenChange, 
  onSelect 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void; 
  onSelect: (url: string) => void;
}) => {
  const [images, setImages] = useState<Image[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalImages, setTotalImages] = useState(0);

  const imagesPerPage = 9;

  const loadImages = useCallback(async (page: number) => {
    try {
      setIsLoading(true);
      const data = await fetchImages({ page, limit: imagesPerPage });
      setImages(data.images);
      setTotalImages(data.total);
      setTotalPages(Math.ceil(data.total / imagesPerPage));
      setCurrentPage(page);
    } catch (error) {
      console.error('Error loading images:', error);
      toast.error('Failed to load images');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      loadImages(1);
    }
  }, [open, loadImages]);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      loadImages(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      loadImages(currentPage - 1);
    }
  };

  const filteredImages = images.filter(image => 
    image.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Select Image</DialogTitle>
          <DialogDescription>
            Choose an image from your library
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-2 border rounded-md px-3 py-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search images..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
            />
          </div>
          <ScrollArea className="h-[400px] rounded-md border p-4">
            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="aspect-square rounded-md" />
                ))}
              </div>
            ) : filteredImages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  {searchQuery ? 'No images found' : 'No images available'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {filteredImages.map((image) => (
                  <button
                    key={image.$id}
                    onClick={() => {
                      onSelect(image.imageUrl);
                      onOpenChange(false);
                    }}
                    className="group relative aspect-square rounded-md overflow-hidden border hover:border-primary transition-colors"
                  >
                    <img
                      src={image.imageUrl}
                      alt={image.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/60 flex items-end p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-xs text-white truncate w-full">
                        {image.name}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
         <DialogFooter className="pt-4 sm:justify-between items-center border-t mt-4">
          <div className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages} ({totalImages} images)
          </div>
          <div className="flex gap-2">
            <Button onClick={handlePrevPage} disabled={currentPage <= 1 || isLoading} variant="outline">
              Previous
            </Button>
            <Button onClick={handleNextPage} disabled={currentPage >= totalPages || isLoading} variant="outline">
              Next
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export function CategoriesTab({ currentAdmin }: CategoriesTabProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [categoryName, setCategoryName] = useState<string>("")
  const [categoryImageUrl, setCategoryImageUrl] = useState<string>("")
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isAdding, setIsAdding] = useState<boolean>(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [imageLoadErrors, setImageLoadErrors] = useState<Set<string>>(new Set())
  const [isImageSelectorOpen, setIsImageSelectorOpen] = useState(false)

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
    if (!canDeleteCategory(currentAdmin)) {
      toast.error('You do not have permission to delete categories')
      return
    }

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
    const [isEditImageSelectorOpen, setIsEditImageSelectorOpen] = useState(false)

    // Check if current admin can edit categories
    const canEdit = canEditCategory(currentAdmin);
    
    if (!canEdit) {
      return null; // Don't render the edit button if no permission
    }

    const handleSave = async () => {
      if (!canEditCategory(currentAdmin)) {
        toast.error('You do not have permission to edit categories')
        return
      }

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
              <label className="text-sm font-medium">Image URL</label>
              <div className="flex gap-2">
                <Input
                  value={localImageUrl}
                  onChange={(e) => setLocalImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                />
                <Button
                  variant="outline"
                  size="icon"
                  type="button"
                  onClick={() => setIsEditImageSelectorOpen(true)}
                >
                  <ImageIcon className="h-4 w-4" />
                </Button>
              </div>
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
        <ImageSelector
          open={isEditImageSelectorOpen}
          onOpenChange={setIsEditImageSelectorOpen}
          onSelect={(url) => setLocalImageUrl(url)}
        />
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
                {canDeleteCategory(currentAdmin) && (
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
                )}
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
    <div className="space-y-4 sm:space-y-6">
      <Toaster position="top-right" />
      
      {/* Mobile Header */}
      <div className="lg:hidden space-y-4">
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-bold tracking-tight">Categories</h2>
          <p className="text-sm text-muted-foreground">
            Manage product categories and organization
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <Button 
            onClick={() => setIsImageSelectorOpen(true)} 
            className="w-full"
            disabled={!canEditCategory(currentAdmin)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Category
          </Button>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden lg:flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Categories</h2>
          <p className="text-muted-foreground">
            Manage product categories and organization
          </p>
        </div>
        <Button 
          onClick={() => setIsImageSelectorOpen(true)} 
          disabled={!canEditCategory(currentAdmin)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Category
        </Button>
      </div>

      {/* Add Category Dialog */}
      <Dialog open={isImageSelectorOpen} onOpenChange={setIsImageSelectorOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Category</DialogTitle>
            <DialogDescription>
              Create a new category for organizing products. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Category Name
              </label>
              <Input
                id="name"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                placeholder="Category name"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Image URL</label>
              <div className="flex gap-2">
                <Input
                  value={categoryImageUrl}
                  onChange={(e) => setCategoryImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="icon"
                  type="button"
                  onClick={() => setIsImageSelectorOpen(true)}
                >
                  <ImageIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {categoryImageUrl && isValidUrl(categoryImageUrl) && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Preview</label>
                <img
                  src={categoryImageUrl}
                  alt="Preview"
                  className="w-20 h-20 object-cover rounded-md border"
                  onError={() => toast.error('Invalid image URL')}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsImageSelectorOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddCategory}
              disabled={!categoryName.trim() || !categoryImageUrl.trim() || isAdding}
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
          </DialogFooter>
        </DialogContent>
        <ImageSelector
          open={isImageSelectorOpen}
          onOpenChange={setIsImageSelectorOpen}
          onSelect={(url) => setCategoryImageUrl(url)}
        />
      </Dialog>

      {/* Categories Display */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg sm:text-xl">
            All Categories ({categories.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {/* Mobile Card View */}
          {!isLoading && categories.length > 0 && <MobileCardView />}
          
          {/* Desktop Table View */}
          <div className="hidden lg:block">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="hidden sm:table-cell">ID</TableHead>
                    <TableHead>Image</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden md:table-cell">Products</TableHead>
                    <TableHead className="hidden lg:table-cell">Created</TableHead>
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
                          <FolderOpen className="h-8 w-8 text-muted-foreground" />
                          <p className="text-muted-foreground">No categories found</p>
                          <p className="text-sm text-muted-foreground">Add your first category above</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    categories.map((category) => (
                      <TableRow key={category.$id}>
                        <TableCell className="hidden sm:table-cell font-mono text-sm">
                          {category.$id}
                        </TableCell>
                        <TableCell>
                          {imageLoadErrors.has(category.$id) ? (
                            <div className="w-10 h-10 bg-muted rounded-md flex items-center justify-center">
                              <ImageIcon className="h-5 w-5 text-muted-foreground" />
                            </div>
                          ) : (
                            <img
                              src={category.imageUrl || "/placeholder.svg"}
                              alt={category.name}
                              className="w-10 h-10 object-cover rounded-md"
                              onError={() => handleImageError(category.$id)}
                            />
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{category.name}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge variant="outline">0</Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {formatDate(category.createdAt)}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <EditCategoryDialog category={category} />
                            {canDeleteCategory(currentAdmin) && (
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
                            )}
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
            <div className="lg:hidden space-y-4 p-4">
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
            <div className="lg:hidden p-8 text-center">
              <div className="flex flex-col items-center gap-3">
                <FolderOpen className="h-12 w-12 text-muted-foreground" />
                <h3 className="text-lg font-semibold">No categories yet</h3>
                <p className="text-muted-foreground text-sm max-w-[250px]">
                  Start by adding your first category above
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}