// components/categoriTab/UsersTab.tsx
'use client'

import { useEffect, useState } from 'react'
import { fetchUsers, updateUserRetailCode } from '../../../lib/product/HandleUsers'
import { User } from '../../../types/UsersTypes'
import toast, { Toaster } from 'react-hot-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Search, 
  Filter, 
  Edit, 
  Save, 
  X, 
  Users, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  Building, 
  Hash,
  Eye,
  RefreshCw,
  Download,
  Copy,
  ExternalLink,
  MessageCircle,
  MoreHorizontal
} from 'lucide-react';
import { format } from 'date-fns';

export function UsersTab() {
  const [users, setUsers] = useState<any>([]);
  const [filteredUsers, setFilteredUsers] = useState<any>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [editRetailCode, setEditRetailCode] = useState<string | null>(null);
  const [newRetailCode, setNewRetailCode] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const fetchAllUsers = async () => {
    setLoading(true);
    try {
      const fetchedUsers = await fetchUsers();
      setUsers(fetchedUsers);
      setFilteredUsers(fetchedUsers);
      console.log('👥 Fetched users:', fetchedUsers);
    } catch (error) {
      console.error('❌ Error fetching users:', error);
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllUsers();
  }, []);

  useEffect(() => {
    let filtered = users;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter((user: any) =>
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phone?.includes(searchTerm) ||
        user.shopName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.pincode?.includes(searchTerm) ||
        user.retailCode?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter((user: any) => {
        switch (filterType) {
          case 'with-retail':
            return user.retailCode && user.retailCode !== '';
          case 'without-retail':
            return !user.retailCode || user.retailCode === '';
          case 'with-shop':
            return user.shopName && user.shopName !== '';
          case 'without-shop':
            return !user.shopName || user.shopName === '';
          default:
            return true;
        }
      });
    }

    setFilteredUsers(filtered);
  }, [users, searchTerm, filterType]);

  const handleEditRetailCode = (userId: string, currentCode: string) => {
    setEditRetailCode(userId);
    setNewRetailCode(currentCode || '');
  };

  const handleCancelEdit = () => {
    setEditRetailCode(null);
    setNewRetailCode('');
  };

  const handleUpdateRetailCode = async (userId: string, documentId: string) => {
    try {
      await updateUserRetailCode(documentId, newRetailCode);
      toast.success(`Retail code updated successfully`);
      setEditRetailCode(null);
      setNewRetailCode('');
      fetchAllUsers();
    } catch (error) {
      toast.error('Failed to update retail code');
      console.error('❌ Error updating retail code:', error);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const handleCall = (phone: string) => {
    window.open(`tel:${phone}`, '_self');
  };

  const handleWhatsApp = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanPhone}`, '_blank');
  };

  const handleEmail = (email: string) => {
    window.open(`mailto:${email}`, '_self');
  };

  // User Card Component for mobile view
  const UserCard = ({ user }: { user: any }) => (
    <Card className="mb-4 hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.name || 'User'}`} />
            <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold">
              {(user.name || 'U').split(' ').map((n: string) => n[0]).join('').toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
              {user.name || 'Unknown User'}
              {user.retailCode && (
                <Badge variant="outline" className="bg-green-50 text-green-700">
                  {user.retailCode}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>{user.email}</CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Contact Information */}
        <div className="grid grid-cols-1 gap-3">
          {/* Email */}
          <div className="flex items-center justify-between">
            <div className="flex items-center text-sm">
              <Mail className="w-4 h-4 mr-2 text-gray-400" />
              <span className="truncate">{user.email}</span>
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(user.email, 'Email')}
                className="h-6 w-6 p-0"
              >
                <Copy className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEmail(user.email)}
                className="h-6 w-6 p-0"
              >
                <ExternalLink className="w-3 h-3" />
              </Button>
            </div>
          </div>

          {/* Phone */}
          {user.phone && (
            <div className="flex items-center justify-between">
              <div className="flex items-center text-sm">
                <Phone className="w-4 h-4 mr-2 text-gray-400" />
                <span>{user.phone}</span>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(user.phone, 'Phone')}
                  className="h-6 w-6 p-0"
                >
                  <Copy className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCall(user.phone)}
                  className="h-6 w-6 p-0 text-green-600"
                >
                  <Phone className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleWhatsApp(user.phone)}
                  className="h-6 w-6 p-0 text-green-600"
                >
                  <MessageCircle className="w-3 h-3" />
                </Button>
              </div>
            </div>
          )}

          {/* Shop Information */}
          {user.shopName && (
            <div className="flex items-center text-sm">
              <Building className="w-4 h-4 mr-2 text-gray-400" />
              <span className="font-medium">{user.shopName}</span>
            </div>
          )}

          {/* Address */}
          {user.address && (
            <div className="flex items-start text-sm">
              <MapPin className="w-4 h-4 mr-2 mt-0.5 text-gray-400" />
              <div>
                <p>{user.address}</p>
                {user.pincode && <p className="text-gray-500">Pincode: {user.pincode}</p>}
              </div>
            </div>
          )}
        </div>

        {/* Retail Code Section */}
        <div className="border-t pt-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Retail Code:</span>
            {editRetailCode === user.userId ? (
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  value={newRetailCode}
                  onChange={(e) => setNewRetailCode(e.target.value)}
                  className="h-8 w-24 text-sm"
                  placeholder="Code"
                />
                <Button
                  size="sm"
                  onClick={() => handleUpdateRetailCode(user.userId, user.$id)}
                  className="h-8 px-2"
                >
                  <Save className="w-3 h-3" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelEdit}
                  className="h-8 px-2"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-sm">{user.retailCode || 'Not set'}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEditRetailCode(user.userId, user.retailCode)}
                  className="h-8 px-2"
                >
                  <Edit className="w-3 h-3" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="border-t pt-3 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedUser(user);
              setIsDetailsModalOpen(true);
            }}
            className="flex-1"
          >
            <Eye className="w-4 h-4 mr-2" />
            View Details
          </Button>
        </div>

        {/* Timestamps */}
        <div className="text-xs text-gray-500 border-t pt-2">
          <p>Created: {format(new Date(user.createdAt), 'MMM dd, yyyy')}</p>
          <p>Updated: {format(new Date(user.updatedAt), 'MMM dd, yyyy')}</p>
        </div>
      </CardContent>
    </Card>
  );

  // User Details Modal
  const UserDetailsModal = () => {
    if (!selectedUser) return null;

    return (
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              User Details - {selectedUser.name}
            </DialogTitle>
            <DialogDescription>
              Complete information about this user
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* User Profile */}
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${selectedUser.name}`} />
                <AvatarFallback className="bg-blue-100 text-blue-600 text-lg font-bold">
                  {selectedUser.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-xl font-semibold">{selectedUser.name}</h3>
                <p className="text-gray-600">{selectedUser.email}</p>
                <p className="text-sm text-gray-500">User ID: {selectedUser.userId}</p>
              </div>
            </div>

            {/* Contact & Business Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-500">Email</label>
                    <p className="font-medium">{selectedUser.email}</p>
                  </div>
                  {selectedUser.phone && (
                    <div>
                      <label className="text-xs text-gray-500">Phone</label>
                      <p className="font-medium">{selectedUser.phone}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-xs text-gray-500">User Since</label>
                    <p className="font-medium">{format(new Date(selectedUser.createdAt), 'MMMM dd, yyyy')}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Business Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-500">Shop Name</label>
                    <p className="font-medium">{selectedUser.shopName || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Retail Code</label>
                    <p className="font-medium">{selectedUser.retailCode || 'Not assigned'}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Address</label>
                    <p className="font-medium">{selectedUser.address || 'Not provided'}</p>
                    {selectedUser.pincode && (
                      <p className="text-sm text-gray-600">Pincode: {selectedUser.pincode}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsDetailsModalOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-2 text-lg">Loading users...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <Toaster position="top-right" reverseOrder={false} />
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Users Management</h1>
          <p className="text-gray-600">Manage customers and retail partners</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchAllUsers}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{users.length}</p>
                <p className="text-sm text-gray-600">Total Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Hash className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">
                  {users.filter((u: any) => u.retailCode).length}
                </p>
                <p className="text-sm text-gray-600">With Retail Code</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Building className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">
                  {users.filter((u: any) => u.shopName).length}
                </p>
                <p className="text-sm text-gray-600">Business Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">
                  {users.filter((u: any) => {
                    const userDate = new Date(u.createdAt);
                    const thirtyDaysAgo = new Date();
                    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                    return userDate > thirtyDaysAgo;
                  }).length}
                </p>
                <p className="text-sm text-gray-600">New This Month</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search users, shops, codes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="with-retail">With Retail Code</SelectItem>
                <SelectItem value="without-retail">Without Retail Code</SelectItem>
                <SelectItem value="with-shop">Business Users</SelectItem>
                <SelectItem value="without-shop">Individual Users</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => {
              setSearchTerm('');
              setFilterType('all');
            }}>
              <Filter className="w-4 h-4 mr-2" />
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <div className="space-y-4">
        {filteredUsers.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
              <p className="text-gray-500">
                {users.length === 0 
                  ? "No users have registered yet." 
                  : "Try adjusting your search or filter criteria."
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
          {/* Desktop Table View */}
          <div className="hidden lg:block">
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="text-left p-4 font-medium text-gray-900">User</th>
                        <th className="text-left p-4 font-medium text-gray-900">Contact</th>
                        <th className="text-left p-4 font-medium text-gray-900">Business</th>
                        <th className="text-left p-4 font-medium text-gray-900">Retail Code</th>
                        <th className="text-left p-4 font-medium text-gray-900">Location</th>
                        <th className="text-left p-4 font-medium text-gray-900">Joined</th>
                        <th className="text-left p-4 font-medium text-gray-900">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user: any) => (
                        <tr key={user.userId} className="border-b hover:bg-gray-50 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.name || 'User'}`} />
                                <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold">
                                  {(user.name || 'U').split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-gray-900">{user.name || 'Unknown'}</p>
                                <p className="text-sm text-gray-500">ID: {user.userId.slice(-8)}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="space-y-1">
                              <div className="flex items-center text-sm">
                                <Mail className="w-3 h-3 mr-1 text-gray-400" />
                                <span className="truncate max-w-[150px]">{user.email}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(user.email, 'Email')}
                                  className="h-6 w-6 p-0 ml-1"
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                              </div>
                              {user.phone && (
                                <div className="flex items-center text-sm">
                                  <Phone className="w-3 h-3 mr-1 text-gray-400" />
                                  <span>{user.phone}</span>
                                  <div className="flex ml-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleCall(user.phone)}
                                      className="h-6 w-6 p-0"
                                    >
                                      <Phone className="w-3 h-3 text-green-600" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleWhatsApp(user.phone)}
                                      className="h-6 w-6 p-0"
                                    >
                                      <MessageCircle className="w-3 h-3 text-green-600" />
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="space-y-1">
                              {user.shopName ? (
                                <div className="flex items-center text-sm">
                                  <Building className="w-3 h-3 mr-1 text-gray-400" />
                                  <span className="font-medium">{user.shopName}</span>
                                </div>
                              ) : (
                                <span className="text-sm text-gray-400">Individual</span>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            {editRetailCode === user.userId ? (
                              <div className="flex items-center gap-2">
                                <Input
                                  type="text"
                                  value={newRetailCode}
                                  onChange={(e) => setNewRetailCode(e.target.value)}
                                  className="h-8 w-20 text-sm"
                                  placeholder="Code"
                                />
                                <Button
                                  size="sm"
                                  onClick={() => handleUpdateRetailCode(user.userId, user.$id)}
                                  className="h-8 px-2"
                                >
                                  <Save className="w-3 h-3" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={handleCancelEdit}
                                  className="h-8 px-2"
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                {user.retailCode ? (
                                  <Badge variant="outline" className="bg-green-50 text-green-700">
                                    {user.retailCode}
                                  </Badge>
                                ) : (
                                  <span className="text-sm text-gray-400">Not set</span>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditRetailCode(user.userId, user.retailCode)}
                                  className="h-6 w-6 p-0"
                                >
                                  <Edit className="w-3 h-3" />
                                </Button>
                              </div>
                            )}
                          </td>
                          <td className="p-4">
                            <div className="space-y-1">
                              {user.address && (
                                <div className="flex items-start text-sm">
                                  <MapPin className="w-3 h-3 mr-1 mt-0.5 text-gray-400 flex-shrink-0" />
                                  <div>
                                    <p className="max-w-[120px] truncate">{user.address}</p>
                                    {user.pincode && (
                                      <p className="text-xs text-gray-500">{user.pincode}</p>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="text-sm">
                              <p className="font-medium">{format(new Date(user.createdAt), 'MMM dd, yyyy')}</p>
                              <p className="text-xs text-gray-500">{format(new Date(user.createdAt), 'HH:mm')}</p>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setIsDetailsModalOpen(true);
                                }}
                                className="h-8 px-2"
                              >
                                <Eye className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2"
                              >
                                <MoreHorizontal className="w-3 h-3" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden space-y-4">
            {filteredUsers.map((user: any) => (
              <UserCard key={user.userId} user={user} />
            ))}
          </div>
        </>
      )}
    </div>

    {/* User Details Modal */}
    <UserDetailsModal />
  </div>
);
}