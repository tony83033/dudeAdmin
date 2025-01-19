'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type Category = {
  id: number
  name: string
}

export function CategoriesTab() {
  const [categories, setCategories] = useState<Category[]>([
    { id: 1, name: 'Electronics' },
    { id: 2, name: 'Clothing' },
    { id: 3, name: 'Books' },
  ])
  const [newCategory, setNewCategory] = useState('')

  const handleAddCategory = () => {
    if (newCategory.trim() !== '') {
      setCategories([...categories, { id: categories.length + 1, name: newCategory }])
      setNewCategory('')
    }
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Categories</h2>
      <div className="flex gap-2 mb-4">
        <Input
          placeholder="New category name"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
        />
        <Button onClick={handleAddCategory}>Add Category</Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Name</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {categories.map((category) => (
            <TableRow key={category.id}>
              <TableCell>{category.id}</TableCell>
              <TableCell>{category.name}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

