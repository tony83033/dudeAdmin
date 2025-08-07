import { databases, appwriteConfig } from '../appwrite';
import { ID, Query } from 'appwrite';
import { OrderItem, DeliveryAddress, OrderStatus, PaymentStatus, UserDetails, Order } from '../../types/OrderTypes';

export const fetchUserDetails = async (userId: string): Promise<UserDetails | null> => {
  try {
    const userResponse = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      [Query.equal('userId', userId)]
    );

    if (userResponse.documents.length > 0) {
      const user = userResponse.documents[0];
      return {
        name: user.name || 'N/A',
        email: user.email || 'N/A',
        phone: user.phone || 'N/A',
        shopName: user.shopName ?? null,
        address: user.address ?? null,
        pincode: user.pincode ?? null,
        retailCode: user.retailCode ?? null,
        ratanaCash: user.ratanaCash || 0,
        createdAt: user.createdAt || user.$createdAt
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching user details:', error);
    return null;
  }
};

export const fetchUserOrders = async (): Promise<Order[]> => {
  try {
    const orders = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.ordersCollectionId,
      [Query.orderDesc('$createdAt'), Query.limit(100)]
    );

    return await Promise.all(
      orders.documents.map(async (order) => {
        // Parse items safely
        const parsedItems: OrderItem[] = safeParseItems(order.items);

        // Parse delivery address safely
        const parsedDeliveryAddress = safeParseDeliveryAddress(order.deliveryAddress);

        // Fetch user details from users collection using userId
        let userDetails: UserDetails = {
          name: 'N/A',
          email: 'N/A',
          phone: 'N/A',
          shopName: null,
          address: null,
          pincode: null,
          retailCode: null,
          ratanaCash: 0,
          createdAt: order.$createdAt || '',
        };

        const fetchedUserDetails = await fetchUserDetails(order.userId);
        if (fetchedUserDetails) {
          userDetails = fetchedUserDetails;
        }

        return {
          $id: order.$id,
          $collectionId: order.$collectionId,
          $databaseId: order.$databaseId,
          $createdAt: order.$createdAt,
          $updatedAt: order.$updatedAt,
          $permissions: order.$permissions || [],
          orderId: order.$id,
          userId: order.userId || '',
          items: parsedItems,
          totalAmount: order.totalAmount || 0,
          status: order.status as OrderStatus,
          paymentStatus: order.paymentStatus as PaymentStatus,
          userDetails,
          deliveryAddress: parsedDeliveryAddress,
          discount: order.discount || 0,
          tax: order.tax || 0,
          shippingCost: order.shippingCost || 0,
        };
      })
    );
  } catch (error) {
    console.error('Error fetching user orders:', error);
    throw new Error('Failed to fetch user orders');
  }
};

export const createOrder = async (
  userId: string,
  cartItems: OrderItem[],
  totalAmount: number,
  deliveryAddress: DeliveryAddress,
  userDetails: UserDetails,
  discount: number = 0,
  tax: number = 0,
  shippingCost: number = 0
): Promise<string> => {
  try {
    const formattedItems = cartItems.map(item => JSON.stringify(item));
    const orderResponse = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.ordersCollectionId,
      ID.unique(),
      {
        userId,
        items: formattedItems,
        totalAmount,
        status: 'pending',
        paymentStatus: 'pending',
        deliveryAddress: JSON.stringify(deliveryAddress),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    );

    return orderResponse.$id;
  } catch (error) {
    console.error('Error creating order:', error);
    throw new Error('Failed to create order');
  }
};

export const updateOrderPaymentStatus = async (
  orderId: string,
  newPaymentStatus: PaymentStatus
): Promise<void> => {
  try {
    await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.ordersCollectionId,
      orderId,
      {
        paymentStatus: newPaymentStatus,
        updatedAt: new Date().toISOString(),
      }
    );
  } catch (error) {
    console.error('Error updating payment status:', error);
    throw new Error('Failed to update payment status');
  }
};

export const updateOrderStatus = async (
  orderId: string,
  newStatus: OrderStatus
): Promise<void> => {
  try {
    await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.ordersCollectionId,
      orderId,
      {
        status: newStatus,
        updatedAt: new Date().toISOString(),
      }
    );
  } catch (error) {
    console.error('Error updating order status:', error);
    throw new Error('Failed to update order status');
  }
};

export const updateOrderItems = async (
  orderId: string,
  updatedItems: OrderItem[],
  newTotalAmount: number
): Promise<void> => {
  try {
    // Format items as JSON strings (same as in createOrder)
    const formattedItems = updatedItems.map(item => JSON.stringify(item));
    
    await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.ordersCollectionId,
      orderId,
      {
        items: formattedItems,
        totalAmount: newTotalAmount,
        updatedAt: new Date().toISOString(),
      }
    );
    
    console.log('✅ Order items updated successfully in database');
  } catch (error) {
    console.error('❌ Error updating order items:', error);
    throw new Error('Failed to update order items in database');
  }
};

export const createOrderForUser = async (
  userId: string,
  userDetails: UserDetails,
  deliveryAddress: DeliveryAddress,
  cartItems: OrderItem[],
  discount: number = 0,
  tax: number = 0,
  shippingCost: number = 0,
  createdByAdmin: string
): Promise<string> => {
  try {
    console.log('Creating order for user:', userDetails.email);
    console.log('Order details:', {
      userId,
      itemsCount: cartItems.length,
      totalItems: cartItems.reduce((sum, item) => sum + item.quantity, 0),
      deliveryAddress: deliveryAddress.address,
      createdByAdmin
    });

    // Calculate total amount
    const itemsTotal = cartItems.reduce((total, item) => total + (item.quantity * item.price), 0);
    const totalAmount = itemsTotal + tax + shippingCost - discount;

    console.log('Order calculations:', {
      itemsTotal,
      tax,
      shippingCost,
      discount,
      totalAmount
    });

    const formattedItems = cartItems.map(item => JSON.stringify(item));
    
    // Prepare order data with only existing schema fields
    const orderData = {
      userId,
      items: formattedItems,
      totalAmount,
      status: 'pending',
      paymentStatus: 'pending',
      deliveryAddress: JSON.stringify(deliveryAddress),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    console.log('Creating order document with data:', orderData);

    const orderResponse = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.ordersCollectionId,
      ID.unique(),
      orderData
    );

    console.log('✅ Order created successfully for user:', userDetails.email);
    console.log('✅ Order ID:', orderResponse.$id);
    return orderResponse.$id;
  } catch (error: any) {
    console.error('❌ Error creating order for user:', error);
    console.error('❌ Error details:', {
      message: error.message,
      code: error.code,
      type: error.type,
      userId,
      userName: userDetails.name
    });
    throw new Error(`Failed to create order for user: ${error.message || 'Unknown error'}`);
  }
};

export const fetchOrderById = async (orderId: string): Promise<Order | null> => {
  try {
    const order = await databases.getDocument(
      appwriteConfig.databaseId,
      appwriteConfig.ordersCollectionId,
      orderId
    );

    const parsedItems = safeParseItems(order.items);
    const parsedDeliveryAddress = safeParseDeliveryAddress(order.deliveryAddress);

    return {
      $id: order.$id,
      $collectionId: order.$collectionId,
      $databaseId: order.$databaseId,
      $createdAt: order.$createdAt,
      $updatedAt: order.$updatedAt,
      $permissions: order.$permissions || [],
      orderId: order.$id,
      userId: order.userId || '',
      items: parsedItems,
      totalAmount: order.totalAmount || 0,
      status: order.status as OrderStatus,
      paymentStatus: order.paymentStatus as PaymentStatus,
      userDetails: order.userDetails,
      deliveryAddress: parsedDeliveryAddress,
      discount: order.discount || 0,
      tax: order.tax || 0,
      shippingCost: order.shippingCost || 0,
    };
  } catch (error) {
    console.error('Error fetching order:', error);
    return null;
  }
};

export const getOrderStats = async () => {
  try {
    const orders = await fetchUserOrders();
    
    const stats = {
      total: orders.length,
      pending: orders.filter(o => o.status === 'pending').length,
      confirmed: orders.filter(o => o.status === 'confirmed').length,
      shipped: orders.filter(o => o.status === 'shipped').length,
      delivered: orders.filter(o => o.status === 'delivered').length,
      cancelled: orders.filter(o => o.status === 'cancelled').length,
      businessOrders: orders.filter(o => o.userDetails?.shopName).length,
      totalRevenue: orders.reduce((sum, order) => sum + order.totalAmount, 0),
      averageOrderValue: orders.length > 0 ? orders.reduce((sum, order) => sum + order.totalAmount, 0) / orders.length : 0
    };

    return stats;
  } catch (error) {
    console.error('Error getting order stats:', error);
    throw new Error('Failed to get order statistics');
  }
};

// Helper Functions
const safeParseItems = (items: any): OrderItem[] => {
  try {
    return items.map((item: string) => JSON.parse(item));
  } catch {
    return [{
      productId: '',
      name: 'Unknown Product',
      price: 0,
      quantity: 1,
      imageUrl: '/assets/placeholder.png'
    }];
  }
};

const safeParseDeliveryAddress = (address: any): DeliveryAddress => {
  try {
    return JSON.parse(address);
  } catch {
    return {
      name: 'N/A',
      address: 'N/A',
      pincode: 'N/A',
      phone: 'N/A'
    };
  }
};