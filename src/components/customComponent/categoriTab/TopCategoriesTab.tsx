'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type TopCategory = {
  id: number
  name: string
  productCount: number
}

export function TopCategoriesTab() {
  const [topCategories, setTopCategories] = useState<TopCategory[]>([
    { id: 1, name: 'Electronics', productCount: 100 },
    { id: 2, name: 'Clothing', productCount: 80 },
    { id: 3, name: 'Books', productCount: 50 },
  ])
  const [newTopCategory, setNewTopCategory] = useState({ name: '', productCount: '' })

  const handleAddTopCategory = () => {
    if (newTopCategory.name && newTopCategory.productCount) {
      setTopCategories([...topCategories, { 
        id: topCategories.length + 1, 
        name: newTopCategory.name, 
        productCount: parseInt(newTopCategory.productCount) 
      }])
      setNewTopCategory({ name: '', productCount: '' })
    }
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Top Categories</h2>
      <div className="flex gap-2 mb-4">
        <Input
          placeholder="Category name"
          value={newTopCategory.name}
          onChange={(e) => setNewTopCategory({...newTopCategory, name: e.target.value})}
        />
        <Input
          placeholder="Product count"
          type="number"
          value={newTopCategory.productCount}
          onChange={(e) => setNewTopCategory({...newTopCategory, productCount: e.target.value})}
        />
        <Button onClick={handleAddTopCategory}>Add Top Category</Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Product Count</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {topCategories.map((category) => (
            <TableRow key={category.id}>
              <TableCell>{category.id}</TableCell>
              <TableCell>{category.name}</TableCell>
              <TableCell>{category.productCount}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

