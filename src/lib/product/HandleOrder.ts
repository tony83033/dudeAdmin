import { databases, appwriteConfig } from '../appwrite';
import { ID,Query } from 'appwrite';
import { OrderItem, DeliveryAddress,OrderStatus,PaymentStatus } from '../../types/OrderTypes';

export const createOrder = async (
  userId: string,
  cartItems: OrderItem[], // List of items from cart
  totalAmount: number,
  deliveryAddress: DeliveryAddress
): Promise<string> => {
  try {
    // Step 1: Create Order in Appwrite Orders Collection
    // const formattedItems = cartItems.map(item => JSON.stringify(item));
    const formattedItems = cartItems.map(item => JSON.stringify(item));
    const orderResponse = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.ordersCollectionId,
      ID.unique(),
      {
        userId: userId,
        // conver the array of objects to array of strings
        items: formattedItems,
        totalAmount: totalAmount,
        status: 'pending',
        paymentStatus: 'pending',
        deliveryAddress: JSON.stringify(deliveryAddress), // Convert object to string before saving
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    );

    // Step 2: Return the newly created order ID
    return orderResponse.$id;
  } catch (error) {
    console.error('Error creating order:', error);
    throw new Error('Failed to create order');
  }
};




// export const fetchOrder = async (orderId: string) => {
//   try {
//     const order = await databases.getDocument(
//       appwriteConfig.databaseId,
//       appwriteConfig.ordersCollectionId,
//       orderId
//     );

//     // Parse the stringified data back to objects
//     return {
//       ...order,
//       items: order.items.map((item: string) => JSON.parse(item)),
//       deliveryAddress: JSON.parse(order.deliveryAddress)
//     };
//   } catch (error) {
//     console.error('Error fetching order:', error);
//     throw new Error('Failed to fetch order');
//   }
// };

// Function to fetch all orders for a specific user
export const fetchUserOrders = async () => {
  try {
    const orders = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.ordersCollectionId,

    );

   // Transform and validate each order according to the Order type
   return orders.documents.map(order => ({
    $id: order.$id,
    userId: order.userId,
    items: order.items.map((item: string): OrderItem => {
      const parsedItem = JSON.parse(item);
      return {
        productId: parsedItem.productId,
        name: parsedItem.name,
        price: parsedItem.price,
        quantity: parsedItem.quantity,
        imageUrl: parsedItem.imageUrl
      };
    }),
    totalAmount: order.totalAmount,
    status: order.status as OrderStatus,
    paymentStatus: order.paymentStatus as PaymentStatus,
    deliveryAddress: JSON.parse(order.deliveryAddress) as DeliveryAddress,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt
  }));
    // todo 
    //  do the data transformation herer according to the order types OrderItem
  } catch (error) {
    console.error('Error fetching user orders:', error);
    throw new Error('Failed to fetch user orders');
  }
};

//  todo create a function to update the order, status, and payment status


export const updateOrderPaymentStatus = async (
    orderId: string,
    newPaymentStatus: PaymentStatus
  ): Promise<void> => {
    try {
      // Step 1: Update the payment status in Appwrite
      await databases.updateDocument(
        appwriteConfig.databaseId,
        appwriteConfig.ordersCollectionId,
        Query.equal("userId", orderId),
        {
          paymentStatus: newPaymentStatus,
          updatedAt: new Date().toISOString(),
        }
      );
  
      console.log(`Payment status for order ${orderId} updated successfully.`);
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
      // Step 1: Update the order status in Appwrite
      await databases.updateDocument(
        appwriteConfig.databaseId,
        appwriteConfig.ordersCollectionId,
        orderId,
        {
          status: newStatus,
          updatedAt: new Date().toISOString(),
        }
      );
  
      console.log(`Order status for order ${orderId} updated successfully.`);
    } catch (error) {
      console.error('Error updating order status:', error);
      throw new Error('Failed to update order status');
    }
  };