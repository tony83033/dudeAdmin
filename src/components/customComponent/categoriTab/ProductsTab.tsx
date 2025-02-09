"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton"; // Import Skeleton component
import { fetchProducts, addProduct, fetchCategories, deleteProduct } from "@/lib/product/ProductFun";
import { Product } from "@/types/ProductTypes";
import { Category } from "@/types/CategoryTypes";
import toast, { Toaster } from "react-hot-toast";

export function ProductsTab() {
  const [products, setProducts] = useState<Product[]>([]);
  const [newFlavors, setNewFlavors] = useState<string[]>([]);
  const [newProduct, setNewProduct] = useState<Omit<Product, "$id" | "$collectionId" | "$databaseId" | "$createdAt" | "$updatedAt" | "$permissions">>({
    categoryId: "",
    createdAt: "",
    description: "",
    discount: null,
    imageUrl: "",
    isFeatured: false,
    mrp: null,
    name: "",
    price: 0,
    productId: "", // Add productId
    unit: "", // Add unit
    stock: 0,
  
    updatedAt: "",
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create a map of categories for faster lookup
  const categoryMap = new Map(categories.map((cat) => [cat.$id, cat.name]));

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      const data = await fetchProducts();
      setProducts(data);
      setError(null);
      toast.success("Products fetched successfully!");
    } catch (err) {
      console.error("Failed to fetch products:", err);
      setError("Failed to fetch products. Please try again later.");
      toast.error("Failed to fetch products. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      setIsCategoriesLoading(true);
      const data = await fetchCategories();
      setCategories(data);
      toast.success("Categories fetched successfully!");
    } catch (error) {
      console.error("Failed to fetch categories:", error);
      toast.error("Failed to fetch categories. Please try again later.");
    } finally {
      setIsCategoriesLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  //  fot auto calcuateing discount 
  useEffect(() => {
    if (newProduct.mrp && newProduct.price) {
      const discountPercentage = ((newProduct.mrp - newProduct.price) / newProduct.mrp) * 100;
      setNewProduct((prev) => ({
        ...prev,
        discount: parseFloat(discountPercentage.toFixed(2)), // Round to 2 decimal places
      }));
    } else {
      setNewProduct((prev) => ({
        ...prev,
        discount: null, // Reset discount if mrp or price is missing
      }));
    }
  }, [newProduct.mrp, newProduct.price]);

  const handleAddProduct = async () => {
    try {
      // Validate required fields
      if (!newProduct.name || !newProduct.price || !newProduct.categoryId || !newProduct.productId || !newProduct.unit) {
        toast.error("Please fill in all required fields.");
        return;
      }

      // Add the product to the Appwrite database
      const createdProduct = await addProduct({
        ...newProduct,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Update the local state with the new product
      setProducts([...products, createdProduct]);

      // Reset the form
      setNewProduct({
        categoryId: "",
        createdAt: "",
        description: "",
        discount: null,
        imageUrl: "",
        isFeatured: false,
        mrp: null,
        name: "",
        price: 0,
        productId: "", // Reset productId
        unit: "", // Reset unit
        stock: 0,

        updatedAt: "",
      });

      toast.success("Product added successfully!");
    } catch (error) {
      console.error("Failed to add product:", error);
      toast.error("Failed to add product. Please try again.");
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      await deleteProduct(productId); // Delete the product from the database
      setProducts(products.filter((product) => product.$id !== productId)); // Update the UI
      toast.success("Product deleted successfully!");
    } catch (error) {
      console.error("Failed to delete product:", error);
      toast.error("Failed to delete product. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Products</h2>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Product Item Code</TableHead> {/* Add this */}
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>MRP</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Image</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Unit</TableHead> {/* Add this */}
                <TableHead>Featured</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell> {/* Add this */}
                  <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[200px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                  <TableCell><Skeleton className="h-10 w-10 rounded-md" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell> {/* Add this */}
                  <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                  <TableCell><Skeleton className="h-10 w-[100px]" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="space-y-4">
      {/* Add Toaster component for toast notifications */}
      <Toaster position="top-right" />

      <h2 className="text-2xl font-bold">Products</h2>
      <Button onClick={loadProducts} className="mb-4">
        Refresh Products
      </Button>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Input fields for adding a new product */}
        <Input
          placeholder="Product name"
          value={newProduct.name}
          onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
        />
        <Input
          placeholder="Product Item Code"
          value={newProduct.productId}
          onChange={(e) => setNewProduct({ ...newProduct, productId: e.target.value })}
          required
        />
        <Textarea
          placeholder="Description"
          value={newProduct.description}
          onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
        />
 <Input
  placeholder="Price"
  type="number"
  value={newProduct.price || ""}
  onChange={(e) =>
    setNewProduct({
      ...newProduct,
      price: Number.parseFloat(e.target.value),
    })
  }
/>

       <Input
  placeholder="MRP"
  type="number"
  value={newProduct.mrp || ""}
  onChange={(e) =>
    setNewProduct({
      ...newProduct,
      mrp: Number.parseFloat(e.target.value),
    })
  }
/>
        <Input
          placeholder="Discount"
          type="number"
          value={newProduct.discount || ""}
          onChange={(e) => setNewProduct({ ...newProduct, discount: Number.parseFloat(e.target.value) })}
        />
        <Input
          placeholder="Image URL"
          value={newProduct.imageUrl}
          onChange={(e) => setNewProduct({ ...newProduct, imageUrl: e.target.value })}
        />
        <Input
          placeholder="Stock"
          type="number"
          value={newProduct.stock || ""}
          onChange={(e) => setNewProduct({ ...newProduct, stock: Number.parseInt(e.target.value) })}
        />
        <Select
          onValueChange={(value) => setNewProduct({ ...newProduct, unit: value })}
          value={newProduct.unit}
          required
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
        <div className="flex items-center space-x-2">
          <Checkbox
            id="isFeatured"
            checked={newProduct.isFeatured}
            onCheckedChange={(checked) => setNewProduct({ ...newProduct, isFeatured: checked as boolean })}
          />
          <label
            htmlFor="isFeatured"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Featured Product
          </label>
        </div>


      
{/*  flavor end ============================================= */}



        <Select onValueChange={(value) => setNewProduct({ ...newProduct, categoryId: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {isCategoriesLoading ? (
              <SelectItem value="loading" disabled>
                Loading categories...
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



      <Button onClick={handleAddProduct} className="w-full">
        Add Product
      </Button>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Product Item Code</TableHead> {/* Add this */}
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>MRP</TableHead>
              <TableHead>Discount</TableHead>
              <TableHead>Image</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Unit</TableHead> {/* Add this */}
              <TableHead>Featured</TableHead>
          
    
              <TableHead>Category</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.$id}>
                <TableCell>{product.$id}</TableCell>
                <TableCell>{product.productId}</TableCell> {/* Add this */}
                <TableCell>{product.name}</TableCell>
                <TableCell>{product.description}</TableCell>
                <TableCell>${product.price.toFixed(2)}</TableCell>
                <TableCell>${product.mrp?.toFixed(2)}</TableCell>
                <TableCell>{product.discount}%</TableCell>
                <TableCell>
                  <img
                    src={product.imageUrl || "/placeholder.svg"}
                    alt={product.name}
                    className="w-10 h-10 object-cover"
                  />
                </TableCell>
                <TableCell>{product.stock}</TableCell>
                <TableCell>{product.unit}</TableCell> {/* Add this */}
                <TableCell>{product.isFeatured ? "Yes" : "No"}</TableCell>

                <TableCell>{categoryMap.get(product.categoryId) || "Unknown"}</TableCell>


                <TableCell>{new Date(product.createdAt).toLocaleDateString()}</TableCell>
                <TableCell>{new Date(product.updatedAt).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Button
                    variant="destructive"
                    onClick={() => handleDeleteProduct(product.$id)}
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
  );
}