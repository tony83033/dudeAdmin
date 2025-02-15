// /lib/types/OrderTypes.ts
export type OrderItem = {
    productId: string;
    name: string;
    price: number;
    quantity: number;
    imageUrl: string;
  };
  
  export type DeliveryAddress = {
    name: string;
    phone: string;
    address: string;

    pincode: string;
  };
  
  export type OrderStatus = "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
  
  export type PaymentStatus = "paid" | "pending";
  
  export type PaymentMethod = "COD" | "UPI" | "Credit Card" | "Debit Card" | "Net Banking" | "Wallet";
  
  export type Order = {
    $id: string; // UUID
    userId: string;
    items: OrderItem[];
    totalAmount: number;
    status: OrderStatus;
    paymentStatus: PaymentStatus;
    
    deliveryAddress: DeliveryAddress;
    createdAt: string; // ISO timestamp
    updatedAt: string; // ISO timestamp
  };
  