"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { fetchProductsForRetailer } from "@/lib/product/ProductFun"
import { getCurrentUserRetailerInfo } from "@/lib/auth/auth"
import { Product } from "@/types/ProductTypes"
import { User } from "@/types/UsersTypes"
import { Search, Package, Star, DollarSign, ShoppingCart, Users, AlertCircle } from "lucide-react"
import toast from "react-hot-toast"

export default function RetailerProductView() {
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadUserAndProducts = async () => {
      try {
        setLoading(true)
        setError(null)

        // Get current user info
        const userInfo = await getCurrentUserRetailerInfo()
        if (!userInfo) {
          setError("Unable to load retailer information. Please ensure you're logged in as a retailer.")
          return
        }

        setCurrentUser(userInfo)

        // Fetch products available to this retailer
        const availableProducts = await fetchProductsForRetailer()
        setProducts(availableProducts)
        setFilteredProducts(availableProducts)

        if (availableProducts.length === 0) {
          toast(`No products are currently available for retailer ${userInfo.retailCode}`)
        } else {
          toast.success(`Loaded ${availableProducts.length} products available to you`)
        }

      } catch (err) {
        console.error("Error loading retailer products:", err)
        setError("Failed to load products. Please try again later.")
        toast.error("Failed to load products")
      } finally {
        setLoading(false)
      }
    }

    loadUserAndProducts()
  }, [])

  // Filter products based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredProducts(products)
    } else {
      const filtered = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.productId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredProducts(filtered)
    }
  }, [searchTerm, products])

  const formatPrice = (price: number) => {
    return `₹${price.toFixed(2)}`
  }

  if (loading) {
    return (
      <div className="container mx-auto p-4 max-w-7xl">
        <div className="mb-6">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="w-full">
              <CardHeader className="pb-3">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-32 w-full mb-4" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-6 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 max-w-7xl">
        <Card className="w-full">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Error Loading Products</h3>
            <p className="text-muted-foreground text-center mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Available Products
            </h1>
            <p className="text-muted-foreground mt-1">
              Products available for retailer: <span className="font-medium">{currentUser?.retailCode}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              <Users className="w-3 h-3 mr-1" />
              {currentUser?.shopName || currentUser?.name}
            </Badge>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <Package className="w-3 h-3 mr-1" />
              {filteredProducts.length} Products
            </Badge>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <Card className="w-full">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchTerm ? "No products found" : "No products available"}
            </h3>
            <p className="text-muted-foreground text-center">
              {searchTerm 
                ? "Try adjusting your search terms" 
                : `No products are currently available for retailer ${currentUser?.retailCode}`
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProducts.map((product) => (
            <Card key={product.$id} className="w-full hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">{product.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {product.productId}
                      </Badge>
                      {product.isFeatured && (
                        <Badge variant="default" className="text-xs">
                          <Star className="h-3 w-3 mr-1" />
                          Featured
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Product Image */}
                <div className="mb-4">
                  <img
                    src={product.imageUrl || "/placeholder.svg"}
                    alt={product.name}
                    className="w-full h-32 object-cover rounded-md"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "/placeholder.svg";
                    }}
                  />
                </div>

                {/* Product Details */}
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {product.description || "No description available"}
                  </p>
                  
                  {/* Price Information */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <span className="font-bold text-green-600">
                        {formatPrice(product.price)}
                      </span>
                    </div>
                    {product.mrp && product.mrp > product.price && (
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground line-through">
                          {formatPrice(product.mrp)}
                        </p>
                        {product.discount && (
                          <p className="text-xs font-medium text-orange-600">
                            {product.discount}% off
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Stock and Unit */}
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Stock: {product.stock}</span>
                    <span>Unit: {product.unit}</span>
                  </div>

                  {/* GST Info */}
                  {product.gst && product.gst > 0 && (
                    <div className="text-xs text-muted-foreground">
                      GST: {product.gst}%
                    </div>
                  )}
                </div>

                {/* Action Button */}
                <Button 
                  className="w-full mt-4" 
                  disabled={product.stock <= 0}
                  onClick={() => {
                    // This would typically add to cart or open order dialog
                    toast.success(`${product.name} - Feature coming soon!`)
                  }}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  {product.stock <= 0 ? "Out of Stock" : "Add to Cart"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}