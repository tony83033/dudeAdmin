# PowerShell script to create productPriceMultipliers collection
# Make sure you have Appwrite CLI installed: npm install -g appwrite-cli

Write-Host "Creating productPriceMultipliers collection..." -ForegroundColor Green

# Create the collection
appwrite databases createCollection `
  --databaseId "67811767003984166d8d" `
  --collectionId "productPriceMultipliers" `
  --name "Product Price Multipliers" `
  --permissions '["read(\"any\")", "write(\"any\")"]' `
  --documentSecurity false

Write-Host "Collection created successfully!" -ForegroundColor Green

# Create attributes
Write-Host "Creating attributes..." -ForegroundColor Yellow

# productId attribute
appwrite databases createStringAttribute `
  --databaseId "67811767003984166d8d" `
  --collectionId "productPriceMultipliers" `
  --key "productId" `
  --required true `
  --min 1 `
  --max 36

# retailerCode attribute
appwrite databases createStringAttribute `
  --databaseId "67811767003984166d8d" `
  --collectionId "productPriceMultipliers" `
  --key "retailerCode" `
  --required true `
  --min 1 `
  --max 50

# multiplierValue attribute
appwrite databases createFloatAttribute `
  --databaseId "67811767003984166d8d" `
  --collectionId "productPriceMultipliers" `
  --key "multiplierValue" `
  --required true `
  --min 0.01 `
  --max 1000

# isActive attribute
appwrite databases createBooleanAttribute `
  --databaseId "67811767003984166d8d" `
  --collectionId "productPriceMultipliers" `
  --key "isActive" `
  --required true `
  --default true

# createdAt attribute
appwrite databases createStringAttribute `
  --databaseId "67811767003984166d8d" `
  --collectionId "productPriceMultipliers" `
  --key "createdAt" `
  --required true `
  --min 1 `
  --max 255

# updatedAt attribute
appwrite databases createStringAttribute `
  --databaseId "67811767003984166d8d" `
  --collectionId "productPriceMultipliers" `
  --key "updatedAt" `
  --required true `
  --min 1 `
  --max 255

Write-Host "Attributes created successfully!" -ForegroundColor Green

# Create indexes
Write-Host "Creating indexes..." -ForegroundColor Yellow

appwrite databases createIndex `
  --databaseId "67811767003984166d8d" `
  --collectionId "productPriceMultipliers" `
  --key "productId" `
  --type "key" `
  --attributes '["productId"]' `
  --orders '["ASC"]'

appwrite databases createIndex `
  --databaseId "67811767003984166d8d" `
  --collectionId "productPriceMultipliers" `
  --key "retailerCode" `
  --type "key" `
  --attributes '["retailerCode"]' `
  --orders '["ASC"]'

appwrite databases createIndex `
  --databaseId "67811767003984166d8d" `
  --collectionId "productPriceMultipliers" `
  --key "productId_retailerCode" `
  --type "key" `
  --attributes '["productId", "retailerCode"]' `
  --orders '["ASC", "ASC"]'

appwrite databases createIndex `
  --databaseId "67811767003984166d8d" `
  --collectionId "productPriceMultipliers" `
  --key "isActive" `
  --type "key" `
  --attributes '["isActive"]' `
  --orders '["ASC"]'

Write-Host "Indexes created successfully!" -ForegroundColor Green
Write-Host "Product Price Multipliers collection setup completed!" -ForegroundColor Green
