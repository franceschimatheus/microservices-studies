'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/features/auth/hooks/useAuth';
import {
  loginSchema,
  signupSchema,
  LoginFormType,
  SignupFormType,
} from '@/features/auth/schemas/authSchema';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const { user, login, signup, loading } = useAuth();
  const router = useRouter();

  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      if (user.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/customer');
      }
    }
  }, [user, router]);

  // Forms
  const {
    register: registerLogin,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors },
  } = useForm<LoginFormType>({
    resolver: zodResolver(loginSchema),
  });

  const {
    register: registerSignup,
    handleSubmit: handleSignupSubmit,
    formState: { errors: signupErrors },
  } = useForm<SignupFormType>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      role: 'customer',
    },
  });

  const onLogin = async (data: LoginFormType) => {
    setSubmitError(null);
    try {
      const loggedUser = await login(data.email, data.password);
      if (loggedUser.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/customer');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Incorrect email or password';
      setSubmitError(message);
    }
  };

  const onSignup = async (data: SignupFormType) => {
    setSubmitError(null);
    setSubmitSuccess(null);
    try {
      await signup(data.email, data.password, data.role);
      setSubmitSuccess('Account created successfully! Auto signing in...');
      
      // Auto sign in
      setTimeout(async () => {
        try {
          const loggedUser = await login(data.email, data.password);
          if (loggedUser.role === 'admin') {
            router.push('/admin');
          } else {
            router.push('/customer');
          }
        } catch {
          setIsLogin(true);
          setSubmitSuccess(null);
        }
      }, 1500);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create account';
      setSubmitError(message);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-white font-sans items-center justify-center p-6">
      <div className="flex w-full max-w-[960px] min-h-[580px] bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        
        {/* Left Side branding panel */}
        <div className="hidden md:flex flex-col justify-end p-10 flex-1 relative bg-gradient-to-br from-red-600 to-red-950 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(99,102,241,0.15),transparent_60%)] pointer-events-none" />
          <div className="relative z-10">
            <h1 className="text-5xl font-black tracking-tighter mb-2">
              iFood<span className="text-yellow-400">.</span>
            </h1>
            <p className="text-white/80 font-light text-base leading-relaxed">
              The ultimate food delivery microservices platform.
            </p>
          </div>
        </div>

        {/* Right Side form panel */}
        <div className="flex flex-col justify-center px-6 py-12 md:px-12 flex-[1.1] bg-slate-900">
          
          {isLogin ? (
            <div className="w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
              <h2 className="text-3xl font-bold tracking-tight mb-2">Welcome Back</h2>
              <p className="text-slate-400 text-sm mb-8">Please sign in to access your dashboard</p>

              {submitError && (
                <div className="mb-6 p-4 text-sm bg-red-500/10 border border-red-500/25 rounded-xl text-red-500 font-medium">
                  {submitError}
                </div>
              )}

              <form onSubmit={handleLoginSubmit(onLogin)} className="flex flex-col gap-6">
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="you@example.com"
                  error={loginErrors.email?.message}
                  {...registerLogin('email')}
                />

                <Input
                  label="Password"
                  type="password"
                  placeholder="••••••••"
                  error={loginErrors.password?.message}
                  {...registerLogin('password')}
                />

                <Button type="submit" loading={loading} className="mt-2">
                  Sign In
                </Button>
              </form>

              <p className="text-center mt-6 text-sm text-slate-400">
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(false);
                    setSubmitError(null);
                  }}
                  className="text-red-500 hover:text-red-400 font-semibold cursor-pointer"
                >
                  Create one now
                </button>
              </p>
            </div>
          ) : (
            <div className="w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
              <h2 className="text-3xl font-bold tracking-tight mb-2">Create Account</h2>
              <p className="text-slate-400 text-sm mb-8">Join our distributed delivery system today</p>

              {submitError && (
                <div className="mb-6 p-4 text-sm bg-red-500/10 border border-red-500/25 rounded-xl text-red-500 font-medium">
                  {submitError}
                </div>
              )}

              {submitSuccess && (
                <div className="mb-6 p-4 text-sm bg-emerald-500/10 border border-emerald-500/25 rounded-xl text-emerald-500 font-medium">
                  {submitSuccess}
                </div>
              )}

              <form onSubmit={handleSignupSubmit(onSignup)} className="flex flex-col gap-6">
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="you@example.com"
                  error={signupErrors.email?.message}
                  {...registerSignup('email')}
                />

                <Input
                  label="Password"
                  type="password"
                  placeholder="••••••••"
                  error={signupErrors.password?.message}
                  {...registerSignup('password')}
                />

                <div className="flex flex-col gap-2 w-full">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    I want to join as
                  </label>
                  <select
                    className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3.5 text-white font-sans text-sm outline-none transition-all focus:border-red-500 focus:ring-4 focus:ring-red-500/15 cursor-pointer"
                    {...registerSignup('role')}
                  >
                    <option value="customer">Customer (Order Food)</option>
                    <option value="admin">Administrator (Manage Platform)</option>
                  </select>
                </div>

                <Button type="submit" loading={loading} className="mt-2">
                  Create Account
                </Button>
              </form>

              <p className="text-center mt-6 text-sm text-slate-400">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(true);
                    setSubmitError(null);
                  }}
                  className="text-red-500 hover:text-red-400 font-semibold cursor-pointer"
                >
                  Sign in instead
                </button>
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
