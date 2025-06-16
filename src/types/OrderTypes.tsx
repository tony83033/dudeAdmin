import { Models } from 'appwrite';

// Define types for order items, delivery address, and user details
export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string;
  gst?: number;
}

export interface DeliveryAddress {
  name: string;
  address: string;
  pincode: string;
  phone: string;
  city?: string;
  state?: string;
}

export interface UserDetails {
  name: string;
  email: string;
  phone: string;
  shopName?: string | null;
  address?: string | null;
  pincode?: string | null;
  retailCode?: string | null;
  ratanaCash: number; // Amount of Ratana Cash available
  createdAt: string;
}

// Order extends Models.Document to include Appwrite-specific fields
export interface Order extends Models.Document {
  orderId: string;
  userId: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  userDetails: UserDetails;
  deliveryAddress: DeliveryAddress;
  discount?: number;
  tax?: number;
  shippingCost?: number;
}

// Define statuses for order and payment
export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentStatus = 'paid' | 'pending' | 'failed' | 'refunded';