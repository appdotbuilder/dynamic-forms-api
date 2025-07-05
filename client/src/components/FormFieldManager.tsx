
import { useState, useEffect, useCallback } from 'react';
import { trpc } from '@/utils/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import type { FormWithFields, FormField, CreateFormFieldInput, FieldOption, FieldType } from '../../../server/src/schema';
import { Plus, Trash2, Settings } from 'lucide-react';

interface FormFieldManagerProps {
  formId: number;
}

export function FormFieldManager({ formId }: FormFieldManagerProps) {
  const [form, setForm] = useState<FormWithFields | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newFieldData, setNewFieldData] = useState<CreateFormFieldInput>({
    form_id: formId,
    field_name: '',
    field_type: 'text',
    is_required: false,
    order: 1,
    options: null,
    placeholder: null
  });

  const [fieldOptions, setFieldOptions] = useState<FieldOption[]>([]);

  const loadForm = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await trpc.getFormById.query({ id: formId });
      setForm(result);
      // Set next order for new fields
      const maxOrder = result.fields.length > 0 ? Math.max(...result.fields.map(f => f.order)) : 0;
      setNewFieldData(prev => ({ ...prev, order: maxOrder + 1 }));
    } catch (err) {
      console.error('Failed to load form:', err);
      setError('Failed to load form details');
    } finally {
      setIsLoading(false);
    }
  }, [formId]);

  useEffect(() => {
    loadForm();
  }, [loadForm]);

  const handleCreateField = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const fieldData = {
        ...newFieldData,
        options: needsOptions(newFieldData.field_type) ? fieldOptions : null
      };
      
      const result = await trpc.createFormField.mutate(fieldData);
      setForm((prev: FormWithFields | null) => prev ? {
        ...prev,
        fields: [...prev.fields, result]
      } : null);
      
      // Reset form
      setNewFieldData({
        form_id: formId,
        field_name: '',
        field_type: 'text',
        is_required: false,
        order: (form?.fields.length || 0) + 1,
        options: null,
        placeholder: null
      });
      setFieldOptions([]);
      setIsCreateDialogOpen(false);
    } catch (err) {
      console.error('Failed to create field:', err);
      setError('Failed to create field');
    }
  };

  const handleDeleteField = async (fieldId: number) => {
    if (!window.confirm('Are you sure you want to delete this field?')) return;

    try {
      await trpc.deleteFormField.mutate({ id: fieldId });
      setForm((prev: FormWithFields | null) => prev ? {
        ...prev,
        fields: prev.fields.filter(f => f.id !== fieldId)
      } : null);
    } catch (err) {
      console.error('Failed to delete field:', err);
      setError('Failed to delete field');
    }
  };

  const needsOptions = (fieldType: FieldType) => {
    return ['select', 'radio', 'checkbox'].includes(fieldType);
  };

  const addOption = () => {
    setFieldOptions(prev => [...prev, { value: '', label: '' }]);
  };

  const updateOption = (index: number, key: 'value' | 'label', value: string) => {
    setFieldOptions(prev => prev.map((option, i) => 
      i === index ? { ...option, [key]: value } : option
    ));
  };

  const removeOption = (index: number) => {
    setFieldOptions(prev => prev.filter((_, i) => i !== index));
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading form details...</p>
      </div>
    );
  }

  if (!form) {
    return (
      <Alert className="border-yellow-200 bg-yellow-50">
        <AlertDescription className="text-yellow-700">
          Form not found
        </AlertDescription>
      </Alert>
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Form: {form.name}</span>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Field
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add New Field</DialogTitle>
                  <DialogDescription>
                    Add a new field to the form
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateField} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="field-name">Field Name</Label>
                      <Input
                        id="field-name"
                        value={newFieldData.field_name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setNewFieldData((prev: CreateFormFieldInput) => ({ ...prev, field_name: e.target.value }))
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="field-type">Field Type</Label>
                      <Select
                        value={newFieldData.field_type || 'text'}
                        onValueChange={(value: string) => {
                          setNewFieldData((prev: CreateFormFieldInput) => ({ ...prev, field_type: value as FieldType }));
                          if (!needsOptions(value as FieldType)) {
                            setFieldOptions([]);
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">Text</SelectItem>
                          <SelectItem value="number">Number</SelectItem>
                          <SelectItem value="textarea">Textarea</SelectItem>
                          <SelectItem value="date">Date</SelectItem>
                          <SelectItem value="select">Select</SelectItem>
                          <SelectItem value="radio">Radio</SelectItem>
                          <SelectItem value="checkbox">Checkbox</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="field-placeholder">Placeholder (optional)</Label>
                      <Input
                        id="field-placeholder"
                        value={newFieldData.placeholder || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setNewFieldData((prev: CreateFormFieldInput) => ({ 
                            ...prev, 
                            placeholder: e.target.value || null 
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="field-order">Order</Label>
                      <Input
                        id="field-order"
                        type="number"
                        value={newFieldData.order}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setNewFieldData((prev: CreateFormFieldInput) => ({ 
                            ...prev, 
                            order: parseInt(e.target.value) || 1 
                          }))
                        }
                        min="1"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="field-required"
                      checked={newFieldData.is_required}
                      onCheckedChange={(checked: boolean) =>
                        setNewFieldData((prev: CreateFormFieldInput) => ({ ...prev, is_required: checked }))
                      }
                    />
                    <Label htmlFor="field-required">Required</Label>
                  </div>

                  {needsOptions(newFieldData.field_type) && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Options</Label>
                        <Button type="button" variant="outline" size="sm" onClick={addOption}>
                          <Plus className="h-4 w-4 mr-1" />
                          Add Option
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {fieldOptions.map((option, index) => (
                          <div key={index} className="flex gap-2">
                            <Input
                              placeholder="Value"
                              value={option.value}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                updateOption(index, 'value', e.target.value)
                              }
                              required
                            />
                            <Input
                              placeholder="Label"
                              value={option.label}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                updateOption(index, 'label', e.target.value)
                              }
                              required
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeOption(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <Button type="submit" className="w-full">
                    Add Field
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </CardTitle>
          <CardDescription>
            Manage form fields and their configuration
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="space-y-4">
        {form.fields
          .sort((a: FormField, b: FormField) => a.order - b.order)
          .map((field: FormField) => (
            <Card key={field.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {field.field_name}
                      <Badge variant="secondary">{field.field_type}</Badge>
                      {field.is_required && (
                        <Badge variant="destructive">Required</Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      Order: {field.order}
                      {field.placeholder && ` • Placeholder: ${field.placeholder}`}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteField(field.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {field.options && field.options.length > 0 && (
                <CardContent>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Options:</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {field.options.map((option, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <Badge variant="outline">{option.value}</Badge>
                          <span>{option.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
      </div>

      {form.fields.length === 0 && (
        <div className="text-center py-12">
          <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">No fields added yet</p>
          <p className="text-gray-500 text-sm mt-2">
            Add fields to make this form functional
          </p>
        </div>
      )}
    </div>
  );
}
