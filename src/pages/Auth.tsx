import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { BookOpen } from 'lucide-react';
import { z } from 'zod';

const signupSchema = z.object({
  email: z.string().trim().email({ message: 'כתובת אימייל לא תקינה' }),
  password: z.string().min(6, { message: 'סיסמה חייבת להכיל לפחות 6 תווים' }),
  name: z.string().trim().min(1, { message: 'שם הוא שדה חובה' }),
  nativeLanguage: z.enum(['hebrew', 'english', 'italian']),
});

const loginSchema = z.object({
  email: z.string().trim().email({ message: 'כתובת אימייל לא תקינה' }),
  password: z.string().min(1, { message: 'סיסמה היא שדה חובה' }),
});

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [nativeLanguage, setNativeLanguage] = useState<'hebrew' | 'english' | 'italian'>('hebrew');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = loginSchema.safeParse({ email, password });
    if (!validation.success) {
      toast({
        title: 'שגיאת אימות',
        description: validation.error.errors[0].message,
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    
    const { error } = await supabase.auth.signInWithPassword({
      email: validation.data.email,
      password: validation.data.password,
    });

    setLoading(false);

    if (error) {
      toast({
        title: 'כניסה נכשלה',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      navigate('/dashboard');
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = signupSchema.safeParse({ email, password, name, nativeLanguage });
    if (!validation.success) {
      toast({
        title: 'שגיאת אימות',
        description: validation.error.errors[0].message,
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email: validation.data.email,
      password: validation.data.password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          name: validation.data.name,
          native_language: validation.data.nativeLanguage,
        },
      },
    });

    setLoading(false);

    if (error) {
      toast({
        title: 'הרשמה נכשלה',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'חשבון נוצר בהצלחה',
        description: 'כעת תוכל להיכנס עם פרטי ההתחברות שלך.',
      });
      navigate('/dashboard');
    }
  };

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
            {isLogin ? 'ברוך שובך! היכנס כדי להמשיך ללמוד.' : 'צור חשבון חדש כדי להתחיל ללמוד גרמנית.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={isLogin ? handleLogin : handleSignup} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="name">שם</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="הזן את שמך"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required={!isLogin}
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">אימייל</Label>
              <Input
                id="email"
                type="email"
                placeholder="הזן את כתובת האימייל שלך"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">סיסמה</Label>
              <Input
                id="password"
                type="password"
                placeholder="הזן את הסיסמה שלך"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="language">שפת אם</Label>
                <Select value={nativeLanguage} onValueChange={(value: 'hebrew' | 'english' | 'italian') => setNativeLanguage(value)}>
                  <SelectTrigger id="language">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hebrew">עברית (Hebrew)</SelectItem>
                    <SelectItem value="english">English</SelectItem>
                    <SelectItem value="italian">Italiano</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'אנא המתן...' : (isLogin ? 'כניסה' : 'יצירת חשבון')}
            </Button>

            <div className="text-center text-sm">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-primary hover:underline"
              >
                {isLogin ? "אין לך חשבון? הירשם" : 'כבר יש לך חשבון? היכנס'}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
