'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Package, Loader2, Mail, ArrowLeft, CheckCircle } from 'lucide-react';

const resetRequestSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

const resetConfirmSchema = z.object({
  new_password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  confirm_password: z.string(),
}).refine((data) => data.new_password === data.confirm_password, {
  message: "Passwords don't match",
  path: ['confirm_password'],
});

type ResetRequestFormData = z.infer<typeof resetRequestSchema>;
type ResetConfirmFormData = z.infer<typeof resetConfirmSchema>;

export default function PasswordResetPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  // Check if this is a reset confirmation (has token) or reset request
  const token = searchParams.get('token');
  const isConfirmation = !!token;

  const requestForm = useForm<ResetRequestFormData>({
    resolver: zodResolver(resetRequestSchema),
  });

  const confirmForm = useForm<ResetConfirmFormData>({
    resolver: zodResolver(resetConfirmSchema),
  });

  const onRequestReset = async (data: ResetRequestFormData) => {
    try {
      setIsLoading(true);
      setError('');
      
      // TODO: Implement password reset request API
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      setSuccess(true);
    } catch (error: any) {
      setError(error.message || 'Failed to send reset email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const onConfirmReset = async (data: ResetConfirmFormData) => {
    try {
      setIsLoading(true);
      setError('');
      
      // TODO: Implement password reset confirmation API
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      setSuccess(true);
    } catch (error: any) {
      setError(error.message || 'Failed to reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-primary/5 to-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center space-x-2">
              <Package className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold">RentalPro</span>
            </div>
          </div>

          <Card className="w-full">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
                <div>
                  <h2 className="text-2xl font-bold">
                    {isConfirmation ? 'Password Reset Complete' : 'Check Your Email'}
                  </h2>
                  <p className="text-muted-foreground mt-2">
                    {isConfirmation 
                      ? 'Your password has been successfully reset. You can now sign in with your new password.'
                      : 'We\'ve sent a password reset link to your email address. Please check your inbox and follow the instructions.'
                    }
                  </p>
                </div>
                <div className="space-y-2">
                  <Link href="/auth/login" className="w-full">
                    <Button className="w-full">
                      {isConfirmation ? 'Sign In' : 'Back to Sign In'}
                    </Button>
                  </Link>
                  {!isConfirmation && (
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => setSuccess(false)}
                    >
                      Didn't receive email? Try again
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-primary/5 to-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-2">
            <Package className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">RentalPro</span>
          </div>
        </div>

        <Card className="w-full">
          <CardHeader className="space-y-1">
            <div className="flex items-center space-x-2 mb-2">
              <Link href="/auth/login">
                <Button variant="ghost" size="sm" className="p-0 h-auto">
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back to login
                </Button>
              </Link>
            </div>
            <CardTitle className="text-2xl text-center">
              {isConfirmation ? 'Reset Your Password' : 'Forgot Password?'}
            </CardTitle>
            <CardDescription className="text-center">
              {isConfirmation 
                ? 'Enter your new password below'
                : 'No worries! Enter your email and we\'ll send you reset instructions'
              }
            </CardDescription>
          </CardHeader>

          {isConfirmation ? (
            <form onSubmit={confirmForm.handleSubmit(onConfirmReset)}>
              <CardContent className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="new_password">New Password</Label>
                  <Input
                    id="new_password"
                    type="password"
                    placeholder="Enter your new password"
                    {...confirmForm.register('new_password')}
                  />
                  {confirmForm.formState.errors.new_password && (
                    <p className="text-sm text-destructive">
                      {confirmForm.formState.errors.new_password.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm_password">Confirm New Password</Label>
                  <Input
                    id="confirm_password"
                    type="password"
                    placeholder="Confirm your new password"
                    {...confirmForm.register('confirm_password')}
                  />
                  {confirmForm.formState.errors.confirm_password && (
                    <p className="text-sm text-destructive">
                      {confirmForm.formState.errors.confirm_password.message}
                    </p>
                  )}
                </div>
              </CardContent>

              <CardFooter>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Reset Password
                </Button>
              </CardFooter>
            </form>
          ) : (
            <form onSubmit={requestForm.handleSubmit(onRequestReset)}>
              <CardContent className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email address"
                      className="pl-10"
                      {...requestForm.register('email')}
                    />
                  </div>
                  {requestForm.formState.errors.email && (
                    <p className="text-sm text-destructive">
                      {requestForm.formState.errors.email.message}
                    </p>
                  )}
                </div>
              </CardContent>

              <CardFooter className="flex flex-col space-y-4">
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Send Reset Instructions
                </Button>

                <div className="text-center text-sm text-muted-foreground">
                  Remember your password?{' '}
                  <Link href="/auth/login" className="text-primary hover:underline">
                    Sign in
                  </Link>
                </div>
              </CardFooter>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
