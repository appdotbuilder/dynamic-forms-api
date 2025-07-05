
import { useState, useEffect, useCallback } from 'react';
import { trpc } from '@/utils/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import type { User, UpdateUserInput, UserRole } from '../../../server/src/schema';
import { Users, Calendar, Edit, Trash2, Shield, Mail } from 'lucide-react';

export function UserManager() {
  const [users, setUsers] = useState<User[]>([]);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await trpc.getAllUsers.query();
      setUsers(result);
    } catch (err) {
      console.error('Failed to load users:', err);
      setError('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      const updateData: UpdateUserInput = {
        id: editingUser.id,
        email: editingUser.email,
        role: editingUser.role
      };
      
      const result = await trpc.updateUser.mutate(updateData);
      setUsers((prev: User[]) => 
        prev.map((user: User) => user.id === editingUser.id ? result : user)
      );
      setEditingUser(null);
    } catch (err) {
      console.error('Failed to update user:', err);
      setError('Failed to update user');
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    try {
      await trpc.deleteUser.mutate({ id: userId });
      setUsers((prev: User[]) => prev.filter((user: User) => user.id !== userId));
    } catch (err) {
      console.error('Failed to delete user:', err);
      setError('Failed to delete user');
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'manager': return 'bg-blue-100 text-blue-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield className="h-4 w-4" />;
      case 'manager': return <Users className="h-4 w-4" />;
      default: return <Mail className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading users...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-700">
            {error}
          </AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">User Management</h2>
        <Badge className="bg-blue-100 text-blue-800">
          {users.length} Total Users
        </Badge>
      </div>

      <div className="grid gap-4">
        {users.map((user: User) => (
          <Card key={user.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  {user.email}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge className={`${getRoleColor(user.role)} flex items-center gap-1`}>
                    {getRoleIcon(user.role)}
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </Badge>
                </div>
              </div>
              <CardDescription>
                User ID: {user.id}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Calendar className="h-4 w-4" />
                  Created: {user.created_at.toLocaleDateString()}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Calendar className="h-4 w-4" />
                  Updated: {user.updated_at.toLocaleDateString()}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingUser(user)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit User</DialogTitle>
                      <DialogDescription>
                        Update user details and role
                      </DialogDescription>
                    </DialogHeader>
                    {editingUser && (
                      <form onSubmit={handleUpdateUser} className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Email</label>
                          <input
                            type="email"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                            value={editingUser.email}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              setEditingUser((prev: User | null) => prev ? { ...prev, email: e.target.value } : null)
                            }
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Role</label>
                          <Select
                            value={editingUser.role}
                            onValueChange={(value: string) =>
                              setEditingUser((prev: User | null) => prev ? { ...prev, role: value as UserRole } : null)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">User</SelectItem>
                              <SelectItem value="manager">Manager</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button type="submit" className="w-full">
                          Update User
                        </Button>
                      </form>
                    )}
                  </DialogContent>
                </Dialog>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteUser(user.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {users.length === 0 && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">No users found</p>
          <p className="text-gray-500 text-sm mt-2">
            Users will appear here once they register
          </p>
        </div>
      )}
    </div>
  );
}
