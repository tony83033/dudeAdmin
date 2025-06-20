"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { databases, appwriteConfig } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { UserDetails } from "@/types/OrderTypes";
import toast, { Toaster } from "react-hot-toast";
import { RefreshCw, Gift, Search, Edit, Save, X, Plus, Minus } from "lucide-react";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"

interface UserWithRatanaCash extends UserDetails {
  $id: string;
}

export function RatanaCashTab() {
  const [users, setUsers] = useState<UserWithRatanaCash[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserWithRatanaCash | null>(null);
  const [rewardAmount, setRewardAmount] = useState<number>(0);
  
  // Edit state
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState<number>(0);
  const [isEditing, setIsEditing] = useState(false);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const response = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.userCollectionId,
        [Query.limit(100)]
      );

      const usersData = response.documents.map((doc) => ({
        $id: doc.$id,
        name: doc.name || 'N/A',
        email: doc.email || 'N/A',
        phone: doc.phone || 'N/A',
        shopName: doc.shopName || null,
        address: doc.address || null,
        pincode: doc.pincode || null,
        retailCode: doc.retailCode || null,
        ratanaCash: doc.ratanaCash || 0,
        createdAt: doc.$createdAt,
      }));

      setUsers(usersData);
      toast.success(`${usersData.length} users loaded successfully!`);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      toast.error("Failed to fetch users.");
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleAddReward = async () => {
    if (!selectedUser || rewardAmount <= 0) {
      toast.error("Please select a user and enter a valid reward amount.");
      return;
    }

    setIsAdding(true);
    try {
      const currentRatanaCash = selectedUser.ratanaCash || 0;
      const newRatanaCash = currentRatanaCash + rewardAmount;

      await databases.updateDocument(
        appwriteConfig.databaseId,
        appwriteConfig.userCollectionId,
        selectedUser.$id,
        {
          ratanaCash: newRatanaCash,
          updatedAt: new Date().toISOString(),
        }
      );

      setUsers(users.map(user => 
        user.$id === selectedUser.$id 
          ? { ...user, ratanaCash: newRatanaCash }
          : user
      ));

      toast.success(`Added ${rewardAmount} Ratana Cash to ${selectedUser.name}`);
      setSelectedUser(null);
      setRewardAmount(0);
    } catch (error: any) {
      console.error("Failed to add reward:", error);
      if (error?.message?.includes('ratanaCash')) {
        toast.error("User document is missing the 'ratanaCash' field. Please add it in Appwrite console.");
      } else if (error?.message?.includes('permission')) {
        toast.error("Permission denied. Please check your Appwrite collection permissions.");
      } else {
        toast.error("Failed to add reward. Please check the user document and permissions in Appwrite.");
      }
    } finally {
      setIsAdding(false);
    }
  };

  // Edit Ratana Cash functions
  const startEditing = (user: UserWithRatanaCash) => {
    setEditingUserId(user.$id);
    setEditAmount(user.ratanaCash || 0);
  };

  const cancelEditing = () => {
    setEditingUserId(null);
    setEditAmount(0);
  };

  const handleEditRatanaCash = async (userId: string, operation: 'add' | 'remove' | 'set') => {
    if (editAmount < 0) {
      toast.error("Amount cannot be negative");
      return;
    }

    setIsEditing(true);
    try {
      const user = users.find(u => u.$id === userId);
      if (!user) {
        toast.error("User not found");
        return;
      }

      let newAmount: number;
      switch (operation) {
        case 'add':
          newAmount = (user.ratanaCash || 0) + editAmount;
          break;
        case 'remove':
          newAmount = Math.max(0, (user.ratanaCash || 0) - editAmount);
          break;
        case 'set':
          newAmount = editAmount;
          break;
        default:
          newAmount = user.ratanaCash || 0;
      }

      await databases.updateDocument(
        appwriteConfig.databaseId,
        appwriteConfig.userCollectionId,
        userId,
        {
          ratanaCash: newAmount,
          updatedAt: new Date().toISOString(),
        }
      );

      setUsers(users.map(u => 
        u.$id === userId 
          ? { ...u, ratanaCash: newAmount }
          : u
      ));

      const operationText = operation === 'add' ? 'Added' : operation === 'remove' ? 'Removed' : 'Set';
      toast.success(`${operationText} Ratana Cash for ${user.name}. New balance: ${newAmount}`);
      
      setEditingUserId(null);
      setEditAmount(0);
    } catch (error: any) {
      console.error("Failed to update Ratana Cash:", error);
      toast.error("Failed to update Ratana Cash. Please try again.");
    } finally {
      setIsEditing(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.name.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower) ||
      user.phone.includes(searchTerm) ||
      (user.retailCode && user.retailCode.toLowerCase().includes(searchLower)) ||
      (user.shopName && user.shopName.toLowerCase().includes(searchLower))
    );
  });

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString));
  };

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />

      {/* Add Reward Card */}
      <Card>
        <CardHeader>
          <CardTitle>Add Ratana Cash Reward</CardTitle>
          <CardDescription>
            Select a user and add Ratana Cash as a reward
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select User</label>
              <Select
                value={selectedUser?.$id || ""}
                onValueChange={(value) => {
                  const user = users.find(u => u.$id === value);
                  setSelectedUser(user || null);
                }}
                disabled={isAdding || users.length === 0}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={users.length === 0 ? "No users found" : "Select a user"} />
                </SelectTrigger>
                <SelectContent>
                  <ScrollArea className="h-[300px]">
                    {users.map((user) => (
                      <SelectItem key={user.$id} value={user.$id}>
                        <div className="flex flex-col gap-1">
                          <div className="font-medium flex items-center gap-2">
                            {user.name}
                            {user.shopName && (
                              <Badge variant="outline" className="ml-2">
                                Shop: {user.shopName}
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            <div>Phone: {user.phone}</div>
                            {user.retailCode && <div>Retail Code: {user.retailCode}</div>}
                            <div>Current Balance: {user.ratanaCash || 0}</div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </ScrollArea>
                </SelectContent>
              </Select>
            </div>

            {selectedUser && (
              <div className="col-span-1 md:col-span-2 mt-2">
                <Card className="bg-muted">
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <h4 className="font-semibold">User Details</h4>
                        <p className="text-sm text-muted-foreground">{selectedUser.name}</p>
                        <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                        <p className="text-sm text-muted-foreground">{selectedUser.phone}</p>
                      </div>
                      {selectedUser.shopName && (
                        <div>
                          <h4 className="font-semibold">Shop Details</h4>
                          <p className="text-sm text-muted-foreground">Shop: {selectedUser.shopName}</p>
                          {selectedUser.retailCode && (
                            <p className="text-sm text-muted-foreground">Code: {selectedUser.retailCode}</p>
                          )}
                        </div>
                      )}
                      <div>
                        <h4 className="font-semibold">Ratana Cash</h4>
                        <p className="text-sm text-muted-foreground">Current Balance: {selectedUser.ratanaCash || 0}</p>
                        {rewardAmount > 0 && (
                          <>
                            <p className="text-sm text-muted-foreground">Adding: +{rewardAmount}</p>
                            <p className="text-sm font-medium">New Balance: {(selectedUser.ratanaCash || 0) + rewardAmount}</p>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Reward Amount</label>
              <Input
                type="number"
                min="0"
                step="1"
                value={rewardAmount || ""}
                onChange={(e) => setRewardAmount(parseInt(e.target.value) || 0)}
                placeholder="Enter amount"
                disabled={isAdding}
              />
            </div>
          </div>

          <Button 
            onClick={handleAddReward} 
            className="w-full mt-4"
            disabled={!selectedUser || rewardAmount <= 0 || isAdding}
          >
            {isAdding ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                Adding Reward...
              </>
            ) : (
              <>
                <Gift className="h-4 w-4 mr-2" />
                Add Reward
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users with Ratana Cash</CardTitle>
          <CardDescription>
            Search by name, email, phone, retail code, or shop name
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, phone, email, retail code, or shop name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Retail Code</TableHead>
                  <TableHead>Ratana Cash</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                        <p className="text-muted-foreground">Loading users...</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <Gift className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">No users found in the database.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <Gift className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">No users match your search.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.$id}>
                      <TableCell className="font-medium">
                        {user.name}
                        {user.shopName && (
                          <Badge variant="secondary" className="ml-2">
                            {user.shopName}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="text-sm">{user.email}</p>
                          <p className="text-sm text-muted-foreground">{user.phone}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.retailCode || "-"}
                      </TableCell>
                      <TableCell>
                        {editingUserId === user.$id ? (
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min="0"
                              value={editAmount}
                              onChange={(e) => setEditAmount(parseInt(e.target.value) || 0)}
                              className="w-20"
                              disabled={isEditing}
                            />
                          </div>
                        ) : (
                          <Badge variant={user.ratanaCash > 0 ? "default" : "secondary"}>
                            {user.ratanaCash}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(user.createdAt)}
                      </TableCell>
                      <TableCell>
                        {editingUserId === user.$id ? (
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditRatanaCash(user.$id, 'add')}
                              disabled={isEditing}
                              className="h-8 w-8 p-0"
                              title="Add amount"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditRatanaCash(user.$id, 'remove')}
                              disabled={isEditing}
                              className="h-8 w-8 p-0"
                              title="Remove amount"
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleEditRatanaCash(user.$id, 'set')}
                              disabled={isEditing}
                              className="h-8 w-8 p-0"
                              title="Set exact amount"
                            >
                              <Save className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={cancelEditing}
                              disabled={isEditing}
                              className="h-8 w-8 p-0"
                              title="Cancel"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => startEditing(user)}
                            disabled={isEditing}
                            className="h-8 w-8 p-0"
                            title="Edit Ratana Cash"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 