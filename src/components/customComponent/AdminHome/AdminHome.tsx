'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProductsTab } from '../categoriTab/ProductsTab'
import { CategoriesTab } from '../categoriTab/CategoriesTab'
import { UsersTab } from '../categoriTab/UsersTab'
import { TopCategoriesTab } from '../categoriTab/TopCategoriesTab'

export default function AdminHome() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">E-commerce Admin Panel</h1>
      <Tabs defaultValue="products">
        <TabsList>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="top-categories">Top Categories</TabsTrigger>
        </TabsList>
        <TabsContent value="products">
          <ProductsTab />
        </TabsContent>
        <TabsContent value="categories">
          <CategoriesTab />
        </TabsContent>
        <TabsContent value="users">
          <UsersTab />
        </TabsContent>
        <TabsContent value="top-categories">
          <TopCategoriesTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}

