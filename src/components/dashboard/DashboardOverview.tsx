// components/dashboard/DashboardOverview.tsx
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Package, 
  ShoppingCart,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw
} from 'lucide-react'
import { fetchProducts } from '@/lib/product/ProductFun'
import { fetchCategories } from '@/lib/cateogry/CategoryFun'
import { getOrderStats } from '@/lib/product/HandleOrder'

interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalUsers: number;
  totalProducts: number;
  pending: number;
  confirmed: number;
  shipped: number;
  delivered: number;
  cancelled: number;
  businessOrders: number;
  averageOrderValue: number;
}

export default function DashboardOverview() {
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    totalOrders: 0,
    totalUsers: 0,
    totalProducts: 0,
    pending: 0,
    confirmed: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
    businessOrders: 0,
    averageOrderValue: 0
  })
  const [loading, setLoading] = useState(true)

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      // Fetch products count
      const products = await fetchProducts()
      
      // Fetch categories count
      const categories = await fetchCategories()
      
      // Fetch order stats
      const orderStats = await getOrderStats()
      
      setStats({
        totalRevenue: orderStats.totalRevenue,
        totalOrders: orderStats.total,
        totalUsers: orderStats.businessOrders, // Using business orders as a proxy for users
        totalProducts: products.length,
        pending: orderStats.pending,
        confirmed: orderStats.confirmed,
        shipped: orderStats.shipped,
        delivered: orderStats.delivered,
        cancelled: orderStats.cancelled,
        businessOrders: orderStats.businessOrders,
        averageOrderValue: orderStats.averageOrderValue
      })
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      currencyDisplay: 'code'
    }).format(price).replace('INR', 'Rs.');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-lg">Loading dashboard data...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Revenue
            </CardTitle>
            <div className="h-4 w-4 text-muted-foreground">
              <DollarSign className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(stats.totalRevenue)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Orders
            </CardTitle>
            <div className="h-4 w-4 text-muted-foreground">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Products
            </CardTitle>
            <div className="h-4 w-4 text-muted-foreground">
              <Package className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Business Orders
            </CardTitle>
            <div className="h-4 w-4 text-muted-foreground">
              <Users className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.businessOrders}</div>
          </CardContent>
        </Card>
      </div>

      {/* Order Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Order Status Overview</CardTitle>
          <CardDescription>
            Current status of all orders
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2" />
                <span className="text-sm font-medium">Pending</span>
              </div>
              <span className="text-sm text-gray-500">{stats.pending} orders</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-blue-500 mr-2" />
                <span className="text-sm font-medium">Confirmed</span>
              </div>
              <span className="text-sm text-gray-500">{stats.confirmed} orders</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-purple-500 mr-2" />
                <span className="text-sm font-medium">Shipped</span>
              </div>
              <span className="text-sm text-gray-500">{stats.shipped} orders</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-green-500 mr-2" />
                <span className="text-sm font-medium">Delivered</span>
              </div>
              <span className="text-sm text-gray-500">{stats.delivered} orders</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-red-500 mr-2" />
                <span className="text-sm font-medium">Cancelled</span>
              </div>
              <span className="text-sm text-gray-500">{stats.cancelled} orders</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Average Order Value */}
      <Card>
        <CardHeader>
          <CardTitle>Average Order Value</CardTitle>
          <CardDescription>
            Mean value per order
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatPrice(stats.averageOrderValue)}</div>
          <div className="text-sm text-gray-500">
            Based on {stats.totalOrders} orders
          </div>
        </CardContent>
      </Card>

      {/* Refresh Button */}
      <div className="flex justify-end">
        <button
          onClick={fetchDashboardData}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh Data
        </button>
      </div>
    </div>
  )
}