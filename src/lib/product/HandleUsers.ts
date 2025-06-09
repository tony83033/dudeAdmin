// src/lib/product/HandleUsers.ts
import { databases, appwriteConfig } from "@/lib/appwrite"
import { User } from "@/types/UsersTypes"
import { ID, Query } from 'appwrite';

export async function fetchUsers(queries: Query[] = []): Promise<User[]> {
    try {
        const response = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.userCollectionId,
        );

        const users = response.documents.map((doc) => ({
            $id: doc.$id,
            $collectionId: doc.$collectionId,
            $databaseId: doc.$databaseId,
            $createdAt: doc.$createdAt,
            $updatedAt: doc.$updatedAt,
            $permissions: doc.$permissions,
            userId: doc.userId,
            email: doc.email,
            name: doc.name,
            phone: doc.phone,
            password: doc.password,
            retailCode: doc.retailCode,
            address: doc.address,
            shopName: doc.shopName,
            pincode: doc.pincode,
            createdAt: doc.$createdAt,
            updatedAt: doc.$updatedAt,
        }));

        return users;
    } catch (error) {
        console.error('Error fetching users:', error);
        return [];
    }
}

export async function updateUserRetailCode(userId: string, newRetailCode: string): Promise<void> {
    try {
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