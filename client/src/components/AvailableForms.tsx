
import { useState, useEffect, useCallback } from 'react';
import { trpc } from '@/utils/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { DynamicFormComponent } from '@/components/DynamicFormComponent';
import type { Form } from '../../../server/src/schema';
import { FileText, Calendar, User } from 'lucide-react';

export function AvailableForms() {
  const [forms, setForms] = useState<Form[]>([]);
  const [selectedFormId, setSelectedFormId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadForms = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await trpc.getAvailableForms.query();
      setForms(result);
    } catch (err) {
      console.error('Failed to load forms:', err);
      setError('Failed to load available forms');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadForms();
  }, [loadForms]);

  const handleFormSubmissionSuccess = () => {
    setSelectedFormId(null);
    // Optionally refresh forms or show success message
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading available forms...</p>
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

  if (selectedFormId) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Submit Form</h3>
          <Button 
            variant="outline" 
            onClick={() => setSelectedFormId(null)}
          >
            ← Back to Forms
          </Button>
        </div>
        <DynamicFormComponent 
          formId={selectedFormId} 
          onSuccess={handleFormSubmissionSuccess}
        />
      </div>
    );
  }

  if (forms.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 text-lg">No active forms available</p>
        <p className="text-gray-500 text-sm mt-2">
          Check back later for new forms to submit
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {forms.map((form: Form) => (
          <Card key={form.id} className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                {form.name}
              </CardTitle>
              {form.description && (
                <CardDescription className="text-sm">
                  {form.description}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Calendar className="h-4 w-4" />
                  Created: {form.created_at.toLocaleDateString()}
                </div>
                <Badge className="bg-green-100 text-green-800">
                  Active
                </Badge>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                <User className="h-4 w-4" />
                Created by User #{form.created_by_user_id}
              </div>

              <Button 
                onClick={() => setSelectedFormId(form.id)}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                Submit Form
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
