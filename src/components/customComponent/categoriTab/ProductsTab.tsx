"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { fetchProducts, addProduct, fetchCategories, deleteProduct, updateProduct } from "@/lib/product/ProductFun";
import { fetchImages } from '@/lib/Images/ImagesFun'
import { Product } from "@/types/ProductTypes";
import { Category } from "@/types/CategoryTypes";
import { Image } from "@/types/ImageTypes";
import { Admin } from "@/types/AdminTypes";
import { canEditProduct, canDeleteProduct } from "@/lib/auth/permissions";
import toast, { Toaster } from "react-hot-toast";
import { Trash2, Plus, Image as ImageIcon, Calendar, RefreshCw, Edit, Save, Package, Star, DollarSign, Percent, Search, Users, ChevronLeft, ChevronRight } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RetailerAvailabilityInput } from "@/components/ui/retailer-availability-input";

interface EditingProduct {
  $id: string;
  name: string;
  productId: string;
  description: string;
  price: number;
  mrp: number | null;
  discount: number | null;
  gst: number | null;
  imageUrl: string;
  stock: number;
  unit: string;
  isFeatured: boolean;
  categoryId: string;
  flavours: string[];
  retailerAvailability: string[];
}

// Add the ImageSelector component
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

interface ProductsTabProps {
  currentAdmin: Admin | null;
}

export function ProductsTab({ currentAdmin }: ProductsTabProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [imageLoadErrors, setImageLoadErrors] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalProducts, setTotalProducts] = useState(0);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  const [newProduct, setNewProduct] = useState<Omit<EditingProduct, "$id">>({
    categoryId: "",
    description: "",
    discount: null,
    imageUrl: "",
    isFeatured: false,
    mrp: null,
    name: "",
    price: 0,
    gst: null,
    productId: "",
    unit: "",
    stock: 0,
    flavours: [],
    retailerAvailability: [],
  });

  // Create a map of categories for faster lookup
  const categoryMap = useMemo(() => new Map(categories.map((cat) => [cat.$id, cat.name])), [categories]);

  // Form validation
  const isFormValid = newProduct.name.trim() && 
                     newProduct.productId.trim() && 
                     newProduct.price > 0 && 
                     newProduct.categoryId && 
                     newProduct.unit;

  const isValidUrl = (url: string) => {
    if (!url) return true; // Allow empty URLs
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  // Auto calculate discount
  useEffect(() => {
    if (newProduct.mrp && newProduct.price && newProduct.mrp > 0) {
      const discountPercentage = ((newProduct.mrp - newProduct.price) / newProduct.mrp) * 100;
      setNewProduct((prev) => ({
        ...prev,
        discount: parseFloat(discountPercentage.toFixed(2)),
      }));
    } else {
      setNewProduct((prev) => ({
        ...prev,
        discount: null,
      }));
    }
  }, [newProduct.mrp, newProduct.price]);

  // Filtered and paginated products
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    
    const query = searchQuery.toLowerCase();
    return products.filter(product => 
      product.name.toLowerCase().includes(query) ||
      product.productId.toLowerCase().includes(query) ||
      product.description?.toLowerCase().includes(query) ||
      categoryMap.get(product.categoryId)?.toLowerCase().includes(query)
    );
  }, [products, searchQuery, categoryMap]);

  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredProducts, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const loadProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await fetchProducts();
      setProducts(data || []);
      setTotalProducts(data?.length || 0);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch products:", err);
      setError("Failed to fetch products. Please try again later.");
      toast.error("Failed to fetch products.");
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadCategories = useCallback(async () => {
    try {
      setIsCategoriesLoading(true);
      const data = await fetchCategories();
      setCategories((data || []) as unknown as Category[]);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
      toast.error("Failed to fetch categories.");
      setCategories([]);
    } finally {
      setIsCategoriesLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, [loadProducts, loadCategories]);

  // Handle search with debouncing
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1); // Reset to first page when searching
    
    // Clear existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    // Set new timeout for debouncing
    const timeout = setTimeout(() => {
      // Search is handled by useMemo, no need for additional logic here
    }, 300);
    
    setSearchTimeout(timeout);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  const handleAddProduct = async () => {
    if (!isFormValid) {
      toast.error("Please fill in all required fields.");
      return;
    }

    if (newProduct.imageUrl && !isValidUrl(newProduct.imageUrl)) {
      toast.error("Please enter a valid image URL.");
      return;
    }

    setIsAdding(true);
    try {
      const createdProduct = await addProduct({
        productId: newProduct.productId.trim(),
        name: newProduct.name.trim(),
        description: newProduct.description.trim(),
        price: Math.round(Number(newProduct.price)),
        mrp: newProduct.mrp !== null ? Math.round(Number(newProduct.mrp)) : null,
        discount: newProduct.discount !== null ? Math.round(Number(newProduct.discount)) : null,
        gst: newProduct.gst ? Math.round(Number(newProduct.gst)) : null,
        imageUrl: newProduct.imageUrl.trim(),
        stock: Math.round(Number(newProduct.stock)),
        isFeatured: !!newProduct.isFeatured,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        categoryId: newProduct.categoryId,
        unit: newProduct.unit,
        flavours: Array.isArray(newProduct.flavours) ? newProduct.flavours : [],
        retailerAvailability: Array.isArray(newProduct.retailerAvailability) ? newProduct.retailerAvailability : [],
      });

      // Add to products list without refreshing the entire page
      setProducts(prev => [...prev, createdProduct as Product]);
      setTotalProducts(prev => prev + 1);
      
      // Reset form
      setNewProduct({
        categoryId: "",
        description: "",
        discount: null,
        imageUrl: "",
        isFeatured: false,
        mrp: null,
        name: "",
        price: 0,
        gst: null,
        productId: "",
        unit: "",
        stock: 0,
        flavours: [],
        retailerAvailability: [],
      });
      toast.success("Product added successfully!");
    } catch (error: any) {
      console.error("Failed to add product:", error);
      if (error?.message?.includes('required')) {
        toast.error("A required field is missing. Please check all fields and try again.");
      } else if (error?.message?.includes('type')) {
        toast.error("A field has the wrong type. Please check your input values.");
      } else {
        toast.error("Failed to add product. Please try again.");
      }
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    setDeletingId(productId);
    try {
      const success = await deleteProduct(productId);
      if (success) {
        // Remove from products list without refreshing the entire page
        setProducts(prev => prev.filter((product) => product.$id !== productId));
        setTotalProducts(prev => prev - 1);
        toast.success("Product deleted successfully!");
      } else {
        toast.error("Failed to delete product.");
      }
    } catch (error) {
      console.error("Failed to delete product:", error);
      toast.error("Failed to delete product. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleImageError = (productId: string) => {
    setImageLoadErrors(prev => new Set(Array.from(prev).concat(productId)));
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString));
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Pagination controls
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    const startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  // Add state for image selector
  const [isImageSelectorOpen, setIsImageSelectorOpen] = useState(false);

  // Edit Product Dialog Component
  const EditProductDialog = ({ product }: { product: Product }) => {
    // Check if current admin can edit products
    const canEdit = canEditProduct(currentAdmin);
    
    if (!canEdit) {
      return null; // Don't render the edit button if no permission
    }
    const [open, setOpen] = useState(false);
    const [editData, setEditData] = useState<EditingProduct>({
      $id: product.$id,
      name: product.name,
      productId: product.productId,
      description: product.description,
      price: product.price,
      mrp: product.mrp,
      discount: product.discount,
      gst: product.gst,
      imageUrl: product.imageUrl || "",
      stock: product.stock,
      unit: product.unit,
      isFeatured: product.isFeatured,
      categoryId: product.categoryId,
      flavours: product.flavours || [],
      retailerAvailability: product.retailerAvailability || [],
    });

    // Add state for image selector
    const [isEditImageSelectorOpen, setIsEditImageSelectorOpen] = useState(false);

    // Auto calculate discount for edit form
    useEffect(() => {
      if (editData.mrp && editData.price && editData.mrp > 0) {
        const discountPercentage = ((editData.mrp - editData.price) / editData.mrp) * 100;
        setEditData(prev => ({
          ...prev,
          discount: parseFloat(discountPercentage.toFixed(2)),
        }));
      } else {
        setEditData(prev => ({
          ...prev,
          discount: null,
        }));
      }
    }, [editData.mrp, editData.price]);

    const isEditFormValid = editData.name.trim() && 
                           editData.productId.trim() && 
                           editData.price > 0 && 
                           editData.categoryId && 
                           editData.unit;

    const handleSave = async () => {
      if (!isEditFormValid) {
        toast.error("Please fill in all required fields.");
        return;
      }

      if (editData.imageUrl && !isValidUrl(editData.imageUrl)) {
        toast.error("Please enter a valid image URL.");
        return;
      }

      setUpdatingId(product.$id);
      try {
        const success = await updateProduct(product.$id, {
          ...editData,
          name: editData.name.trim(),
          productId: editData.productId.trim(),
          description: editData.description.trim(),
          imageUrl: editData.imageUrl.trim(),
          price: Math.round(Number(editData.price)),
          gst: editData.gst ? Math.round(Number(editData.gst)) : null,
          discount: editData.discount ? Math.round(editData.discount) : null,
          retailerAvailability: editData.retailerAvailability,
          updatedAt: new Date().toISOString(),
        });

        if (success) {
          setProducts(prevProducts =>
            prevProducts.map(p =>
              p.$id === product.$id
                ? { ...p, ...editData, updatedAt: new Date().toISOString() }
                : p
            )
          );
          toast.success("Product updated successfully!");
          setOpen(false);
          // Remove from image error set if it was there
          setImageLoadErrors(prev => {
            const newSet = new Set(prev);
            newSet.delete(product.$id);
            return newSet;
          });
        } else {
          toast.error("Failed to update product.");
        }
      } catch (error) {
        console.error("Error updating product:", error);
        toast.error("An error occurred while updating the product.");
      } finally {
        setUpdatingId(null);
      }
    };

    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={updatingId === product.$id}
            onClick={() => {
              setEditData({
                $id: product.$id,
                name: product.name,
                productId: product.productId,
                description: product.description,
                price: product.price,
                mrp: product.mrp,
                discount: product.discount,
                gst: product.gst,
                imageUrl: product.imageUrl || "",
                stock: product.stock,
                unit: product.unit,
                isFeatured: product.isFeatured,
                categoryId: product.categoryId,
                flavours: product.flavours || [],
                retailerAvailability: product.retailerAvailability || [],
              });
            }}
          >
            {updatingId === product.$id ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Edit className="h-4 w-4" />
            )}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>
              Make changes to the product. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Product Name *</label>
                <Input
                  value={editData.name}
                  onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Product name"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Product Code *</label>
                <Input
                  value={editData.productId}
                  onChange={(e) => setEditData(prev => ({ ...prev, productId: e.target.value }))}
                  placeholder="Product code"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={editData.description}
                onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Product description"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Price (Base) *</label>
                <Input
                  type="number"
                  step="0.01"
                  value={editData.price || ""}
                  onChange={(e) => setEditData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">GST (%)</label>
                <Input
                  placeholder="0"
                  type="number"
                  step="1"
                  value={editData.gst || ""}
                  onChange={(e) => setEditData(prev => ({ ...prev, gst: Math.round(Number(e.target.value)) }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">MRP</label>
                <Input
                  type="number"
                  step="0.01"
                  value={editData.mrp || ""}
                  onChange={(e) => setEditData(prev => ({ ...prev, mrp: parseFloat(e.target.value) || null }))}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="col-span-2">
              <span className="text-sm text-muted-foreground">
                Final Price: <b>₹ {editData.price}</b>
                {editData.gst && (
                  <span className="ml-2 text-muted-foreground">
                    (GST: {editData.gst}%)
                  </span>
                )}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Stock</label>
                <Input
                  type="number"
                  value={editData.stock || ""}
                  onChange={(e) => setEditData(prev => ({ 
                    ...prev, 
                    stock: parseInt(e.target.value) || 0 
                  }))}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Unit *</label>
                <Select
                  value={editData.unit}
                  onValueChange={(value) => setEditData(prev => ({ ...prev, unit: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">kg</SelectItem>
                    <SelectItem value="Pac">Pac</SelectItem>
                    <SelectItem value="Box">Box</SelectItem>
                    <SelectItem value="Jar">Jar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Category *</label>
              <Select
                value={editData.categoryId}
                onValueChange={(value) => setEditData(prev => ({ ...prev, categoryId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.$id} value={category.$id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Image URL</label>
              <div className="flex gap-2">
                <Input
                  value={editData.imageUrl}
                  onChange={(e) => setEditData(prev => ({ ...prev, imageUrl: e.target.value }))}
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
              {editData.imageUrl && isValidUrl(editData.imageUrl) && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Preview</label>
                  <img
                    src={editData.imageUrl}
                    alt="Preview"
                    className="w-20 h-20 object-cover rounded-md border"
                    onError={() => toast.error('Invalid image URL')}
                  />
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="editFeatured"
                checked={editData.isFeatured}
                onCheckedChange={(checked) => setEditData(prev => ({ 
                  ...prev, 
                  isFeatured: checked as boolean 
                }))}
              />
              <label htmlFor="editFeatured" className="text-sm font-medium">
                Featured Product
              </label>
            </div>

            {/* Retailer Availability */}
            <div className="mt-4">
              <RetailerAvailabilityInput
                value={editData.retailerAvailability}
                onChange={(value) => setEditData(prev => ({ ...prev, retailerAvailability: value }))}
                disabled={updatingId === product.$id}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!isEditFormValid || updatingId === product.$id}
            >
              {updatingId === product.$id ? (
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
    );
  };

  // Skeleton Loader
  const TableSkeleton = () => (
    <>
      {Array.from({ length: 5 }).map((_, index) => (
        <TableRow key={index}>
          <TableCell className="hidden lg:table-cell">
            <Skeleton className="h-4 w-[100px]" />
          </TableCell>
          <TableCell className="hidden sm:table-cell">
            <Skeleton className="h-4 w-[100px]" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-[120px]" />
          </TableCell>
          <TableCell className="hidden md:table-cell">
            <Skeleton className="h-4 w-[150px]" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-[80px]" />
          </TableCell>
          <TableCell className="hidden sm:table-cell">
            <Skeleton className="h-4 w-[80px]" />
          </TableCell>
          <TableCell className="hidden md:table-cell">
            <Skeleton className="h-4 w-[60px]" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-10 w-10 rounded-md" />
          </TableCell>
          <TableCell className="hidden lg:table-cell">
            <Skeleton className="h-4 w-[60px]" />
          </TableCell>
          <TableCell className="hidden xl:table-cell">
            <Skeleton className="h-4 w-[60px]" />
          </TableCell>
          <TableCell className="hidden sm:table-cell">
            <Skeleton className="h-4 w-[60px]" />
          </TableCell>
          <TableCell className="hidden md:table-cell">
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
  );

  // Mobile Card View
  const MobileCardView = () => (
    <div className="grid gap-4 lg:hidden px-4 sm:px-6 w-full max-w-full">
      {paginatedProducts.map((product) => (
        <Card key={product.$id} className="w-full max-w-full overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-2 w-full">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg truncate">{product.name}</CardTitle>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <Badge variant="secondary" className="text-xs">
                    {product.productId}
                  </Badge>
                  {product.isFeatured && (
                    <Badge variant="default" className="text-xs">
                      <Star className="h-3 w-3 mr-1" />
                      Featured
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex gap-2 ml-2 flex-shrink-0">
                <EditProductDialog product={product} />
                {canDeleteProduct(currentAdmin) && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        disabled={deletingId === product.$id}
                      >
                        {deletingId === product.$id ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Product</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{product.name}"? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => handleDeleteProduct(product.$id)}
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
          <CardContent className="px-4 sm:px-6 w-full">
            <div className="space-y-4 w-full">
              {/* Image and Basic Info */}
              <div className="flex items-start gap-4 w-full">
                <div className="flex-shrink-0">
                  {imageLoadErrors.has(product.$id) ? (
                    <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    </div>
                  ) : (
                    <img
                      src={product.imageUrl || "/placeholder.svg"}
                      alt={product.name}
                      className="w-16 h-16 object-cover rounded-md"
                      onError={() => handleImageError(product.$id)}
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {product.description || "No description"}
                  </p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <Badge variant="outline" className="text-xs">
                      {categoryMap.get(product.categoryId) || "Unknown"}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {product.unit}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Price Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                <div className="space-y-1">
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">Price</span>
                  </div>
                  <p className="text-lg font-bold text-green-600">
                    {formatPrice(product.price)}
                  </p>
                </div>
                {product.mrp && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1">
                      <Percent className="h-4 w-4 text-orange-600" />
                      <span className="text-sm font-medium">MRP & Discount</span>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground line-through">
                        {formatPrice(product.mrp)}
                      </p>
                      {product.discount && (
                        <p className="text-sm font-medium text-orange-600">
                          {product.discount}% off
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Stock and Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-muted-foreground w-full">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">Stock: {product.stock}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">Updated: {formatDate(product.updatedAt)}</span>
                </div>
              </div>

              {/* Retailer Availability */}
              <div className="space-y-2 w-full">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 flex-shrink-0" />
                  <span className="text-sm font-medium">Retailer Availability</span>
                </div>
                {product.retailerAvailability && product.retailerAvailability.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {product.retailerAvailability.slice(0, 5).map((code) => (
                      <Badge key={code} variant="secondary" className="text-xs px-2">
                        {code}
                      </Badge>
                    ))}
                    {product.retailerAvailability.length > 5 && (
                      <Badge variant="secondary" className="text-xs px-2">
                        +{product.retailerAvailability.length - 5} more
                      </Badge>
                    )}
                  </div>
                ) : (
                  <Badge variant="outline" className="text-xs text-green-600 w-fit">
                    Available to All Retailers
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <div className="text-red-500 text-center">
          <h3 className="text-lg font-semibold mb-2">Error Loading Products</h3>
          <p className="mb-4">{error}</p>
          <Button onClick={loadProducts} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 max-w-full overflow-hidden">
      <Toaster position="top-right" />
      
      {/* Mobile Header */}
      <div className="lg:hidden space-y-4 px-4 sm:px-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-bold tracking-tight">Products</h2>
          <p className="text-sm text-muted-foreground">
            Manage your product inventory
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full"
          />
          <Button 
            onClick={loadProducts} 
            variant="outline" 
            size="sm"
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden lg:flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Products</h2>
          <p className="text-muted-foreground">
            Manage your product inventory
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full sm:w-[150px] lg:w-[250px]"
          />
          <Button 
            onClick={loadProducts} 
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
      </div>

      {/* Add Product Form */}
      {currentAdmin?.role !== 'sales_admin' && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg sm:text-xl">Add New Product</CardTitle>
            <CardDescription>
              Create a new product with all the necessary details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Product Name *</label>
                <Input
                  placeholder="Product name"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  disabled={isAdding}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Product Code *</label>
                <Input
                  placeholder="Product Item Code"
                  value={newProduct.productId}
                  onChange={(e) => setNewProduct({ ...newProduct, productId: e.target.value })}
                  disabled={isAdding}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Price (Base) *</label>
                <Input
                  placeholder="0.00"
                  type="number"
                  step="0.01"
                  value={newProduct.price || ""}
                  onChange={(e) => setNewProduct({
                    ...newProduct,
                    price: parseFloat(e.target.value) || 0,
                  })}
                  disabled={isAdding}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">GST (%)</label>
                <Input
                  placeholder="0"
                  type="number"
                  step="0.01"
                  value={newProduct.gst || ""}
                  onChange={(e) => setNewProduct({
                    ...newProduct,
                    gst: parseFloat(e.target.value) || 0,
                  })}
                  disabled={isAdding}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">MRP</label>
                <Input
                  placeholder="0.00"
                  type="number"
                  step="0.01"
                  value={newProduct.mrp || ""}
                  onChange={(e) => setNewProduct({
                    ...newProduct,
                    mrp: parseFloat(e.target.value) || null,
                  })}
                  disabled={isAdding}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Stock *</label>
                <Input
                  placeholder="0"
                  type="number"
                  value={newProduct.stock || ""}
                  onChange={(e) => setNewProduct({
                    ...newProduct,
                    stock: parseInt(e.target.value) || 0,
                  })}
                  disabled={isAdding}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Unit *</label>
                <Select
                  onValueChange={(value) => setNewProduct({ ...newProduct, unit: value })}
                  value={newProduct.unit}
                  disabled={isAdding}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">kg</SelectItem>
                    <SelectItem value="Pac">Pac</SelectItem>
                    <SelectItem value="Box">Box</SelectItem>
                    <SelectItem value="Jar">Jar</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Category *</label>
                <Select
                  onValueChange={(value) => setNewProduct({ ...newProduct, categoryId: value })}
                  value={newProduct.categoryId}
                  disabled={isAdding || isCategoriesLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {isCategoriesLoading ? (
                      <SelectItem value="loading" disabled>
                        Loading categories...
                      </SelectItem>
                    ) : categories.length === 0 ? (
                      <SelectItem value="no-categories" disabled>
                        No categories found
                      </SelectItem>
                    ) : (
                      categories.map((category) => (
                        <SelectItem key={category.$id} value={category.$id}>
                          {category.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Image URL</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="https://example.com/image.jpg"
                    value={newProduct.imageUrl}
                    onChange={(e) => setNewProduct({ ...newProduct, imageUrl: e.target.value })}
                    className="flex-1"
                    disabled={isAdding}
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    type="button"
                    onClick={() => setIsImageSelectorOpen(true)}
                    disabled={isAdding}
                  >
                    <ImageIcon className="h-4 w-4" />
                  </Button>
                </div>
                {newProduct.imageUrl && /^https?:\/\//.test(newProduct.imageUrl) && (
                  <div className="mt-2">
                    <img
                      src={newProduct.imageUrl}
                      alt="Preview"
                      className="w-24 h-24 object-cover rounded border"
                      onError={(e) => {
                        e.currentTarget.src = '/assets/placeholder.png';
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  placeholder="Product description"
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  disabled={isAdding}
                  rows={3}
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isFeatured"
                    checked={newProduct.isFeatured}
                    onCheckedChange={(checked) => setNewProduct({ ...newProduct, isFeatured: !!checked })}
                    disabled={isAdding}
                  />
                  <label htmlFor="isFeatured" className="text-sm font-medium">
                    Featured Product
                  </label>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button 
                  onClick={handleAddProduct}
                  disabled={!isFormValid || isAdding}
                  className="w-full sm:w-auto"
                >
                  {isAdding ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Product
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add the ImageSelector component */}
      <ImageSelector
        open={isImageSelectorOpen}
        onOpenChange={setIsImageSelectorOpen}
        onSelect={(url) => setNewProduct({ ...newProduct, imageUrl: url })}
      />

      {/* Products Display */}
      <Card className="max-w-full overflow-hidden">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg sm:text-xl">
            All Products ({totalProducts})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 max-w-full overflow-hidden">
          {/* Mobile View */}
          {!isLoading && paginatedProducts.length > 0 && <MobileCardView />}
          
          {/* Desktop Table View */}
          <div className="hidden lg:block">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="hidden lg:table-cell">ID</TableHead>
                    <TableHead className="hidden sm:table-cell">Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden md:table-cell">Description</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead className="hidden sm:table-cell">MRP</TableHead>
                    <TableHead className="hidden md:table-cell">Discount</TableHead>
                    <TableHead className="hidden md:table-cell">GST</TableHead>
                    <TableHead>Image</TableHead>
                    <TableHead className="hidden lg:table-cell">Stock</TableHead>
                    <TableHead className="hidden xl:table-cell">Unit</TableHead>
                    <TableHead className="hidden sm:table-cell">Featured</TableHead>
                    <TableHead className="hidden md:table-cell">Category</TableHead>
                    <TableHead className="hidden lg:table-cell">Retailers</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableSkeleton />
                  ) : paginatedProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={14} className="text-center py-8">
                        <div className="flex flex-col items-center gap-2">
                          <Package className="h-8 w-8 text-muted-foreground" />
                          <p className="text-muted-foreground">No products found</p>
                          <p className="text-sm text-muted-foreground">Add your first product above</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedProducts.map((product) => (
                      <TableRow key={product.$id}>
                        <TableCell className="hidden lg:table-cell font-mono text-sm">
                          {product.$id}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell font-mono text-sm">
                          {product.productId}
                        </TableCell>
                        <TableCell className="font-medium max-w-[200px] truncate">
                          {product.name}
                        </TableCell>
                        <TableCell className="hidden md:table-cell max-w-[200px] truncate">
                          {product.description || "-"}
                        </TableCell>
                        <TableCell className="font-semibold text-green-600">
                          {formatPrice(product.price)}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          {product.mrp ? formatPrice(product.mrp) : "-"}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {product.discount ? `${product.discount}%` : "-"}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {product.gst ? `${product.gst}%` : '-'}
                        </TableCell>
                        <TableCell>
                          {imageLoadErrors.has(product.$id) ? (
                            <div className="w-10 h-10 bg-muted rounded-md flex items-center justify-center">
                              <ImageIcon className="h-5 w-5 text-muted-foreground" />
                            </div>
                          ) : (
                            <img
                              src={product.imageUrl || "/placeholder.svg"}
                              alt={product.name}
                              className="w-10 h-10 object-cover rounded-md"
                              onError={() => handleImageError(product.$id)}
                            />
                          )}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {product.stock}
                        </TableCell>
                        <TableCell className="hidden xl:table-cell">
                          {product.unit}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          {product.isFeatured ? (
                            <Badge variant="default" className="text-xs">
                              <Star className="h-3 w-3 mr-1" />
                              Featured
                            </Badge>
                          ) : (
                            "No"
                          )}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge variant="outline" className="text-xs">
                            {categoryMap.get(product.categoryId) || "Unknown"}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {product.retailerAvailability && product.retailerAvailability.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {product.retailerAvailability.slice(0, 3).map((code) => (
                                <Badge key={code} variant="secondary" className="text-xs px-1">
                                  {code}
                                </Badge>
                              ))}
                              {product.retailerAvailability.length > 3 && (
                                <Badge variant="secondary" className="text-xs px-1">
                                  +{product.retailerAvailability.length - 3}
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <Badge variant="outline" className="text-xs text-green-600">
                              All Retailers
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <EditProductDialog product={product} />
                            {canDeleteProduct(currentAdmin) && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={deletingId === product.$id}
                                  >
                                    {deletingId === product.$id ? (
                                      <RefreshCw className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Trash2 className="h-4 w-4" />
                                    )}
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Product</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete "{product.name}"? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction 
                                      onClick={() => handleDeleteProduct(product.$id)}
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
          
          {/* Pagination Controls */}
          {!isLoading && totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between px-4 sm:px-6 py-4 border-t gap-4">
              <div className="text-sm text-muted-foreground text-center sm:text-left">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredProducts.length)} of {filteredProducts.length} products
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Previous</span>
                </Button>
                
                <div className="flex gap-1">
                  {getPageNumbers().map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(page)}
                      className="w-8 h-8 p-0"
                    >
                      {page}
                    </Button>
                  ))}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
          
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
          {!isLoading && paginatedProducts.length === 0 && (
            <div className="lg:hidden p-8 text-center">
              <div className="flex flex-col items-center gap-3">
                <Package className="h-12 w-12 text-muted-foreground" />
                <h3 className="text-lg font-semibold">
                  {searchQuery ? 'No products found' : 'No products yet'}
                </h3>
                <p className="text-muted-foreground text-sm max-w-[250px]">
                  {searchQuery 
                    ? 'Try adjusting your search terms' 
                    : 'Start by adding your first product above'
                  }
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}