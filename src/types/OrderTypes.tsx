// types/OrderTypes.ts
import { Models } from 'appwrite';

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string;
}

export interface DeliveryAddress {
  name: string;
  address: string;
  pincode: string;
  phone: string;
}

export interface UserDetails {
  name: string;
  email: string;
  phone: string;
  shopName?: string | null;
  address?: string | null;
  pincode?: string | null;
  retailCode?: string | null;
  createdAt: string;
}

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
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentStatus = 'paid' | 'pending' | 'failed' | 'refunded';