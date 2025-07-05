
import { useState, useEffect, useCallback } from 'react';
import { trpc } from '@/utils/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AuthComponent } from '@/components/AuthComponent';
import { FormManager } from '@/components/FormManager';
import { UserSubscriptions } from '@/components/UserSubscriptions';
import { SubscriptionManager } from '@/components/SubscriptionManager';
import { UserManager } from '@/components/UserManager';
import { AvailableForms } from '@/components/AvailableForms';
import type { User } from '../../server/src/schema';
import { Shield, Users, FileText, ClipboardList, AlertCircle, WifiOff } from 'lucide-react';

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  const getCurrentUser = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      setIsOfflineMode(false);
      const user = await trpc.getCurrentUser.query();
      setCurrentUser(user);
    } catch (err) {
      console.error('Failed to get current user:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      
      // Check if it's a network/server error
      if (errorMessage.includes('fetch') || errorMessage.includes('500') || errorMessage.includes('JSON')) {
        setIsOfflineMode(true);
        setError('Backend services are currently unavailable. Running in demo mode.');
      } else {
        setError('Failed to authenticate. Please log in.');
      }
      setCurrentUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    getCurrentUser();
  }, [getCurrentUser]);

  const handleLogin = () => {
    getCurrentUser();
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('auth_token');
  };

  const handleDemoMode = () => {
    // Create a demo user for offline mode
    const demoUser: User = {
      id: 1,
      email: 'demo@example.com',
      password_hash: 'demo_hash',
      role: 'admin',
      created_at: new Date(),
      updated_at: new Date()
    };
    setCurrentUser(demoUser);
    setIsOfflineMode(true);
    setError(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </Card>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-4">
          {error && (
            <Alert className="border-orange-200 bg-orange-50">
              <WifiOff className="h-4 w-4" />
              <AlertDescription className="text-orange-700">
                {error}
              </AlertDescription>
            </Alert>
          )}
          
          {isOfflineMode && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <AlertCircle className="h-8 w-8 text-blue-600 mx-auto" />
                  <div>
                    <h3 className="font-semibold text-blue-800 mb-2">Demo Mode Available</h3>
                    <p className="text-sm text-blue-700 mb-4">
                      Backend services are unavailable. You can explore the frontend interface in demo mode.
                    </p>
                    <Button 
                      onClick={handleDemoMode}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                    >
                      Continue in Demo Mode
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          <AuthComponent onLogin={handleLogin} />
        </div>
      </div>
    );
  }

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
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const canAccessUserManagement = currentUser.role === 'admin';
  const canAccessFormManagement = currentUser.role === 'admin' || currentUser.role === 'manager';
  const canAccessSubscriptionManagement = currentUser.role === 'admin' || currentUser.role === 'manager';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto p-4">
        {/* Header */}
        <div className="mb-6">
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-2xl font-bold">📋 Subscription System</CardTitle>
                  <CardDescription className="text-blue-100">
                    Dynamic forms and subscription management
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-sm text-blue-100">Welcome,</p>
                    <p className="font-semibold">{currentUser.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={`${getRoleColor(currentUser.role)} flex items-center gap-1`}>
                      {getRoleIcon(currentUser.role)}
                      {currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1)}
                    </Badge>
                    {isOfflineMode && (
                      <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300">
                        <WifiOff className="h-3 w-3 mr-1" />
                        Demo
                      </Badge>
                    )}
                  </div>
                  <Button 
                    onClick={handleLogout}
                    variant="outline"
                    className="border-white text-white hover:bg-white hover:text-blue-600"
                  >
                    Logout
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Demo Mode Notice */}
        {isOfflineMode && (
          <Alert className="mb-6 border-blue-200 bg-blue-50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-blue-700">
              <strong>Demo Mode:</strong> You're viewing the frontend interface. Backend services are unavailable, 
              but you can explore all UI components and interactions.
            </AlertDescription>
          </Alert>
        )}

        {/* Main Content */}
        <Tabs defaultValue="forms" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
            <TabsTrigger value="forms" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Available Forms
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              My Subscriptions
            </TabsTrigger>
            {canAccessFormManagement && (
              <TabsTrigger value="manage-forms" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Manage Forms
              </TabsTrigger>
            )}
            {canAccessSubscriptionManagement && (
              <TabsTrigger value="manage-subscriptions" className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4" />
                All Subscriptions
              </TabsTrigger>
            )}
            {canAccessUserManagement && (
              <TabsTrigger value="manage-users" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Manage Users
              </TabsTrigger>
            )}
          </TabsList>

          {/* Available Forms Tab */}
          <TabsContent value="forms" className="space-y-4">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  Available Forms
                </CardTitle>
                <CardDescription>
                  Submit subscriptions to active forms
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AvailableForms />
              </CardContent>
            </Card>
          </TabsContent>

          {/* My Subscriptions Tab */}
          <TabsContent value="subscriptions" className="space-y-4">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-green-600" />
                  My Subscriptions
                </CardTitle>
                <CardDescription>
                  View and track your submitted subscriptions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <UserSubscriptions />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Form Management Tab */}
          {canAccessFormManagement && (
            <TabsContent value="manage-forms" className="space-y-4">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-purple-600" />
                    Form Management
                  </CardTitle>
                  <CardDescription>
                    Create, edit, and manage dynamic forms
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FormManager />
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Subscription Management Tab */}
          {canAccessSubscriptionManagement && (
            <TabsContent value="manage-subscriptions" className="space-y-4">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ClipboardList className="h-5 w-5 text-orange-600" />
                    Subscription Management
                  </CardTitle>
                  <CardDescription>
                    Review and manage all subscriptions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <SubscriptionManager />
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* User Management Tab */}
          {canAccessUserManagement && (
            <TabsContent value="manage-users" className="space-y-4">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-red-600" />
                    User Management
                  </CardTitle>
                  <CardDescription>
                    Manage user accounts and roles
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <UserManager />
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}

export default App;
