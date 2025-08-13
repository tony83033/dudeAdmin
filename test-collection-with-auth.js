const { Client, Databases, Account } = require('node-appwrite');

// Initialize the Appwrite client
const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject('6780e3ff00052183da93');

const databases = new Databases(client);
const account = new Account(client);

const DATABASE_ID = '67811767003984166d8d';
const COLLECTION_ID = 'productPriceMultipliers';

async function testCollectionWithAuth() {
    try {
        console.log('Testing productPriceMultipliers collection with authentication...');
        
        // First, check if we have a current session
        try {
            const currentUser = await account.get();
            console.log('✅ Current user found:', { email: currentUser.email, id: currentUser.$id });
        } catch (error) {
            console.log('❌ No current session found. Please log in first.');
            console.log('Error:', error.message);
            return false;
        }
        
        // Try to list documents from the collection
        const response = await databases.listDocuments(
            DATABASE_ID,
            COLLECTION_ID
        );
        
        console.log('✅ Collection exists and is accessible');
        console.log('Documents found:', response.documents.length);
        return true;
    } catch (error) {
        console.error('❌ Collection test failed:', error);
        
        if (error.code === 404) {
            console.error('Collection does not exist. Please create it first.');
        } else if (error.code === 401) {
            console.error('Unauthorized. Please check your authentication.');
        } else if (error.code === 403) {
            console.error('Forbidden. You do not have permission to access this collection.');
        } else {
            console.error('Unknown error:', error.message);
        }
        
        return false;
    }
}

// Run the test
testCollectionWithAuth();
