"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type Category = {
  categoryId: number
  name: string
  imageUrl: string
  createdAt: Date
  updatedAt: Date
}

export function CategoriesTab() {
  const [categories, setCategories] = useState<Category[]>([
    {
      categoryId: 1,
      name: "Electronics",
      imageUrl: "https://example.com/electronics.jpg",
      createdAt: new Date("2023-01-01"),
      updatedAt: new Date("2023-01-01"),
    },
    {
      categoryId: 2,
      name: "Clothing",
      imageUrl: "https://example.com/clothing.jpg",
      createdAt: new Date("2023-02-15"),
      updatedAt: new Date("2023-02-15"),
    },
    {
      categoryId: 3,
      name: "Books",
      imageUrl: "https://example.com/books.jpg",
      createdAt: new Date("2023-03-10"),
      updatedAt: new Date("2023-03-10"),
    },
  ])

  const [newCategory, setNewCategory] = useState<Omit<Category, "categoryId" | "createdAt" | "updatedAt">>({
    name: "",
    imageUrl: "",
  })

  const handleAddCategory = () => {
    if (newCategory.name.trim() !== "") {
      const now = new Date()
      setCategories([
        ...categories,
        {
          categoryId: categories.length + 1,
          ...newCategory,
          createdAt: now,
          updatedAt: now,
        },
      ])
      setNewCategory({ name: "", imageUrl: "" })
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Categories</h2>
      <div className="flex gap-2">
        <Input
          placeholder="Category name"
          value={newCategory.name}
          onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
        />
        <Input
          placeholder="Image URL"
          value={newCategory.imageUrl}
          onChange={(e) => setNewCategory({ ...newCategory, imageUrl: e.target.value })}
        />
        <Button onClick={handleAddCategory}>Add Category</Button>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Image</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead>Updated At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((category) => (
              <TableRow key={category.categoryId}>
                <TableCell>{category.categoryId}</TableCell>
                <TableCell>{category.name}</TableCell>
                <TableCell>
                  <img
                    src={category.imageUrl || "/placeholder.svg"}
                    alt={category.name}
                    className="w-10 h-10 object-cover"
                  />
                </TableCell>
                <TableCell>{category.createdAt.toLocaleString()}</TableCell>
                <TableCell>{category.updatedAt.toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

