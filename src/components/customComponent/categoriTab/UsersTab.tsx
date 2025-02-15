'use client'

import { useEffect, useState } from 'react'
import { fetchUsers, updateUserRetailCode } from '../../../lib/product/HandleUsers'
import { User } from '../../../types/UsersTypes'
import toast, { Toaster } from 'react-hot-toast';

export function UsersTab() {
  const [users, setUsers] = useState<any>([]);
  const [editRetailCode, setEditRetailCode] = useState<string | null>(null);
  const [newRetailCode, setNewRetailCode] = useState<string>('');

  const fetchAllUsers = async () => {
    try {
      const fetchedUsers = await fetchUsers();
      setUsers(fetchedUsers);
      console.log(fetchedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  useEffect(() => {
    fetchAllUsers();
  }, []);

  const handleEditRetailCode = (userId: string) => {
    setEditRetailCode(userId);
  };

  const handleCancelEdit = () => {
    setEditRetailCode(null);
    setNewRetailCode('');
  };

  const handleUpdateRetailCode = async (userId: string) => {
    try {
      await updateUserRetailCode(userId, newRetailCode);
      toast.success(`Retail code updated successfully for user ${userId}`);
      setEditRetailCode(null);
      setNewRetailCode('');
      fetchAllUsers(); // Refresh the users list
    } catch (error) {
      toast.error('Failed to update retail code');
      console.error('Error updating retail code:', error);
    }
  };

  return (
    <>
      <Toaster position="top-right" reverseOrder={false} />
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Users</h1>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-200">
              <th className="p-2 border border-gray-300">User ID</th>
              <th className="p-2 border border-gray-300">Email</th>
              <th className="p-2 border border-gray-300">Name</th>
              <th className="p-2 border border-gray-300">Phone</th>
              <th className="p-2 border border-gray-300">Retail Code</th>
              <th className="p-2 border border-gray-300">Address</th>
              <th className="p-2 border border-gray-300">Shop Name</th>
              <th className="p-2 border border-gray-300">Pincode</th>
              <th className="p-2 border border-gray-300">Created At</th>
              <th className="p-2 border border-gray-300">Updated At</th>
              <th className="p-2 border border-gray-300">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user:any) => (
              <tr key={user.userId} className="hover:bg-gray-100">
                <td className="p-2 border border-gray-300">{user.userId}</td>
                <td className="p-2 border border-gray-300">{user.email}</td>
                <td className="p-2 border border-gray-300">{user.name}</td>
                <td className="p-2 border border-gray-300">{user.phone}</td>
                <td className="p-2 border border-gray-300">
                  {editRetailCode === user.userId ? (
                    <input
                      type="text"
                      value={newRetailCode}
                      onChange={(e) => setNewRetailCode(e.target.value)}
                      className="border border-gray-300 p-1 rounded"
                    />
                  ) : (
                    user.retailCode
                  )}
                </td>
                <td className="p-2 border border-gray-300">{user.address}</td>
                <td className="p-2 border border-gray-300">{user.shopName}</td>
                <td className="p-2 border border-gray-300">{user.pincode}</td>
                <td className="p-2 border border-gray-300">{new Date(user.createdAt).toLocaleString()}</td>
                <td className="p-2 border border-gray-300">{new Date(user.updatedAt).toLocaleString()}</td>
                <td className="p-2 border border-gray-300">
                  {editRetailCode === user.userId ? (
                    <button
                      onClick={() => handleUpdateRetailCode(user.$id)}
                      className="bg-green-500 text-white p-1 rounded mr-2"
                    >
                      Save
                    </button>
                  ) : (
                    <button
                      onClick={() => handleEditRetailCode(user.userId)}
                      className="bg-blue-500 text-white p-1 rounded mr-2"
                    >
                      Edit
                    </button>
                  )}
                  {editRetailCode === user.userId && (
                    <button
                      onClick={handleCancelEdit}
                      className="bg-red-500 text-white p-1 rounded"
                    >
                      Cancel
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}