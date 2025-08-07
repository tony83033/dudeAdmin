'use client'

import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
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
import { getAdminById } from '@/lib/admin/AdminFunctions'
import { getCurrentUser } from '@/lib/auth/auth'
import { Admin } from '@/types/AdminTypes'
import { getAccessibleTabs, hasTabAccess, ProtectedTabContent } from '@/lib/auth/permissions'
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
ListStart,
Shield,
Settings,
Menu,
X
} from 'lucide-react'
import { RatanaCashTab } from '../categoriTab/RatanaCashTab'
import { AdminsTab } from '../categoriTab/AdminsTab'


interface TabItem {
  value: string
  label: string
  icon: React.ReactNode
  badge?: string | number
}

export default function AdminHome() {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [currentAdmin, setCurrentAdmin] = useState<Admin | null>(null)
  const [accessibleTabs, setAccessibleTabs] = useState<string[]>(['dashboard'])
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
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
      setIsLoading(true)
      setError(null)
      
      try {
        // Fetch current admin
        const currentUser = await getCurrentUser()
        if (currentUser) {
          try {
            const admin = await getAdminById(currentUser.$id)
            setCurrentAdmin(admin)
            
            // Set accessible tabs based on admin role and permissions
            if (admin) {
              const tabs = getAccessibleTabs(admin)
              setAccessibleTabs(tabs)
              
              // If current active tab is not accessible, switch to dashboard
              if (!tabs.includes(activeTab)) {
                setActiveTab('dashboard')
              }
            } else {
              // If no admin found, set default tabs
              setAccessibleTabs(['dashboard'])
              setActiveTab('dashboard')
            }
          } catch (adminError) {
            console.error('Error fetching admin:', adminError)
            // Set default tabs if admin fetch fails
            setAccessibleTabs(['dashboard'])
            setActiveTab('dashboard')
          }
        } else {
          // If no current user, set default tabs
          setAccessibleTabs(['dashboard'])
          setActiveTab('dashboard')
        }
        
        // Fetch products count
        try {
          const products = await fetchProducts()
          setStats(prev => ({ ...prev, products: products.length }))
        } catch (error) {
          console.error('Error fetching products:', error)
        }
        
        // Fetch categories count  
        try {
          const categories = await fetchCategories()
          setStats(prev => ({ ...prev, categories: categories.length }))
        } catch (error) {
          console.error('Error fetching categories:', error)
        }
          
        // Fetch order stats  
        try {
          const orderStats = await getOrderStats()
          setStats(prev => ({ 
            ...prev, 
            orders: {  
              total: orderStats.total,  
              pending: orderStats.pending  
            },  
            users: orderStats.businessOrders
          }))
        } catch (error) {
          console.error('Error fetching order stats:', error)
        }
          
        // Fetch pincodes count  
        try {
          const pincodes = await fetchPincodes()
          setStats(prev => ({ ...prev, pincodes: pincodes.length }))
        } catch (error) {
          console.error('Error fetching pincodes:', error)
        }
      } catch (error) {
        console.error('Error in fetchStats:', error)
        setError('Failed to load admin data. Please refresh the page.')
        // Set default values if everything fails
        setAccessibleTabs(['dashboard'])
        setActiveTab('dashboard')
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [])

  // Update accessible tabs when current admin changes
  useEffect(() => {
    if (currentAdmin) {
      const tabs = getAccessibleTabs(currentAdmin)
      setAccessibleTabs(tabs)
      
      // If current active tab is not accessible, switch to dashboard
      if (!tabs.includes(activeTab)) {
        setActiveTab('dashboard')
      }
    }
  }, [currentAdmin, activeTab])

  // Define all possible tabs
  const allTabs: TabItem[] = [
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
    {
      value: "admins",
      label: "Admins",
      icon: <Shield className="w-4 h-4" />
    },
  ]

  // Filter tabs based on accessibility
  const tabs = allTabs.filter(tab => accessibleTabs.includes(tab.value))

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading admin dashboard...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                <p className="font-medium">Error Loading Dashboard</p>
                <p className="text-sm">{error}</p>
              </div>
              <Button onClick={() => window.location.reload()} variant="outline">
                Refresh Page
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show loading if we don't have admin info yet
  if (!currentAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto p-4 max-w-7xl">
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="text-lg text-gray-600">Loading dashboard...</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto p-2 sm:p-4 max-w-7xl">
        {/* Mobile Header */}
        <div className="lg:hidden mb-4">
          <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-3">
              <Dialog open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="lg:hidden">
                    <Menu className="w-4 h-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-[280px] sm:w-[320px] p-0 max-w-none">
                  <div>
                    <div className="p-4 border-b">
                      <h2 className="text-lg font-semibold">Admin Panel</h2>
                      <p className="text-sm text-gray-600">Navigation Menu</p>
                    </div>
                    <div className="p-2">
                      <div className="space-y-1">
                        {tabs.map((tab) => (
                          <button
                            key={tab.value}
                            onClick={() => {
                              setActiveTab(tab.value)
                              setIsMobileMenuOpen(false)
                            }}
                            className={`flex items-center gap-3 p-3 text-sm font-medium rounded-lg transition-all duration-200 w-full text-left ${
                              activeTab === tab.value
                                ? 'bg-blue-500 text-white shadow-md'
                                : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                          >
                            {tab.icon}
                            <span className="truncate">{tab.label}</span>
                            {tab.badge && (
                              <Badge
                                variant="secondary"
                                className={`ml-auto h-5 w-auto min-w-[20px] text-xs px-1.5 ${
                                  activeTab === tab.value
                                    ? 'bg-blue-200 text-blue-700'
                                    : 'bg-blue-100 text-blue-700'
                                }`}
                              >
                                {tab.badge}
                              </Badge>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Admin Dashboard
                </h1>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {currentAdmin.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
                Online
              </Badge>
            </div>
          </div>
        </div>

        {/* Desktop Header */}
        <div className="hidden lg:block mb-6">
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
              {currentAdmin && (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  <Shield className="w-3 h-3 mr-1" />
                  {currentAdmin.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Badge>
              )}
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                Online
              </Badge>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="dashboard" value={activeTab} onValueChange={setActiveTab}>
          {/* Desktop Tab Navigation */}
          <div className="hidden lg:block bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-2">
            <TabsList className="grid w-full grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10 gap-1 bg-transparent h-auto p-1">
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200"
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
            <TabsContent value="dashboard" className="p-2 sm:p-4 lg:p-6 m-0">
              <DashboardOverview />
            </TabsContent>

            <TabsContent value="products" className="p-2 sm:p-4 lg:p-6 m-0">
              <ProtectedTabContent admin={currentAdmin} tabValue="products">
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <h2 className="text-xl sm:text-2xl font-semibold">Products Management</h2>
                    <Badge variant="outline">{stats.products} Total</Badge>
                  </div>
                  <ProductsTab currentAdmin={currentAdmin} />
                </div>
              </ProtectedTabContent>
            </TabsContent>

            <TabsContent value="categories" className="p-2 sm:p-4 lg:p-6 m-0">
              <ProtectedTabContent admin={currentAdmin} tabValue="categories">
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <h2 className="text-xl sm:text-2xl font-semibold">Categories Management</h2>
                    <Badge variant="outline">{stats.categories} Total</Badge>
                  </div>
                  <CategoriesTab currentAdmin={currentAdmin} />
                </div>
              </ProtectedTabContent>
            </TabsContent>

            <TabsContent value="top-categories" className="p-2 sm:p-4 lg:p-6 m-0">
              <ProtectedTabContent admin={currentAdmin} tabValue="top-categories">
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <h2 className="text-xl sm:text-2xl font-semibold">Top Categories Management</h2>
                    <Badge variant="outline">Featured Categories</Badge>
                  </div>
                  <TopCategoriesTab />
                </div>
              </ProtectedTabContent>
            </TabsContent>

            <TabsContent value="orders" className="p-2 sm:p-4 lg:p-6 m-0">
              <ProtectedTabContent admin={currentAdmin} tabValue="orders">
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <h2 className="text-xl sm:text-2xl font-semibold">Orders Management</h2>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="bg-orange-50 text-orange-700">
                        {stats.orders.pending} Pending
                      </Badge>
                      <Badge variant="outline">{stats.orders.total} Total</Badge>
                    </div>
                  </div>
                  <Orders currentAdmin={currentAdmin} />
                </div>
              </ProtectedTabContent>
            </TabsContent>

            <TabsContent value="users" className="p-2 sm:p-4 lg:p-6 m-0">
              <ProtectedTabContent admin={currentAdmin} tabValue="users">
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <h2 className="text-xl sm:text-2xl font-semibold">Users Management</h2>
                    <Badge variant="outline">{stats.users} Total</Badge>
                  </div>
                  <UsersTab currentAdmin={currentAdmin} />
                </div>
              </ProtectedTabContent>
            </TabsContent>

            <TabsContent value="pincodes" className="p-2 sm:p-4 lg:p-6 m-0">
              <ProtectedTabContent admin={currentAdmin} tabValue="pincodes">
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <h2 className="text-xl sm:text-2xl font-semibold">Pincodes Management</h2>
                    <Badge variant="outline">{stats.pincodes} Total</Badge>
                  </div>
                  <PincodesTab />
                </div>
              </ProtectedTabContent>
            </TabsContent>

            <TabsContent value="price-multiplier" className="p-2 sm:p-4 lg:p-6 m-0">
              <ProtectedTabContent admin={currentAdmin} tabValue="price-multiplier">
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <h2 className="text-xl sm:text-2xl font-semibold">Price Multiplier Management</h2>
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      <Calculator className="w-3 h-3 mr-1" />
                      Pricing
                    </Badge>
                  </div>
                  <PriceMultiplierTab />
                </div>
              </ProtectedTabContent>
            </TabsContent>

            <TabsContent value="images" className="p-2 sm:p-4 lg:p-6 m-0">
              <ProtectedTabContent admin={currentAdmin} tabValue="images">
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <h2 className="text-xl sm:text-2xl font-semibold">Images Management</h2>
                    <Badge variant="outline">Media Library</Badge>
                  </div>
                  <ImagesTab />
                </div>
              </ProtectedTabContent>
            </TabsContent>

            <TabsContent value="flavour" className="p-2 sm:p-4 lg:p-6 m-0">
              <ProtectedTabContent admin={currentAdmin} tabValue="flavour">
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <h2 className="text-xl sm:text-2xl font-semibold">Flavours Management</h2>
                    <Badge variant="outline">Variants</Badge>
                  </div>
                  <Flavour />
                </div>
              </ProtectedTabContent>
            </TabsContent>

            <TabsContent value="product-of-the-day" className="p-2 sm:p-4 lg:p-6 m-0">
              <ProtectedTabContent admin={currentAdmin} tabValue="product-of-the-day">
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <h2 className="text-xl sm:text-2xl font-semibold">Featured Products</h2>
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                      <Star className="w-3 h-3 mr-1" />
                      Featured
                    </Badge>
                  </div>
                  <ProdectOfTheDay />
                </div>
              </ProtectedTabContent>
            </TabsContent>

            <TabsContent value="ratana-cash" className="p-2 sm:p-4 lg:p-6 m-0">
              <ProtectedTabContent admin={currentAdmin} tabValue="ratana-cash">
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <h2 className="text-xl sm:text-2xl font-semibold">Ratana Cash Rewards</h2>
                  </div>
                  <RatanaCashTab />
                </div>
              </ProtectedTabContent>
            </TabsContent>

            <TabsContent value="admins" className="p-2 sm:p-4 lg:p-6 m-0">
              <ProtectedTabContent admin={currentAdmin} tabValue="admins">
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <h2 className="text-xl sm:text-2xl font-semibold">Admin Management</h2>
                    <Badge variant="outline" className="bg-red-50 text-red-700">
                      <Shield className="w-3 h-3 mr-1" />
                      System Access
                    </Badge>
                  </div>
                  <AdminsTab currentAdmin={currentAdmin} />
                </div>
              </ProtectedTabContent>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  )
}
