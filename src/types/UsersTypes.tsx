import { Models } from 'appwrite';

export interface User extends Models.Document {
    userId: string;
    name: string;
    email: string;
    phone: string;
    password: string;
    shopName?: string | null;
    address?: string | null;
    pincode?: string | null;
    retailCode?: string | null;
    createdAt: string;
    updatedAt: string;
} 