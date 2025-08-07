export interface PriceMultiplier {
    $id: string;
    $collectionId: string;
    $databaseId: string;
    $createdAt: string;
    $updatedAt: string;
    $permissions: string[];
    retailerCode: string;
    multiplierValue: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  }