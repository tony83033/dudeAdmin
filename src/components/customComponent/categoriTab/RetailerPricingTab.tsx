"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

import { fetchProducts } from "@/lib/product/ProductFun";
import { fetchUsers } from "@/lib/product/HandleUsers";
import { 
  fetchRetailerPricingWithDetails, 
  addRetailerPricing, 
  updateRetailerPricing, 
  deleteRetailerPricing 
} from "@/lib/retailer-pricing/RetailerPricingFun";

import { Product } from "@/types/ProductTypes";
import { User } from "@/types/UsersTypes";
import { RetailerPricingDisplay, CreateRetailerPricing } from "@/types/RetailerPricingTypes";

import { Calculator, Plus, RefreshCw, Trash2, Users, DollarSign, Percent, Edit, Save, X, Package } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

export function RetailerPricingTab() {
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [retailerPricing, setRetailerPricing] = useState<RetailerPricingDisplay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProductsLoading, setIsProductsLoading] = useState(true);
  const [isUsersLoading, setIsUsersLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingPricing, setEditingPricing] = useState<RetailerPricingDisplay | null>(null);

  // Form state for adding new pricing
  const [newPricing, setNewPricing] = useState<{
    productId: string;
    retailerCode: string;
    multiplierValue: number;
    newPrice: number;
    isActive: boolean;
  }>({
    productId: "",
    retailerCode: "",
    multiplierValue: 1,
    newPrice: 0,
    isActive: true,
  });

  // Get retailers (users with retailer codes)
  const retailers = users.filter(user => user.retailCode && user.retailCode.trim() !== '');

  // Form validation
  const isFormValid = newPricing.productId && 
                     newPricing.retailerCode && 
                     newPricing.multiplierValue > 0 &&
                     newPricing.newPrice > 0;

  // Load functions
  const loadProducts = useCallback(async () => {
    try {
      setIsProductsLoading(true);
      const data = await fetchProducts();
      setProducts(data || []);
    } catch (error) {
      console.error("Failed to fetch products:", error);
      toast.error("Failed to fetch products.");
      setProducts([]);
    } finally {
      setIsProductsLoading(false);
    }
  }, []);

  const loadUsers = useCallback(async () => {
    try {
      setIsUsersLoading(true);
      const data = await fetchUsers();
      setUsers(data || []);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      toast.error("Failed to fetch users.");
      setUsers([]);
    } finally {
      setIsUsersLoading(false);
    }
  }, []);

  const loadRetailerPricing = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchRetailerPricingWithDetails();
      setRetailerPricing(data || []);
      if (data?.length > 0) {
        toast.success(`${data.length} pricing records loaded successfully!`);
      }
    } catch (err) {
      console.error("Failed to fetch retailer pricing:", err);
      setError("Failed to fetch retailer pricing. Please try again later.");
      toast.error("Failed to fetch retailer pricing.");
      setRetailerPricing([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
    loadUsers();
    loadRetailerPricing();
  }, [loadProducts, loadUsers, loadRetailerPricing]);

  // Calculate new price when multiplier or product changes
  useEffect(() => {
    if (newPricing.productId && newPricing.multiplierValue > 0) {
      const selectedProduct = products.find(p => p.$id === newPricing.productId);
      if (selectedProduct) {
        const calculatedPrice = selectedProduct.price * newPricing.multiplierValue;
        setNewPricing(prev => ({
          ...prev,
          newPrice: Math.round(calculatedPrice * 100) / 100 // Round to 2 decimal places
        }));
      }
    }
  }, [newPricing.productId, newPricing.multiplierValue, products]);

  // Handle add new pricing
  const handleAddPricing = async () => {
    if (!isFormValid) {
      toast.error("Please fill in all required fields.");
      return;
    }

    const selectedProduct = products.find(p => p.$id === newPricing.productId);
    if (!selectedProduct) {
      toast.error("Selected product not found.");
      return;
    }

    setIsAdding(true);
    try {
      const pricingData: CreateRetailerPricing = {
        productId: newPricing.productId,
        retailerCode: newPricing.retailerCode,
        originalPrice: selectedProduct.price,
        newPrice: newPricing.newPrice,
        multiplierValue: newPricing.multiplierValue,
        isActive: newPricing.isActive
      };

      await addRetailerPricing(pricingData);
      
      // Reset form
      setNewPricing({
        productId: "",
        retailerCode: "",
        multiplierValue: 1,
        newPrice: 0,
        isActive: true,
      });
      
      setIsAddDialogOpen(false);
      await loadRetailerPricing(); // Reload data
      toast.success("Retailer pricing added successfully!");
    } catch (error: any) {
      console.error("Failed to add retailer pricing:", error);
      toast.error(error?.message || "Failed to add retailer pricing. Please try again.");
    } finally {
      setIsAdding(false);
    }
  };

  // Handle edit pricing
  const handleEditPricing = async () => {
    if (!editingPricing) return;

    setEditingId(editingPricing.$id);
    try {
      await updateRetailerPricing(editingPricing.$id, {
        newPrice: editingPricing.newPrice / 100, // Convert back to normal price for API
        multiplierValue: editingPricing.multiplierValue,
        isActive: editingPricing.isActive
      });

      setIsEditDialogOpen(false);
      setEditingPricing(null);
      await loadRetailerPricing(); // Reload data
      toast.success("Retailer pricing updated successfully!");
    } catch (error: any) {
      console.error("Failed to update retailer pricing:", error);
      toast.error(error?.message || "Failed to update retailer pricing. Please try again.");
    } finally {
      setEditingId(null);
    }
  };

  // Handle delete pricing
  const handleDeletePricing = async (pricingId: string) => {
    setDeletingId(pricingId);
    try {
      await deleteRetailerPricing(pricingId);
      await loadRetailerPricing(); // Reload data
      toast.success("Retailer pricing deleted successfully!");
    } catch (error: any) {
      console.error("Failed to delete retailer pricing:", error);
      toast.error(error?.message || "Failed to delete retailer pricing. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  // Format price
  const formatPrice = (price: number) => {
    return `₹${price.toFixed(2)}`;
  };

  // Loading skeleton
  const TableSkeleton = () => (
    <>
      {Array.from({ length: 5 }).map((_, index) => (
        <TableRow key={index}>
          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
          <TableCell><Skeleton className="h-8 w-20" /></TableCell>
        </TableRow>
      ))}
    </>
  );

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <div className="text-red-500 text-center">
          <h3 className="text-lg font-semibold mb-2">Error Loading Retailer Pricing</h3>
          <p className="mb-4">{error}</p>
          <Button onClick={loadRetailerPricing} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Retailer Pricing</h2>
          <p className="text-muted-foreground">
            Set custom prices for specific retailers
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={loadRetailerPricing} 
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
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Pricing
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add Retailer Pricing</DialogTitle>
                <DialogDescription>
                  Set a custom price for a specific retailer and product.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="product">Product *</Label>
                  <Select
                    value={newPricing.productId}
                    onValueChange={(value) => setNewPricing({ ...newPricing, productId: value })}
                    disabled={isAdding || isProductsLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      {isProductsLoading ? (
                        <SelectItem value="loading" disabled>Loading products...</SelectItem>
                      ) : products.length === 0 ? (
                        <SelectItem value="no-products" disabled>No products found</SelectItem>
                      ) : (
                        products.map((product) => (
                          <SelectItem key={product.$id} value={product.$id}>
                            {product.name} ({product.productId}) - {formatPrice(product.price)}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="retailer">Retailer *</Label>
                  <Select
                    value={newPricing.retailerCode}
                    onValueChange={(value) => setNewPricing({ ...newPricing, retailerCode: value })}
                    disabled={isAdding || isUsersLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select retailer" />
                    </SelectTrigger>
                    <SelectContent>
                      {isUsersLoading ? (
                        <SelectItem value="loading" disabled>Loading retailers...</SelectItem>
                      ) : retailers.length === 0 ? (
                        <SelectItem value="no-retailers" disabled>No retailers found</SelectItem>
                      ) : (
                        retailers.map((retailer) => (
                          <SelectItem key={retailer.$id} value={retailer.retailCode}>
                            {retailer.name} ({retailer.retailCode}) - {retailer.shopName}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="multiplier">Price Multiplier *</Label>
                    <Input
                      id="multiplier"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="1.00"
                      value={newPricing.multiplierValue || ""}
                      onChange={(e) => setNewPricing({ 
                        ...newPricing, 
                        multiplierValue: parseFloat(e.target.value) || 0 
                      })}
                      disabled={isAdding}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="newPrice">New Price *</Label>
                    <Input
                      id="newPrice"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={newPricing.newPrice || ""}
                      onChange={(e) => setNewPricing({ 
                        ...newPricing, 
                        newPrice: parseFloat(e.target.value) || 0 
                      })}
                      disabled={isAdding}
                    />
                  </div>
                </div>

                {newPricing.productId && (
                  <div className="p-3 bg-gray-50 rounded-md">
                    <p className="text-sm">
                      <strong>Original Price:</strong> {formatPrice(products.find(p => p.$id === newPricing.productId)?.price || 0)}
                    </p>
                    <p className="text-sm">
                      <strong>New Price:</strong> {formatPrice(newPricing.newPrice)}
                    </p>
                    {newPricing.newPrice > 0 && (
                      <p className="text-sm">
                        <strong>Difference:</strong> {
                          newPricing.newPrice > (products.find(p => p.$id === newPricing.productId)?.price || 0)
                            ? `+${formatPrice(newPricing.newPrice - (products.find(p => p.$id === newPricing.productId)?.price || 0))}`
                            : formatPrice(newPricing.newPrice - (products.find(p => p.$id === newPricing.productId)?.price || 0))
                        }
                      </p>
                    )}
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={newPricing.isActive}
                    onCheckedChange={(checked) => setNewPricing({ ...newPricing, isActive: checked })}
                    disabled={isAdding}
                  />
                  <Label htmlFor="isActive">Active</Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} disabled={isAdding}>
                  Cancel
                </Button>
                <Button onClick={handleAddPricing} disabled={!isFormValid || isAdding}>
                  {isAdding ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Pricing
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Retailer Pricing Table */}
      <Card>
        <CardHeader>
          <CardTitle>Retailer Pricing ({retailerPricing.length})</CardTitle>
          <CardDescription>
            Custom pricing configurations for specific retailers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Retailer</TableHead>
                  <TableHead>Original Price</TableHead>
                  <TableHead>New Price</TableHead>
                  <TableHead>Multiplier</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableSkeleton />
                ) : retailerPricing.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <Calculator className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">No retailer pricing found</p>
                        <p className="text-sm text-muted-foreground">Add your first retailer pricing above</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  retailerPricing.map((pricing) => (
                    <TableRow key={pricing.$id}>
                      <TableCell>
                        <div className="font-medium">{pricing.productName}</div>
                        <div className="text-sm text-muted-foreground">{pricing.productCode}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{pricing.retailerName}</div>
                        <div className="text-sm text-muted-foreground">{pricing.retailerCode}</div>
                      </TableCell>
                      <TableCell className="font-mono">{pricing.originalPriceFormatted}</TableCell>
                      <TableCell className="font-mono font-semibold text-green-600">
                        {pricing.newPriceFormatted}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {pricing.multiplierValue}x
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {pricing.discountPercentage > 0 ? (
                          <Badge variant="destructive">
                            -{pricing.discountPercentage}%
                          </Badge>
                        ) : pricing.discountPercentage < 0 ? (
                          <Badge variant="default">
                            +{Math.abs(pricing.discountPercentage)}%
                          </Badge>
                        ) : (
                          <Badge variant="secondary">0%</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={pricing.isActive ? "default" : "secondary"}>
                          {pricing.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Dialog open={isEditDialogOpen && editingPricing?.$id === pricing.$id} onOpenChange={(open) => {
                            setIsEditDialogOpen(open);
                            if (!open) setEditingPricing(null);
                          }}>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEditingPricing(pricing)}
                                disabled={editingId === pricing.$id}
                              >
                                {editingId === pricing.$id ? (
                                  <RefreshCw className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Edit className="h-4 w-4" />
                                )}
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Edit Retailer Pricing</DialogTitle>
                                <DialogDescription>
                                  Update the pricing for {pricing.productName} - {pricing.retailerName}
                                </DialogDescription>
                              </DialogHeader>
                              {editingPricing && (
                                <div className="grid gap-4 py-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                      <Label>Price Multiplier</Label>
                                      <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={editingPricing.multiplierValue || ""}
                                        onChange={(e) => {
                                          const multiplier = parseFloat(e.target.value) || 0;
                                          const originalPrice = editingPricing.originalPrice / 100;
                                          const newPrice = originalPrice * multiplier;
                                          setEditingPricing({
                                            ...editingPricing,
                                            multiplierValue: multiplier,
                                            newPrice: Math.round(newPrice * 100) // Store in cents for display
                                          });
                                        }}
                                      />
                                    </div>
                                    <div className="grid gap-2">
                                      <Label>New Price</Label>
                                      <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={editingPricing.newPrice / 100 || ""}
                                        onChange={(e) => {
                                          const price = parseFloat(e.target.value) || 0;
                                          setEditingPricing({
                                            ...editingPricing,
                                            newPrice: Math.round(price * 100) // Store in cents
                                          });
                                        }}
                                      />
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Switch
                                      checked={editingPricing.isActive}
                                      onCheckedChange={(checked) => setEditingPricing({
                                        ...editingPricing,
                                        isActive: checked
                                      })}
                                    />
                                    <Label>Active</Label>
                                  </div>
                                  <div className="p-3 bg-gray-50 rounded-md">
                                    <p className="text-sm"><strong>Original:</strong> {formatPrice(editingPricing.originalPrice / 100)}</p>
                                    <p className="text-sm"><strong>New:</strong> {formatPrice(editingPricing.newPrice / 100)}</p>
                                  </div>
                                </div>
                              )}
                              <DialogFooter>
                                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                                  Cancel
                                </Button>
                                <Button onClick={handleEditPricing} disabled={editingId === pricing.$id}>
                                  {editingId === pricing.$id ? (
                                    <>
                                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                                      Updating...
                                    </>
                                  ) : (
                                    <>
                                      <Save className="h-4 w-4 mr-2" />
                                      Update
                                    </>
                                  )}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={deletingId === pricing.$id}
                              >
                                {deletingId === pricing.$id ? (
                                  <RefreshCw className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Retailer Pricing</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete the pricing for "{pricing.productName}" - "{pricing.retailerName}"? 
                                  This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeletePricing(pricing.$id)}
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
        </CardContent>
      </Card>
    </div>
  );
}