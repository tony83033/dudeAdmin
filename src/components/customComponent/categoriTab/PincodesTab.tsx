"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { fetchPincodes, addPincode, deletePincode, updatePincode } from "@/lib/pincode/PincodeFun";
import { Pincode } from "@/types/PincodeTypes";
import toast, { Toaster } from "react-hot-toast";
import { Trash2, Plus, MapPin, RefreshCw, Edit, Save, Calendar } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Search } from "lucide-react";

interface EditingPincode {
  $id: string;
  pincode: string;
  area: string;
  city: string;
  state: string;
  isActive: boolean;
}

export function PincodesTab() {
  const [pincodes, setPincodes] = useState<Pincode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    pincode: "",
    area: "",
    city: "",
    state: "",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  const loadPincodes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("Loading pincodes...");
      const data = await fetchPincodes();
      console.log("Loaded pincodes:", data);
      setPincodes(data || []);
    } catch (err) {
      console.error("Error loading pincodes:", err);
      setError("Failed to fetch pincodes. Please try again later.");
      toast.error("Failed to fetch pincodes");
      setPincodes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPincodes();
  }, [loadPincodes]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditing) {
        const pincodeToUpdate = pincodes.find(p => p.pincode === formData.pincode);
        if (pincodeToUpdate) {
          await updatePincode(pincodeToUpdate.$id, formData);
          toast.success("Pincode updated successfully");
        }
      } else {
        await addPincode(formData);
        toast.success("Pincode added successfully");
      }
      setIsDialogOpen(false);
      resetForm();
      loadPincodes();
    } catch (err) {
      console.error("Error saving pincode:", err);
      toast.error("Failed to save pincode");
    }
  };

  const handleEdit = (pincode: Pincode) => {
    setFormData({
      pincode: pincode.pincode,
      area: pincode.area,
      city: pincode.city,
      state: pincode.state,
      isActive: pincode.isActive,
      createdAt: pincode.createdAt,
      updatedAt: pincode.updatedAt
    });
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const handleDelete = async (pincodeId: string) => {
    if (window.confirm("Are you sure you want to delete this pincode?")) {
      try {
        await deletePincode(pincodeId);
        toast.success("Pincode deleted successfully");
        loadPincodes();
      } catch (err) {
        console.error("Error deleting pincode:", err);
        toast.error("Failed to delete pincode");
      }
    }
  };

  const resetForm = () => {
    setFormData({
      pincode: "",
      area: "",
      city: "",
      state: "",
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    setIsEditing(false);
  };

  const filteredPincodes = pincodes.filter(pincode =>
    pincode.pincode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pincode.area.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pincode.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pincode.state.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Skeleton Loader
  const TableSkeleton = () => (
    <>
      {Array.from({ length: 5 }).map((_, index) => (
        <TableRow key={index}>
          <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
          <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
          <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
          <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
          <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
          <TableCell><Skeleton className="h-4 w-[60px]" /></TableCell>
          <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
          <TableCell>
            <div className="flex gap-1">
              <Skeleton className="h-8 w-[60px]" />
              <Skeleton className="h-8 w-[60px]" />
            </div>
          </TableCell>
        </TableRow>
      ))}
    </>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Skeleton className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-lg">Loading pincodes...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={loadPincodes} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Toaster position="top-right" />
      
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Pincodes Management</h2>
        <div className="flex gap-2">
          <Button onClick={loadPincodes} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                resetForm();
                setIsDialogOpen(true);
              }}>
                <Plus className="w-4 h-4 mr-2" />
                Add Pincode
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{isEditing ? "Edit Pincode" : "Add New Pincode"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="pincode">Pincode</Label>
                  <Input
                    id="pincode"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleInputChange}
                    placeholder="Enter pincode"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="area">Area</Label>
                  <Input
                    id="area"
                    name="area"
                    value={formData.area}
                    onChange={handleInputChange}
                    placeholder="Enter area"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="Enter city"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    placeholder="Enter state"
                    required
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                  />
                  <Label htmlFor="isActive">Active</Label>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {isEditing ? "Update" : "Add"} Pincode
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Search pincodes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="border rounded-lg">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-2 text-left">Pincode</th>
                <th className="px-4 py-2 text-left">Area</th>
                <th className="px-4 py-2 text-left">City</th>
                <th className="px-4 py-2 text-left">State</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPincodes.map((pincode) => (
                <tr key={pincode.$id} className="border-t">
                  <td className="px-4 py-2">{pincode.pincode}</td>
                  <td className="px-4 py-2">{pincode.area}</td>
                  <td className="px-4 py-2">{pincode.city}</td>
                  <td className="px-4 py-2">{pincode.state}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 rounded-full text-xs ${pincode.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {pincode.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(pincode)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(pincode.$id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}