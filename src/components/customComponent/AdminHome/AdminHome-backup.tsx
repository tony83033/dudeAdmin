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
Settings
} from 'lucide-react'
import { RatanaCashTab } from '../categoriTab/RatanaCashTab'
import { AdminsTab } from '../categoriTab/AdminsTab'
// import AvailabilityTab from '../categoriTab/AvailabilityTab'

// This is a backup of the original AdminHome component 