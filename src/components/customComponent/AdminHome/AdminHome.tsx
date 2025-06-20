'use client'

import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import DashboardOverview from '../../dashboard/DashboardOverview'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ProductsTab } from '../categoriTab/ProductsTab'
import { CategoriesTab } from '../categoriTab/CategoriesTab'
import { UsersTab } from '../categoriTab/UsersTab'
import { TopCategoriesTab } from '../categoriTab/TopCategoriesTab'
import { ImagesTab } from '../categoriTab/ImagesTab'
import ProdectOfTheDay from '../categoriTab/ProductOfTheDay'
import Flavour from "../categoriTab/Flavour"
import Orders from '../categoriTab/Orders'
import { PincodesTab } from '../categoriTab/PincodesTab'
import { PriceMultiplierTab } from '../categoriTab/PriceMultiplierTab'
import { fetchProducts } from '@/lib/product/ProductFun'
import { fetchCategories } from '@/lib/cateogry/CategoryFun'
import { fetchUserOrders, getOrderStats } from '@/lib/product/HandleOrder'
import { fetchPincodes } from '@/lib/pincode/PincodeFun'
import { 
  LayoutDashboard, 
  Package, 
  FolderOpen, 
  Users, 
  Image, 
  Star, 
  Palette,
  ShoppingCart,
  TrendingUp,
  DollarSign,
  Eye,
  AlertCircle,
  MapPin,
  Calculator,
  ListStart
} from 'lucide-react'
import { RatanaCashTab } from '../categoriTab/RatanaCashTab'

interface TabItem {
  value: string
  label: string
  icon: React.ReactNode
  badge?: string | number
}

export default function AdminHome() {
  const [activeTab, setActiveTab] = useState("dashboard")

  const [stats, setStats] = useState({
    products: 0,
    categories: 0,
    orders: {
      total: 0,
      pending: 0
    },
    users: 0,
    pincodes: 0
  })

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const products = await fetchProducts()
        const categories = await fetchCategories()
        const orderStats = await getOrderStats()
        const pincodes = await fetchPincodes()
        setStats({
          products: products.length,
          categories: categories.length,
          orders: {
            total: orderStats.total,
            pending: orderStats.pending
          },
          users: orderStats.businessOrders,
          pincodes: pincodes.length
        })
      } catch (error) {
        console.error('Error fetching stats:', error)
      }
    }
    fetchStats()
  }, [])

  const tabs: TabItem[] = [
    { value: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
    { value: "products", label: "Products", icon: <Package className="w-4 h-4" />, badge: stats.products },
    { value: "categories", label: "Categories", icon: <FolderOpen className="w-4 h-4" />, badge: stats.categories },
    { value: "top-categories", label: "Top Categories", icon: <ListStart className="w-4 h-4" /> },
    { value: "orders", label: "Orders", icon: <ShoppingCart className="w-4 h-4" />, badge: stats.orders.total },
    { value: "users", label: "Users", icon: <Users className="w-4 h-4" />, badge: stats.users },
    { value: "pincodes", label: "Pincodes", icon: <MapPin className="w-4 h-4" />, badge: stats.pincodes },
    { value: "price-multiplier", label: "Price Multiplier", icon: <Calculator className="w-4 h-4" /> },
    { value: "images", label: "Images", icon: <Image className="w-4 h-4" /> },
    { value: "flavour", label: "Flavours", icon: <Palette className="w-4 h-4" /> },
    { value: "product-of-the-day", label: "Featured", icon: <Star className="w-4 h-4" /> },
    { value: "ratana-cash", label: "Ratana Cash", icon: <DollarSign className="w-4 h-4" /> }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto p-4 lg:p-6 xl:p-8 max-w-7xl">
        <div className="mb-6 lg:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Admin Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Manage your e-commerce platform
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                Online
              </Badge>
            </div>
          </div>
        </div>

        <Tabs defaultValue="dashboard" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="overflow-x-auto">
            {tabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value} className="flex items-center gap-2">
                {tab.icon}
                {tab.label}
                {tab.badge !== undefined && (
                  <span className="ml-1 text-xs bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-full px-2 py-0.5">
                    {tab.badge}
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="mt-4">
            <TabsContent value="dashboard" className="p-6 m-0">
              <DashboardOverview />
            </TabsContent>
            <TabsContent value="products">
              <ProductsTab />
            </TabsContent>
            <TabsContent value="categories">
              <CategoriesTab />
            </TabsContent>
            <TabsContent value="top-categories">
              <TopCategoriesTab />
            </TabsContent>
            <TabsContent value="orders">
              <Orders />
            </TabsContent>
            <TabsContent value="users">
              <UsersTab />
            </TabsContent>
            <TabsContent value="pincodes">
              <PincodesTab />
            </TabsContent>
            <TabsContent value="price-multiplier">
              <PriceMultiplierTab />
            </TabsContent>
            <TabsContent value="images">
              <ImagesTab />
            </TabsContent>
            <TabsContent value="flavour">
              <Flavour />
            </TabsContent>
            <TabsContent value="product-of-the-day">
              <ProdectOfTheDay />
            </TabsContent>
            <TabsContent value="ratana-cash">
              <RatanaCashTab />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  )
}
