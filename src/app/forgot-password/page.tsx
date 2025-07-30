
"use client";

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const { forgotPassword } = useAuth();
    const { toast } = useToast();
    const router = useRouter();

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        const { success, message } = await forgotPassword(email);
        if (success) {
            toast({ title: 'Success', description: message });
            router.push('/login');
        } else {
            toast({ title: 'Error', description: message, variant: 'destructive' });
        }
    };

    return (
        <div className="flex min-h-[80vh] items-center justify-center">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-2xl">Forgot Password</CardTitle>
                    <CardDescription>
                        Enter your email address and we'll send you a link to reset your password.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleResetPassword} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input id="email" type="email" placeholder="e.g., student@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                        </div>
                        <Button type="submit" className="w-full">Send Reset Link</Button>
                        <div className="text-center">
                            <Button variant="link" asChild className="p-0 h-auto">
                                <Link href="/login">Back to Login</Link>
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
