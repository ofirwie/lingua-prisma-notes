import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { BookOpen } from 'lucide-react';

const CORRECT_PASSWORD = 'Churro393$';
const FIXED_EMAIL = 'admin@deutsche-lernen.com';
const FIXED_SUPABASE_PASSWORD = 'Deutsche2024!Churro';

const SimpleAuth = () => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  // Auto-redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      navigate('/dashboard');
    }
  }, [user, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password) {
      toast({
        title: 'Error',
        description: 'Please enter a password',
        variant: 'destructive',
      });
      return;
    }

    if (password !== CORRECT_PASSWORD) {
      toast({
        title: 'Access Denied',
        description: 'Incorrect password',
        variant: 'destructive',
      });
      setPassword('');
      return;
    }

    setLoading(true);

    try {
      // Try to sign in first
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: FIXED_EMAIL,
        password: FIXED_SUPABASE_PASSWORD,
      });

      if (signInError) {
        // If sign in fails, try to sign up (first time setup)
        if (signInError.message.includes('Invalid login credentials')) {
          const { error: signUpError } = await supabase.auth.signUp({
            email: FIXED_EMAIL,
            password: FIXED_SUPABASE_PASSWORD,
            options: {
              data: {
                name: 'Admin User',
                native_language: 'hebrew',
              },
            },
          });

          if (signUpError) {
            throw signUpError;
          }

          // After sign up, sign in immediately
          const { error: secondSignInError } = await supabase.auth.signInWithPassword({
            email: FIXED_EMAIL,
            password: FIXED_SUPABASE_PASSWORD,
          });

          if (secondSignInError) {
            throw secondSignInError;
          }
        } else {
          throw signInError;
        }
      }

      toast({
        title: 'Welcome!',
        description: 'Access granted',
      });

      navigate('/dashboard');
    } catch (error: any) {
      console.error('Auth error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to authenticate',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-primary p-3">
              <BookOpen className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Deutsche Lernen</CardTitle>
          <CardDescription>
            Enter the password to access the application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Checking...' : 'Enter'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SimpleAuth;
