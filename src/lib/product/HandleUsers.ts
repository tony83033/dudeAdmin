// src/lib/product/HandleUsers.ts
import { databases, appwriteConfig, account } from '../appwrite';
import { ID, Query } from 'appwrite';
import { User } from '../../types/UsersTypes';

export async function fetchUsers(): Promise<User[]> {
    try {
        const response = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.userCollectionId,
            [Query.limit(100), Query.orderDesc('$createdAt')]
        );

        const users = response.documents.map((doc) => ({
            $id: doc.$id,
            userId: doc.userId,
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

export async function createUser(userData: {
    name: string;
    email?: string;
    phone: string;
    address: string;
    pincode: string;
    shopName?: string;
    retailCode?: string;
    password?: string; // Optional password parameter
}): Promise<User> {
    try {
        console.log('Creating new user:', userData.email || 'No email provided');

        // Generate unique user ID
        const userId = ID.unique();
        const currentTime = new Date().toISOString();

        // Check if user already exists by phone number
        const existingUsers = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.userCollectionId,
            [Query.equal('phone', userData.phone)]
        );

        if (existingUsers.documents.length > 0) {
            throw new Error(`Phone number '${userData.phone}' already exists. Please use a different phone number.`);
        }

        // Check if email already exists (if provided)
        if (userData.email) {
            const existingEmailUsers = await databases.listDocuments(
                appwriteConfig.databaseId,
                appwriteConfig.userCollectionId,
                [Query.equal('email', userData.email)]
            );

            if (existingEmailUsers.documents.length > 0) {
                throw new Error(`Email '${userData.email}' already exists. Please use a different email.`);
            }
        }

        let authUserId = userId;
        let authEmail = userData.email || '';

        // Create Appwrite Auth account if email is provided
        if (userData.email) {
            try {
                // Use provided password or default to "12345678"
                const defaultPassword = userData.password || "12345678";
                
                console.log('Creating Appwrite Auth account...');
                const authAccount = await account.create(
                    userId,
                    userData.email,
                    defaultPassword,
                    userData.name
                );
                
                authUserId = authAccount.$id;
                authEmail = authAccount.email;
                
                console.log('✅ Appwrite Auth account created successfully:', authAccount.$id);
                
                // Store the password in the user document for reference
                const userDocumentData = {
                    userId: authUserId,
                    name: userData.name,
                    email: authEmail,
                    phone: userData.phone,
                    address: userData.address,
                    pincode: userData.pincode,
                    shopName: userData.shopName || '',
                    retailCode: userData.retailCode || '',
                    password: defaultPassword, // Store the password
                    profileUrl: '',
                    createdAt: currentTime,
                    updatedAt: currentTime,
                };

                // Create user document in database
                const response = await databases.createDocument(
                    appwriteConfig.databaseId,
                    appwriteConfig.userCollectionId,
                    ID.unique(),
                    userDocumentData
                );

                const user: User = {
                    $id: response.$id,
                    userId: response.userId,
                    email: response.email,
                    name: response.name,
                    phone: response.phone,
                    retailCode: response.retailCode,
                    address: response.address,
                    shopName: response.shopName,
                    password: response.password,
                    profileUrl: response.profileUrl,
                    pincode: response.pincode,
                    createdAt: response.$createdAt,
                    updatedAt: response.$updatedAt,
                };

                console.log('✅ User created successfully with Auth account:', user.email);
                console.log('🔑 Password for user:', defaultPassword);
                
                return user;

            } catch (authError: any) {
                console.error('❌ Error creating Auth account:', authError);
                
                if (authError.code === 409 && authError.message.includes('email')) {
                    throw new Error(`Email '${userData.email}' already exists in Auth. Please use a different email.`);
                }
                
                // If Auth creation fails, still create the user document but log the error
                console.log('⚠️ Creating user document without Auth account due to Auth creation failure');
            }
        }

        // If no email provided or Auth creation failed, create user document only
        const userDocumentData = {
            userId: authUserId,
            name: userData.name,
            email: authEmail,
            phone: userData.phone,
            address: userData.address,
            pincode: userData.pincode,
            shopName: userData.shopName || '',
            retailCode: userData.retailCode || '',
            password: userData.password || '', // Store password if provided
            profileUrl: '',
            createdAt: currentTime,
            updatedAt: currentTime,
        };

        // Create user document in database
        const response = await databases.createDocument(
            appwriteConfig.databaseId,
            appwriteConfig.userCollectionId,
            ID.unique(),
            userDocumentData
        );

        const user: User = {
            $id: response.$id,
            userId: response.userId,
            email: response.email,
            name: response.name,
            phone: response.phone,
            retailCode: response.retailCode,
            address: response.address,
            shopName: response.shopName,
            password: response.password,
            profileUrl: response.profileUrl,
            pincode: response.pincode,
            createdAt: response.$createdAt,
            updatedAt: response.$updatedAt,
        };

        console.log('✅ User created successfully:', user.email || 'No email');
        return user;

    } catch (error: any) {
        console.error('❌ Error creating user:', error);
        if (error.code === 409 && error.message.includes('email')) {
            throw new Error(`Email '${userData.email}' already exists. Please use a different email.`);
        }
        throw new Error(error.message || 'Failed to create user');
    }
}