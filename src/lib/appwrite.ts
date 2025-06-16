import { Client, Account, Databases, Storage } from 'appwrite';

export interface AppwriteConfig {
    endpoint: string;
    platform: string;
    projectId: string;
    databaseId: string;
    userCollectionId: string;
    productscollectionId: string;
    addressesCollectionId: string;
    categoriesCollectionId: string;
    orderItemsCollectionId: string;
    ordersCollectionId: string;
    reviewsCollectionId: string;
    topCategoriesCollectionId: string;
    cartsCollectionId: string;
    imagesCollectionId: string;
    productOfTheDayCollectionId: string;
    imageBucketId: string;
    pincodesCollectionId: string;
    priceMultipliersCollectionId: string;
}

export const appwriteConfig: AppwriteConfig = {
    endpoint: "https://cloud.appwrite.io/v1",
    platform: "com.dude",
    projectId: "6780e3ff00052183da93",
    databaseId: "67811767003984166d8d",
    userCollectionId: "678117b5003d84901e25",
    productscollectionId: "67841fbe001f1492ed9b",
    addressesCollectionId: "678425cb00065ae8f6e4",
    categoriesCollectionId: "6784211500075796cdb3",
    orderItemsCollectionId: "6784253f003cb6ca9b36",
    ordersCollectionId: "678422cc000435240434",
    reviewsCollectionId: "67842677000e2ff86cd8",
    topCategoriesCollectionId: "6784f04b001d5ad03d85",
    cartsCollectionId: "6787910e000842462c22",
    imagesCollectionId: "679aac1c0030e98d1537",
    productOfTheDayCollectionId: "67a052e00031d601a6b5",
    imageBucketId: "679a93ca0015bbc8a2db",
    pincodesCollectionId: "pincodes",
    priceMultipliersCollectionId: "priceMultipliers",
};

const client = new Client();
client.setProject(appwriteConfig.projectId);
client.setEndpoint(appwriteConfig.endpoint);

export const account = new Account(client);
export const storage = new Storage(client);
export const databases = new Databases(client);