// components/categoriTab/UsersTab.tsx
'use client'

import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { fetchUsers, updateUserRetailCode, createUser } from '../../../lib/product/HandleUsers'
import { createOrderForUser } from '../../../lib/product/HandleOrder'
import { fetchProducts, fetchProductsForRetailer, fetchProductsForSpecificRetailer } from '../../../lib/product/ProductFun'
import { User } from '../../../types/UsersTypes'
import { Admin } from '../../../types/AdminTypes'
import { Product } from '../../../types/ProductTypes'
import { OrderItem, DeliveryAddress, UserDetails } from '../../../types/OrderTypes'
import { canCreateUsers, canCreateOrdersForUsers } from '../../../lib/auth/permissions'
import toast, { Toaster } from 'react-hot-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Search, 
  Filter, 
  Edit, 
  Save, 
  X, 
  Users, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  Building, 
  Hash,
  Eye,
  RefreshCw,
  Download,
  Copy,
  ExternalLink,
  MessageCircle,
  MoreHorizontal,
  UserPlus,
  ShoppingCart,
  Plus,
  Package,
  ChevronLeft,
  ChevronRight,
  Navigation,
  Camera,
  Image
 } from 'lucide-react';
import { format } from 'date-fns';

interface UsersTabProps {
  currentAdmin: Admin | null;
}

export function UsersTab({ currentAdmin }: UsersTabProps) {
  const [users, setUsers] = useState<any>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [editRetailCode, setEditRetailCode] = useState<string | null>(null);
  const [newRetailCode, setNewRetailCode] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // Debug: Log currentAdmin and permissions
  useEffect(() => {
    const debugPermissions = async () => {
      console.log('🔍 UsersTab Debug - currentAdmin:', currentAdmin);
      if (currentAdmin) {
        console.log('🔍 UsersTab Debug - admin role:', currentAdmin.role);
        console.log('🔍 UsersTab Debug - admin permissions:', currentAdmin.permissions);
        console.log('🔍 UsersTab Debug - admin isActive:', currentAdmin.isActive);
        console.log('🔍 UsersTab Debug - canCreateUsers result:', canCreateUsers(currentAdmin));
        
        // Test the permission directly
        try {
          const { hasPermission } = await import('../../../lib/admin/AdminFunctions');
          const { PERMISSIONS } = await import('../../../lib/auth/permissions');
          console.log('🔍 UsersTab Debug - direct permission check:', hasPermission(currentAdmin, PERMISSIONS.USERS_CREATE));
          
          // Test role-based check directly
          const canCreateByRole = currentAdmin.role === 'super_admin' || 
                                 currentAdmin.role === 'sales_admin' || 
                                 currentAdmin.role === 'customer_admin';
          console.log('🔍 UsersTab Debug - role-based check:', canCreateByRole);
          
          // Test if sales_admin specifically can create users
          if (currentAdmin.role === 'sales_admin') {
            console.log('🔍 UsersTab Debug - Sales admin detected, checking permissions...');
            const { ROLE_PERMISSIONS } = await import('../../../types/AdminTypes');
            const salesAdminPermissions = ROLE_PERMISSIONS.sales_admin;
            console.log('🔍 UsersTab Debug - Sales admin permissions:', salesAdminPermissions);
            const hasCreatePermission = salesAdminPermissions.includes('users.create');
            console.log('🔍 UsersTab Debug - Sales admin has users.create:', hasCreatePermission);
          }
        } catch (error) {
          console.log('🔍 UsersTab Debug - error importing modules:', error);
        }
      } else {
        console.log('🔍 UsersTab Debug - currentAdmin is null or undefined');
      }
    };
    
    debugPermissions();
  }, [currentAdmin]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalUsers, setTotalUsers] = useState(0);

  // Search state with debouncing
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  // Create User Modal State
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);
  const [createUserForm, setCreateUserForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    pincode: '',
    shopName: '',
    retailCode: '',
    password: '12345678' // Default password
  });
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [userCredentials, setUserCredentials] = useState<{
    name: string;
    email: string;
    password: string;
  } | null>(null);

  // Function to validate and clean pincode
  const validatePincode = (pincode: string): string => {
    // Remove all non-digits
    const cleanPincode = pincode.replace(/\D/g, '');
    
    // Check if it's a valid Indian pincode (6 digits)
    if (cleanPincode.length === 6) {
      return cleanPincode;
    }
    
    // If not 6 digits, return empty string
    return '';
  };

  // Function to extract pincode from address string
  const extractPincodeFromAddress = (addressString: string): string => {
    // Look for 6-digit patterns in the address
    const pincodeMatch = addressString.match(/\b\d{6}\b/g);
    if (pincodeMatch && pincodeMatch.length > 0) {
      const extractedPincode = validatePincode(pincodeMatch[0]);
      console.log('📍 Extracted pincode from address string:', { original: pincodeMatch[0], validated: extractedPincode });
      return extractedPincode;
    }
    
    // Also try to look for pincode patterns with spaces or dashes
    const pincodePatterns = [
      /\b\d{3}\s?\d{3}\b/g,  // 123 456 or 123456
      /\b\d{2}\s?\d{2}\s?\d{2}\b/g,  // 12 34 56 or 123456
    ];
    
    for (const pattern of pincodePatterns) {
      const matches = addressString.match(pattern);
      if (matches && matches.length > 0) {
        const cleanPincode = matches[0].replace(/\s/g, '');
        const validatedPincode = validatePincode(cleanPincode);
        if (validatedPincode) {
          console.log('📍 Extracted pincode with pattern:', { pattern: pattern.source, original: matches[0], validated: validatedPincode });
          return validatedPincode;
        }
      }
    }
    
    console.log('📍 No pincode found in address string:', addressString);
    return '';
  };

  // Function to fetch current location
  const fetchCurrentLocation = async () => {
    setIsFetchingLocation(true);
    try {
      if (!navigator.geolocation) {
        toast.error('Geolocation is not supported by this browser.');
        return;
      }

      // Request high accuracy location
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 30000
        });
      });

      const { latitude, longitude } = position.coords;
      console.log('📍 Location coordinates:', { latitude, longitude });
      
      // Try multiple geocoding services for better accuracy
      let addressData = null;
      let pincode = '';
      let fullAddress = '';

      // First try: High accuracy Nominatim (zoom level 18)
      try {
        const nominatimResponse = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1&zoom=18&accept-language=en`
        );
        
        if (nominatimResponse.ok) {
          const nominatimData = await nominatimResponse.json();
          console.log('📍 High accuracy Nominatim data:', nominatimData);
          
          if (nominatimData.address) {
            const address = nominatimData.address;
            pincode = validatePincode(address.postcode || '');
            fullAddress = [
              address.house_number,
              address.road,
              address.suburb || address.neighbourhood,
              address.city || address.town || address.village,
              address.state
            ].filter(Boolean).join(', ');
            
            if (pincode) {
              addressData = { address, fullAddress, pincode };
            }
          }
        }
      } catch (error) {
        console.log('📍 High accuracy Nominatim failed:', error);
      }

      // Second try: Medium accuracy if no pincode found
      if (!addressData || !pincode) {
        try {
          const mediumResponse = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1&zoom=16&accept-language=en`
          );
          
          if (mediumResponse.ok) {
            const mediumData = await mediumResponse.json();
            console.log('📍 Medium accuracy Nominatim data:', mediumData);
            
            if (mediumData.address) {
              const address = mediumData.address;
              const newPincode = validatePincode(address.postcode || '');
              
              if (newPincode) {
                pincode = newPincode;
              }
              
              if (!fullAddress) {
                fullAddress = [
                  address.house_number,
                  address.road,
                  address.suburb || address.neighbourhood || address.district,
                  address.city || address.town || address.village,
                  address.state
                ].filter(Boolean).join(', ');
              }
              
              addressData = { address, fullAddress, pincode };
            }
          }
        } catch (error) {
          console.log('📍 Medium accuracy geocoding failed:', error);
        }
      }

      // Third try: Lower accuracy for broader area
      if (!addressData || !pincode) {
        try {
          const lowResponse = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1&zoom=14&accept-language=en`
          );
          
          if (lowResponse.ok) {
            const lowData = await lowResponse.json();
            console.log('📍 Low accuracy Nominatim data:', lowData);
            
            if (lowData.address) {
              const address = lowData.address;
              const newPincode = validatePincode(address.postcode || '');
              
              if (newPincode) {
                pincode = newPincode;
              }
              
              if (!fullAddress) {
                fullAddress = [
                  address.house_number,
                  address.road,
                  address.suburb || address.neighbourhood || address.district,
                  address.city || address.town || address.village,
                  address.state
                ].filter(Boolean).join(', ');
              }
              
              addressData = { address, fullAddress, pincode };
            }
          }
        } catch (error) {
          console.log('📍 Low accuracy geocoding failed:', error);
        }
      }

      // Fourth try: Use display_name as fallback
      if (!addressData) {
        try {
          const fallbackResponse = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          
          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json();
            console.log('📍 Fallback data:', fallbackData);
            
            fullAddress = fallbackData.display_name || '';
            const newPincode = validatePincode(fallbackData.address?.postcode || '');
            
            if (newPincode) {
              pincode = newPincode;
            }
            
            addressData = { address: fallbackData.address || {}, fullAddress, pincode };
          }
        } catch (error) {
          console.log('📍 Fallback geocoding failed:', error);
        }
      }

      // Fifth try: Try with different parameters for better accuracy
      if (!addressData || !pincode) {
        try {
          const enhancedResponse = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1&zoom=12&accept-language=en&extratags=1`
          );
          
          if (enhancedResponse.ok) {
            const enhancedData = await enhancedResponse.json();
            console.log('📍 Enhanced geocoding data:', enhancedData);
            
            if (enhancedData.address) {
              const address = enhancedData.address;
              const newPincode = validatePincode(address.postcode || '');
              
              if (newPincode) {
                pincode = newPincode;
              }
              
              if (!fullAddress) {
                fullAddress = [
                  address.house_number,
                  address.road,
                  address.suburb || address.neighbourhood || address.district,
                  address.city || address.town || address.village,
                  address.state
                ].filter(Boolean).join(', ');
              }
              
              addressData = { address, fullAddress, pincode };
            }
          }
        } catch (error) {
          console.log('📍 Enhanced geocoding failed:', error);
        }
      }

      if (addressData) {
        // Validate and clean the data
        const cleanAddress = fullAddress.replace(/,\s*,/g, ',').replace(/^,\s*/, '').replace(/,\s*$/, '');
        let cleanPincode = validatePincode(pincode);
        
        // If no pincode found in the structured data, try to extract from address string
        if (!cleanPincode && fullAddress) {
          cleanPincode = extractPincodeFromAddress(fullAddress);
          console.log('📍 Extracted pincode from address:', cleanPincode);
        }
        
        // Additional validation: Check if the address seems complete
        const addressParts = cleanAddress.split(',').filter(part => part.trim().length > 0);
        const hasEnoughInfo = addressParts.length >= 2; // At least city and state
        
        console.log('📍 Setting form data:', { address: cleanAddress, pincode: cleanPincode });
        
        setCreateUserForm(prev => ({
          ...prev,
          address: cleanAddress || 'Address not available',
          pincode: cleanPincode || ''
        }));

        if (cleanPincode && hasEnoughInfo) {
          toast.success(`📍 Location fetched successfully! Pincode: ${cleanPincode}`);
        } else if (cleanPincode) {
          toast.success(`📍 Location fetched successfully! Pincode: ${cleanPincode} (Address may need manual completion)`);
        } else if (hasEnoughInfo) {
          toast.success('📍 Location fetched successfully! (Pincode not available)');
        } else {
          toast.success('📍 Location fetched successfully! (Please review and complete address manually)');
        }
        
        console.log('📍 Final address data:', { address: cleanAddress, pincode: cleanPincode, addressParts: addressParts.length });
      } else {
        throw new Error('Could not fetch address details from any service');
      }
    } catch (error) {
      console.error('❌ Error fetching location:', error);
      
      if (error instanceof GeolocationPositionError) {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            toast.error('Location permission denied. Please allow location access and try again.');
            break;
          case error.POSITION_UNAVAILABLE:
            toast.error('Location information unavailable. Please check your GPS settings.');
            break;
          case error.TIMEOUT:
            toast.error('Location request timed out. Please try again.');
            break;
          default:
            toast.error('Failed to fetch location. Please enter address manually.');
        }
      } else {
        toast.error('Failed to fetch location. Please enter address manually.');
      }
    } finally {
      setIsFetchingLocation(false);
    }
  };

  // Place Order Modal State
  const [isPlaceOrderModalOpen, setIsPlaceOrderModalOpen] = useState(false);
  const [selectedUserForOrder, setSelectedUserForOrder] = useState<any>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<OrderItem[]>([]);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState<DeliveryAddress>({
    name: '',
    address: '',
    pincode: '',
    phone: ''
  });
  const [orderTotals, setOrderTotals] = useState({
    subtotal: 0,
    tax: 0,
    shipping: 0,
    discount: 0,
    total: 0
  });
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);

  // Filtered and paginated users
  const filteredUsers = useMemo(() => {
    let filtered = users;

    // Search filter
    if (searchTerm) {
      const query = searchTerm.toLowerCase();
      filtered = filtered.filter((user: any) =>
        user.name?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query) ||
        user.phone?.includes(query) ||
        user.shopName?.toLowerCase().includes(query) ||
        user.address?.toLowerCase().includes(query) ||
        user.pincode?.includes(query) ||
        user.retailCode?.toLowerCase().includes(query)
      );
    }

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter((user: any) => {
        switch (filterType) {
          case 'with-retail':
            return user.retailCode && user.retailCode !== '';
          case 'without-retail':
            return !user.retailCode || user.retailCode === '';
          case 'with-shop':
            return user.shopName && user.shopName !== '';
          case 'without-shop':
            return !user.shopName || user.shopName === '';
          default:
            return true;
        }
      });
    }

    return filtered;
  }, [users, searchTerm, filterType]);

  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredUsers, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  const fetchAllUsers = useCallback(async () => {
    setLoading(true);
    try {
      const fetchedUsers = await fetchUsers();
      setUsers(fetchedUsers);
      setTotalUsers(fetchedUsers?.length || 0);
    } catch (error) {
      console.error('❌ Error fetching users:', error);
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllUsers();
  }, [fetchAllUsers]);

  // Handle search with debouncing
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page when searching
    
    // Clear existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    // Set new timeout for debouncing
    const timeout = setTimeout(() => {
      // Search is handled by useMemo, no need for additional logic here
    }, 300);
    
    setSearchTimeout(timeout);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  // Pagination controls
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    const startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  const handleEditRetailCode = (userId: string, currentCode: string) => {
    setEditRetailCode(userId);
    setNewRetailCode(currentCode || '');
  };

  const handleCancelEdit = () => {
    setEditRetailCode(null);
    setNewRetailCode('');
  };

  const handleUpdateRetailCode = async (userId: string, documentId: string) => {
    try {
      await updateUserRetailCode(documentId, newRetailCode);
      toast.success(`Retail code updated successfully`);
      setEditRetailCode(null);
      setNewRetailCode('');
      // Update local state instead of refetching all users
      setUsers((prevUsers: any[]) => 
        prevUsers.map((user: any) => 
          user.$id === documentId 
            ? { ...user, retailCode: newRetailCode }
            : user
        )
      );
    } catch (error) {
      toast.error('Failed to update retail code');
      console.error('❌ Error updating retail code:', error);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!canCreateUsers(currentAdmin)) {
      toast.error('You do not have permission to create users');
      return;
    }

    // Validate password if email is provided
    if (createUserForm.email && createUserForm.password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    try {
      const newUser = await createUser({
        name: createUserForm.name,
        email: createUserForm.email,
        phone: createUserForm.phone,
        address: createUserForm.address,
        pincode: createUserForm.pincode,
        shopName: createUserForm.shopName,
        retailCode: createUserForm.retailCode,
        password: createUserForm.password // Include password in the createUser call
      });

      // Add to users list without refreshing the entire page
      setUsers((prev: any[]) => [...prev, newUser]);
      setTotalUsers((prev: number) => prev + 1);

      // Check if user was created with auth account (has password)
      if (newUser.password && newUser.email) {
        toast.success(`User ${createUserForm.name} created successfully with login credentials!`, {
          duration: 10000,
          icon: '🔑',
        });
        
        // Set credentials for modal display
        setUserCredentials({
          name: createUserForm.name,
          email: newUser.email,
          password: newUser.password
        });
        setShowCredentialsModal(true);
        
        // Also log to console for admin reference
        console.log('🔑 User Login Credentials:', {
          name: createUserForm.name,
          email: newUser.email,
          password: newUser.password
        });
      } else {
        toast.success(`User ${createUserForm.name} created successfully! (No login credentials - email required for mobile app login)`);
      }

      setIsCreateUserModalOpen(false);
      
      // Reset form
      setCreateUserForm({
        name: '',
        email: '',
        phone: '',
        address: '',
        pincode: '',
        shopName: '',
        retailCode: '',
        password: '12345678' // Reset password to default
      });
    } catch (error) {
      console.error('❌ Error creating user:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create user');
    }
  };

  const handlePlaceOrderForUser = async (user: any) => {
    if (!canCreateOrdersForUsers(currentAdmin)) {
      toast.error('You do not have permission to place orders');
      return;
    }
    
    try {
      // Fetch products filtered for this specific retailer
      const fetchedProducts = user.retailCode 
        ? await fetchProductsForSpecificRetailer(user.retailCode)
        : await fetchProducts(); // Fallback to all products if no retailer code
      setProducts(fetchedProducts);
      
      // Set selected user and default delivery address
      setSelectedUserForOrder(user);
      setDeliveryAddress({
        name: user.name || '',
        address: user.address || '',
        pincode: user.pincode || '',
        phone: user.phone || ''
      });
      
      // Reset order state
      setSelectedProducts([]);
      setProductSearchTerm('');
      setOrderTotals({
        subtotal: 0,
        tax: 0,
        shipping: 0,
        discount: 0,
        total: 0
      });
      
      setIsPlaceOrderModalOpen(true);
    } catch (error) {
      console.error('Error loading products:', error);
      toast.error('Failed to load products');
    }
  };

  const handleAddProductToOrder = (product: Product) => {
    const existingItem = selectedProducts.find(item => item.productId === product.productId);
    
    if (existingItem) {
      // Increase quantity if product already selected
      const updatedProducts = selectedProducts.map(item =>
        item.productId === product.productId
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
      setSelectedProducts(updatedProducts);
    } else {
      // Add new product to order with the correct pricing (already applied by fetchProductsForSpecificRetailer)
      const newItem: OrderItem = {
        productId: product.productId,
        name: product.name,
        price: product.price, // This should already have pricing applied
        quantity: 1,
        imageUrl: product.imageUrl,
        gst: product.gst || 0
      };
      setSelectedProducts([...selectedProducts, newItem]);
    }
    calculateOrderTotals();
  };

  const handleUpdateProductQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveProductFromOrder(productId);
      return;
    }
    
    const updatedProducts = selectedProducts.map(item =>
      item.productId === productId
        ? { ...item, quantity: newQuantity }
        : item
    );
    setSelectedProducts(updatedProducts);
    calculateOrderTotals();
  };

  const handleRemoveProductFromOrder = (productId: string) => {
    const updatedProducts = selectedProducts.filter(item => item.productId !== productId);
    setSelectedProducts(updatedProducts);
    calculateOrderTotals();
  };

  const calculateOrderTotals = () => {
    const subtotal = selectedProducts.reduce((total, item) => total + (item.price * item.quantity), 0);
    const tax = 0; // No GST
    const shipping = 0; // No shipping charges
    const discount = 0; // Can be customized later
    const total = subtotal - discount; // Only subtotal minus discount

    setOrderTotals({
      subtotal,
      tax,
      shipping,
      discount,
      total
    });
  };

  const handleCreateOrder = async () => {
    if (!selectedUserForOrder || !currentAdmin) return;
    
    if (selectedProducts.length === 0) {
      toast.error('Please add at least one product to the order');
      return;
    }

    if (!deliveryAddress.name || !deliveryAddress.address || !deliveryAddress.pincode || !deliveryAddress.phone) {
      toast.error('Please fill in all delivery address fields');
      return;
    }

    setIsCreatingOrder(true);
    
    try {
      const userDetails: UserDetails = {
        name: selectedUserForOrder.name,
        email: selectedUserForOrder.email,
        phone: selectedUserForOrder.phone,
        shopName: selectedUserForOrder.shopName,
        address: selectedUserForOrder.address,
        pincode: selectedUserForOrder.pincode,
        retailCode: selectedUserForOrder.retailCode,
        ratanaCash: 0,
        createdAt: selectedUserForOrder.createdAt
      };

      const orderId = await createOrderForUser(
        selectedUserForOrder.userId,
        userDetails,
        deliveryAddress,
        selectedProducts,
        orderTotals.discount,
        orderTotals.tax,
        orderTotals.shipping,
        currentAdmin.adminId
      );

      toast.success(`Order #${orderId.slice(-8)} created successfully for ${selectedUserForOrder.name}!`);
      setIsPlaceOrderModalOpen(false);
      
      // Reset form
      setSelectedProducts([]);
      setProductSearchTerm('');
      setOrderTotals({
        subtotal: 0,
        tax: 0,
        shipping: 0,
        discount: 0,
        total: 0
      });
      
    } catch (error: any) {
      console.error('Error creating order:', error);
      toast.error(error.message || 'Failed to create order');
    } finally {
      setIsCreatingOrder(false);
    }
  };

  // Filter products based on search term
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
    product.description.toLowerCase().includes(productSearchTerm.toLowerCase())
  );

  // Calculate order totals whenever selected products change
  React.useEffect(() => {
    calculateOrderTotals();
  }, [selectedProducts]);

  const handleCall = (phone: string) => {
    window.open(`tel:${phone}`, '_self');
  };

  const handleWhatsApp = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanPhone}`, '_blank');
  };

  const handleEmail = (email: string) => {
    window.open(`mailto:${email}`, '_self');
  };

  // User Card Component for mobile view
  const UserCard = ({ user }: { user: any }) => (
    <Card className="mb-4 hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.name || 'User'}`} />
            <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold">
              {(user.name || 'U').split(' ').map((n: string) => n[0]).join('').toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
              {user.name || 'Unknown User'}
              {user.retailCode && (
                <Badge variant="outline" className="bg-green-50 text-green-700">
                  {user.retailCode}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>{user.email}</CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Contact Information */}
        <div className="grid grid-cols-1 gap-3">
          {/* Email */}
          <div className="flex items-center justify-between">
            <div className="flex items-center text-sm">
              <Mail className="w-4 h-4 mr-2 text-gray-400" />
              <span className="truncate">{user.email}</span>
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(user.email, 'Email')}
                className="h-6 w-6 p-0"
              >
                <Copy className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEmail(user.email)}
                className="h-6 w-6 p-0"
              >
                <ExternalLink className="w-3 h-3" />
              </Button>
            </div>
          </div>

          {/* Phone */}
          {user.phone && (
            <div className="flex items-center justify-between">
              <div className="flex items-center text-sm">
                <Phone className="w-4 h-4 mr-2 text-gray-400" />
                <span>{user.phone}</span>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(user.phone, 'Phone')}
                  className="h-6 w-6 p-0"
                >
                  <Copy className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCall(user.phone)}
                  className="h-6 w-6 p-0 text-green-600"
                >
                  <Phone className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleWhatsApp(user.phone)}
                  className="h-6 w-6 p-0 text-green-600"
                >
                  <MessageCircle className="w-3 h-3" />
                </Button>
              </div>
            </div>
          )}

          {/* Shop Information */}
          {user.shopName && (
            <div className="flex items-center text-sm">
              <Building className="w-4 h-4 mr-2 text-gray-400" />
              <span className="font-medium">{user.shopName}</span>
            </div>
          )}

          {/* Address */}
          {user.address && (
            <div className="flex items-start text-sm">
              <MapPin className="w-4 h-4 mr-2 mt-0.5 text-gray-400" />
              <div>
                <p>{user.address}</p>
                {user.pincode && <p className="text-gray-500">Pincode: {user.pincode}</p>}
              </div>
            </div>
          )}
        </div>

        {/* Retail Code Section */}
        <div className="border-t pt-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Retail Code:</span>
            {editRetailCode === user.userId ? (
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  value={newRetailCode}
                  onChange={(e) => setNewRetailCode(e.target.value)}
                  className="h-8 w-24 text-sm"
                  placeholder="Code"
                />
                <Button
                  size="sm"
                  onClick={() => handleUpdateRetailCode(user.userId, user.$id)}
                  className="h-8 px-2"
                >
                  <Save className="w-3 h-3" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelEdit}
                  className="h-8 px-2"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-sm">{user.retailCode || 'Not set'}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEditRetailCode(user.userId, user.retailCode)}
                  className="h-8 px-2"
                >
                  <Edit className="w-3 h-3" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="border-t pt-3 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedUser(user);
              setIsDetailsModalOpen(true);
            }}
            className="flex-1"
          >
            <Eye className="w-4 h-4 mr-2" />
            View Details
          </Button>
          {canCreateOrdersForUsers(currentAdmin) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePlaceOrderForUser(user)}
              className="flex-1 text-blue-600 hover:text-blue-700"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Place Order
            </Button>
          )}
        </div>

        {/* Timestamps */}
        <div className="text-xs text-gray-500 border-t pt-2">
          <p>Created: {format(new Date(user.createdAt), 'MMM dd, yyyy')}</p>
          <p>Updated: {format(new Date(user.updatedAt), 'MMM dd, yyyy')}</p>
        </div>
      </CardContent>
    </Card>
  );

  // User Details Modal
  const UserDetailsModal = () => {
    if (!selectedUser) return null;

    return (
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              User Details - {selectedUser.name}
            </DialogTitle>
            <DialogDescription>
              Complete information about this user
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* User Profile */}
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${selectedUser.name}`} />
                <AvatarFallback className="bg-blue-100 text-blue-600 text-lg font-bold">
                  {selectedUser.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-xl font-semibold">{selectedUser.name}</h3>
                <p className="text-gray-600">{selectedUser.email}</p>
                <p className="text-sm text-gray-500">User ID: {selectedUser.userId}</p>
              </div>
            </div>

            {/* Contact & Business Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-500">Email</label>
                    <p className="font-medium">{selectedUser.email}</p>
                  </div>
                  {selectedUser.phone && (
                    <div>
                      <label className="text-xs text-gray-500">Phone</label>
                      <p className="font-medium">{selectedUser.phone}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-xs text-gray-500">User Since</label>
                    <p className="font-medium">{format(new Date(selectedUser.createdAt), 'MMMM dd, yyyy')}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Business Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-500">Shop Name</label>
                    <p className="font-medium">{selectedUser.shopName || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Retail Code</label>
                    <p className="font-medium">{selectedUser.retailCode || 'Not assigned'}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Address</label>
                    <p className="font-medium">{selectedUser.address || 'Not provided'}</p>
                    {selectedUser.pincode && (
                      <p className="text-sm text-gray-600">Pincode: {selectedUser.pincode}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsDetailsModalOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-2 text-lg">Loading users...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-2 sm:p-4 space-y-4 sm:space-y-6">
      <Toaster position="top-right" reverseOrder={false} />
      
      {/* Mobile Header */}
      <div className="lg:hidden space-y-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-xl font-bold">Users Management</h1>
          <p className="text-sm text-gray-600">Manage customers and retail partners</p>
        </div>
        <div className="flex flex-col gap-2">
          {canCreateUsers(currentAdmin) && (
            <Button onClick={() => setIsCreateUserModalOpen(true)} className="w-full">
              <UserPlus className="w-4 h-4 mr-2" />
              Create User
            </Button>
          )}
          <Button variant="outline" onClick={fetchAllUsers} className="w-full">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden lg:flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Users Management</h1>
          <p className="text-gray-600">Manage customers and retail partners</p>
        </div>
        <div className="flex gap-2">
          {canCreateUsers(currentAdmin) && (
            <Button onClick={() => setIsCreateUserModalOpen(true)}>
              <UserPlus className="w-4 h-4 mr-2" />
              Create User
            </Button>
          )}
          <Button variant="outline" onClick={fetchAllUsers}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
              <div>
                <p className="text-lg sm:text-2xl font-bold">{users.length}</p>
                <p className="text-xs sm:text-sm text-gray-600">Total Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <Hash className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
              <div>
                <p className="text-lg sm:text-2xl font-bold">
                  {users.filter((u: any) => u.retailCode).length}
                </p>
                <p className="text-xs sm:text-sm text-gray-600">With Retail Code</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
              <div>
                <p className="text-lg sm:text-2xl font-bold">
                  {users.filter((u: any) => u.shopName).length}
                </p>
                <p className="text-xs sm:text-sm text-gray-600">Business Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
              <div>
                <p className="text-lg sm:text-2xl font-bold">
                  {users.filter((u: any) => {
                    const userDate = new Date(u.createdAt);
                    const thirtyDaysAgo = new Date();
                    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                    return userDate > thirtyDaysAgo;
                  }).length}
                </p>
                <p className="text-xs sm:text-sm text-gray-600">New This Month</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-3 sm:p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search users, shops, codes..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="with-retail">With Retail Code</SelectItem>
                <SelectItem value="without-retail">Without Retail Code</SelectItem>
                <SelectItem value="with-shop">Business Users</SelectItem>
                <SelectItem value="without-shop">Individual Users</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => {
              setSearchTerm('');
              setFilterType('all');
            }} className="w-full sm:w-auto">
              <Filter className="w-4 h-4 mr-2" />
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <div className="space-y-4">
        {paginatedUsers.length === 0 ? (
          <Card>
            <CardContent className="p-6 sm:p-8 text-center">
              <Users className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No users found</h3>
              <p className="text-sm text-gray-500">
                {users.length === 0 
                  ? "No users have registered yet." 
                  : "Try adjusting your search or filter criteria."
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
          {/* Desktop Table View */}
          <div className="hidden lg:block">
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="text-left p-4 font-medium text-gray-900">User</th>
                        <th className="text-left p-4 font-medium text-gray-900">Contact</th>
                        <th className="text-left p-4 font-medium text-gray-900">Business</th>
                        <th className="text-left p-4 font-medium text-gray-900">Retail Code</th>
                        <th className="text-left p-4 font-medium text-gray-900">Location</th>
                        <th className="text-left p-4 font-medium text-gray-900">Joined</th>
                        <th className="text-left p-4 font-medium text-gray-900">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedUsers.map((user: any) => (
                        <tr key={user.userId} className="border-b hover:bg-gray-50 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.name || 'User'}`} />
                                <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold">
                                  {(user.name || 'U').split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-gray-900">{user.name || 'Unknown'}</p>
                                <p className="text-sm text-gray-500">ID: {user.userId.slice(-8)}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="space-y-1">
                              <div className="flex items-center text-sm">
                                <Mail className="w-3 h-3 mr-1 text-gray-400" />
                                <span className="truncate max-w-[150px]">{user.email}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(user.email, 'Email')}
                                  className="h-6 w-6 p-0 ml-1"
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                              </div>
                              {user.phone && (
                                <div className="flex items-center text-sm">
                                  <Phone className="w-3 h-3 mr-1 text-gray-400" />
                                  <span>{user.phone}</span>
                                  <div className="flex ml-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleCall(user.phone)}
                                      className="h-6 w-6 p-0"
                                    >
                                      <Phone className="w-3 h-3 text-green-600" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleWhatsApp(user.phone)}
                                      className="h-6 w-6 p-0"
                                    >
                                      <MessageCircle className="w-3 h-3 text-green-600" />
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="space-y-1">
                              {user.shopName ? (
                                <div className="flex items-center text-sm">
                                  <Building className="w-3 h-3 mr-1 text-gray-400" />
                                  <span className="truncate max-w-[120px]">{user.shopName}</span>
                                </div>
                              ) : (
                                <span className="text-sm text-gray-400">No business</span>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            {editRetailCode === user.userId ? (
                              <div className="flex items-center gap-2">
                                <Input
                                  type="text"
                                  value={newRetailCode}
                                  onChange={(e) => setNewRetailCode(e.target.value)}
                                  className="h-8 w-20 text-sm"
                                  placeholder="Code"
                                />
                                <Button
                                  size="sm"
                                  onClick={() => handleUpdateRetailCode(user.userId, user.$id)}
                                  className="h-8 px-2"
                                >
                                  <Save className="w-3 h-3" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={handleCancelEdit}
                                  className="h-8 px-2"
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                {user.retailCode ? (
                                  <Badge variant="outline" className="bg-green-50 text-green-700">
                                    {user.retailCode}
                                  </Badge>
                                ) : (
                                  <span className="text-sm text-gray-400">Not set</span>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditRetailCode(user.userId, user.retailCode)}
                                  className="h-6 w-6 p-0"
                                >
                                  <Edit className="w-3 h-3" />
                                </Button>
                              </div>
                            )}
                          </td>
                          <td className="p-4">
                            <div className="space-y-1">
                              {user.address && (
                                <div className="flex items-start text-sm">
                                  <MapPin className="w-3 h-3 mr-1 mt-0.5 text-gray-400 flex-shrink-0" />
                                  <div>
                                    <p className="max-w-[120px] truncate">{user.address}</p>
                                    {user.pincode && (
                                      <p className="text-xs text-gray-500">{user.pincode}</p>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="text-sm">
                              <p className="font-medium">{format(new Date(user.createdAt), 'MMM dd, yyyy')}</p>
                              <p className="text-xs text-gray-500">{format(new Date(user.createdAt), 'HH:mm')}</p>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setIsDetailsModalOpen(true);
                                }}
                                className="h-8 px-2"
                                title="View Details"
                              >
                                <Eye className="w-3 h-3" />
                              </Button>
                              {canCreateOrdersForUsers(currentAdmin) && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handlePlaceOrderForUser(user)}
                                  className="h-8 px-2 text-blue-600 hover:text-blue-700"
                                  title="Place Order"
                                >
                                  <ShoppingCart className="w-3 h-3" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2"
                                title="More Actions"
                              >
                                <MoreHorizontal className="w-3 h-3" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden space-y-4">
            {paginatedUsers.map((user: any) => (
              <UserCard key={user.userId} user={user} />
            ))}
          </div>

          {/* Pagination Controls */}
          {!loading && totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between px-4 sm:px-6 py-4 border-t bg-white rounded-b-lg gap-4">
              <div className="text-sm text-muted-foreground text-center sm:text-left">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredUsers.length)} of {filteredUsers.length} users
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Previous</span>
                </Button>
                
                <div className="flex gap-1">
                  {getPageNumbers().map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(page)}
                      className="w-8 h-8 p-0"
                    >
                      {page}
                    </Button>
                  ))}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
          </>
        )}
      </div>

    {/* User Details Modal */}
    <UserDetailsModal />

    {/* Create User Modal */}
    <Dialog open={isCreateUserModalOpen} onOpenChange={setIsCreateUserModalOpen}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto sm:max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-blue-600" />
            Create New User
          </DialogTitle>
          <DialogDescription>
            Add a new customer to the system. They will be able to login and place orders.
            {createUserForm.email && (
              <span className="block mt-2 text-sm text-green-600">
                💡 <strong>Note:</strong> When email is provided, an automatic login account will be created for mobile app access with the specified password.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleCreateUser} className="space-y-4 pb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Full Name *</label>
              <Input
                value={createUserForm.name}
                onChange={(e) => setCreateUserForm({...createUserForm, name: e.target.value})}
                placeholder="Enter full name"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email Address (Optional)</label>
              <Input
                type="email"
                value={createUserForm.email}
                onChange={(e) => setCreateUserForm({...createUserForm, email: e.target.value})}
                placeholder="user@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Password (Default: 12345678)</label>
              <Input
                type="text"
                value={createUserForm.password}
                onChange={(e) => setCreateUserForm({...createUserForm, password: e.target.value})}
                placeholder="12345678"
                className={createUserForm.password === '12345678' ? 'border-yellow-300 bg-yellow-50' : ''}
              />
              <p className="text-xs text-gray-500 mt-1">
                This password will be used for mobile app login. Users can change it later.
                {createUserForm.password === '12345678' && (
                  <span className="text-yellow-600 font-medium"> Using default password.</span>
                )}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phone Number *</label>
              <Input
                value={createUserForm.phone}
                onChange={(e) => setCreateUserForm({...createUserForm, phone: e.target.value})}
                placeholder="+1234567890"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Pincode *</label>
              <Input
                value={createUserForm.pincode}
                onChange={(e) => setCreateUserForm({...createUserForm, pincode: e.target.value})}
                placeholder="Enter pincode"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Address *</label>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                value={createUserForm.address}
                onChange={(e) => setCreateUserForm({...createUserForm, address: e.target.value})}
                placeholder="Enter full address"
                required
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={fetchCurrentLocation}
                disabled={isFetchingLocation}
                className="shrink-0 w-full sm:w-auto"
                title="Fetch current location and auto-fill address"
              >
                {isFetchingLocation ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Navigation className="w-4 h-4" />
                )}
                <span className="ml-2 hidden sm:inline">Fetch Location</span>
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Click the location button to automatically fetch current address and pincode
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Shop Name (Optional)</label>
              <Input
                value={createUserForm.shopName}
                onChange={(e) => setCreateUserForm({...createUserForm, shopName: e.target.value})}
                placeholder="Enter shop name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Retail Code (Optional)</label>
              <Input
                value={createUserForm.retailCode}
                onChange={(e) => setCreateUserForm({...createUserForm, retailCode: e.target.value})}
                placeholder="Enter retail code"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4 border-t sticky bottom-0 bg-background">
            <Button type="button" variant="outline" onClick={() => setIsCreateUserModalOpen(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button type="submit" className="w-full sm:w-auto">
              <UserPlus className="w-4 h-4 mr-2" />
              Create User
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>

    {/* Place Order Modal */}
    <Dialog open={isPlaceOrderModalOpen} onOpenChange={setIsPlaceOrderModalOpen}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-green-600" />
            Place Order for {selectedUserForOrder?.name}
          </DialogTitle>
          <DialogDescription>
            Create a new order on behalf of this customer. Select products and quantities.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Customer Info */}
          <Card className="bg-gray-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium">{selectedUserForOrder?.name}</h3>
                  <p className="text-sm text-gray-600">{selectedUserForOrder?.email}</p>
                  <p className="text-sm text-gray-600">{selectedUserForOrder?.phone}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Product Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5 text-purple-600" />
                Select Products
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Product Search */}
              <div>
                <Input
                  placeholder="Search products..."
                  value={productSearchTerm}
                  onChange={(e) => setProductSearchTerm(e.target.value)}
                  className="mb-4"
                />
              </div>

              {/* Product List */}
              <div className="max-h-64 overflow-y-auto space-y-2">
                {filteredProducts.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No products found</p>
                ) : (
                  filteredProducts.map((product) => (
                    <div key={product.productId} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <img
                          src={product.imageUrl || '/assets/placeholder.png'}
                          alt={product.name}
                          className="w-12 h-12 rounded object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            if (target.src !== '/assets/placeholder.png') {
                              target.src = '/assets/placeholder.png';
                            }
                          }}
                        />
                        <div>
                          <h4 className="font-medium">{product.name}</h4>
                          <p className="text-sm text-gray-500">Rs. {product.price.toFixed(2)}</p>
                          <p className="text-xs text-gray-400">Stock: {product.stock}</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleAddProductToOrder(product)}
                        disabled={product.stock <= 0}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Selected Products */}
          {selectedProducts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-green-600" />
                  Selected Products ({selectedProducts.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {selectedProducts.map((item) => (
                  <div key={item.productId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <img
                        src={item.imageUrl || '/assets/placeholder.png'}
                        alt={item.name}
                        className="w-10 h-10 rounded object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          if (target.src !== '/assets/placeholder.png') {
                            target.src = '/assets/placeholder.png';
                          }
                        }}
                      />
                      <div>
                        <h4 className="font-medium">{item.name}</h4>
                        <p className="text-sm text-gray-500">Rs. {item.price.toFixed(2)} each</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUpdateProductQuantity(item.productId, item.quantity - 1)}
                      >
                        -
                      </Button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUpdateProductQuantity(item.productId, item.quantity + 1)}
                      >
                        +
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRemoveProductFromOrder(item.productId)}
                        className="text-red-600 hover:text-red-700 ml-2"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Delivery Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-orange-600" />
                Delivery Address
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Recipient Name *</label>
                  <Input
                    value={deliveryAddress.name}
                    onChange={(e) => setDeliveryAddress({...deliveryAddress, name: e.target.value})}
                    placeholder="Enter recipient name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Phone Number *</label>
                  <Input
                    value={deliveryAddress.phone}
                    onChange={(e) => setDeliveryAddress({...deliveryAddress, phone: e.target.value})}
                    placeholder="Enter phone number"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Full Address *</label>
                <Input
                  value={deliveryAddress.address}
                  onChange={(e) => setDeliveryAddress({...deliveryAddress, address: e.target.value})}
                  placeholder="Enter complete address"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Pincode *</label>
                <Input
                  value={deliveryAddress.pincode}
                  onChange={(e) => setDeliveryAddress({...deliveryAddress, pincode: e.target.value})}
                  placeholder="Enter pincode"
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Order Summary */}
          {selectedProducts.length > 0 && (
            <Card className="bg-green-50 border-green-200">
              <CardHeader>
                <CardTitle className="text-green-800">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>Rs. {orderTotals.subtotal.toFixed(2)}</span>
                </div>
                {orderTotals.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount:</span>
                    <span>-Rs. {orderTotals.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total:</span>
                  <span>Rs. {orderTotals.total.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-gray-600">
            {selectedProducts.length === 0 ? (
              'Add products to create an order'
            ) : (
              `${selectedProducts.length} product${selectedProducts.length === 1 ? '' : 's'} selected`
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsPlaceOrderModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateOrder}
              disabled={selectedProducts.length === 0 || isCreatingOrder}
              className="bg-green-600 hover:bg-green-700"
            >
              {isCreatingOrder ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Create Order (Rs. {orderTotals.total.toFixed(2)})
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    {/* Credentials Modal */}
    <Dialog open={showCredentialsModal} onOpenChange={setShowCredentialsModal}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-green-600" />
            User Created Successfully
          </DialogTitle>
          <DialogDescription>
            Login credentials have been generated for the mobile app.
          </DialogDescription>
        </DialogHeader>

        {userCredentials && (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-800 mb-2">Login Credentials for {userCredentials.name}</h4>
              <div className="space-y-2">
                <div>
                  <label className="text-sm font-medium text-gray-700">Email:</label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={userCredentials.email}
                      readOnly
                      className="bg-white"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(userCredentials.email, 'Email')}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Password:</label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={userCredentials.password}
                      readOnly
                      type="password"
                      className="bg-white"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(userCredentials.password, 'Password')}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                <strong>Important:</strong> Please share these credentials with the user securely. 
                They can use these credentials to login to the mobile app immediately.
                {userCredentials?.password === '12345678' && (
                  <span className="block mt-1">
                    <strong>Note:</strong> This is the default password. Users should change it on first login for security.
                  </span>
                )}
              </p>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button 
            variant="outline" 
            onClick={() => setShowCredentialsModal(false)}
          >
            Close
          </Button>
          <Button 
            onClick={() => {
              if (userCredentials) {
                const credentialsText = `Login Credentials for ${userCredentials.name}:\nEmail: ${userCredentials.email}\nPassword: ${userCredentials.password}`;
                copyToClipboard(credentialsText, 'All credentials');
              }
              setShowCredentialsModal(false);
            }}
          >
            <Copy className="w-4 h-4 mr-2" />
            Copy All
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  </div>
);
}