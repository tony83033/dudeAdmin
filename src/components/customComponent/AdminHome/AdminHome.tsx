'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProductsTab } from '../categoriTab/ProductsTab'
import { CategoriesTab } from '../categoriTab/CategoriesTab'
import { UsersTab } from '../categoriTab/UsersTab'
import { TopCategoriesTab } from '../categoriTab/TopCategoriesTab'
import { ImagesTab } from '../categoriTab/ImagesTab'
import ProdectOfTheDay from '../categoriTab/ProductOfTheDay'
import Orders from '../categoriTab/Orders'
export default function AdminHome() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">E-commerce Admin Panel</h1>
      <Tabs defaultValue="products">
        <TabsList>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          {/* <TabsTrigger value="top-categories">Top Categories</TabsTrigger> */}
          <TabsTrigger value="images">Images</TabsTrigger>
          <TabsTrigger value="images">flavour</TabsTrigger>
          <TabsTrigger value="Prodect-of-the-day">Product of the Day</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
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
        <TabsContent value="images">
          <ImagesTab />
        </TabsContent>

        <TabsContent value='Prodect-of-the-day'>
          <ProdectOfTheDay/>
        </TabsContent>
        <TabsContent value='orders'>
          <Orders/>
        </TabsContent>
      </Tabs>
    </div>
  )
}

