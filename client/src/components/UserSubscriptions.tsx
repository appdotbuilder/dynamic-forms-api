
import { useState, useEffect, useCallback } from 'react';
import { trpc } from '@/utils/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import type { Subscription } from '../../../server/src/schema';
import { Calendar, Eye, FileText, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export function UserSubscriptions() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSubscriptions = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await trpc.getUserSubscriptions.query();
      setSubscriptions(result);
    } catch (err) {
      console.error('Failed to load subscriptions:', err);
      setError('Failed to load your subscriptions');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSubscriptions();
  }, [loadSubscriptions]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      case 'cancelled': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading your subscriptions...</p>
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

  if (subscriptions.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 text-lg">No subscriptions yet</p>
        <p className="text-gray-500 text-sm mt-2">
          Submit a form to create your first subscription
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4">
        {subscriptions.map((subscription: Subscription) => (
          <Card key={subscription.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  Subscription #{subscription.id}
                </CardTitle>
                <Badge className={`${getStatusColor(subscription.status)} flex items-center gap-1`}>
                  {getStatusIcon(subscription.status)}
                  {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                </Badge>
              </div>
              <CardDescription>
                Form ID: {subscription.form_id}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Calendar className="h-4 w-4" />
                  Submitted: {subscription.submitted_at.toLocaleDateString()}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Clock className="h-4 w-4" />
                  Updated: {subscription.updated_at.toLocaleDateString()}
                </div>
              </div>

              <div className="mt-4 flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  {Object.keys(subscription.data).length} fields submitted
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Subscription Details
                      </DialogTitle>
                      <DialogDescription>
                        Submission #{subscription.id} - Status: {subscription.status}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-700">Submitted</p>
                          <p className="text-sm text-gray-600">{subscription.submitted_at.toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Last Updated</p>
                          <p className="text-sm text-gray-600">{subscription.updated_at.toLocaleDateString()}</p>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Submitted Data</p>
                        <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                          {Object.entries(subscription.data).map(([key, value]) => (
                            <div key={key} className="flex justify-between">
                              <span className="font-medium text-gray-700">{key}:</span>
                              <span className="text-gray-600">
                                {Array.isArray(value) ? value.join(', ') : String(value)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
