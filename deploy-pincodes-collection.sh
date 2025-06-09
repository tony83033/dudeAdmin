#!/bin/bash

# Create the pincodes collection
appwrite databases createCollection \
  --databaseId "67811767003984166d8d" \
  --collectionId "pincodes" \
  --name "pincodes" \
  --permissions '["read(\"any\")"]' \
  --documentSecurity false

# Create attributes
appwrite databases createStringAttribute \
  --databaseId "67811767003984166d8d" \
  --collectionId "pincodes" \
  --key "pincode" \
  --required true \
  --min 6 \
  --max 6 \
  --format "number"

appwrite databases createStringAttribute \
  --databaseId "67811767003984166d8d" \
  --collectionId "pincodes" \
  --key "area" \
  --required true \
  --min 1 \
  --max 100

appwrite databases createStringAttribute \
  --databaseId "67811767003984166d8d" \
  --collectionId "pincodes" \
  --key "city" \
  --required true \
  --min 1 \
  --max 100

appwrite databases createStringAttribute \
  --databaseId "67811767003984166d8d" \
  --collectionId "pincodes" \
  --key "state" \
  --required true \
  --min 1 \
  --max 100

appwrite databases createBooleanAttribute \
  --databaseId "67811767003984166d8d" \
  --collectionId "pincodes" \
  --key "isActive" \
  --required true \
  --default true

appwrite databases createStringAttribute \
  --databaseId "67811767003984166d8d" \
  --collectionId "pincodes" \
  --key "createdAt" \
  --required true

appwrite databases createStringAttribute \
  --databaseId "67811767003984166d8d" \
  --collectionId "pincodes" \
  --key "updatedAt" \
  --required true

# Create indexes
appwrite databases createIndex \
  --databaseId "67811767003984166d8d" \
  --collectionId "pincodes" \
  --key "pincode" \
  --type "key" \
  --attributes '["pincode"]' \
  --orders '["ASC"]'

appwrite databases createIndex \
  --databaseId "67811767003984166d8d" \
  --collectionId "pincodes" \
  --key "isActive" \
  --type "key" \
  --attributes '["isActive"]' \
  --orders '["ASC"]' 