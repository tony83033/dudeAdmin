const { Client, Databases } = require('node-appwrite');

// Initialize the Appwrite client
const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject('6780e3ff00052183da93');

const databases = new Databases(client);

const DATABASE_ID = '67811767003984166d8d';
const COLLECTION_ID = 'productPriceMultipliers';

async function updateCollectionPermissions() {
    try {
        console.log('Updating productPriceMultipliers collection permissions...');
        
        // Update the collection permissions
        const updatedCollection = await databases.updateCollection(
            DATABASE_ID,
            COLLECTION_ID,
            'Product Price Multipliers',
            [
                'create("any")',
                'read("any")',
                'update("any")',
                'delete("any")'
            ],
            false
        );
        
        console.log('✅ Collection permissions updated successfully');
        console.log('Updated collection:', updatedCollection);
        return true;
    } catch (error) {
        console.error('❌ Failed to update collection permissions:', error);
        return false;
    }
}

// Run the update
updateCollectionPermissions();
