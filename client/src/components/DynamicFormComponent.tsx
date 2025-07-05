
import { useState, useEffect, useCallback } from 'react';
import { trpc } from '@/utils/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import type { FormWithFields, FormField, CreateSubscriptionInput } from '../../../server/src/schema';
import { CheckCircle, Calendar, FileText } from 'lucide-react';

interface DynamicFormComponentProps {
  formId: number;
  onSuccess?: () => void;
}

type FormFieldValue = string | number | boolean | string[];

export function DynamicFormComponent({ formId, onSuccess }: DynamicFormComponentProps) {
  const [form, setForm] = useState<FormWithFields | null>(null);
  const [formData, setFormData] = useState<Record<string, FormFieldValue>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadForm = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await trpc.getFormById.query({ id: formId });
      setForm(result);
      
      // Initialize form data with default values
      const initialData: Record<string, FormFieldValue> = {};
      result.fields.forEach((field: FormField) => {
        if (field.field_type === 'checkbox') {
          initialData[field.field_name] = [];
        } else {
          initialData[field.field_name] = '';
        }
      });
      setFormData(initialData);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const submissionData: CreateSubscriptionInput = {
        form_id: formId,
        data: formData as Record<string, unknown>
      };

      await trpc.submitForm.mutate(submissionData);
      setSuccess('Form submitted successfully!');
      
      // Reset form data
      const resetData: Record<string, FormFieldValue> = {};
      form?.fields.forEach((field: FormField) => {
        if (field.field_type === 'checkbox') {
          resetData[field.field_name] = [];
        } else {
          resetData[field.field_name] = '';
        }
      });
      setFormData(resetData);
      
      // Call success callback after a short delay
      setTimeout(() => {
        onSuccess?.();
      }, 2000);
    } catch (err) {
      console.error('Failed to submit form:', err);
      setError('Failed to submit form. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFieldChange = (fieldName: string, value: FormFieldValue) => {
    setFormData((prev: Record<string, FormFieldValue>) => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const handleCheckboxChange = (fieldName: string, optionValue: string, checked: boolean) => {
    setFormData((prev: Record<string, FormFieldValue>) => {
      const currentValues = prev[fieldName] as string[] || [];
      if (checked) {
        return { ...prev, [fieldName]: [...currentValues, optionValue] };
      } else {
        return { ...prev, [fieldName]: currentValues.filter((v: string) => v !== optionValue) };
      }
    });
  };

  const renderField = (field: FormField) => {
    const value = formData[field.field_name] || '';

    switch (field.field_type) {
      case 'text':
        return (
          <Input
            type="text"
            value={String(value)}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
              handleFieldChange(field.field_name, e.target.value)
            }
            placeholder={field.placeholder || undefined}
            required={field.is_required}
          />
        );

      case 'number':
        return (
          <Input
            type="number"
            value={String(value)}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
              handleFieldChange(field.field_name, e.target.value)
            }
            placeholder={field.placeholder || undefined}
            required={field.is_required}
          />
        );

      case 'textarea':
        return (
          <Textarea
            value={String(value)}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => 
              handleFieldChange(field.field_name, e.target.value)
            }
            placeholder={field.placeholder || undefined}
            required={field.is_required}
            rows={4}
          />
        );

      case 'date':
        return (
          <Input
            type="date"
            value={String(value)}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
              handleFieldChange(field.field_name, e.target.value)
            }
            required={field.is_required}
          />
        );

      case 'select':
        return (
          <Select
            value={String(value)}
            onValueChange={(newValue: string) => handleFieldChange(field.field_name, newValue)}
            required={field.is_required}
          >
            <SelectTrigger>
              <SelectValue placeholder={field.placeholder || 'Select an option'} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option, index) => (
                <SelectItem key={index} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'radio':
        return (
          <RadioGroup
            value={String(value)}
            onValueChange={(newValue: string) => handleFieldChange(field.field_name, newValue)}
            required={field.is_required}
          >
            {field.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={option.value} id={`${field.field_name}-${index}`} />
                <Label htmlFor={`${field.field_name}-${index}`}>{option.label}</Label>
              </div>
            ))}
          </RadioGroup>
        );

      case 'checkbox': {
        const checkboxValues = formData[field.field_name] as string[] || [];
        return (
          <div className="space-y-2">
            {field.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Checkbox
                  id={`${field.field_name}-${index}`}
                  checked={checkboxValues.includes(option.value)}
                  onCheckedChange={(checked: boolean) => 
                    handleCheckboxChange(field.field_name, option.value, checked)
                  }
                />
                <Label htmlFor={`${field.field_name}-${index}`}>{option.label}</Label>
              </div>
            ))}
          </div>
        );
      }

      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading form...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertDescription className="text-red-700">
          {error}
        </AlertDescription>
      </Alert>
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

  if (success) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className="text-center">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-green-800 mb-2">Form Submitted Successfully!</h3>
            <p className="text-green-700">{success}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-6 w-6" />
          {form.name}
        </CardTitle>
        {form.description && (
          <CardDescription className="text-blue-100">
            {form.description}
          </CardDescription>
        )}
        <div className="flex items-center gap-2 text-sm text-blue-100">
          <Calendar className="h-4 w-4" />
          Created: {form.created_at.toLocaleDateString()}
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {form.fields
            .sort((a: FormField, b: FormField) => a.order - b.order)
            .map((field: FormField) => (
              <div key={field.id} className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor={field.field_name} className="text-sm font-medium">
                    {field.field_name}
                  </Label>
                  {field.is_required && (
                    <Badge variant="destructive" className="text-xs">
                      Required
                    </Badge>
                  )}
                </div>
                {renderField(field)}
              </div>
            ))}

          <div className="flex gap-4 pt-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Form'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
