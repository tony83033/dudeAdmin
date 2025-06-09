"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { fetchPincodes } from "@/lib/pincode/PincodeFun";
import { fetchPriceMultipliers, addPriceMultiplier, deletePriceMultiplier, updatePriceMultiplier } from "@/lib/pincode/PriceMultiplierFun";
import { Pincode } from "@/types/PincodeTypes";
import { PriceMultiplier } from "@/types/PriceMultiplierTypes";
import toast, { Toaster } from "react-hot-toast";
import { Calculator, Plus, RefreshCw, Trash2, MapPin, Percent } from "lucide-react";

export function PriceMultiplierTab() {
  const [pincodes, setPincodes] = useState<Pincode[]>([]);
  const [priceMultipliers, setPriceMultipliers] = useState<PriceMultiplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPincodesLoading, setIsPincodesLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [newMultiplier, setNewMultiplier] = useState<Omit<PriceMultiplier, "$id" | "$collectionId" | "$databaseId" | "$createdAt" | "$updatedAt" | "$permissions">>({
    pincodeId: "",
    multiplierValue: 1,
    isActive: true,
    createdAt: "",
    updatedAt: "",
  });

  // Create a map of pincodes for faster lookup
  const pincodeMap = new Map(pincodes.map((pincode) => [pincode.$id, pincode]));

  // Form validation
  const isFormValid = newMultiplier.pincodeId && 
                     newMultiplier.multiplierValue > 0;

  const loadPincodes = useCallback(async () => {
    try {
      setIsPincodesLoading(true);
      const data = await fetchPincodes();
      setPincodes(data || []);
    } catch (error) {
      console.error("Failed to fetch pincodes:", error);
      toast.error("Failed to fetch pincodes.");
      setPincodes([]);
    } finally {
      setIsPincodesLoading(false);
    }
  }, []);

  const loadPriceMultipliers = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await fetchPriceMultipliers();
      setPriceMultipliers(data || []);
      setError(null);
      if (data?.length > 0) {
        toast.success(`${data.length} price multipliers loaded successfully!`);
      }
    } catch (err) {
      console.error("Failed to fetch price multipliers:", err);
      setError("Failed to fetch price multipliers. Please try again later.");
      toast.error("Failed to fetch price multipliers.");
      setPriceMultipliers([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPincodes();
    loadPriceMultipliers();
  }, [loadPincodes, loadPriceMultipliers]);

  const handleAddMultiplier = async () => {
    if (!isFormValid) {
      toast.error("Please fill in all required fields.");
      return;
    }

    if (newMultiplier.multiplierValue <= 0) {
      toast.error("Multiplier value must be greater than 0.");
      return;
    }

    // Check if multiplier already exists for this pincode
    const existingMultiplier = priceMultipliers.find(pm => pm.pincodeId === newMultiplier.pincodeId);
    if (existingMultiplier) {
      toast.error("Price multiplier already exists for this pincode.");
      return;
    }

    setIsAdding(true);
    try {
      const createdMultiplier = await addPriceMultiplier({
        ...newMultiplier,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      setPriceMultipliers(prev => [...prev, createdMultiplier]);
      
      // Reset form
      setNewMultiplier({
        pincodeId: "",
        multiplierValue: 1,
        isActive: true,
        createdAt: "",
        updatedAt: "",
      });

      toast.success("Price multiplier added successfully!");
    } catch (error) {
      console.error("Failed to add price multiplier:", error);
      toast.error("Failed to add price multiplier. Please try again.");
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteMultiplier = async (multiplierId: string) => {
    setDeletingId(multiplierId);
    try {
      const success = await deletePriceMultiplier(multiplierId);
      if (success) {
        setPriceMultipliers(priceMultipliers.filter((multiplier) => multiplier.$id !== multiplierId));
        toast.success("Price multiplier deleted successfully!");
      } else {
        toast.error("Failed to delete price multiplier.");
      }
    } catch (error) {
      console.error("Failed to delete price multiplier:", error);
      toast.error("Failed to delete price multiplier. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleUpdateMultiplier = async (multiplierId: string, newValue: number) => {
    if (newValue <= 0) {
      toast.error("Multiplier value must be greater than 0.");
      return;
    }

    setUpdatingId(multiplierId);
    try {
      const success = await updatePriceMultiplier(multiplierId, {
        multiplierValue: newValue,
        updatedAt: new Date().toISOString(),
      });

      if (success) {
        setPriceMultipliers(prev =>
          prev.map(pm =>
            pm.$id === multiplierId
              ? { ...pm, multiplierValue: newValue, updatedAt: new Date().toISOString() }
              : pm
          )
        );
        toast.success("Price multiplier updated successfully!");
      } else {
        toast.error("Failed to update price multiplier.");
      }
    } catch (error) {
      console.error("Failed to update price multiplier:", error);
      toast.error("Failed to update price multiplier. Please try again.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleToggleStatus = async (multiplierId: string, currentStatus: boolean) => {
    setUpdatingId(multiplierId);
    try {
      const success = await updatePriceMultiplier(multiplierId, {
        isActive: !currentStatus,
        updatedAt: new Date().toISOString(),
      });

      if (success) {
        setPriceMultipliers(prev =>
          prev.map(pm =>
            pm.$id === multiplierId
              ? { ...pm, isActive: !currentStatus, updatedAt: new Date().toISOString() }
              : pm
          )
        );
        toast.success(`Price multiplier ${!currentStatus ? 'activated' : 'deactivated'} successfully!`);
      } else {
        toast.error("Failed to update price multiplier status.");
      }
    } catch (error) {
      console.error("Failed to update price multiplier status:", error);
      toast.error("Failed to update price multiplier status. Please try again.");
    } finally {
      setUpdatingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString));
  };

  // Inline Edit Component
  const InlineEdit = ({ multiplier }: { multiplier: PriceMultiplier }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(multiplier.multiplierValue.toString());

    const handleSave = () => {
      const newValue = parseFloat(editValue);
      if (newValue !== multiplier.multiplierValue) {
        handleUpdateMultiplier(multiplier.$id, newValue);
      }
      setIsEditing(false);
    };

    const handleCancel = () => {
      setEditValue(multiplier.multiplierValue.toString());
      setIsEditing(false);
    };

    if (isEditing) {
      return (
        <div className="flex items-center gap-2">
          <Input
            type="number"
            step="0.01"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="w-20 h-8"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') handleCancel();
            }}
          />
          <Button size="sm" onClick={handleSave} disabled={updatingId === multiplier.$id}>
            Save
          </Button>
          <Button size="sm" variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2">
        <span className="font-semibold text-green-600">
          {multiplier.multiplierValue}x
        </span>
        <Button 
          size="sm" 
          variant="ghost" 
          onClick={() => setIsEditing(true)}
          disabled={updatingId === multiplier.$id}
        >
          Edit
        </Button>
      </div>
    );
  };

  // Skeleton Loader
  const TableSkeleton = () => (
    <>
      {Array.from({ length: 5 }).map((_, index) => (
        <TableRow key={index}>
          <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
          <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
          <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
          <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
          <TableCell><Skeleton className="h-4 w-[60px]" /></TableCell>
          <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
          <TableCell>
            <div className="flex gap-1">
              <Skeleton className="h-8 w-[80px]" />
              <Skeleton className="h-8 w-[60px]" />
            </div>
          </TableCell>
        </TableRow>
      ))}
    </>
  );

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <div className="text-red-500 text-center">
          <h3 className="text-lg font-semibold mb-2">Error Loading Price Multipliers</h3>
          <p className="mb-4">{error}</p>
          <Button onClick={loadPriceMultipliers} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Price Multipliers</h2>
          <p className="text-muted-foreground">
            Set pricing multipliers for different pincodes
          </p>
        </div>
        <Button 
          onClick={loadPriceMultipliers} 
          variant="outline" 
          size="sm"
          disabled={isLoading}
        >
          {isLoading ? (
            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Refresh
        </Button>
      </div>

      {/* Add Price Multiplier Form */}
      <Card>
        <CardHeader>
          <CardTitle>Add Price Multiplier</CardTitle>
          <CardDescription>
            Set a price multiplier for a specific pincode. All product prices will be multiplied by this value for orders to this pincode.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Pincode *</label>
              <Select
                onValueChange={(value) => setNewMultiplier({ ...newMultiplier, pincodeId: value })}
                value={newMultiplier.pincodeId}
                disabled={isAdding || isPincodesLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select pincode" />
                </SelectTrigger>
                <SelectContent>
                  {isPincodesLoading ? (
                    <SelectItem value="loading" disabled>
                      Loading pincodes...
                    </SelectItem>
                  ) : pincodes.length === 0 ? (
                    <SelectItem value="no-pincodes" disabled>
                      No pincodes found
                    </SelectItem>
                  ) : (
                    pincodes
                      .filter(pincode => pincode.isActive)
                      .filter(pincode => !priceMultipliers.some(pm => pm.pincodeId === pincode.$id))
                      .map((pincode) => (
                        <SelectItem key={pincode.$id} value={pincode.$id}>
                          {pincode.pincode} - {pincode.area}, {pincode.city}
                        </SelectItem>
                      ))
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Multiplier Value *</label>
              <Input
                placeholder="1.0"
                type="number"
                step="0.01"
                min="0.01"
                value={newMultiplier.multiplierValue || ""}
                onChange={(e) => setNewMultiplier({
                  ...newMultiplier,
                  multiplierValue: parseFloat(e.target.value) || 0,
                })}
                disabled={isAdding}
              />
              <p className="text-xs text-muted-foreground">
                Example: 1.5 = 150% of original price
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Actions</label>
              <Button 
                onClick={handleAddMultiplier} 
                className="w-full"
                disabled={!isFormValid || isAdding}
              >
                {isAdding ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Multiplier
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Price Multipliers Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            All Price Multipliers ({priceMultipliers.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Pincode</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Multiplier</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableSkeleton />
                ) : priceMultipliers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <Calculator className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">No price multipliers found</p>
                        <p className="text-sm text-muted-foreground">Add your first price multiplier above</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  priceMultipliers.map((multiplier) => {
                    const pincode = pincodeMap.get(multiplier.pincodeId);
                    return (
                      <TableRow key={multiplier.$id}>
                        <TableCell className="font-mono text-sm">
                          {multiplier.$id}
                        </TableCell>
                        <TableCell className="font-semibold">
                          {pincode ? pincode.pincode : "Unknown"}
                        </TableCell>
                        <TableCell>
                          {pincode ? `${pincode.area}, ${pincode.city}, ${pincode.state}` : "Unknown Location"}
                        </TableCell>
                        <TableCell>
                          <InlineEdit multiplier={multiplier} />
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleStatus(multiplier.$id, multiplier.isActive)}
                            disabled={updatingId === multiplier.$id}
                          >
                            {multiplier.isActive ? (
                              <Badge variant="default" className="bg-green-100 text-green-800">
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="bg-red-100 text-red-800">
                                Inactive
                              </Badge>
                            )}
                          </Button>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(multiplier.updatedAt)}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={deletingId === multiplier.$id}
                                >
                                  {deletingId === multiplier.$id ? (
                                    <RefreshCw className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Price Multiplier</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete the price multiplier for pincode "{pincode?.pincode}"? This will reset pricing to default for this area.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleDeleteMultiplier(multiplier.$id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Summary Card */}
      {priceMultipliers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Percent className="h-5 w-5" />
              Price Multiplier Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {priceMultipliers.length}
                </div>
                <div className="text-sm text-muted-foreground">Total Multipliers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {priceMultipliers.filter(pm => pm.isActive).length}
                </div>
                <div className="text-sm text-muted-foreground">Active Multipliers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {priceMultipliers.filter(pm => pm.multiplierValue > 1).length}
                </div>
                <div className="text-sm text-muted-foreground">Price Increases</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}