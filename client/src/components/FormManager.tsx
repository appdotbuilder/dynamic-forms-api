
import { useState, useEffect, useCallback } from 'react';
import { trpc } from '@/utils/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FormFieldManager } from '@/components/FormFieldManager';
import type { Form, CreateFormInput, UpdateFormInput } from '../../../server/src/schema';
import { Plus, Edit, Trash2, Settings, FileText, Calendar, User } from 'lucide-react';

export function FormManager() {
  const [forms, setForms] = useState<Form[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingForm, setEditingForm] = useState<Form | null>(null);
  const [selectedFormId, setSelectedFormId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newFormData, setNewFormData] = useState<CreateFormInput>({
    name: '',
    description: null,
    is_active: true
  });

  const loadForms = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await trpc.getAllForms.query();
      setForms(result);
    } catch (err) {
      console.error('Failed to load forms:', err);
      setError('Failed to load forms');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadForms();
  }, [loadForms]);

  const handleCreateForm = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await trpc.createForm.mutate(newFormData);
      setForms((prev: Form[]) => [...prev, result]);
      setNewFormData({ name: '', description: null, is_active: true });
      setIsCreateDialogOpen(false);
    } catch (err) {
      console.error('Failed to create form:', err);
      setError('Failed to create form');
    }
  };

  const handleUpdateForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingForm) return;

    try {
      const updateData: UpdateFormInput = {
        id: editingForm.id,
        name: editingForm.name,
        description: editingForm.description,
        is_active: editingForm.is_active
      };
      
      const result = await trpc.updateForm.mutate(updateData);
      setForms((prev: Form[]) => 
        prev.map((form: Form) => form.id === editingForm.id ? result : form)
      );
      setEditingForm(null);
    } catch (err) {
      console.error('Failed to update form:', err);
      setError('Failed to update form');
    }
  };

  const handleDeleteForm = async (formId: number) => {
    if (!window.confirm('Are you sure you want to delete this form?')) return;

    try {
      await trpc.deleteForm.mutate({ id: formId });
      setForms((prev: Form[]) => prev.filter((form: Form) => form.id !== formId));
    } catch (err) {
      console.error('Failed to delete form:', err);
      setError('Failed to delete form');
    }
  };

  if (selectedFormId) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Manage Form Fields</h3>
          <Button 
            variant="outline" 
            onClick={() => setSelectedFormId(null)}
          >
            ← Back to Forms
          </Button>
        </div>
        <FormFieldManager formId={selectedFormId} />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading forms...</p>
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
        <h2 className="text-xl font-semibold">Form Management</h2>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700">
              <Plus className="h-4 w-4 mr-2" />
              Create New Form
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Form</DialogTitle>
              <DialogDescription>
                Create a new dynamic form for subscriptions
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateForm} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="form-name">Form Name</Label>
                <Input
                  id="form-name"
                  value={newFormData.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNewFormData((prev: CreateFormInput) => ({ ...prev, name: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="form-description">Description (optional)</Label>
                <Textarea
                  id="form-description"
                  value={newFormData.description || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setNewFormData((prev: CreateFormInput) => ({ 
                      ...prev, 
                      description: e.target.value || null 
                    }))
                  }
                  rows={3}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="form-active"
                  checked={newFormData.is_active}
                  onCheckedChange={(checked: boolean) =>
                    setNewFormData((prev: CreateFormInput) => ({ ...prev, is_active: checked }))
                  }
                />
                <Label htmlFor="form-active">Active</Label>
              </div>
              <Button type="submit" className="w-full">
                Create Form
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {forms.map((form: Form) => (
          <Card key={form.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  {form.name}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge className={form.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                    {form.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
              {form.description && (
                <CardDescription>{form.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Calendar className="h-4 w-4" />
                  Created: {form.created_at.toLocaleDateString()}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <User className="h-4 w-4" />
                  Created by User #{form.created_by_user_id}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedFormId(form.id)}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Manage Fields
                </Button>
                
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingForm(form)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit Form</DialogTitle>
                      <DialogDescription>
                        Update form details
                      </DialogDescription>
                    </DialogHeader>
                    {editingForm && (
                      <form onSubmit={handleUpdateForm} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="edit-form-name">Form Name</Label>
                          <Input
                            id="edit-form-name"
                            value={editingForm.name}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              setEditingForm((prev: Form | null) => prev ? { ...prev, name: e.target.value } : null)
                            }
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-form-description">Description</Label>
                          <Textarea
                            id="edit-form-description"
                            value={editingForm.description || ''}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                              setEditingForm((prev: Form | null) => prev ? { 
                                ...prev, 
                                description: e.target.value || null 
                              } : null)
                            }
                            rows={3}
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="edit-form-active"
                            checked={editingForm.is_active}
                            onCheckedChange={(checked: boolean) =>
                              setEditingForm((prev: Form | null) => prev ? { ...prev, is_active: checked } : null)
                            }
                          />
                          <Label htmlFor="edit-form-active">Active</Label>
                        </div>
                        <Button type="submit" className="w-full">
                          Update Form
                        </Button>
                      </form>
                    )}
                  </DialogContent>
                </Dialog>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteForm(form.id)}
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

      {forms.length === 0 && (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">No forms created yet</p>
          <p className="text-gray-500 text-sm mt-2">
            Create your first form to get started
          </p>
        </div>
      )}
    </div>
  );
}
