#!/bin/bash

# Create the productPriceMultipliers collection
appwrite databases createCollection \
  --databaseId "67811767003984166d8d" \
  --collectionId "productPriceMultipliers" \
  --name "Product Price Multipliers" \
  --permissions '["read(\"any\")", "write(\"any\")"]' \
  --documentSecurity false

# Create attributes
appwrite databases createStringAttribute \
  --databaseId "67811767003984166d8d" \
  --collectionId "productPriceMultipliers" \
  --key "productId" \
  --required true \
  --min 1 \
  --max 36

appwrite databases createStringAttribute \
  --databaseId "67811767003984166d8d" \
  --collectionId "productPriceMultipliers" \
  --key "retailerCode" \
  --required true \
  --min 1 \
  --max 50

appwrite databases createFloatAttribute \
  --databaseId "67811767003984166d8d" \
  --collectionId "productPriceMultipliers" \
  --key "multiplierValue" \
  --required true \
  --min 0.01 \
  --max 1000

appwrite databases createBooleanAttribute \
  --databaseId "67811767003984166d8d" \
  --collectionId "productPriceMultipliers" \
  --key "isActive" \
  --required true \
  --default true

appwrite databases createStringAttribute \
  --databaseId "67811767003984166d8d" \
  --collectionId "productPriceMultipliers" \
  --key "createdAt" \
  --required true

appwrite databases createStringAttribute \
  --databaseId "67811767003984166d8d" \
  --collectionId "productPriceMultipliers" \
  --key "updatedAt" \
  --required true

# Create indexes
appwrite databases createIndex \
  --databaseId "67811767003984166d8d" \
  --collectionId "productPriceMultipliers" \
  --key "productId" \
  --type "key" \
  --attributes '["productId"]' \
  --orders '["ASC"]'

appwrite databases createIndex \
  --databaseId "67811767003984166d8d" \
  --collectionId "productPriceMultipliers" \
  --key "retailerCode" \
  --type "key" \
  --attributes '["retailerCode"]' \
  --orders '["ASC"]'

appwrite databases createIndex \
  --databaseId "67811767003984166d8d" \
  --collectionId "productPriceMultipliers" \
  --key "productId_retailerCode" \
  --type "key" \
  --attributes '["productId", "retailerCode"]' \
  --orders '["ASC", "ASC"]'

appwrite databases createIndex \
  --databaseId "67811767003984166d8d" \
  --collectionId "productPriceMultipliers" \
  --key "isActive" \
  --type "key" \
  --attributes '["isActive"]' \
  --orders '["ASC"]'

echo "Product Price Multipliers collection created successfully!"
