
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useUser } from '@/hooks/use-data';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { LoaderCircle, KeyRound, AtSign } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { loginWithPassword, loading } = useAuth();
  const user = useUser();
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      if (user.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    }
  }, [user, loading, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const { success, message } = await loginWithPassword(email, password);
    if (success) {
      toast({
        title: 'Login Successful!',
        description: 'Redirecting to your dashboard...',
      });
      // The useEffect will handle redirection
    } else {
      toast({
        title: 'Login Failed',
        description: message,
        variant: 'destructive',
      });
      setIsSubmitting(false);
    }
  };
  
  if (loading || user) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <div className="w-full max-w-md space-y-4">
          <Skeleton className="h-10 w-1/3" />
          <Skeleton className="h-6 w-2/3" />
          <div className="space-y-2 pt-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex min-h-[80vh] items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Welcome to UdaanSarthi</CardTitle>
          <CardDescription>
            Log in with your email and password to continue.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="e.g., student@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isSubmitting}
                    className="pl-10"
                  />
                </div>
              </div>
               <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                 <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isSubmitting}
                    className="pl-10"
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? <LoaderCircle className="animate-spin" /> : 'Login'}
              </Button>
               <div className="text-center text-sm">
                  <Button variant="link" asChild className="p-0 h-auto font-normal">
                    <Link href="/forgot-password">Forgot your password?</Link>
                  </Button>
              </div>
              <div className="text-center text-sm text-muted-foreground">
                Don't have an account?{' '}
                <Button variant="link" asChild className="p-0 h-auto">
                  <Link href="/signup">Sign up</Link>
                </Button>
              </div>
            </form>
        </CardContent>
      </Card>
    </div>
  );
}
