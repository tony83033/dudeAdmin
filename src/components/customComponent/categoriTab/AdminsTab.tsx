'use client'

import { useEffect, useState } from 'react'
import { 
  fetchAdmins, 
  updateAdmin, 
  deleteAdmin, 
  getAdminStats,
  linkAuthUserByEmail
} from '../../../lib/admin/AdminFunctions'
import { Admin, AdminRole, CreateAdminPayload, UpdateAdminPayload, ROLE_INFO, ROLE_PERMISSIONS } from '../../../types/AdminTypes'
import { PERMISSIONS } from '../../../lib/auth/permissions'
import toast, { Toaster } from 'react-hot-toast'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

import { 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Users, 
  UserPlus,
  Shield,
  ShieldCheck,
  ShieldX,
  Crown,
  TrendingUp,
  Package,
  DollarSign,
  RefreshCw,
  Eye,
  MoreHorizontal,
  Mail,
  Phone,
  Calendar,
  UserCheck,
  UserX,
      Settings,
    Link,
    CheckCircle
} from 'lucide-react'
import { format } from 'date-fns'

interface AdminsTabProps {
  currentAdmin: Admin | null;
}

export function AdminsTab({ currentAdmin }: AdminsTabProps) {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [filteredAdmins, setFilteredAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<AdminRole | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [adminStats, setAdminStats] = useState<{
    totalAdmins: number;
    activeAdmins: number;
    roleDistribution: Record<AdminRole, number>;
  }>({
    totalAdmins: 0,
    activeAdmins: 0,
    roleDistribution: {
      super_admin: 0,
      sales_admin: 0,
      inventory_admin: 0,
      customer_admin: 0,
      finance_admin: 0
    }
  });

  // Form state for email-based admin linking
  const [adminForm, setAdminForm] = useState({
    email: '',
    name: '',
    role: 'sales_admin' as AdminRole,
    phone: ''
  });

  const [updateForm, setUpdateForm] = useState<UpdateAdminPayload>({
    name: '',
    role: 'sales_admin',
    isActive: true,
    phone: ''
  });



  // Check permissions
  const canViewAdmins = currentAdmin ? 
    currentAdmin.role === 'super_admin' || currentAdmin.permissions.includes(PERMISSIONS.ADMINS_VIEW) : false;
  const canCreateAdmins = currentAdmin ? 
    currentAdmin.role === 'super_admin' || currentAdmin.permissions.includes(PERMISSIONS.ADMINS_CREATE) : false;
  const canUpdateAdmins = currentAdmin ? 
    currentAdmin.role === 'super_admin' || currentAdmin.permissions.includes(PERMISSIONS.ADMINS_UPDATE) : false;
  const canDeleteAdmins = currentAdmin ? 
    currentAdmin.role === 'super_admin' || currentAdmin.permissions.includes(PERMISSIONS.ADMINS_DELETE) : false;

  const fetchAllAdmins = async () => {
    if (!canViewAdmins) {
      toast.error('You do not have permission to view admins');
      return;
    }

    setLoading(true);
    try {
      const [fetchedAdmins, stats] = await Promise.all([
        fetchAdmins(),
        getAdminStats()
      ]);
      setAdmins(fetchedAdmins);
      setFilteredAdmins(fetchedAdmins);
      setAdminStats(stats);
    } catch (error) {
      console.error('Error fetching admins:', error);
      toast.error('Failed to fetch admins');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllAdmins();
  }, []);

  useEffect(() => {
    let filtered = admins;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter((admin) =>
        admin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        admin.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        admin.phone?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter((admin) => admin.role === roleFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((admin) => 
        statusFilter === 'active' ? admin.isActive : !admin.isActive
      );
    }

    setFilteredAdmins(filtered);
  }, [admins, searchTerm, roleFilter, statusFilter]);

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreateAdmins) {
      toast.error('You do not have permission to create admins');
      return;
    }

    // Validate form data
    if (!adminForm.email.trim()) {
      toast.error('Email is required');
      return;
    }
    if (!adminForm.name.trim()) {
      toast.error('Name is required');
      return;
    }

    try {
      console.log('🔗 Linking existing auth user by email:', adminForm.email);
      
      const result = await linkAuthUserByEmail(
        adminForm.email,
        {
          name: adminForm.name,
          role: adminForm.role,
          phone: adminForm.phone
        },
        currentAdmin!.adminId
      );
      
      if (result.success) {
        toast.success('Successfully linked user to admin role!');
        setIsCreateModalOpen(false);
        setAdminForm({
          email: '',
          name: '',
          role: 'sales_admin',
          phone: ''
        });
        fetchAllAdmins();
      } else {
        let errorMessage = result.error || 'Failed to link user';
        
        // Provide helpful messages based on action
        if (result.action === 'not_found') {
          errorMessage = `No user found with email ${adminForm.email}. The user must create an account first, then you can link them to admin role.`;
        } else if (result.action === 'already_linked') {
          errorMessage = `Email ${adminForm.email} is already linked to an admin account.`;
        }
        
        toast.error(errorMessage);
      }
    } catch (error: any) {
      console.error('Error linking user by email:', error);
      toast.error('Failed to link user: ' + error.message);
    }
  };

  const handleUpdateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canUpdateAdmins || !editingAdmin) {
      toast.error('You do not have permission to update admins');
      return;
    }

    try {
      await updateAdmin(editingAdmin.$id, updateForm, currentAdmin!.adminId);
      toast.success('Admin updated successfully');
      setIsEditModalOpen(false);
      setEditingAdmin(null);
      fetchAllAdmins();
    } catch (error) {
      console.error('Error updating admin:', error);
      toast.error('Failed to update admin');
    }
  };

  const handleDeleteAdmin = async (admin: Admin) => {
    if (!canDeleteAdmins) {
      toast.error('You do not have permission to delete admins');
      return;
    }

    if (admin.adminId === currentAdmin?.adminId) {
      toast.error('You cannot delete your own account');
      return;
    }

    if (confirm(`Are you sure you want to delete ${admin.name}?`)) {
      try {
        await deleteAdmin(admin.$id, admin.adminId);
        toast.success('Admin deleted successfully');
        fetchAllAdmins();
      } catch (error) {
        console.error('Error deleting admin:', error);
        toast.error('Failed to delete admin');
      }
    }
  };

  const handleToggleStatus = async (admin: Admin) => {
    if (!canUpdateAdmins) {
      toast.error('You do not have permission to update admins');
      return;
    }

    if (admin.adminId === currentAdmin?.adminId) {
      toast.error('You cannot deactivate your own account');
      return;
    }

    try {
      await updateAdmin(admin.$id, { isActive: !admin.isActive }, currentAdmin!.adminId);
      toast.success(`Admin ${admin.isActive ? 'deactivated' : 'activated'} successfully`);
      fetchAllAdmins();
    } catch (error) {
      console.error('Error toggling admin status:', error);
      toast.error('Failed to update admin status');
    }
  };

  const openEditModal = (admin: Admin) => {
    setEditingAdmin(admin);
    setUpdateForm({
      name: admin.name,
      role: admin.role,
      isActive: admin.isActive,
      phone: admin.phone || ''
    });
    setIsEditModalOpen(true);
  };

  const getRoleIcon = (role: AdminRole) => {
    switch (role) {
      case 'super_admin': return <Crown className="w-4 h-4" />;
      case 'sales_admin': return <TrendingUp className="w-4 h-4" />;
      case 'inventory_admin': return <Package className="w-4 h-4" />;
      case 'customer_admin': return <Users className="w-4 h-4" />;
      case 'finance_admin': return <DollarSign className="w-4 h-4" />;
      default: return <Shield className="w-4 h-4" />;
    }
  };

  const getRoleBadgeColor = (role: AdminRole) => {
    switch (role) {
      case 'super_admin': return 'bg-red-100 text-red-800';
      case 'sales_admin': return 'bg-blue-100 text-blue-800';
      case 'inventory_admin': return 'bg-green-100 text-green-800';
      case 'customer_admin': return 'bg-purple-100 text-purple-800';
      case 'finance_admin': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!canViewAdmins) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardContent className="p-8 text-center">
            <ShieldX className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
            <p className="text-gray-500">You do not have permission to view admin accounts.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-2 text-lg">Loading admins...</span>
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
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="w-8 h-8" />
            Admin Management
          </h1>
          <p className="text-gray-600">Manage admin accounts and roles</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchAllAdmins}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          {canCreateAdmins && (
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Link className="w-4 h-4 mr-2" />
                  Link User to Admin
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto sm:max-h-[80vh]">
                <DialogHeader>
                  <DialogTitle>Link User to Admin Role</DialogTitle>
                  <DialogDescription>
                    Connect an existing user account to an admin role. The user must already have an account.
                  </DialogDescription>
                </DialogHeader>
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Link className="w-4 h-4 text-blue-600 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium">Email-Based Linking</p>
                      <p>Simply enter the email of an existing user to grant them admin access.</p>
                    </div>
                  </div>
                </div>
                <form onSubmit={handleCreateAdmin} className="space-y-4 pb-4">
                  <div>
                    <Label htmlFor="email">User Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={adminForm.email}
                      onChange={(e) => setAdminForm({...adminForm, email: e.target.value})}
                      placeholder="user@example.com"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Email of an existing user account
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={adminForm.name}
                      onChange={(e) => setAdminForm({...adminForm, name: e.target.value})}
                      placeholder="Enter admin's full name"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="role">Admin Role</Label>
                    <Select value={adminForm.role} onValueChange={(value: AdminRole) => setAdminForm({...adminForm, role: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(ROLE_INFO).map(([key, roleInfo]) => (
                          <SelectItem key={key} value={key}>
                            <div className="flex flex-col items-start gap-1 py-1">
                              <div className="flex items-center gap-2">
                                {getRoleIcon(key as AdminRole)}
                                <span className="font-medium">{roleInfo.label}</span>
                              </div>
                              <span className="text-xs text-gray-500 max-w-xs">
                                {roleInfo.description}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500 mt-1">
                      {ROLE_INFO[adminForm.role].description}
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone (Optional)</Label>
                    <Input
                      id="phone"
                      value={adminForm.phone}
                      onChange={(e) => setAdminForm({...adminForm, phone: e.target.value})}
                      placeholder="+1234567890"
                    />
                  </div>
                  
                  {/* Permission Preview */}
                  <div className="border rounded-lg p-3 bg-gray-50">
                    <Label className="text-sm font-medium text-gray-700">
                      Permissions for {ROLE_INFO[adminForm.role].label}
                    </Label>
                    <div className="mt-2 max-h-32 overflow-y-auto">
                      <div className="grid grid-cols-1 gap-1">
                        {ROLE_PERMISSIONS[adminForm.role].map((permission) => (
                          <Badge key={permission} variant="outline" className="text-xs w-fit">
                            {permission}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t sticky bottom-0 bg-background">
                    <Button type="submit" className="flex-1">
                      <Link className="w-4 h-4 mr-2" />
                      Link to Admin Role
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)} className="flex-1 sm:flex-none">
                      Cancel
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{adminStats.totalAdmins}</p>
                <p className="text-sm text-gray-600">Total Admins</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{adminStats.activeAdmins}</p>
                <p className="text-sm text-gray-600">Active Admins</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-red-600" />
              <div>
                <p className="text-2xl font-bold">{adminStats.roleDistribution.super_admin}</p>
                <p className="text-sm text-gray-600">Super Admins</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <UserX className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">{adminStats.totalAdmins - adminStats.activeAdmins}</p>
                <p className="text-sm text-gray-600">Inactive Admins</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search admins..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={roleFilter} onValueChange={(value: AdminRole | 'all') => setRoleFilter(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {Object.entries(ROLE_INFO).map(([key, roleInfo]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      {getRoleIcon(key as AdminRole)}
                      {roleInfo.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(value: 'all' | 'active' | 'inactive') => setStatusFilter(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => {
              setSearchTerm('');
              setRoleFilter('all');
              setStatusFilter('all');
            }}>
              <Filter className="w-4 h-4 mr-2" />
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Admins Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-4 font-medium text-gray-900">Admin</th>
                  <th className="text-left p-4 font-medium text-gray-900">Role</th>
                  <th className="text-left p-4 font-medium text-gray-900">Status</th>
                  <th className="text-left p-4 font-medium text-gray-900">Contact</th>
                  <th className="text-left p-4 font-medium text-gray-900">Last Login</th>
                  <th className="text-left p-4 font-medium text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAdmins.map((admin) => (
                  <tr key={admin.$id} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={admin.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${admin.name}`} />
                          <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold">
                            {admin.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-gray-900">{admin.name}</p>
                          <p className="text-sm text-gray-500">{admin.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge className={getRoleBadgeColor(admin.role)}>
                        <div className="flex items-center gap-1">
                          {getRoleIcon(admin.role)}
                          {ROLE_INFO[admin.role].label}
                        </div>
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Badge variant={admin.isActive ? 'default' : 'secondary'}>
                          {admin.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        {canUpdateAdmins && admin.adminId !== currentAdmin?.adminId && (
                          <Switch
                            checked={admin.isActive}
                            onCheckedChange={() => handleToggleStatus(admin)}
                          />
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="space-y-1">
                        <div className="flex items-center text-sm">
                          <Mail className="w-3 h-3 mr-1 text-gray-400" />
                          <span className="truncate max-w-[150px]">{admin.email}</span>
                        </div>
                        {admin.phone && (
                          <div className="flex items-center text-sm">
                            <Phone className="w-3 h-3 mr-1 text-gray-400" />
                            <span>{admin.phone}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm">
                        {admin.lastLogin ? (
                          <>
                            <p className="font-medium">{format(new Date(admin.lastLogin), 'MMM dd, yyyy')}</p>
                            <p className="text-xs text-gray-500">{format(new Date(admin.lastLogin), 'HH:mm')}</p>
                          </>
                        ) : (
                          <span className="text-gray-400">Never</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedAdmin(admin);
                            setIsDetailsModalOpen(true);
                          }}
                          className="h-8 px-2"
                        >
                          <Eye className="w-3 h-3" />
                        </Button>
                        {canUpdateAdmins && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(admin)}
                            className="h-8 px-2"
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                        )}
                        {canDeleteAdmins && admin.adminId !== currentAdmin?.adminId && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteAdmin(admin)}
                            className="h-8 px-2 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredAdmins.length === 0 && (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No admins found</h3>
                <p className="text-gray-500">
                  {admins.length === 0 
                    ? "No admin accounts have been created yet." 
                    : "Try adjusting your search or filter criteria."
                  }
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Admin Modal */}
      {editingAdmin && (
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Admin - {editingAdmin.name}</DialogTitle>
              <DialogDescription>
                Update admin account information
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdateAdmin} className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Full Name</Label>
                <Input
                  id="edit-name"
                  value={updateForm.name}
                  onChange={(e) => setUpdateForm({...updateForm, name: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-phone">Phone</Label>
                <Input
                  id="edit-phone"
                  value={updateForm.phone}
                  onChange={(e) => setUpdateForm({...updateForm, phone: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="edit-role">Role</Label>
                <Select value={updateForm.role} onValueChange={(value: AdminRole) => setUpdateForm({...updateForm, role: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ROLE_INFO).map(([key, roleInfo]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          {getRoleIcon(key as AdminRole)}
                          {roleInfo.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-active"
                  checked={updateForm.isActive}
                  onCheckedChange={(checked) => setUpdateForm({...updateForm, isActive: checked})}
                />
                <Label htmlFor="edit-active">Account Active</Label>
              </div>
              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1">
                  <Save className="w-4 h-4 mr-2" />
                  Update Admin
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Admin Details Modal */}
      {selectedAdmin && (
        <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Admin Details - {selectedAdmin.name}
              </DialogTitle>
              <DialogDescription>
                Complete information about this admin account
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Admin Profile */}
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedAdmin.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${selectedAdmin.name}`} />
                  <AvatarFallback className="bg-blue-100 text-blue-600 text-lg font-bold">
                    {selectedAdmin.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold">{selectedAdmin.name}</h3>
                  <p className="text-gray-600">{selectedAdmin.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={getRoleBadgeColor(selectedAdmin.role)}>
                      <div className="flex items-center gap-1">
                        {getRoleIcon(selectedAdmin.role)}
                        {ROLE_INFO[selectedAdmin.role].label}
                      </div>
                    </Badge>
                    <Badge variant={selectedAdmin.isActive ? 'default' : 'secondary'}>
                      {selectedAdmin.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Contact Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <label className="text-xs text-gray-500">Email</label>
                      <p className="font-medium">{selectedAdmin.email}</p>
                    </div>
                    {selectedAdmin.phone && (
                      <div>
                        <label className="text-xs text-gray-500">Phone</label>
                        <p className="font-medium">{selectedAdmin.phone}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Account Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <label className="text-xs text-gray-500">Role</label>
                      <p className="font-medium">{ROLE_INFO[selectedAdmin.role].label}</p>
                      <p className="text-xs text-gray-500">{ROLE_INFO[selectedAdmin.role].description}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Status</label>
                      <p className="font-medium">{selectedAdmin.isActive ? 'Active' : 'Inactive'}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Permissions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Permissions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {selectedAdmin.permissions.map((permission) => (
                      <Badge key={permission} variant="outline" className="text-xs">
                        {permission}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Activity</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-500">Created</label>
                    <p className="font-medium">{format(new Date(selectedAdmin.createdAt), 'MMMM dd, yyyy HH:mm')}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Last Updated</label>
                    <p className="font-medium">{format(new Date(selectedAdmin.updatedAt), 'MMMM dd, yyyy HH:mm')}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Last Login</label>
                    <p className="font-medium">
                      {selectedAdmin.lastLogin 
                        ? format(new Date(selectedAdmin.lastLogin), 'MMMM dd, yyyy HH:mm')
                        : 'Never'
                      }
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setIsDetailsModalOpen(false)}>
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}


    </div>
  );
} 