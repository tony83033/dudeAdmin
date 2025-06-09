export interface Pincode {
    $id: string;
    $collectionId: string;
    $databaseId: string;
    $createdAt: string;
    $updatedAt: string;
    $permissions: string[];
    pincode: string;
    area: string;
    city: string;
    state: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  }