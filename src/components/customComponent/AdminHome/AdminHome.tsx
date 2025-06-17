'use client'

import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
import DashboardOverview from '../../dashboard/DashboardOverview'
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
        // Fetch products count
        const products = await fetchProducts()
        
        // Fetch categories count
        const categories = await fetchCategories()
        
        // Fetch order stats
        const orderStats = await getOrderStats()
        
        // Fetch pincodes count
        const pincodes = await fetchPincodes()
        
        // Update stats state
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
    {
      value: "dashboard",
      label: "Dashboard",
      icon: <LayoutDashboard className="w-4 h-4" />
    },
    {
      value: "products",
      label: "Products",
      icon: <Package className="w-4 h-4" />,
      badge: stats.products
    },
    {
      value: "categories",
      label: "Categories",
      icon: <FolderOpen className="w-4 h-4" />,
      badge: stats.categories
    },
    {
      value: "top-categories",
      label: "Top Categories",
      icon: <ListStart className="w-4 h-4" />
    },
    {
      value: "orders",
      label: "Orders",
      icon: <ShoppingCart className="w-4 h-4" />,
      badge: stats.orders.total
    },
    {
      value: "users",
      label: "Users",
      icon: <Users className="w-4 h-4" />,
      badge: stats.users
    },
    {
      value: "pincodes",
      label: "Pincodes",
      icon: <MapPin className="w-4 h-4" />,
      badge: stats.pincodes
    },
    {
      value: "price-multiplier",
      label: "Price Multiplier",
      icon: <Calculator className="w-4 h-4" />
    },
    {
      value: "images",
      label: "Images",
      icon: <Image className="w-4 h-4" />
    },
    {
      value: "flavour",
      label: "Flavours",
      icon: <Palette className="w-4 h-4" />
    },
    {
      value: "product-of-the-day",
      label: "Featured",
      icon: <Star className="w-4 h-4" />
    },
    {
      value: "ratana-cash",
      label: "Ratana Cash",
      icon: <DollarSign className="w-4 h-4" />
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto p-4 lg:p-6 xl:p-8 max-w-7xl">
        {/* Header */}
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

        {/* Tabs */}
        <Tabs defaultValue="dashboard" value={activeTab} onValueChange={setActiveTab}>
          {/* Tab Navigation */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-2">
            <TabsList className="grid w-full grid-cols-5 lg:grid-cols-10 gap-1 bg-transparent h-auto p-1">
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  {tab.icon}
                  <span className="hidden sm:inline truncate">{tab.label}</span>
                  <span className="sm:hidden text-[10px] mt-1 truncate">{tab.label}</span>
                  {tab.badge && (
                    <Badge 
                      variant="secondary" 
                      className="ml-1 h-5 w-auto min-w-[20px] text-xs px-1.5 bg-blue-100 text-blue-700 data-[state=active]:bg-blue-200"
                    >
                      {tab.badge}
                    </Badge>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* Tab Content */}
          <div className="mt-4">
            <TabsContent value="dashboard" className="p-6 m-0">
              <DashboardOverview />
            </TabsContent>

            <TabsContent value="products" className="p-6 m-0">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-semibold">Products Management</h2>
                  <Badge variant="outline">{stats.products} Total</Badge>
                </div>
                <ProductsTab />
              </div>
            </TabsContent>

            <TabsContent value="categories" className="p-6 m-0">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-semibold">Categories Management</h2>
                  <Badge variant="outline">{stats.categories} Total</Badge>
                </div>
                <CategoriesTab />
              </div>
            </TabsContent>

            <TabsContent value="top-categories" className="p-6 m-0">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-semibold">Top Categories Management</h2>
                  <Badge variant="outline">Featured Categories</Badge>
                </div>
                <TopCategoriesTab />
              </div>
            </TabsContent>

            <TabsContent value="orders" className="p-6 m-0">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-semibold">Orders Management</h2>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="bg-orange-50 text-orange-700">
                      {stats.orders.pending} Pending
                    </Badge>
                    <Badge variant="outline">{stats.orders.total} Total</Badge>
                  </div>
                </div>
                <Orders />
              </div>
            </TabsContent>

            <TabsContent value="users" className="p-6 m-0">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-semibold">Users Management</h2>
                  <Badge variant="outline">{stats.users} Total</Badge>
                </div>
                <UsersTab />
              </div>
            </TabsContent>

            <TabsContent value="pincodes" className="p-6 m-0">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-semibold">Pincodes Management</h2>
                  <Badge variant="outline">{stats.pincodes} Total</Badge>
                </div>
                <PincodesTab />
              </div>
            </TabsContent>

            <TabsContent value="price-multiplier" className="p-6 m-0">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-semibold">Price Multiplier Management</h2>
                  <Badge variant="outline" className="bg-green-50 text-green-700">
                    <Calculator className="w-3 h-3 mr-1" />
                    Pricing
                  </Badge>
                </div>
                <PriceMultiplierTab />
              </div>
            </TabsContent>

            <TabsContent value="images" className="p-6 m-0">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-semibold">Images Management</h2>
                  <Badge variant="outline">Media Library</Badge>
                </div>
                <ImagesTab />
              </div>
            </TabsContent>

            <TabsContent value="flavour" className="p-6 m-0">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-semibold">Flavours Management</h2>
                  <Badge variant="outline">Variants</Badge>
                </div>
                <Flavour />
              </div>
            </TabsContent>

            <TabsContent value="product-of-the-day" className="p-6 m-0">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-semibold">Featured Products</h2>
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                    <Star className="w-3 h-3 mr-1" />
                    Featured
                  </Badge>
                </div>
                <ProdectOfTheDay />
              </div>
            </TabsContent>

            <TabsContent value="ratana-cash" className="p-6 m-0">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-semibold">Ratana Cash Rewards</h2>
                </div>
                <RatanaCashTab />
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  )
}