const { Client, Databases, ID } = require('node-appwrite');

// Initialize the Appwrite client
const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject('6780e3ff00052183da93');

const databases = new Databases(client);

const DATABASE_ID = '67811767003984166d8d';
const COLLECTION_ID = 'productPriceMultipliers';

async function createProductPriceMultipliersCollection() {
    try {
        console.log('Creating productPriceMultipliers collection...');
        
        // Create the collection
        const collection = await databases.createCollection(
            DATABASE_ID,
            COLLECTION_ID,
            'Product Price Multipliers',
            [
                'read("any")',
                'write("any")'
            ],
            false
        );
        
        console.log('Collection created:', collection);
        
        // Create attributes
        console.log('Creating attributes...');
        
        // productId attribute
        await databases.createStringAttribute(
            DATABASE_ID,
            COLLECTION_ID,
            'productId',
            1,
            36,
            true
        );
        
        // retailerCode attribute
        await databases.createStringAttribute(
            DATABASE_ID,
            COLLECTION_ID,
            'retailerCode',
            1,
            50,
            true
        );
        
        // multiplierValue attribute
        await databases.createFloatAttribute(
            DATABASE_ID,
            COLLECTION_ID,
            'multiplierValue',
            0.01,
            1000,
            true
        );
        
        // isActive attribute
        await databases.createBooleanAttribute(
            DATABASE_ID,
            COLLECTION_ID,
            'isActive',
            true,
            true
        );
        
        // createdAt attribute
        await databases.createStringAttribute(
            DATABASE_ID,
            COLLECTION_ID,
            'createdAt',
            1,
            255,
            true
        );
        
        // updatedAt attribute
        await databases.createStringAttribute(
            DATABASE_ID,
            COLLECTION_ID,
            'updatedAt',
            1,
            255,
            true
        );
        
        console.log('Attributes created successfully');
        
        // Create indexes
        console.log('Creating indexes...');
        
        await databases.createIndex(
            DATABASE_ID,
            COLLECTION_ID,
            'productId',
            'key',
            ['productId'],
            ['ASC']
        );
        
        await databases.createIndex(
            DATABASE_ID,
            COLLECTION_ID,
            'retailerCode',
            'key',
            ['retailerCode'],
            ['ASC']
        );
        
        await databases.createIndex(
            DATABASE_ID,
            COLLECTION_ID,
            'productId_retailerCode',
            'key',
            ['productId', 'retailerCode'],
            ['ASC', 'ASC']
        );
        
        await databases.createIndex(
            DATABASE_ID,
            COLLECTION_ID,
            'isActive',
            'key',
            ['isActive'],
            ['ASC']
        );
        
        console.log('Indexes created successfully');
        console.log('Product Price Multipliers collection setup completed!');
        
    } catch (error) {
        console.error('Error creating collection:', error);
    }
}

// Run the script
createProductPriceMultipliersCollection();
