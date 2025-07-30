
"use client"

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { KeyRound, User, AtSign, LoaderCircle } from 'lucide-react';


export default function SignupPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { signup } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast({ title: 'Password too short', description: 'Password must be at least 6 characters.', variant: 'destructive' });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: 'Passwords do not match', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    
    const result = await signup(fullName, email, password);
    if (result.success) {
        toast({
            title: 'Signup Successful!',
            description: 'Your account has been created. Please check your email to verify your account before logging in.',
            duration: 8000,
            className: 'bg-accent text-accent-foreground',
        });
        router.push('/login');
    } else {
        toast({ title: 'Signup Failed', description: result.message, variant: 'destructive' });
    }
    setIsSubmitting(false);
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Create your Account</CardTitle>
          <CardDescription>
            Enter your details to get started.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="fullName" placeholder="e.g., Jane Doe" value={fullName} onChange={(e) => setFullName(e.target.value)} required disabled={isSubmitting} className="pl-10" />
                  </div>
              </div>
              <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="email" type="email" placeholder="e.g., student@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={isSubmitting} className="pl-10" />
                  </div>
              </div>
              <div className="space-y-2">
                  <Label htmlFor="password">Create Password</Label>
                   <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={isSubmitting} className="pl-10" />
                  </div>
              </div>
              <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                   <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required disabled={isSubmitting} className="pl-10" />
                  </div>
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? <LoaderCircle className="animate-spin" /> : 'Create Account'}
              </Button>
              <div className="text-center text-sm text-muted-foreground">
                  Already have an account?{' '}
                  <Button variant="link" asChild className="p-0 h-auto">
                      <Link href="/login">Log in</Link>
                  </Button>
              </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
