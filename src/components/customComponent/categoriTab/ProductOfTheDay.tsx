"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { databases, appwriteConfig } from "@/lib/appwrite"; // Assuming you have Appwrite setup in lib
import { ID, Query } from "appwrite";
import { Product } from "@/types/ProductTypes";
import Image from "next/image"; // For displaying images

const ProductOfTheDay = () => {
  const [productId, setProductId] = useState(""); // Input field state
  const [productsOfTheDay, setProductsOfTheDay] = useState<Product[]>([]); // Store fetched product details
  const [loading, setLoading] = useState(false); // Loading state
  const [error, setError] = useState<string | null>(null); // Error state

  // Fetch all products of the day
  const fetchProductsOfTheDay = async () => {
    try {
      setLoading(true);
      setError(null);

      // Step 1: Fetch all documents from the "Product of the Day" collection
      const productOfTheDayResponse = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.productOfTheDayCollectionId
      );

      // Step 2: Extract ProductIds from the response
      const productIds = productOfTheDayResponse.documents.map((doc) => doc.ProductId);

      console.log(productIds);

      // Step 3: Fetch product details for each ProductId
      const productDetailsPromises = productIds.map((id) =>
        databases.getDocument(
          appwriteConfig.databaseId,
          appwriteConfig.productscollectionId,
          id
        )
      );

      // Step 4: Wait for all product details to be fetched
      const productDetails = await Promise.all(productDetailsPromises);

      // Step 5: Set the fetched product details to state
      setProductsOfTheDay(productDetails as Product[]);
    } catch (err) {
      console.error("Error fetching products of the day:", err);
      setError("Failed to fetch products of the day!");
    } finally {
      setLoading(false);
    }
  };

  // Handle Add Product of the Day
  const handleAddProductOfTheDay = async () => {
    if (!productId.trim()) {
      setError("Product ID is required!");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Step 1: Save productId in "Product of the Day" collection
      await databases.createDocument(
        appwriteConfig.databaseId,
        appwriteConfig.productOfTheDayCollectionId,
        ID.unique(), // Document ID (can be auto-generated)
        {
          ProductId: productId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      );

      // Step 2: Refresh the list of products of the day
      await fetchProductsOfTheDay();
    } catch (err) {
      console.error("Error adding product of the day:", err);
      setError("Failed to add product!");
    } finally {
      setLoading(false);
    }
  };

  // Handle Delete Product of the Day
  const handleDeleteProductOfTheDay = async (productId: string) => {
    try {
      setLoading(true);
      setError(null);

      // Step 1: Find the document ID in the "Product of the Day" collection
      const productOfTheDayResponse = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.productOfTheDayCollectionId,
        [Query.equal("ProductId", [productId])]
      );

      if (productOfTheDayResponse.documents.length === 0) {
        throw new Error("Product of the Day not found!");
      }

      const documentId = productOfTheDayResponse.documents[0].$id;

      // Step 2: Delete the document from the "Product of the Day" collection
      await databases.deleteDocument(
        appwriteConfig.databaseId,
        appwriteConfig.productOfTheDayCollectionId,
        documentId
      );

      // Step 3: Refresh the list of products of the day
      await fetchProductsOfTheDay();
    } catch (err) {
      console.error("Error deleting product of the day:", err);
      setError("Failed to delete product!");
    } finally {
      setLoading(false);
    }
  };

  // Fetch products of the day when the component mounts
  useEffect(() => {
    fetchProductsOfTheDay();
  }, []);

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Product of the Day</h2>

      {/* Input Field */}
      <div className="flex gap-2 mb-4">
        <Input
          placeholder="Product ID"
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
        />
        <Button onClick={handleAddProductOfTheDay} disabled={loading}>
          {loading ? "Adding..." : "Add Product of the Day"}
        </Button>
      </div>

      {/* Error Message */}
      {error && <p className="text-red-500">{error}</p>}

      {/* Product Details Table */}
      {loading ? (
        <p>Loading...</p>
      ) : productsOfTheDay.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {productsOfTheDay.map((product) => (
              <TableRow key={product.$id}>
                <TableCell>
                  <Image
                    src={product.imageUrl}
                    alt={product.name}
                    width={50}
                    height={50}
                    className="rounded"
                  />
                </TableCell>
                <TableCell>{product.name}</TableCell>
                <TableCell>₹{product.price}</TableCell>
                <TableCell>{product.stock}</TableCell>
                <TableCell>{product.unit}</TableCell>
                <TableCell>
                  <Button
                    variant="destructive"
                    onClick={() => handleDeleteProductOfTheDay(product.productId)}
                    disabled={loading}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <p>No products of the day found.</p>
      )}
    </div>
  );
};

export default ProductOfTheDay;