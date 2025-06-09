export interface PriceMultiplier {
    $id: string;
    $collectionId: string;
    $databaseId: string;
    $createdAt: string;
    $updatedAt: string;
    $permissions: string[];
    pincodeId: string;
    multiplierValue: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  }