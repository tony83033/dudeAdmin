const { Client, Databases } = require('node-appwrite');

// Initialize the Appwrite client
const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject('6780e3ff00052183da93');

const databases = new Databases(client);

const DATABASE_ID = '67811767003984166d8d';
const COLLECTION_ID = 'productPriceMultipliers';

async function testCollection() {
    try {
        console.log('Testing productPriceMultipliers collection...');
        
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
            console.error('Unauthorized. Please check your API key and permissions.');
        } else if (error.code === 403) {
            console.error('Forbidden. You do not have permission to access this collection.');
        } else {
            console.error('Unknown error:', error.message);
        }
        
        return false;
    }
}

// Run the test
testCollection();
