import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
  Image,
} from '@react-pdf/renderer';
import { Order } from '@/types/OrderTypes';

const QR_CODE_PATH = '/assets/ratana.jpg';

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 20,
    fontFamily: 'Helvetica',
    fontSize: 10,
  },
  // Header Section
  header: {
    marginBottom: 30,
    alignItems: 'center',
  },
  qrTop: {
    width: 80,
    height: 80,
    marginBottom: 10,
  },
  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 5,
  },
  companyDetails: {
    fontSize: 9,
    color: '#666',
    textAlign: 'center',
    marginBottom: 2,
  },
  saleOrderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
    color: '#000',
  },
  orderInfoSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  orderFrom: {
    width: '60%',
  },
  orderDetails: {
    width: '35%',
    alignItems: 'flex-end',
  },
  sectionLabel: {
    fontSize: 10,
    color: '#666',
    marginBottom: 5,
  },
  customerInfo: {
    fontSize: 10,
    color: '#000',
    marginBottom: 2,
  },
  customerName: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 3,
  },
  orderNumber: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'right',
  },
  orderDate: {
    fontSize: 10,
    color: '#666',
    textAlign: 'right',
    marginTop: 2,
  },
  itemsContainer: {
    marginBottom: 20,
  },
  itemCard: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12, // Reduced for compactness
    marginBottom: 10,
    backgroundColor: '#fafafa',
  },
  itemName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 10,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  itemLabel: {
    fontSize: 10,
    color: '#666',
    width: '25%',
  },
  itemValue: {
    fontSize: 10,
    color: '#000',
    width: '20%',
    textAlign: 'center',
  },
  itemAmount: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#000',
    width: '20%',
    textAlign: 'right',
  },
  pricingCard: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12, // Reduced for compactness
    marginBottom: 20,
    backgroundColor: '#fafafa',
  },
  pricingTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 15,
  },
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  pricingLabel: {
    fontSize: 10,
    color: '#666',
  },
  pricingValue: {
    fontSize: 10,
    color: '#000',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingTop: 5,
  },
  totalLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  totalValue: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  transactionBalance: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  balanceLabel: {
    fontSize: 10,
    color: '#666',
  },
  balanceValue: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#000',
  },
  bankSection: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  qrCode: {
    width: 80,
    height: 80,
    marginRight: 15,
  },
  bankDetails: {
    flex: 1,
  },
  bankTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 5,
  },
  bankInfo: {
    fontSize: 9,
    color: '#666',
    marginBottom: 2,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 10,
  },
  termsTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 5,
  },
  termsText: {
    fontSize: 9,
    color: '#666',
  },
});

const formatPrice = (price: number) => `₹ ${price.toFixed(2)}`;
const formatDate = (dateString?: string) => {
  if (!dateString) return 'Date not available';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      console.warn('Invalid date string in invoice:', dateString);
      return 'Invalid date';
    }
    return date.toLocaleDateString('en-GB');
  } catch (error) {
    console.error('Error formatting date in invoice:', error, 'dateString:', dateString);
    return 'Invalid date';
  }
};

interface InvoiceDocumentProps {
  order: Order;
}

const InvoiceDocument: React.FC<InvoiceDocumentProps> = ({ order }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header with QR at top */}
      <View style={styles.header}>
        <Image style={styles.qrTop} src={QR_CODE_PATH} />
        <Text style={styles.companyName}>Ratana ADMIN</Text>
        
        <Text style={styles.companyDetails}>9116045123</Text>
        <Text style={styles.companyDetails}>SANGANER SHYAM VIHAR 43 Diggi Malpura Road</Text>
        <Text style={styles.companyDetails}>Jaipur</Text>
      </View>

      {/* Sale Order Title */}
      <Text style={styles.saleOrderTitle}>Sale Order</Text>

      {/* Order Info Section */}
      <View style={styles.orderInfoSection}>
        <View style={styles.orderFrom}>
          <Text style={styles.sectionLabel}>Order from:</Text>
          <Text style={styles.customerName}>
            {order.userDetails?.shopName || order.userDetails?.name || 'N/A'}
          </Text>
          <Text style={styles.customerInfo}>{order.userDetails?.email || 'N/A'}</Text>
          <Text style={styles.customerInfo}>{order.userDetails?.phone || 'N/A'}</Text>
          <Text style={styles.customerInfo}>{order.deliveryAddress?.address || 'N/A'}</Text>
          <Text style={styles.customerInfo}>{order.deliveryAddress?.city || ''}</Text>
          <Text style={styles.customerInfo}>PIN: {order.deliveryAddress?.pincode || 'N/A'}</Text>
          {order.deliveryAddress?.state && (
            <Text style={styles.customerInfo}>{order.deliveryAddress.state}</Text>
          )}
        </View>
        <View style={styles.orderDetails}>
          <Text style={styles.sectionLabel}>Order No.</Text>
          <Text style={styles.orderNumber}>{order.orderId?.slice(-2) || 'N/A'}</Text>
          <Text style={styles.orderDate}>
            Date: {formatDate(order.$createdAt)}
          </Text>
          <Text style={styles.orderDate}>
            Due Date: {formatDate(order.$createdAt)}
          </Text>
        </View>
      </View>

      {/* Items */}
      <View style={styles.itemsContainer}>
        {order.items?.map((item, index) => {
          const basePrice = item.price || 0;
          const finalUnitPrice = basePrice; // No GST added
          return (
            <View style={styles.itemCard} key={index}>
              <Text style={styles.itemName}>{(item.name || 'Untitled Item').toUpperCase()}</Text>
              <View style={styles.itemRow}>
                <Text style={styles.itemLabel}>Quantity</Text>
                <Text style={styles.itemLabel}>Price/Unit</Text>
                <Text style={styles.itemLabel}>Amount</Text>
              </View>
              <View style={styles.itemRow}>
                <Text style={styles.itemValue}>{item.quantity || 0} Pac</Text>
                <Text style={styles.itemValue}>{formatPrice(basePrice)}</Text>
                <Text style={styles.itemAmount}>
                  {formatPrice((item.quantity || 0) * finalUnitPrice)}
                </Text>
              </View>
            </View>
          );
        }) || <Text>No items available</Text>}
      </View>

      {/* Pricing Breakdown */}
      <View style={styles.pricingCard}>
        <Text style={styles.pricingTitle}>Pricing / Breakup</Text>
        <View style={styles.pricingRow}>
          <Text style={styles.pricingLabel}>Sub Total</Text>
          <Text style={styles.pricingValue}>
            {formatPrice(
              order.items?.reduce((sum, item) => sum + (item.quantity || 0) * (item.price || 0), 0) || 0
            )}
          </Text>
        </View>

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total Amount</Text>
          <Text style={styles.totalValue}>{formatPrice(order.totalAmount || 0)}</Text>
        </View>
        <View style={styles.pricingRow}>
          <Text style={styles.pricingLabel}>Advance</Text>
          <Text style={styles.pricingValue}>₹ 0</Text>
        </View>
        <View style={styles.transactionBalance}>
          <Text style={styles.balanceLabel}>Transaction Balance</Text>
          <Text style={styles.balanceValue}>{formatPrice(order.totalAmount || 0)}</Text>
        </View>
      </View>

      {/* Bank Details */}
      <View style={styles.bankSection}>
        <Image style={styles.qrCode} src={QR_CODE_PATH} />
        <View style={styles.bankDetails}>
          <Text style={styles.bankTitle}>Bank Details</Text>
          <Text style={styles.bankInfo}>Hdfc Bank, Sanganer Bazar Jaipur</Text>
          <Text style={styles.bankInfo}>Padmavati Marketing</Text>
          <Text style={styles.bankInfo}>Account No: 50200096367063</Text>
          <Text style={styles.bankInfo}>IFSC Code: HDFC0006356</Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.termsTitle}>Terms & Conditions :</Text>
        <Text style={styles.termsText}>Thank you for doing business with us.</Text>
      </View>
    </Page>
  </Document>
);

export const generateInvoicePDF = async (order: Order) => {
  try {
    const blob = await pdf(<InvoiceDocument order={order} />).toBlob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sale-order-${order.orderId?.slice(-8) || 'unknown'}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error: any) {
    console.error('Error generating PDF:', error?.message || 'Unknown error');
    throw new Error('Failed to generate invoice PDF. Please try again.');
  }
};

export default InvoiceDocument;