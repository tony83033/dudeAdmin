// lib/product/HandleOrder.ts
import { databases, appwriteConfig } from '../appwrite';
import { ID, Query } from 'appwrite';
import { OrderItem, DeliveryAddress, OrderStatus, PaymentStatus, UserDetails } from '../../types/OrderTypes';

// Function to fetch complete user details from users collection
export const fetchUserDetails = async (userId: string) => {
  try {
    console.log(`👤 Fetching user details for userId: ${userId}`);
    
    const userResponse = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      [Query.equal('userId', userId)]
    );

    if (userResponse.documents.length > 0) {
      const user = userResponse.documents[0];
      console.log('✅ Found user details:', user);
      return {
        name: user.name || 'N/A',
        email: user.email || 'N/A',
        phone: user.phone || 'N/A',
        shopName: user.shopName || null,
        address: user.address || null,
        pincode: user.pincode || null,
        retailCode: user.retailCode || null,
        createdAt: user.createdAt || user.$createdAt
      };
    } else {
      console.log('❌ No user found for userId:', userId);
      return null;
    }
  } catch (error) {
    console.error('❌ Error fetching user details:', error);
    return null;
  }
};

export const fetchUserOrders = async () => {
  try {
    console.log('🔄 Fetching all orders from database...');
    
    const orders = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.ordersCollectionId,
      [
        Query.orderDesc('$createdAt'),
        Query.limit(100)
      ]
    );

    console.log(`📦 Found ${orders.documents.length} orders`);

    // Enhanced order processing with user lookup
    const enhancedOrders = await Promise.all(
      orders.documents.map(async (order, index) => {
        try {
          console.log(`🔍 Processing order ${index + 1}: ${order.$id}`);

          // Parse items safely
          let parsedItems: OrderItem[] = [];
          if (order.items && Array.isArray(order.items)) {
            parsedItems = order.items.map((item: string): OrderItem => {
              try {
                const parsedItem = JSON.parse(item);
                return {
                  productId: parsedItem.productId || '',
                  name: parsedItem.name || 'Unknown Product',
                  price: parsedItem.price || 0,
                  quantity: parsedItem.quantity || 1,
                  imageUrl: parsedItem.imageUrl || '/placeholder.jpg'
                };
              } catch (parseError) {
                console.error('Error parsing item:', parseError);
                return {
                  productId: '',
                  name: 'Unknown Product',
                  price: 0,
                  quantity: 1,
                  imageUrl: '/placeholder.jpg'
                };
              }
            });
          }

          // Parse delivery address safely
          let parsedDeliveryAddress: DeliveryAddress = {
            name: 'N/A',
            address: 'N/A',
            pincode: 'N/A',
            phone: 'N/A'
          };

          if (order.deliveryAddress) {
            try {
              parsedDeliveryAddress = JSON.parse(order.deliveryAddress);
            } catch (parseError) {
              console.error('❌ Error parsing delivery address:', parseError);
            }
          }

          // First try to get user details from order fields
          let userDetails: UserDetails = {
            name: order.userName || 'N/A',
            email: order.userEmail || 'N/A',
            phone: order.userPhone || 'N/A',
            shopName: null,
            address: null,
            pincode: null,
            retailCode: null,
            createdAt: order.createdAt || order.$createdAt
          };

          // If user details are missing or incomplete, fetch from users collection
          if ((userDetails.name === 'N/A' || userDetails.email === 'N/A') && order.userId) {
            console.log(`🔍 User details incomplete, fetching from users collection...`);
            const fetchedUserDetails = await fetchUserDetails(order.userId);
            if (fetchedUserDetails) {
              userDetails = {
                ...userDetails,
                ...fetchedUserDetails
              };
              console.log('✅ Enhanced user details:', userDetails);
            }
          }

          const processedOrder = {
            $id: order.$id,
            $collectionId: order.$collectionId,
            $databaseId: order.$databaseId,
            $createdAt: order.$createdAt,
            $updatedAt: order.$updatedAt,
            $permissions: order.$permissions,
            orderId: order.orderId || order.$id,
            userId: order.userId || '',
            items: parsedItems,
            totalAmount: order.totalAmount || 0,
            status: order.status as OrderStatus || 'pending',
            paymentStatus: order.paymentStatus as PaymentStatus || 'pending',
            userDetails: userDetails,
            deliveryAddress: parsedDeliveryAddress,
            discount: order.discount || 0,
            tax: order.tax || 0,
            shippingCost: order.shippingCost || 0,
            createdAt: order.createdAt || order.$createdAt,
            updatedAt: order.updatedAt || order.$updatedAt
          };

          return processedOrder;

        } catch (error) {
          console.error('❌ Error processing order:', error);
          return null;
        }
      })
    );

    return enhancedOrders.filter(order => order !== null);
  } catch (error) {
    console.error('❌ Error fetching user orders:', error);
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
    console.log('📝 Creating order with user details:', userDetails);
    
    const formattedItems = cartItems.map(item => JSON.stringify(item));
    const orderId = ID.unique();
    const orderResponse = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.ordersCollectionId,
      orderId,
      {
        orderId: orderId,
        userId: userId,
        items: formattedItems,
        totalAmount: totalAmount,
        status: 'pending',
        paymentStatus: 'pending',
        deliveryAddress: JSON.stringify(deliveryAddress),
        userName: userDetails.name,
        userEmail: userDetails.email,
        userPhone: userDetails.phone,
        discount: discount,
        tax: tax,
        shippingCost: shippingCost,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    );

    return orderResponse.$id;
  } catch (error) {
    console.error('❌ Error creating order:', error);
    throw new Error('Failed to create order');
  }
};

export const updateOrderPaymentStatus = async (
  orderId: string,
  newPaymentStatus: PaymentStatus
): Promise<void> => {
  try {
    console.log(`🔄 Updating payment status for order ${orderId} to ${newPaymentStatus}`);
    
    await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.ordersCollectionId,
      orderId,
      {
        paymentStatus: newPaymentStatus,
        updatedAt: new Date().toISOString(),
      }
    );

    console.log(`✅ Payment status for order ${orderId} updated successfully.`);
  } catch (error) {
    console.error('❌ Error updating payment status:', error);
    throw new Error('Failed to update payment status');
  }
};

export const updateOrderStatus = async (
  orderId: string,
  newStatus: OrderStatus
): Promise<void> => {
  try {
    console.log(`🔄 Updating order status for order ${orderId} to ${newStatus}`);
    
    await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.ordersCollectionId,
      orderId,
      {
        status: newStatus,
        updatedAt: new Date().toISOString(),
      }
    );

    console.log(`✅ Order status for order ${orderId} updated successfully.`);
  } catch (error) {
    console.error('❌ Error updating order status:', error);
    throw new Error('Failed to update order status');
  }
};

// Additional helper functions
export const fetchOrderById = async (orderId: string) => {
  try {
    const order = await databases.getDocument(
      appwriteConfig.databaseId,
      appwriteConfig.ordersCollectionId,
      orderId
    );

    return {
      ...order,
      items: order.items.map((item: string) => JSON.parse(item)),
      deliveryAddress: JSON.parse(order.deliveryAddress)
    };
  } catch (error) {
    console.error('Error fetching order:', error);
    throw new Error('Failed to fetch order');
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