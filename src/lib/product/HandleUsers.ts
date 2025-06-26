// src/lib/product/HandleProdceOfTheDay
import {databases,appwriteConfig} from "@/lib/appwrite"

import {User} from "../../types/UsersTypes"
import { ID ,Query} from 'appwrite'; 
export async function fetchUsers(): Promise<User[]> {
    try {
        const response = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.userCollectionId,
            [Query.limit(1000), Query.orderDesc('$createdAt')]
        );

        const users = response.documents.map((doc) => ({
            userId: doc.userId,// Unique user ID from Appwrite Auth
            email: doc.email,
            name: doc.name,
            phone: doc.phone,
            retailCode: doc.retailCode,
            address: doc.address,
            shopName: doc.shopName,
            password: doc.password,
            profileUrl: doc.profileUrl,
            pincode: doc.pincode,
            createdAt: doc.$createdAt,
            updatedAt: doc.updatedAt,
            $id: doc.$id, // Add document ID for updates

        }));

        return users;
    } catch (error) {
        console.error('Error fetching users:', error);
        return [];
    }
}

export async function updateUserRetailCode(userId: string, newRetailCode: string): Promise<void> {
    try {
        // Step 1: Update the retail code in Appwrite
        await databases.updateDocument(
            appwriteConfig.databaseId,
            appwriteConfig.userCollectionId,
            userId,
            {
                retailCode: newRetailCode,
                updatedAt: new Date().toISOString(),
            }
        );

        console.log(`Retail code for user ${userId} updated successfully.`);
    } catch (error) {
        console.error('Error updating retail code:', error);
        throw new Error('Failed to update retail code');
    }
}