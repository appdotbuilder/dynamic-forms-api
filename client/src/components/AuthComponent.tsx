
import { useState } from 'react';
import { trpc } from '@/utils/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { LoginInput, RegisterInput } from '../../../server/src/schema';
import { LogIn, UserPlus, Mail, Lock, AlertCircle } from 'lucide-react';

interface AuthComponentProps {
  onLogin: () => void;
}

export function AuthComponent({ onLogin }: AuthComponentProps) {
  const [loginData, setLoginData] = useState<LoginInput>({
    email: '',
    password: ''
  });
  const [registerData, setRegisterData] = useState<RegisterInput>({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await trpc.authLogin.mutate(loginData);
      setSuccess('Login successful!');
      // Store token if needed
      if (response.token) {
        localStorage.setItem('auth_token', response.token);
      }
      onLogin();
    } catch (err) {
      console.error('Login failed:', err);
      setError('Login failed. Please check your credentials and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await trpc.authRegister.mutate(registerData);
      setSuccess('Registration successful! You can now log in.');
      // Store token if needed
      if (response.token) {
        localStorage.setItem('auth_token', response.token);
      }
      onLogin();
    } catch (err) {
      console.error('Registration failed:', err);
      setError('Registration failed. Email may already be in use or server is unavailable.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full shadow-2xl">
      <CardHeader className="text-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
        <CardTitle className="text-2xl font-bold">🔐 Authentication</CardTitle>
        <CardDescription className="text-blue-100">
          Sign in to access the subscription system
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        {error && (
          <Alert className="mb-4 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-700">
              {error}
            </AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert className="mb-4 border-green-200 bg-green-50">
            <AlertDescription className="text-green-700">
              {success}
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login" className="flex items-center gap-2">
              <LogIn className="h-4 w-4" />
              Login
            </TabsTrigger>
            <TabsTrigger value="register" className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Register
            </TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="space-y-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="Enter your email"
                  value={loginData.email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setLoginData((prev: LoginInput) => ({ ...prev, email: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password" className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Password
                </Label>
                <Input
                  id="login-password"
                  type="password"
                  placeholder="Enter your password"
                  value={loginData.password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setLoginData((prev: LoginInput) => ({ ...prev, password: e.target.value }))
                  }
                  required
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700" 
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="register" className="space-y-4">
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="register-email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
                <Input
                  id="register-email"
                  type="email"
                  placeholder="Enter your email"
                  value={registerData.email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setRegisterData((prev: RegisterInput) => ({ ...prev, email: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-password" className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Password
                </Label>
                <Input
                  id="register-password"
                  type="password"
                  placeholder="Enter your password (min 8 characters)"
                  value={registerData.password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setRegisterData((prev: RegisterInput) => ({ ...prev, password: e.target.value }))
                  }
                  minLength={8}
                  required
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700" 
                disabled={isLoading}
              >
                {isLoading ? 'Creating account...' : 'Create Account'}
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        {/* Demo Mode Notice */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">Demo Mode</span>
          </div>
          <p className="text-xs text-blue-700">
            This is a demo application. Backend services may be unavailable. 
            The frontend is fully functional and ready for integration with a real backend.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
