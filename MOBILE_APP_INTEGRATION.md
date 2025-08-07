# Mobile App Integration - Retailer Product Filtering

This document explains how to integrate the retailer product filtering system with your mobile application.

## 🚀 **API Endpoints for Mobile App**

### 1. **Get Products for Retailer**

#### Endpoint: `GET /api/products/retailer/{retailerCode}`

**Description:** Fetch products available to a specific retailer

**Example Request:**
```
GET https://yourdomain.com/api/products/retailer/R001
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "$id": "product_id_1",
      "productId": "PROD001",
      "name": "Sample Product",
      "description": "Product description",
      "price": 99.99,
      "mrp": 120.00,
      "discount": 16.67,
      "gst": 18,
      "imageUrl": "https://example.com/image.jpg",
      "stock": 50,
      "unit": "kg",
      "isFeatured": true,
      "categoryId": "cat_123",
      "retailerAvailability": ["R001", "R002"]
    }
  ],
  "count": 1,
  "retailerCode": "R001",
  "message": "Found 1 products available for retailer R001"
}
```

### 2. **Get Products (General)**

#### Endpoint: `GET /api/products`

**Query Parameters:**
- `retailerCode` (optional): Filter for specific retailer
- `includeAll=true` (optional): Get all products (admin use)

**Examples:**
```
GET /api/products?retailerCode=R001
GET /api/products?includeAll=true
GET /api/products (uses authenticated user's retailer code)
```

### 3. **Check Product Availability**

#### Endpoint: `POST /api/products/check-availability`

**Description:** Check if specific products are available to a retailer

**Request Body:**
```json
{
  "retailerCode": "R001",
  "productIds": ["product_id_1", "product_id_2", "product_id_3"]
}
```

**Response:**
```json
{
  "success": true,
  "retailerCode": "R001",
  "results": [
    {
      "productId": "product_id_1",
      "available": true,
      "reason": "Available to this retailer"
    },
    {
      "productId": "product_id_2",
      "available": false,
      "reason": "Not available to this retailer"
    }
  ],
  "summary": {
    "total": 2,
    "available": 1,
    "unavailable": 1
  }
}
```

### 4. **Get Current User's Retailer Info**

#### Endpoint: `GET /api/user/retailer-info`

**Headers:** Requires authentication session

**Response:**
```json
{
  "success": true,
  "data": {
    "$id": "user_doc_id",
    "userId": "auth_user_id",
    "email": "retailer@example.com",
    "name": "John Doe",
    "phone": "+1234567890",
    "retailCode": "R001",
    "address": "123 Main St",
    "shopName": "John's Store",
    "pincode": "12345",
    "profileUrl": "https://example.com/profile.jpg"
  }
}
```

## 📱 **Mobile App Implementation Examples**

### **React Native Example**

```javascript
// services/ProductService.js
const API_BASE_URL = 'https://yourdomain.com/api';

class ProductService {
  // Get products for current user's retailer
  static async getProductsForCurrentUser() {
    try {
      const response = await fetch(`${API_BASE_URL}/products`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Include your authentication headers here
          'Authorization': `Bearer ${authToken}`,
        },
      });
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  }

  // Get products for specific retailer
  static async getProductsForRetailer(retailerCode) {
    try {
      const response = await fetch(`${API_BASE_URL}/products/retailer/${retailerCode}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching retailer products:', error);
      throw error;
    }
  }

  // Get current user's retailer info
  static async getCurrentUserInfo() {
    try {
      const response = await fetch(`${API_BASE_URL}/user/retailer-info`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching user info:', error);
      throw error;
    }
  }
}

export default ProductService;
```

### **React Native Component Example**

```javascript
// components/ProductList.js
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Image, StyleSheet } from 'react-native';
import ProductService from '../services/ProductService';

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      
      // Get user info first
      const userResponse = await ProductService.getCurrentUserInfo();
      if (userResponse.success) {
        setUserInfo(userResponse.data);
      }
      
      // Get filtered products
      const productsResponse = await ProductService.getProductsForCurrentUser();
      if (productsResponse.success) {
        setProducts(productsResponse.data);
      }
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderProduct = ({ item }) => (
    <View style={styles.productCard}>
      <Image source={{ uri: item.imageUrl }} style={styles.productImage} />
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productCode}>{item.productId}</Text>
        <Text style={styles.productPrice}>₹{item.price.toFixed(2)}</Text>
        <Text style={styles.productStock}>Stock: {item.stock}</Text>
      </View>
    </View>
  );

  if (loading) {
    return <Text>Loading products...</Text>;
  }

  return (
    <View style={styles.container}>
      {userInfo && (
        <Text style={styles.header}>
          Products for {userInfo.shopName} ({userInfo.retailCode})
        </Text>
      )}
      <FlatList
        data={products}
        renderItem={renderProduct}
        keyExtractor={(item) => item.$id}
        numColumns={2}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  productCard: {
    flex: 1,
    margin: 8,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    elevation: 2,
  },
  productImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    marginBottom: 8,
  },
  productInfo: {
    alignItems: 'center',
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  productCode: {
    fontSize: 12,
    color: 'gray',
    marginTop: 4,
  },
  productPrice: {
    fontSize: 16,
    color: 'green',
    fontWeight: 'bold',
    marginTop: 4,
  },
  productStock: {
    fontSize: 12,
    color: 'gray',
    marginTop: 4,
  },
});

export default ProductList;
```

### **Flutter Example**

```dart
// services/product_service.dart
import 'dart:convert';
import 'package:http/http.dart' as http;

class ProductService {
  static const String baseUrl = 'https://yourdomain.com/api';
  
  static Future<Map<String, dynamic>> getProductsForRetailer(String retailerCode) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/products/retailer/$retailerCode'),
        headers: {'Content-Type': 'application/json'},
      );
      
      if (response.statusCode == 200) {
        return json.decode(response.body);
      } else {
        throw Exception('Failed to load products');
      }
    } catch (e) {
      print('Error fetching products: $e');
      rethrow;
    }
  }
  
  static Future<Map<String, dynamic>> getCurrentUserInfo(String authToken) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/user/retailer-info'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $authToken',
        },
      );
      
      if (response.statusCode == 200) {
        return json.decode(response.body);
      } else {
        throw Exception('Failed to load user info');
      }
    } catch (e) {
      print('Error fetching user info: $e');
      rethrow;
    }
  }
}
```

## 🔐 **Authentication Integration**

### **For Mobile Apps Using Session-Based Auth:**

1. **Login Flow:**
   ```javascript
   // After successful login
   const loginResponse = await fetch('/api/auth/login', {
     method: 'POST',
     body: JSON.stringify({ email, password }),
   });
   
   // Store session cookie or token
   // Then use authenticated endpoints
   ```

2. **Include Auth Headers:**
   ```javascript
   const headers = {
     'Content-Type': 'application/json',
     'Cookie': sessionCookie, // or
     'Authorization': `Bearer ${authToken}`,
   };
   ```

## 🎯 **Implementation Steps for Mobile App**

1. **Update Mobile App Authentication:**
   - Ensure your mobile app can authenticate users
   - Store retailer code locally or fetch from user profile

2. **Replace Product API Calls:**
   - Replace any existing product fetching with the new filtered endpoints
   - Use `/api/products/retailer/{retailerCode}` for specific retailer filtering

3. **Update Product Display Logic:**
   - Show retailer-specific products only
   - Display appropriate messages when no products are available

4. **Add Error Handling:**
   - Handle cases where retailer code is missing
   - Provide fallback for network errors

5. **Test Different Scenarios:**
   - Test with different retailer codes
   - Test with products that have no retailer restrictions
   - Test with products that have specific retailer restrictions

## ⚡ **Key Benefits for Mobile App**

- **Automatic Filtering:** Products are filtered server-side, reducing mobile app complexity
- **Performance:** Only relevant products are sent to mobile app
- **Security:** Retailer restrictions are enforced at the API level
- **Scalability:** Easy to add new retailers and products without mobile app updates
- **Consistency:** Same filtering logic used across web admin and mobile app

## 🛠️ **Testing the API**

You can test the API endpoints using tools like Postman or curl:

```bash
# Test getting products for retailer R001
curl -X GET "https://yourdomain.com/api/products/retailer/R001"

# Test checking availability
curl -X POST "https://yourdomain.com/api/products/check-availability" \
  -H "Content-Type: application/json" \
  -d '{"retailerCode": "R001", "productIds": ["product_id_1", "product_id_2"]}'
```

The retailer product filtering system is now ready for mobile app integration! 🚀