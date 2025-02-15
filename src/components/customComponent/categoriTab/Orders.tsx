import React, { useState, useEffect } from "react";
import { fetchUserOrders, updateOrderStatus, updateOrderPaymentStatus } from "@/lib/product/HandleOrder";
import { OrderItem, DeliveryAddress, OrderStatus, PaymentStatus, Order } from "@/types/OrderTypes";
import toast, { Toaster } from 'react-hot-toast';

const Orders = () => {
    const [orders, setOrders] = useState<Order[]>([]);

    const getOrders = async () => {
        const fetchedOrders = await fetchUserOrders();
        console.log(fetchedOrders);
        setOrders(fetchedOrders);
    };

    useEffect(() => {
        getOrders();
    }, []);

    const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
        try {
            await updateOrderStatus(orderId, newStatus);
            await getOrders(); // Refresh the orders list
            toast.success(`Order status updated to ${newStatus}`);
        } catch (error) {
            console.error('Error updating order status:', error);
            toast.error('Failed to update order status');
        }
    };

    const handlePaymentStatusChange = async (orderId: string, newPaymentStatus: PaymentStatus) => {
        try {
            await updateOrderPaymentStatus(orderId, newPaymentStatus);
            await getOrders(); // Refresh the orders list
            toast.success(`Payment status updated to ${newPaymentStatus}`);
        } catch (error) {
            console.error('Error updating payment status:', error);
            toast.error('Failed to update payment status');
        }
    };

    return (
        <div className="container mx-auto p-4">
            <Toaster position="top-right" reverseOrder={false} />
            <h1 className="text-2xl font-bold mb-4">Orders</h1>
            <table className="w-full border-collapse">
                <thead>
                    <tr className="bg-gray-200">
                        <th className="p-2 border border-gray-300">Order ID</th>
                        <th className="p-2 border border-gray-300">Total Amount</th>
                        <th className="p-2 border border-gray-300">Status</th>
                        <th className="p-2 border border-gray-300">Payment Status</th>
                        <th className="p-2 border border-gray-300">Created At</th>
                        <th className="p-2 border border-gray-300">Items</th>
                    </tr>
                </thead>
                <tbody>
                    {orders.map((order) => (
                        <tr key={order.$id} className="hover:bg-gray-100">
                            <td className="p-2 border border-gray-300">{order.$id}</td>
                            <td className="p-2 border border-gray-300">{order.totalAmount}</td>
                            <td className="p-2 border border-gray-300">
                                <select
                                    value={order.status}
                                    onChange={(e) => handleStatusChange(order.$id, e.target.value as OrderStatus)}
                                    className="border border-gray-300 p-1 rounded"
                                >
                                    <option value="pending">Pending</option>
                                    <option value="confirmed">Confirmed</option>
                                    <option value="shipped">Shipped</option>
                                    <option value="delivered">Delivered</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                            </td>
                            <td className="p-2 border border-gray-300">
                                <select
                                    value={order.paymentStatus}
                                    onChange={(e) => handlePaymentStatusChange(order.userId, e.target.value as PaymentStatus)}
                                    className="border border-gray-300 p-1 rounded"
                                >
                                    <option value="paid">Paid</option>
                                    <option value="pending">Pending</option>
                                </select>
                            </td>
                            <td className="p-2 border border-gray-300">{new Date(order.createdAt).toLocaleString()}</td>
                            <td className="p-2 border border-gray-300">
                                <ul>
                                    {order.items.map((item, index) => (
                                        <li key={index} className="flex items-center">
                                            <img
                                                src={item.imageUrl}
                                                alt={item.name}
                                                className="w-10 h-10 rounded mr-2"
                                            />
                                            {item.name} - {item.quantity} x {item.price}
                                        </li>
                                    ))}
                                </ul>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default Orders;