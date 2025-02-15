export interface User {
    userId: string; // Unique user ID from Appwrite Auth
    email: string; // User's email
    name: string; // Full name
    phone: string; // Phone number
    retailCode: string; // Retailer-specific code
    address: string; // User's address
    shopName: string; // Name of the shop
    password: string; // Unique password (required for validation)
    profileUrl?: string; // Optional profile image URL
    pincode: string; // Pincode
    createdAt: string; // Timestamp when the user was created
    updatedAt: string; // Timestamp when the user was last updated
  }
  