"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"

type Product = {
  id: number
  name: string
  description: string
  price: number
  mrp: number
  discount: number
  imageUrl: string
  stock: number
  isFeatured: boolean
  createdAt: Date
  updatedAt: Date
  category: string
}

export function ProductsTab() {
  const [products, setProducts] = useState<Product[]>([
    {
      id: 1,
      name: "Laptop",
      description: "High-performance laptop",
      price: 999,
      mrp: 1299,
      discount: 23,
      imageUrl: "https://example.com/laptop.jpg",
      stock: 50,
      isFeatured: true,
      createdAt: new Date("2023-01-01"),
      updatedAt: new Date("2023-01-01"),
      category: "Electronics",
    },
    {
      id: 2,
      name: "T-shirt",
      description: "Comfortable cotton t-shirt",
      price: 19.99,
      mrp: 24.99,
      discount: 20,
      imageUrl: "https://example.com/tshirt.jpg",
      stock: 100,
      isFeatured: false,
      createdAt: new Date("2023-02-15"),
      updatedAt: new Date("2023-02-15"),
      category: "Clothing",
    },
    {
      id: 3,
      name: "Novel",
      description: "Bestselling fiction novel",
      price: 9.99,
      mrp: 14.99,
      discount: 33,
      imageUrl: "https://example.com/novel.jpg",
      stock: 75,
      isFeatured: true,
      createdAt: new Date("2023-03-10"),
      updatedAt: new Date("2023-03-10"),
      category: "Books",
    },
  ])

  const [newProduct, setNewProduct] = useState<Omit<Product, "id" | "createdAt" | "updatedAt">>({
    name: "",
    description: "",
    price: 0,
    mrp: 0,
    discount: 0,
    imageUrl: "",
    stock: 0,
    isFeatured: false,
    category: "",
  })

  const categories = ["Electronics", "Clothing", "Books"] // This should ideally come from the CategoriesTab state

  const handleAddProduct = () => {
    if (newProduct.name && newProduct.category && newProduct.price) {
      const now = new Date()
      setProducts([
        ...products,
        {
          ...newProduct,
          id: products.length + 1,
          createdAt: now,
          updatedAt: now,
        },
      ])
      setNewProduct({
        name: "",
        description: "",
        price: 0,
        mrp: 0,
        discount: 0,
        imageUrl: "",
        stock: 0,
        isFeatured: false,
        category: "",
      })
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Products</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Input
          placeholder="Product name"
          value={newProduct.name}
          onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
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
          onChange={(e) => setNewProduct({ ...newProduct, price: Number.parseFloat(e.target.value) })}
        />
        <Input
          placeholder="MRP"
          type="number"
          value={newProduct.mrp || ""}
          onChange={(e) => setNewProduct({ ...newProduct, mrp: Number.parseFloat(e.target.value) })}
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
        <Select onValueChange={(value) => setNewProduct({ ...newProduct, category: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
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
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>MRP</TableHead>
              <TableHead>Discount</TableHead>
              <TableHead>Image</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Featured</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell>{product.id}</TableCell>
                <TableCell>{product.name}</TableCell>
                <TableCell>{product.description}</TableCell>
                <TableCell>${product.price.toFixed(2)}</TableCell>
                <TableCell>${product.mrp.toFixed(2)}</TableCell>
                <TableCell>{product.discount}%</TableCell>
                <TableCell>
                  <img
                    src={product.imageUrl || "/placeholder.svg"}
                    alt={product.name}
                    className="w-10 h-10 object-cover"
                  />
                </TableCell>
                <TableCell>{product.stock}</TableCell>
                <TableCell>{product.isFeatured ? "Yes" : "No"}</TableCell>
                <TableCell>{product.category}</TableCell>
                <TableCell>{product.createdAt.toLocaleDateString()}</TableCell>
                <TableCell>{product.updatedAt.toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

