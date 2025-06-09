"use client";

import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { databases, appwriteConfig } from "@/lib/appwrite";
import { ID, Query } from "appwrite";
import { Product } from "@/types/ProductTypes";
import Image from "next/image";
import toast, { Toaster } from "react-hot-toast";
import { Trash2, Plus, RefreshCw, Star, Package, ImageIcon, Calendar, Search, Info } from "lucide-react";

interface ProductOfTheDayDocument {
  $id: string;
  ProductId: string; // Use exact casing as in Appwrite schema
  createdAt: string;
  updatedAt: string;
}

const ProductOfTheDay = () => {
  const [productInput, setProductInput] = useState("");
  const [productsOfTheDay, setProductsOfTheDay] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [imageLoadErrors, setImageLoadErrors] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Use the same formatPrice function as ProductsTab (no division by 100)
  const formatPrice = (price: number) => {
    // Multiply price by 100 for display
    const actualPrice = price /100 ;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      currencyDisplay: 'code'
    }).format(actualPrice).replace('INR', 'Rs.');
  };

  // Format date safely
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
  };

  // Handle image load errors
  const handleImageError = (productId: string) => {
    setImageLoadErrors(prev => new Set(Array.from(prev).concat(productId)));
  };

  // Filter products based on search term
  const filteredProducts = productsOfTheDay.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.productId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Find product by document ID or productId (using the same logic as your ProductsTab)
  const findProduct = async (input: string): Promise<Product | null> => {
    try {
      // First, try to find by document ID ($id)
      try {
        const productById = await databases.getDocument(
          appwriteConfig.databaseId,
          appwriteConfig.productscollectionId,
          input
        );
        if (productById) {
          return productById as Product;
        }
      } catch (error) {
        // Document ID not found, continue to search by productId
        // console.log("Not found by document ID, trying productId...");
      }
      // Then try to find by productId (code)
      const productByCode = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.productscollectionId,
        [Query.equal('productId', input)]
      );
      if (productByCode.documents.length > 0) {
        return productByCode.documents[0] as Product;
      }
      return null;
    } catch (error) {
      console.error('Error finding product:', error);
      return null;
    }
  };

  // Fetch all products of the day
  const fetchProductsOfTheDay = useCallback(async () => {
    try {
      setIsLoading(true);
      const productOfTheDayResponse = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.productOfTheDayCollectionId
      );
      // Extract ProductIds (which are document IDs) from the response
      const productOfTheDayDocs = productOfTheDayResponse.documents as unknown as ProductOfTheDayDocument[];
      // Fetch product details for each stored document ID
      const productDetailsPromises = productOfTheDayDocs.map(async (doc) => {
        try {
          const product = await databases.getDocument(
            appwriteConfig.databaseId,
            appwriteConfig.productscollectionId,
            doc.ProductId // Use ProductId
          );
          return product as Product;
        } catch (error) {
          console.error(`Failed to fetch product ${doc.ProductId}:`, error);
          toast.error(`Product ${doc.ProductId} not found or has been deleted`);
          return null;
        }
      });
      const productDetails = await Promise.all(productDetailsPromises);
      const validProducts = productDetails.filter((product): product is Product => product !== null);
      setProductsOfTheDay(validProducts);
      if (validProducts.length > 0) {
        toast.success(`${validProducts.length} products of the day loaded successfully!`);
      }
    } catch (err) {
      console.error("Failed to fetch products of the day:", err);
      setError("Failed to fetch products of the day. Please try again later.");
      toast.error("Failed to fetch products of the day.");
      setProductsOfTheDay([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle Add Product of the Day
  const handleAddProductOfTheDay = async () => {
    const trimmedInput = productInput.trim();
    if (!trimmedInput) {
      toast.error("Product ID or Product Code is required!");
      return;
    }
    try {
      setIsAdding(true);
      // Find the product using the same logic as ProductsTab
      const product = await findProduct(trimmedInput);
      if (!product) {
        toast.error("Product not found! Please check the Product ID or Product Code.");
        return;
      }
      // Check if product already exists in Product of the Day (using document ID)
      const existingProduct = productsOfTheDay.find(p => p.$id === product.$id);
      if (existingProduct) {
        toast.error("This product is already added as Product of the Day!");
        return;
      }
      // Check if the product is already in Product of the Day collection
      const existingProductOfDay = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.productOfTheDayCollectionId,
        [Query.equal('ProductId', product.$id)] // Use ProductId
      );
      if (existingProductOfDay && existingProductOfDay.documents.length > 0) {
        toast.error("This product is already added as Product of the Day!");
        return;
      }
      // Create the Product of the Day entry using the document ID
      const newProductOfDay = await databases.createDocument(
        appwriteConfig.databaseId,
        appwriteConfig.productOfTheDayCollectionId,
        ID.unique(),
        {
          ProductId: product.$id, // Use ProductId
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      );
      if (!newProductOfDay) {
        throw new Error("Failed to create Product of the Day entry");
      }
      // Refresh the list
      await fetchProductsOfTheDay();
      setProductInput(""); // Clear input
      toast.success(`"${product.name}" added as Product of the Day successfully!`);
    } catch (error: any) {
      console.error("Error adding product of the day:", error);
      if (error.code === 409) {
        toast.error("This product is already added as Product of the Day!");
      } else if (error.code === 404) {
        toast.error("Product not found! Please check the Product ID or Product Code.");
      } else {
        toast.error(error.message || "Failed to add product! Please try again.");
      }
    } finally {
      setIsAdding(false);
    }
  };

  // Handle Delete Product of the Day
  const handleDeleteProductOfTheDay = async (productDocumentId: string) => {
    try {
      setDeletingId(productDocumentId);
      // Find the document in the "Product of the Day" collection using the product's document ID
      const response = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.productOfTheDayCollectionId,
        [Query.equal('ProductId', productDocumentId)] // Use ProductId
      );
      if (response.documents.length === 0) {
        toast.error("Product of the Day entry not found!");
        return;
      }
      // Delete the document
      await databases.deleteDocument(
        appwriteConfig.databaseId,
        appwriteConfig.productOfTheDayCollectionId,
        response.documents[0].$id
      );
      // Update the local state
      setProductsOfTheDay(prev => prev.filter(p => p.$id !== productDocumentId));
      toast.success("Product removed from Product of the Day successfully!");
    } catch (error) {
      console.error("Error deleting product of the day:", error);
      toast.error("Failed to remove product! Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  // Load products on component mount
  useEffect(() => {
    fetchProductsOfTheDay();
  }, [fetchProductsOfTheDay]);

  // Mobile Product Card Component (consistent with ProductsTab)
  const MobileProductCard = ({ product }: { product: Product }) => (
    <Card key={product.$id} className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg truncate">{product.name}</CardTitle>
            <div className="flex items-center gap-2 mt-1">
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
                <AlertDialogTitle>Remove Product of the Day</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to remove "{product.name}" from Product of the Day? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={() => handleDeleteProductOfTheDay(product.$id)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Remove
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0">
              {imageLoadErrors.has(product.$id) ? (
                <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center">
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                </div>
              ) : (
                <Image
                  src={product.imageUrl || "/placeholder.svg"}
                  alt={product.name}
                  width={64}
                  height={64}
                  className="w-16 h-16 object-cover rounded-md"
                  onError={() => handleImageError(product.$id)}
                />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground truncate">
                {product.description || "No description"}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="text-xs">
                  {product.unit}
                </Badge>
                <div className="flex items-center gap-1">
                  <Package className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Stock: {product.stock}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-sm font-medium">Price</span>
              <p className="text-lg font-bold text-green-600">
                {formatPrice(product.price)}
              </p>
            </div>
            {product.mrp && (
              <div className="space-y-1">
                <span className="text-sm font-medium">MRP</span>
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

          <div className="text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Added: {formatDate(product.updatedAt)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Table Skeleton Loader
  const TableSkeleton = () => (
    <>
      {Array.from({ length: 5 }).map((_, index) => (
        <TableRow key={index}>
          <TableCell className="hidden lg:table-cell">
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
            <Skeleton className="h-4 w-[60px]" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-10 w-10 rounded-md" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-8 w-[60px]" />
          </TableCell>
        </TableRow>
      ))}
    </>
  );

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Products of the Day</h2>
          <p className="text-muted-foreground">
            Manage featured products for daily highlights
          </p>
        </div>
        <Button 
          onClick={fetchProductsOfTheDay} 
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

      {/* Add Product Form */}
      <Card>
        <CardHeader>
          <CardTitle>Add Product of the Day</CardTitle>
          <CardDescription>
            Add a product to be featured as Product of the Day. You can use either the Product Code or Document ID.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Info box */}
            <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">How to add products:</p>
                <ul className="space-y-1 text-blue-700">
                  <li>• Use <strong>Product Code</strong> (e.g., "123456", "PROD-001")</li>
                  <li>• Or use <strong>Document ID</strong> (e.g., "67842bb300123ebd66c3")</li>
                  <li>• Copy from the Products tab above for easy reference</li>
                </ul>
              </div>
            </div>
            
            <div className="flex gap-4">
              <Input
                placeholder="Enter Product Code or Document ID"
                value={productInput}
                onChange={(e) => setProductInput(e.target.value)}
                disabled={isAdding}
                className="flex-1"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !isAdding && productInput.trim()) {
                    handleAddProductOfTheDay();
                  }
                }}
              />
              <Button 
                onClick={handleAddProductOfTheDay}
                disabled={isAdding || !productInput.trim()}
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

      {/* Products Display */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>
              Products of the Day ({filteredProducts.length})
            </CardTitle>
            {productsOfTheDay.length > 0 && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full sm:w-[300px]"
                />
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* Mobile View */}
          {!isLoading && filteredProducts.length > 0 && (
            <div className="grid gap-4 lg:hidden p-4">
              {filteredProducts.map((product) => (
                <MobileProductCard key={product.$id} product={product} />
              ))}
            </div>
          )}
          
          {/* Desktop Table View */}
          <div className="hidden lg:block">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="hidden lg:table-cell">Product Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden md:table-cell">Description</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead className="hidden sm:table-cell">Stock</TableHead>
                    <TableHead>Image</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableSkeleton />
                  ) : filteredProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="flex flex-col items-center gap-2">
                          <Package className="h-8 w-8 text-muted-foreground" />
                          <p className="text-muted-foreground">
                            {searchTerm ? "No products match your search" : "No products of the day found"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {!searchTerm && "Add your first product above"}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProducts.map((product) => (
                      <TableRow key={product.$id}>
                        <TableCell className="hidden lg:table-cell">
                          <Badge variant="secondary" className="font-mono text-xs">
                            {product.productId}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium max-w-[200px] truncate">
                          <div>
                            <p className="truncate">{product.name}</p>
                            {product.isFeatured && (
                              <Badge variant="default" className="text-xs mt-1">
                                <Star className="h-3 w-3 mr-1" />
                                Featured
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell max-w-[200px] truncate">
                          {product.description || "-"}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-semibold text-green-600">
                              {formatPrice(product.price)}
                            </p>
                            {product.mrp && (
                              <p className="text-sm text-muted-foreground line-through">
                                {formatPrice(product.mrp)}
                              </p>
                            )}
                            {product.discount && (
                              <p className="text-xs text-orange-600">
                                {product.discount}% off
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <div className="flex items-center gap-1">
                            <Package className="h-4 w-4 text-muted-foreground" />
                            <span>{product.stock}</span>
                            <Badge variant="outline" className="text-xs ml-1">
                              {product.unit}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          {imageLoadErrors.has(product.$id) ? (
                            <div className="w-10 h-10 bg-muted rounded-md flex items-center justify-center">
                              <ImageIcon className="h-5 w-5 text-muted-foreground" />
                            </div>
                          ) : (
                            <Image
                              src={product.imageUrl || "/placeholder.svg"}
                              alt={product.name}
                              width={40}
                              height={40}
                              className="w-10 h-10 object-cover rounded-md"
                              onError={() => handleImageError(product.$id)}
                            />
                          )}
                        </TableCell>
                        <TableCell>
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
                                <AlertDialogTitle>Remove Product of the Day</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to remove "{product.name}" from Product of the Day? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleDeleteProductOfTheDay(product.$id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Remove
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
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
                    <div className="flex justify-between">
                      <Skeleton className="h-6 w-[150px]" />
                      <Skeleton className="h-8 w-8" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-16 w-16 rounded-md" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-3 w-[120px]" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Empty state for mobile */}
          {!isLoading && filteredProducts.length === 0 && (
            <div className="lg:hidden p-8 text-center">
              <div className="flex flex-col items-center gap-3">
                <Package className="h-12 w-12 text-muted-foreground" />
                <h3 className="text-lg font-semibold">
                  {searchTerm ? "No products found" : "No products yet"}
                </h3>
                <p className="text-muted-foreground text-sm max-w-[300px]">
                  {searchTerm 
                    ? "No products match your search criteria" 
                    : "Start by adding your first product using the form above"
                  }
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Stats */}
      {!isLoading && productsOfTheDay.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Products</p>
                  <p className="text-2xl font-bold">{productsOfTheDay.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Star className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Featured Products</p>
                  <p className="text-2xl font-bold">
                    {productsOfTheDay.filter(p => p.isFeatured).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Package className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">In Stock</p>
                  <p className="text-2xl font-bold">
                    {productsOfTheDay.filter(p => p.stock > 0).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ProductOfTheDay;