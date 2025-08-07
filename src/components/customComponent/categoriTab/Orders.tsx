import React, { useState, useEffect, useMemo } from "react";
import { fetchUserOrders, updateOrderStatus, updateOrderPaymentStatus, updateOrderItems } from "@/lib/product/HandleOrder";
import { OrderItem, DeliveryAddress, OrderStatus, PaymentStatus, Order, UserDetails } from "@/types/OrderTypes";
import { Admin } from "@/types/AdminTypes";
import { canEditOrderItems, canDeleteOrderItems } from "@/lib/auth/permissions";
import { generateInvoicePDF } from "../../../components/pdf/InvoiceGenerator";
import toast, { Toaster } from 'react-hot-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Package, 
  User, 
  MapPin, 
  Calendar, 
  DollarSign, 
  Phone, 
  Mail, 
  FileText, 
  Truck, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle, 
  RefreshCw, 
  Home, 
  ShoppingBag, 
  Copy, 
  ExternalLink, 
  MessageCircle, 
  Building, 
  Hash,
  Edit,
  Trash2,
  Save,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { format, isValid, parseISO } from 'date-fns';

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    currencyDisplay: 'code'
  }).format(price).replace('INR', 'Rs.');
};

// Helper function to safely format dates
const formatOrderDate = (dateString: string | undefined, formatString: string = 'MMM dd, yyyy • HH:mm'): string => {
  if (!dateString) return 'Date not available';
  
  try {
    // Try parsing as ISO string first (Appwrite format)
    let date = parseISO(dateString);
    
    // If that fails, try creating a new Date
    if (!isValid(date)) {
      date = new Date(dateString);
    }
    
    // Check if the date is valid
    if (!isValid(date)) {
      console.warn('Invalid date string:', dateString);
      return 'Invalid date';
    }
    
    return format(date, formatString);
  } catch (error) {
    console.error('Error formatting date:', error, 'dateString:', dateString);
    return 'Invalid date';
  }
};

interface OrdersProps {
  currentAdmin: Admin | null;
}

const Orders = ({ currentAdmin }: OrdersProps) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [editingItemData, setEditingItemData] = useState<OrderItem | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalOrders, setTotalOrders] = useState(0);

  // Search state with debouncing
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  
  // Edit Items Modal state
  const [selectedOrderForEdit, setSelectedOrderForEdit] = useState<Order | null>(null);
  const [isEditItemsModalOpen, setIsEditItemsModalOpen] = useState(false);
  const [editItemsData, setEditItemsData] = useState<OrderItem[]>([]);
  const [editingItemIndexInModal, setEditingItemIndexInModal] = useState<number | null>(null);

  const getOrders = async () => {
    setLoading(true);

    try {
      const fetchedOrders = await fetchUserOrders();
      console.log('Fetched Orders:', fetchedOrders); // Log to debug data
      setOrders(fetchedOrders);
      setFilteredOrders(fetchedOrders);
    } catch (error) {
      console.error('❌ Error fetching orders:', error);
      toast.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getOrders();
  }, []);

  useEffect(() => {
    let filtered = orders;

    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.$id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.userDetails?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.userDetails?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.userDetails?.phone?.includes(searchTerm) ||
        order.userDetails?.shopName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.userDetails?.retailCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.deliveryAddress?.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.deliveryAddress?.pincode?.includes(searchTerm) ||
        order.deliveryAddress?.phone?.includes(searchTerm)
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    if (paymentFilter !== "all") {
      filtered = filtered.filter(order => order.paymentStatus === paymentFilter);
    }

    setFilteredOrders(filtered);
    setTotalOrders(filtered.length);
    setCurrentPage(1); // Reset to first page when filtering
  }, [orders, searchTerm, statusFilter, paymentFilter]);

  // Pagination logic
  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredOrders.slice(startIndex, endIndex);
  }, [filteredOrders, currentPage, itemsPerPage]);

  const totalPages = useMemo(() => {
    return Math.ceil(totalOrders / itemsPerPage);
  }, [totalOrders, itemsPerPage]);

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

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  // Search with debouncing
  const handleSearchChange = (value: string) => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const timeout = setTimeout(() => {
      setSearchTerm(value);
    }, 300);

    setSearchTimeout(timeout);
  };

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      await getOrders();
      toast.success(`Order status updated to ${newStatus}`);
    } catch (error) {
      console.error('❌ Error updating order status:', error);
      toast.error('Failed to update order status');
    }
  };

  const handlePaymentStatusChange = async (orderId: string, newPaymentStatus: PaymentStatus) => {
    try {
      await updateOrderPaymentStatus(orderId, newPaymentStatus);
      await getOrders();
      toast.success(`Payment status updated to ${newPaymentStatus}`);
    } catch (error) {
      console.error('❌ Error updating payment status:', error);
      toast.error('Failed to update payment status');
    }
  };

  const handleDownloadInvoice = async (order: Order) => {
    try {
      toast.loading('Generating invoice...');
      await generateInvoicePDF(order);
      toast.dismiss();
      toast.success('Invoice downloaded successfully!');
    } catch (error) {
      toast.dismiss();
      console.error('❌ Error generating invoice:', error);
      toast.error('Failed to generate invoice');
    }
  };

  // Order Item Management Functions
  const handleEditOrderItem = (itemIndex: number, item: OrderItem) => {
    if (!canEditOrderItems(currentAdmin)) {
      toast.error('You do not have permission to edit order items');
      return;
    }
    setEditingItemIndex(itemIndex);
    setEditingItemData({ ...item });
  };

  const handleSaveOrderItem = async () => {
    if (!selectedOrder || editingItemIndex === null || !editingItemData) return;
    
    try {
      // Create updated items array
      const updatedItems = [...selectedOrder.items];
      updatedItems[editingItemIndex] = editingItemData;
      
      // Update local state immediately for better UX
      const updatedOrder = { ...selectedOrder, items: updatedItems };
      setSelectedOrder(updatedOrder);
      
      // Update orders list
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.$id === selectedOrder.$id ? updatedOrder : order
        )
      );
      setFilteredOrders(prevOrders => 
        prevOrders.map(order => 
          order.$id === selectedOrder.$id ? updatedOrder : order
        )
      );
      
      // TODO: Add actual API call to update order items in backend
      // await updateOrderItems(selectedOrder.$id, updatedItems);
      
      toast.success('Order item updated successfully');
      setEditingItemIndex(null);
      setEditingItemData(null);
    } catch (error) {
      console.error('❌ Error updating order item:', error);
      toast.error('Failed to update order item');
    }
  };

  const handleDeleteOrderItem = async (itemIndex: number) => {
    if (!canDeleteOrderItems(currentAdmin)) {
      toast.error('You do not have permission to delete order items');
      return;
    }

    if (!selectedOrder) return;

    if (selectedOrder.items.length <= 1) {
      toast.error('Cannot delete the last item from an order');
      return;
    }

    try {
      // Create updated items array without the deleted item
      const updatedItems = selectedOrder.items.filter((_, index) => index !== itemIndex);
      
      // Update local state immediately for better UX
      const updatedOrder = { ...selectedOrder, items: updatedItems };
      setSelectedOrder(updatedOrder);
      
      // Update orders list
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.$id === selectedOrder.$id ? updatedOrder : order
        )
      );
      setFilteredOrders(prevOrders => 
        prevOrders.map(order => 
          order.$id === selectedOrder.$id ? updatedOrder : order
        )
      );
      
      // TODO: Add actual API call to update order items in backend
      // await updateOrderItems(selectedOrder.$id, updatedItems);
      
      toast.success('Order item deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting order item:', error);
      toast.error('Failed to delete order item');
    }
  };

  const handleCancelEditOrderItem = () => {
    setEditingItemIndex(null);
    setEditingItemData(null);
  };

  // Edit Items Modal Functions
  const handleOpenEditItemsModal = (order: Order) => {
    if (!canEditOrderItems(currentAdmin)) {
      toast.error('You do not have permission to edit order items');
      return;
    }
    setSelectedOrderForEdit(order);
    setEditItemsData([...order.items]); // Create a copy for editing
    setIsEditItemsModalOpen(true);
  };

  const handleCloseEditItemsModal = () => {
    setSelectedOrderForEdit(null);
    setIsEditItemsModalOpen(false);
    setEditItemsData([]);
    setEditingItemIndexInModal(null);
  };

  const handleEditItemInModal = (itemIndex: number) => {
    setEditingItemIndexInModal(itemIndex);
  };

  const handleSaveItemInModal = (itemIndex: number, updatedItem: OrderItem) => {
    const updatedItems = [...editItemsData];
    updatedItems[itemIndex] = updatedItem;
    setEditItemsData(updatedItems);
    setEditingItemIndexInModal(null);
  };

  const handleDeleteItemInModal = (itemIndex: number) => {
    if (editItemsData.length <= 1) {
      toast.error('Cannot delete the last item from an order');
      return;
    }
    
    const updatedItems = editItemsData.filter((_, index) => index !== itemIndex);
    setEditItemsData(updatedItems);
    toast.success('Item removed from order');
  };

  const handleSaveAllOrderItems = async () => {
    if (!selectedOrderForEdit) return;

    try {
      // Calculate new subtotal from updated items
      const newSubtotal = editItemsData.reduce((total, item) => total + (item.quantity * item.price), 0);
      
      // Calculate new total amount (preserve original tax/shipping/discount ratios if they exist)
      let newTotalAmount = newSubtotal;
      if (selectedOrderForEdit.tax) {
        newTotalAmount += selectedOrderForEdit.tax;
      }
      if (selectedOrderForEdit.shippingCost) {
        newTotalAmount += selectedOrderForEdit.shippingCost;
      }
      if (selectedOrderForEdit.discount) {
        newTotalAmount -= selectedOrderForEdit.discount;
      }

      // Update local state immediately for better UX
      const updatedOrder = { 
        ...selectedOrderForEdit, 
        items: editItemsData,
        totalAmount: newTotalAmount
      };
      
      // Update orders list
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.$id === selectedOrderForEdit.$id ? updatedOrder : order
        )
      );
      setFilteredOrders(prevOrders => 
        prevOrders.map(order => 
          order.$id === selectedOrderForEdit.$id ? updatedOrder : order
        )
      );
      
      // Save changes to database
      await updateOrderItems(selectedOrderForEdit.$id, editItemsData, newTotalAmount);
      
      // Refresh orders data from database to ensure consistency
      await getOrders();
      
      // Show detailed success message
      const originalTotal = selectedOrderForEdit.items.reduce((total, item) => total + (item.quantity * item.price), 0);
      const difference = newSubtotal - originalTotal;
      const changeText = difference > 0 
        ? `increased by ${formatPrice(difference)}` 
        : difference < 0 
        ? `decreased by ${formatPrice(Math.abs(difference))}` 
        : 'no change in total';
      
      toast.success(`Order items updated and saved! Subtotal ${changeText}`);
      handleCloseEditItemsModal();
    } catch (error) {
      console.error('❌ Error updating order items:', error);
      
      // Revert local state changes if database save failed
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.$id === selectedOrderForEdit.$id ? selectedOrderForEdit : order
        )
      );
      setFilteredOrders(prevOrders => 
        prevOrders.map(order => 
          order.$id === selectedOrderForEdit.$id ? selectedOrderForEdit : order
        )
      );
      
      toast.error('Failed to save order changes. Please try again.');
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const handleCallCustomer = (phone: string) => {
    window.open(`tel:${phone}`, '_self');
  };

  const handleWhatsApp = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanPhone}`, '_blank');
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'shipped': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'delivered': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPaymentStatusColor = (status: PaymentStatus) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'failed': return 'bg-red-100 text-red-800 border-red-200';
      case 'refunded': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'confirmed': return <CheckCircle className="w-4 h-4" />;
      case 'shipped': return <Truck className="w-4 h-4" />;
      case 'delivered': return <Package className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const CustomerInfoCard = ({ order }: { order: Order }) => (
    <Card className="h-fit">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center">
          <User className="w-4 h-4 mr-2 text-blue-600" />
          Customer Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${order.userDetails?.name || 'User'}`} />
            <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold">
              {(order.userDetails?.name || 'U').split(' ').map(n => n[0]).join('').toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-gray-900">{order.userDetails?.name || 'N/A'}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(order.userDetails?.name || '', 'Customer name')}
                className="h-6 w-6 p-0"
              >
                <Copy className="w-3 h-3" />
              </Button>
            </div>
            <p className="text-xs text-gray-500">User ID: {order.userId.slice(-8)}</p>
            {order.userDetails?.shopName && (
              <div className="flex items-center gap-1 mt-1">
                <Building className="w-3 h-3 text-purple-600" />
                <p className="text-xs font-medium text-purple-600">{order.userDetails.shopName}</p>
              </div>
            )}
            {order.userDetails?.retailCode && (
              <Badge variant="outline" className="bg-green-50 text-green-700 text-xs mt-1">
                Code: {order.userDetails.retailCode}
              </Badge>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center text-sm">
              <Mail className="w-4 h-4 mr-2 text-gray-400" />
              <span className="truncate flex-1">{order.userDetails?.email || 'N/A'}</span>
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(order.userDetails?.email || '', 'Email')}
                className="h-6 w-6 p-0"
              >
                <Copy className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open(`mailto:${order.userDetails?.email}`, '_self')}
                className="h-6 w-6 p-0"
              >
                <ExternalLink className="w-3 h-3" />
              </Button>
            </div>
          </div>

          {order.userDetails?.phone && order.userDetails.phone !== 'N/A' && (
            <div className="flex items-center justify-between">
              <div className="flex items-center text-sm">
                <Phone className="w-4 h-4 mr-2 text-gray-400" />
                <span>{order.userDetails.phone}</span>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(order.userDetails?.phone || '', 'Phone')}
                  className="h-6 w-6 p-0"
                >
                  <Copy className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCallCustomer(order.userDetails?.phone || '')}
                  className="h-6 w-6 p-0 text-green-600"
                >
                  <Phone className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleWhatsApp(order.userDetails?.phone || '')}
                  className="h-6 w-6 p-0 text-green-600"
                >
                  <MessageCircle className="w-3 h-3" />
                </Button>
              </div>
            </div>
          )}

          {order.userDetails?.shopName && (
            <div className="border-t pt-3">
              <div className="flex items-center text-sm">
                <Building className="w-4 h-4 mr-2 text-purple-600" />
                <div>
                  <p className="font-medium text-purple-700">{order.userDetails.shopName}</p>
                  <p className="text-xs text-gray-500">Business Customer</p>
                </div>
              </div>
            </div>
          )}

          {order.userDetails?.address && (
            <div className="border-t pt-3">
              <div className="flex items-start text-sm">
                <MapPin className="w-4 h-4 mr-2 mt-0.5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Customer Address</p>
                  <p className="font-medium">{order.userDetails.address}</p>
                  {order.userDetails.pincode && (
                    <p className="text-xs text-gray-500">Pincode: {order.userDetails.pincode}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center text-sm text-gray-500">
            <Calendar className="w-4 h-4 mr-2 text-gray-400" />
            <span>Customer since {formatOrderDate(order.userDetails?.createdAt || order.$createdAt, 'MMM yyyy')}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const DeliveryAddressCard = ({ order }: { order: Order }) => (
    <Card className="h-fit">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center">
          <MapPin className="w-4 h-4 mr-2 text-green-600" />
          Delivery Address
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center text-sm">
            <User className="w-4 h-4 mr-2 text-gray-400" />
            <span className="font-medium">{order.deliveryAddress.name || 'N/A'}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => copyToClipboard(order.deliveryAddress.name, 'Recipient name')}
            className="h-6 w-6 p-0"
          >
            <Copy className="w-3 h-3" />
          </Button>
        </div>

        <div className="flex items-start justify-between">
          <div className="flex items-start text-sm">
            <Home className="w-4 h-4 mr-2 mt-0.5 text-gray-400 flex-shrink-0" />
            <div>
              <p className="font-medium text-gray-900">{order.deliveryAddress.address || 'N/A'}</p>
              <p className="text-gray-600">Pincode: {order.deliveryAddress.pincode || 'N/A'}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => copyToClipboard(`${order.deliveryAddress.address}, ${order.deliveryAddress.pincode}`, 'Address')}
            className="h-6 w-6 p-0 flex-shrink-0"
          >
            <Copy className="w-3 h-3" />
          </Button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center text-sm">
            <Phone className="w-4 h-4 mr-2 text-gray-400" />
            <span>{order.deliveryAddress.phone || 'N/A'}</span>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(order.deliveryAddress.phone, 'Delivery phone')}
              className="h-6 w-6 p-0"
            >
              <Copy className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleCallCustomer(order.deliveryAddress.phone)}
              className="h-6 w-6 p-0 text-green-600"
            >
              <Phone className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleWhatsApp(order.deliveryAddress.phone)}
              className="h-6 w-6 p-0 text-green-600"
            >
              <MessageCircle className="w-3 h-3" />
            </Button>
          </div>
        </div>

        <div className="pt-2 border-t">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(order.deliveryAddress.address + ' ' + order.deliveryAddress.pincode)}`, '_blank')}
          >
            <MapPin className="w-3 h-3 mr-2" />
            View on Maps
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const OrderCard = ({ order }: { order: Order }) => (
    <Card className="mb-4 hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Order #{order.orderId.slice(-8)}</CardTitle>
              <CardDescription>
                {formatOrderDate(order.$createdAt)}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={`${getStatusColor(order.status)} border`}>
              {getStatusIcon(order.status)}
              <span className="ml-1 capitalize">{order.status}</span>
            </Badge>
            <Badge className={`${getPaymentStatusColor(order.paymentStatus)} border`}>
              <DollarSign className="w-3 h-3 mr-1" />
              <span className="capitalize">{order.paymentStatus}</span>
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <CustomerInfoCard order={order} />
          <DeliveryAddressCard order={order} />
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center">
                <ShoppingBag className="w-4 h-4 mr-2 text-purple-600" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Items:</span>
                <span className="font-medium">{order.items.length} item(s)</span>
              </div>

              {order.discount && order.discount > 0 && (
                <div className="flex justify-between items-center text-green-600">
                  <span className="text-sm">Discount:</span>
                  <span className="font-medium">-Rs.{order.discount.toFixed(2)}</span>
                </div>
              )}

              {order.tax && order.tax > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Tax:</span>
                  <span className="font-medium">Rs.{order.tax.toFixed(2)}</span>
                </div>
              )}

              {order.shippingCost && order.shippingCost > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Shipping:</span>
                  <span className="font-medium">Rs.{order.shippingCost.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between items-center border-t pt-2">
                <span className="text-sm font-medium">Total Amount:</span>
                <span className="text-lg font-bold text-green-600">
                  {formatPrice(order.totalAmount)}
                </span>
              </div>

              <div className="pt-2 space-y-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => {
                    setSelectedOrder(order);
                    setIsDetailsModalOpen(true);
                  }}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View Details
                </Button>
                
                {canEditOrderItems(currentAdmin) && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                    onClick={() => handleOpenEditItemsModal(order)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Items ({order.items.length})
                  </Button>
                )}
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => handleDownloadInvoice(order)}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Invoice
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-2 mb-4">
          {order.userDetails?.shopName && (
            <Badge variant="outline" className="bg-purple-50 text-purple-700">
              <Building className="w-3 h-3 mr-1" />
              Business Customer
            </Badge>
          )}
          {order.userDetails?.retailCode && (
            <Badge variant="outline" className="bg-green-50 text-green-700">
              <Hash className="w-3 h-3 mr-1" />
              Retail Partner
            </Badge>
          )}
          {!order.userDetails?.shopName && !order.userDetails?.retailCode && (
            <Badge variant="outline" className="bg-blue-50 text-blue-700">
              <User className="w-3 h-3 mr-1" />
              Individual Customer
            </Badge>
          )}
        </div>

        {order.items && order.items.length > 0 && (
          <div className="border-t pt-4">
            <h4 className="font-medium text-sm text-gray-600 mb-3 flex items-center">
              <Package className="w-4 h-4 mr-2" />
              Order Items ({order.items.length})
            </h4>
            <div className="space-y-2">
              {order.items.slice(0, 3).map((item, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-12 h-12 rounded-lg object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      if (target.src !== '/assets/placeholder.png') {
                        target.src = '/assets/placeholder.png'; // Ensure this path is valid.
                      }
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{item.name}</p>
                    <p className="text-xs text-gray-500">
                      Product ID: {item.productId.slice(-8)}
                    </p>
                    <p className="text-xs text-gray-500">
                      Qty: {item.quantity} × {formatPrice(item.price)}
                    </p>
                  </div>
                  <div className="text-sm font-medium">
                    {formatPrice(item.quantity * item.price)}
                  </div>
                </div>
              ))}
              {order.items.length > 3 && (
                <p className="text-sm text-gray-500 text-center py-2">
                  +{order.items.length - 3} more item{order.items.length - 3 > 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>
        )}

        <div className="border-t pt-4 mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Order Status
              </label>
              <Select 
                value={order.status} 
                onValueChange={(value) => handleStatusChange(order.$id, value as OrderStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Status
              </label>
              <Select 
                value={order.paymentStatus} 
                onValueChange={(value) => handlePaymentStatusChange(order.$id, value as PaymentStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const OrderDetailsModal = () => {
    if (!selectedOrder) return null;

    return (
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Order Details - #{selectedOrder.orderId.slice(-8)}
            </DialogTitle>
            <DialogDescription>
              Complete information about this order
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="items">Items</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Customer Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${selectedOrder.userDetails?.name || 'User'}`} />
                        <AvatarFallback className="bg-blue-100 text-blue-600">
                          {(selectedOrder.userDetails?.name || 'U').split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-lg">{selectedOrder.userDetails?.name || 'N/A'}</p>
                        <p className="text-sm text-gray-500">User ID: {selectedOrder.userId}</p>
                        {selectedOrder.userDetails?.shopName && (
                          <p className="text-sm font-medium text-purple-600 flex items-center">
                            <Building className="w-3 h-3 mr-1" />
                            {selectedOrder.userDetails.shopName}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Email</label>
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{selectedOrder.userDetails?.email || 'N/A'}</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(`mailto:${selectedOrder.userDetails?.email}`, '_self')}
                          >
                            <Mail className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Phone</label>
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{selectedOrder.userDetails?.phone || 'N/A'}</p>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCallCustomer(selectedOrder.userDetails?.phone || '')}
                            >
                              <Phone className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleWhatsApp(selectedOrder.userDetails?.phone || '')}
                            >
                              <MessageCircle className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Customer Since</label>
                        <p className="font-medium">
                          {formatOrderDate(selectedOrder.userDetails?.createdAt, 'MMM dd, yyyy')}
                        </p>
                      </div>
                      {selectedOrder.userDetails?.retailCode && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">Retail Code</label>
                          <p className="font-medium text-green-600">{selectedOrder.userDetails.retailCode}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Delivery Address
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Recipient</label>
                      <p className="font-medium">{selectedOrder.deliveryAddress.name || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Address</label>
                      <p className="font-medium">{selectedOrder.deliveryAddress.address || 'N/A'}</p>
                      <p className="text-sm text-gray-600">Pincode: {selectedOrder.deliveryAddress.pincode || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Delivery Phone</label>
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{selectedOrder.deliveryAddress.phone || 'N/A'}</p>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCallCustomer(selectedOrder.deliveryAddress.phone)}
                          >
                            <Phone className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleWhatsApp(selectedOrder.deliveryAddress.phone)}
                          >
                            <MessageCircle className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(selectedOrder.deliveryAddress.address + ' ' + selectedOrder.deliveryAddress.pincode)}`, '_blank')}
                    >
                      <MapPin className="w-4 h-4 mr-2" />
                      View on Google Maps
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Order Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>{formatPrice(selectedOrder.items.reduce((sum, item) => sum + (item.quantity * item.price), 0))}</span>
                    </div>
                    {selectedOrder.discount && selectedOrder.discount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount:</span>
                        <span>-Rs.{selectedOrder.discount.toFixed(2)}</span>
                      </div>
                    )}
                    {selectedOrder.tax && selectedOrder.tax > 0 && (
                      <div className="flex justify-between">
                        <span>Tax:</span>
                        <span>Rs.{selectedOrder.tax.toFixed(2)}</span>
                      </div>
                    )}
                    {selectedOrder.shippingCost && selectedOrder.shippingCost > 0 && (
                      <div className="flex justify-between">
                        <span>Shipping:</span>
                        <span>Rs.{selectedOrder.shippingCost.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="border-t pt-3">
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total:</span>
                        <span>{formatPrice(selectedOrder.totalAmount)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="items" className="space-y-4">
              {selectedOrder.items.map((item, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-16 h-16 rounded-lg object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          if (target.src !== '/assets/placeholder.png') {
                            target.src = '/assets/placeholder.png'; // Ensure this path is valid.
                          }
                        }}
                      />
                      <div className="flex-1">
                        {editingItemIndex === index ? (
                          // Edit Mode
                          <div className="space-y-3">
                            <Input
                              value={editingItemData?.name || ''}
                              onChange={(e) => setEditingItemData(prev => prev ? {...prev, name: e.target.value} : null)}
                              placeholder="Product name"
                            />
                            <div className="grid grid-cols-2 gap-2">
                              <Input
                                type="number"
                                value={editingItemData?.quantity || 0}
                                onChange={(e) => setEditingItemData(prev => prev ? {...prev, quantity: parseInt(e.target.value) || 0} : null)}
                                placeholder="Quantity"
                                min="1"
                              />
                              <Input
                                type="number"
                                value={editingItemData?.price || 0}
                                onChange={(e) => setEditingItemData(prev => prev ? {...prev, price: parseFloat(e.target.value) || 0} : null)}
                                placeholder="Price"
                                step="0.01"
                                min="0"
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" onClick={handleSaveOrderItem}>
                                <Save className="w-4 h-4 mr-1" />
                                Save
                              </Button>
                              <Button size="sm" variant="outline" onClick={handleCancelEditOrderItem}>
                                <X className="w-4 h-4 mr-1" />
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          // View Mode
                          <>
                            <h3 className="font-medium">{item.name}</h3>
                            <p className="text-sm text-gray-500">Product ID: {item.productId}</p>
                            <div className="flex items-center gap-4 mt-2">
                              <span className="text-sm">Qty: {item.quantity}</span>
                              <span className="text-sm">Price: {formatPrice(item.price)}</span>
                              <span className="font-medium">Total: {formatPrice(item.quantity * item.price)}</span>
                            </div>
                          </>
                        )}
                      </div>
                      
                      {/* Action Buttons */}
                      {editingItemIndex !== index && (
                        <div className="flex gap-2">
                          {canEditOrderItems(currentAdmin) && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditOrderItem(index, item)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          )}
                          {canDeleteOrderItems(currentAdmin) && selectedOrder.items.length > 1 && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteOrderItem(index)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="timeline" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium">Order Created</p>
                    <p className="text-sm text-gray-500">
                      {formatOrderDate(selectedOrder.$createdAt)}
                    </p>
                  </div>
                </div>

                {selectedOrder.status !== 'pending' && (
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium">Status Updated to {selectedOrder.status}</p>
                      <p className="text-sm text-gray-500">
                        {formatOrderDate(selectedOrder.$updatedAt)}
                      </p>
                    </div>
                  </div>
                )}

                {selectedOrder.paymentStatus === 'paid' && (
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium">Payment Confirmed</p>
                      <p className="text-sm text-gray-500">Amount: {formatPrice(selectedOrder.totalAmount)}</p>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsDetailsModalOpen(false)}>
              Close
            </Button>
            <Button onClick={() => handleDownloadInvoice(selectedOrder)}>
              <Download className="w-4 h-4 mr-2" />
              Download Invoice
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
          <span className="ml-2 text-lg">Loading orders...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <Toaster position="top-right" reverseOrder={false} />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Orders Management</h1>
          <p className="text-gray-600">Manage and track all customer orders with complete details</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={getOrders}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button>
            <FileText className="w-4 h-4 mr-2" />
            Export All
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{totalOrders}</p>
                <p className="text-sm text-gray-600">
                  {searchTerm || statusFilter !== "all" || paymentFilter !== "all" 
                    ? `Filtered Orders (${orders.length} total)` 
                    : "Total Orders"
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold">
                  {filteredOrders.filter(o => o.status === 'pending').length}
                </p>
                <p className="text-sm text-gray-600">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">
                  {filteredOrders.filter(o => o.status === 'delivered').length}
                </p>
                <p className="text-sm text-gray-600">Delivered</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Building className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">
                  {filteredOrders.filter(o => o.userDetails?.shopName).length}
                </p>
                <p className="text-sm text-gray-600">Business Orders</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">
                  {formatPrice(filteredOrders.reduce((sum, order) => sum + order.totalAmount, 0))}
                </p>
                <p className="text-sm text-gray-600">
                  {searchTerm || statusFilter !== "all" || paymentFilter !== "all" 
                    ? "Filtered Revenue" 
                    : "Total Revenue"
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search orders, customers, shops, codes, addresses..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by payment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payments</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
                setPaymentFilter("all");
              }}>
              <Filter className="w-4 h-4 mr-2" />
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {paginatedOrders.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
              <p className="text-gray-500">
                {orders.length === 0 
                  ? "No orders have been placed yet." 
                  : "Try adjusting your search or filter criteria."
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          paginatedOrders.map((order) => (
            <OrderCard key={order.$id} order={order} />
          ))
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalOrders)} of {totalOrders} orders
              </div>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handlePrevPage} 
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>
                
                <div className="flex items-center space-x-1">
                  {getPageNumbers().map((page) => (
                    <Button
                      key={page}
                      variant={page === currentPage ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(page)}
                      className="min-w-[40px] h-8"
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
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <OrderDetailsModal />
      <EditOrderItemsModal 
        selectedOrder={selectedOrderForEdit}
        isOpen={isEditItemsModalOpen}
        onClose={handleCloseEditItemsModal}
        editItemsData={editItemsData}
        setEditItemsData={setEditItemsData}
        onSaveAll={handleSaveAllOrderItems}
      />
    </div>
  );
};

// Edit Order Items Modal Component
interface EditOrderItemsModalProps {
  selectedOrder: Order | null;
  isOpen: boolean;
  onClose: () => void;
  editItemsData: OrderItem[];
  setEditItemsData: (items: OrderItem[]) => void;
  onSaveAll: () => void;
}

const EditOrderItemsModal = ({ 
  selectedOrder, 
  isOpen, 
  onClose, 
  editItemsData, 
  setEditItemsData, 
  onSaveAll 
}: EditOrderItemsModalProps) => {
  const [editingItem, setEditingItem] = useState<{index: number, item: OrderItem} | null>(null);

  if (!selectedOrder || !isOpen) return null;

  const handleStartEdit = (index: number, item: OrderItem) => {
    setEditingItem({index, item: {...item}});
  };

  const handleSaveEdit = () => {
    if (!editingItem) return;
    
    const updatedItems = [...editItemsData];
    updatedItems[editingItem.index] = editingItem.item;
    setEditItemsData(updatedItems);
    setEditingItem(null);
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
  };

  const handleDeleteItem = (index: number) => {
    if (editItemsData.length <= 1) {
      toast.error('Cannot delete the last item from an order');
      return;
    }
    
    const updatedItems = editItemsData.filter((_: OrderItem, i: number) => i !== index);
    setEditItemsData(updatedItems);
    toast.success('Item removed from order');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="w-5 h-5 text-blue-600" />
            Edit Order Items - #{selectedOrder.orderId.slice(-8)}
          </DialogTitle>
          <DialogDescription>
            Edit quantities, prices, or remove items from this order. Changes will be applied immediately.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Customer: {selectedOrder.userDetails?.name || 'N/A'}</p>
                <p className="text-sm text-gray-600">Order Date: {formatOrderDate(selectedOrder.$createdAt)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Total Items</p>
                <p className="font-bold text-lg">{editItemsData.length}</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {editItemsData.map((item, index) => (
              <Card key={index} className="relative">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-16 h-16 rounded-lg object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        if (target.src !== '/assets/placeholder.png') {
                          target.src = '/assets/placeholder.png';
                        }
                      }}
                    />
                    
                    <div className="flex-1">
                      {editingItem?.index === index ? (
                        // Edit Mode
                        <div className="space-y-3">
                          <Input
                            value={editingItem.item.name}
                            onChange={(e) => setEditingItem({
                              ...editingItem,
                              item: {...editingItem.item, name: e.target.value}
                            })}
                            placeholder="Product name"
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-xs text-gray-500 block mb-1">Quantity</label>
                              <Input
                                type="number"
                                value={editingItem.item.quantity}
                                onChange={(e) => setEditingItem({
                                  ...editingItem,
                                  item: {...editingItem.item, quantity: parseInt(e.target.value) || 0}
                                })}
                                min="1"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-500 block mb-1">Unit Price (Rs.)</label>
                              <Input
                                type="number"
                                value={editingItem.item.price}
                                onChange={(e) => setEditingItem({
                                  ...editingItem,
                                  item: {...editingItem.item, price: parseFloat(e.target.value) || 0}
                                })}
                                step="0.01"
                                min="0"
                              />
                            </div>
                          </div>
                          
                          {/* Live Item Total Preview */}
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                <span className="text-sm font-medium text-blue-800">Live Preview</span>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-bold text-blue-900">
                                  {formatPrice((editingItem.item.quantity || 0) * (editingItem.item.price || 0))}
                                </p>
                                <p className="text-xs text-blue-600">
                                  {editingItem.item.quantity || 0} × {formatPrice(editingItem.item.price || 0)}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={handleSaveEdit}>
                              <Save className="w-4 h-4 mr-1" />
                              Save
                            </Button>
                            <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                              <X className="w-4 h-4 mr-1" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        // View Mode
                        <>
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-medium">{item.name}</h3>
                              <p className="text-sm text-gray-500">Product ID: {item.productId}</p>
                              <div className="flex items-center gap-4 mt-1">
                                <span className="text-sm">Qty: <span className="font-medium">{item.quantity}</span></span>
                                <span className="text-sm">Price: <span className="font-medium">{formatPrice(item.price)}</span></span>
                                <span className="text-sm font-medium text-green-600">
                                  Total: {formatPrice(item.quantity * item.price)}
                                </span>
                              </div>
                            </div>
                            
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleStartEdit(index, item)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              {editItemsData.length > 1 && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDeleteItem(index)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Order Summary */}
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-green-800">Updated Order Total</p>
                  <p className="text-sm text-green-600">{editItemsData.length} item(s)</p>
                  
                  {/* Show difference from original */}
                  {(() => {
                    const currentSubtotal = editItemsData.reduce((total, item) => total + (item.quantity * item.price), 0);
                    const originalSubtotal = selectedOrder.items.reduce((total, item) => total + (item.quantity * item.price), 0);
                    const difference = currentSubtotal - originalSubtotal;
                    
                    if (difference !== 0) {
                      return (
                        <div className="flex items-center gap-1 mt-1">
                          {difference > 0 ? (
                            <>
                              <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                              <span className="text-xs text-green-700 font-medium">
                                +{formatPrice(difference)} from original
                              </span>
                            </>
                          ) : (
                            <>
                              <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                              <span className="text-xs text-orange-700 font-medium">
                                -{formatPrice(Math.abs(difference))} from original
                              </span>
                            </>
                          )}
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-800">
                    {formatPrice(editItemsData.reduce((total, item) => total + (item.quantity * item.price), 0))}
                  </p>
                  <p className="text-sm text-green-600">
                    subtotal {selectedOrder.tax || selectedOrder.shippingCost ? '(+ taxes & fees)' : ''}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onSaveAll} className="bg-blue-600 hover:bg-blue-700">
            <Save className="w-4 h-4 mr-2" />
            Save All Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default Orders;