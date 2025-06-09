// components/categoriTab/Orders.tsx
import React, { useState, useEffect } from "react";
import { fetchUserOrders, updateOrderStatus, updateOrderPaymentStatus } from "@/lib/product/HandleOrder";
import { OrderItem, DeliveryAddress, OrderStatus, PaymentStatus, Order, UserDetails } from "@/types/OrderTypes";
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
  Users,
  ShoppingBag,
  Copy,
  ExternalLink,
  MessageCircle,
  Edit,
  Building,
  Hash
} from 'lucide-react';
import { format } from 'date-fns';

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    currencyDisplay: 'code'
  }).format(price).replace('INR', 'Rs.');
};

const Orders = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [paymentFilter, setPaymentFilter] = useState<string>("all");
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

    const getOrders = async () => {
        setLoading(true);
        try {
            const fetchedOrders = await fetchUserOrders();
            console.log('📊 Fetched orders with complete customer details:', fetchedOrders);
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

        // Enhanced search filter including shop name and retail code
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
    }, [orders, searchTerm, statusFilter, paymentFilter]);

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

    // Enhanced Customer Info Component with Complete Details
    const CustomerInfoCard = ({ order }: { order: Order }) => (
        <Card className="h-fit">
            <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center">
                    <User className="w-4 h-4 mr-2 text-blue-600" />
                    Customer Details
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Customer Avatar and Basic Info */}
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
                        {/* Show shop name if available */}
                        {order.userDetails?.shopName && (
                            <div className="flex items-center gap-1 mt-1">
                                <Building className="w-3 h-3 text-purple-600" />
                                <p className="text-xs font-medium text-purple-600">{order.userDetails.shopName}</p>
                            </div>
                        )}
                        {/* Show retail code if available */}
                        {order.userDetails?.retailCode && (
                            <Badge variant="outline" className="bg-green-50 text-green-700 text-xs mt-1">
                                Code: {order.userDetails.retailCode}
                            </Badge>
                        )}
                    </div>
                </div>
                
                {/* Contact Information */}
                <div className="space-y-3">
                    {/* Email */}
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
                    
                    {/* Customer Phone */}
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
                    
                    {/* Business Information */}
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
                    
                    {/* Customer Address (if different from delivery) */}
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
                    
                    {/* Customer Since */}
                    <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                        <span>Customer since {format(new Date(order.userDetails?.createdAt || order.createdAt), 'MMM yyyy')}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );

    // Delivery Address Component with Complete Details
    const DeliveryAddressCard = ({ order }: { order: Order }) => (
        <Card className="h-fit">
            <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center">
                    <MapPin className="w-4 h-4 mr-2 text-green-600" />
                    Delivery Address
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {/* Recipient Name */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm">
                        <User className="w-4 h-4 mr-2 text-gray-400" />
                        <span className="font-medium">{order.deliveryAddress.name}</span>
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

                {/* Address */}
                <div className="flex items-start justify-between">
                    <div className="flex items-start text-sm">
                        <Home className="w-4 h-4 mr-2 mt-0.5 text-gray-400 flex-shrink-0" />
                        <div>
                            <p className="font-medium text-gray-900">{order.deliveryAddress.address}</p>
                            <p className="text-gray-600">Pincode: {order.deliveryAddress.pincode}</p>
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

                {/* Delivery Phone */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm">
                        <Phone className="w-4 h-4 mr-2 text-gray-400" />
                        <span>{order.deliveryAddress.phone}</span>
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

                {/* Quick Actions */}
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
                                {format(new Date(order.createdAt), 'MMM dd, yyyy • HH:mm')}
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
                    {/* Customer Info */}
                    <CustomerInfoCard order={order} />
                    
                    {/* Delivery Address */}
                    <DeliveryAddressCard order={order} />
                    
                    {/* Order Summary */}
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

                {/* Customer Type Badge */}
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

                {/* Order Items Preview */}
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
                                            (e.target as HTMLImageElement).src = '/placeholder.jpg';
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

                {/* Status Controls */}
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
                                {/* Customer Information */}
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
                                                    {format(new Date(selectedOrder.userDetails?.createdAt || selectedOrder.createdAt), 'MMM dd, yyyy')}
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

                                {/* Delivery Address */}
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
                                            <p className="font-medium">{selectedOrder.deliveryAddress.name}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">Address</label>
                                            <p className="font-medium">{selectedOrder.deliveryAddress.address}</p>
                                            <p className="text-sm text-gray-600">Pincode: {selectedOrder.deliveryAddress.pincode}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">Delivery Phone</label>
                                            <div className="flex items-center justify-between">
                                                <p className="font-medium">{selectedOrder.deliveryAddress.phone}</p>
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

                            {/* Order Summary */}
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
                                                    (e.target as HTMLImageElement).src = '/placeholder.jpg';
                                                }}
                                            />
                                            <div className="flex-1">
                                                <h3 className="font-medium">{item.name}</h3>
                                                <p className="text-sm text-gray-500">Product ID: {item.productId}</p>
                                                <div className="flex items-center gap-4 mt-2">
                                                    <span className="text-sm">Qty: {item.quantity}</span>
                                                    <span className="text-sm">Price: {formatPrice(item.price)}</span>
                                                    <span className="font-medium">Total: {formatPrice(item.quantity * item.price)}</span>
                                                </div>
                                            </div>
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
                                            {format(new Date(selectedOrder.createdAt), 'MMM dd, yyyy • HH:mm')}
                                        </p>
                                    </div>
                                </div>
                                
                                {selectedOrder.status !== 'pending' && (
                                    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                                        <CheckCircle className="w-5 h-5 text-green-600" />
                                        <div>
                                            <p className="font-medium">Status Updated to {selectedOrder.status}</p>
                                            <p className="text-sm text-gray-500">
                                                {format(new Date(selectedOrder.updatedAt), 'MMM dd, yyyy • HH:mm')}
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
            
            {/* Header */}
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

            {/* Enhanced Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                            <Package className="w-5 h-5 text-blue-600" />
                            <div>
                                <p className="text-2xl font-bold">{orders.length}</p>
                                <p className="text-sm text-gray-600">Total Orders</p>
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
                                    {orders.filter(o => o.status === 'pending').length}
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
                                    {orders.filter(o => o.status === 'delivered').length}
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
                                    {orders.filter(o => o.userDetails?.shopName).length}
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
                                    {formatPrice(orders.reduce((sum, order) => sum + order.totalAmount, 0))}
                                </p>
                                <p className="text-sm text-gray-600">Total Revenue</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Enhanced Filters */}
            <Card>
                <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <Input
                                placeholder="Search orders, customers, shops, codes, addresses..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
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
                                <SelectItem value="refunded">Refunded </SelectItem>                           </SelectContent>
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

            {/* Orders List */}
            <div className="space-y-4">
                {filteredOrders.length === 0 ? (
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
                    filteredOrders.map((order) => (
                        <OrderCard key={order.$id} order={order} />
                    ))
                )}
            </div>

            {/* Order Details Modal */}
            <OrderDetailsModal />
        </div>
    );
};

export default Orders;