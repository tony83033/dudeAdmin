'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type Product = {
  id: number
  name: string
  category: string
  price: number
}

export function ProductsTab() {
  const [products, setProducts] = useState<Product[]>([
    { id: 1, name: 'Laptop', category: 'Electronics', price: 999 },
    { id: 2, name: 'T-shirt', category: 'Clothing', price: 19.99 },
    { id: 3, name: 'Novel', category: 'Books', price: 9.99 },
  ])
  const [newProduct, setNewProduct] = useState({ name: '', category: '', price: '' })

  const categories = ['Electronics', 'Clothing', 'Books'] // This should ideally come from the CategoriesTab state

  const handleAddProduct = () => {
    if (newProduct.name && newProduct.category && newProduct.price) {
      setProducts([...products, { 
        id: products.length + 1, 
        name: newProduct.name, 
        category: newProduct.category, 
        price: parseFloat(newProduct.price) 
      }])
      setNewProduct({ name: '', category: '', price: '' })
    }
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Products</h2>
      <div className="flex gap-2 mb-4">
        <Input
          placeholder="Product name"
          value={newProduct.name}
          onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
        />
        <Select onValueChange={(value) => setNewProduct({...newProduct, category: value})}>
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>{category}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          placeholder="Price"
          type="number"
          value={newProduct.price}
          onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
        />
        <Button onClick={handleAddProduct}>Add Product</Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Price</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id}>
              <TableCell>{product.id}</TableCell>
              <TableCell>{product.name}</TableCell>
              <TableCell>{product.category}</TableCell>
              <TableCell>${product.price.toFixed(2)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

