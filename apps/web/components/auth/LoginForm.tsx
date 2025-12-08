"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Input, Label, Alert, AlertDescription } from "@pingtome/ui";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Icons } from "@/components/icons"; // Assuming Icons component is available for social buttons

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LockStatus {
  locked: boolean;
  remainingMinutes?: number;
}

export function LoginForm() {
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lockStatus, setLockStatus] = useState<LockStatus | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const email = watch("email");

  // Countdown timer effect
  useEffect(() => {
    if (countdown !== null && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 60000); // Update every minute
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      // Reset lock status when countdown reaches 0
      setLockStatus(null);
      setCountdown(null);
      setError(null);
    }
  }, [countdown]);

  const handleSocialLogin = (provider: "github" | "google") => {
    setIsLoading(true);
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/${provider}`;
  };

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);
    setLockStatus(null);

    try {
      const result = await login(data);
      if (result.requires2FA) {
        // Redirect to 2FA page is handled by AuthContext
        window.location.href = "/login/2fa";
      }
    } catch (err: any) {
      const errorData = err.response?.data;

      // Check if account is locked
      if (errorData?.locked) {
        const remainingMinutes = errorData.remainingMinutes || 0;
        setLockStatus({
          locked: true,
          remainingMinutes,
        });
        setCountdown(remainingMinutes);
        setError(errorData.message || `Account is locked. Try again in ${remainingMinutes} minute(s).`);
      } else {
        setError(errorData?.message || "Login failed");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid gap-6">
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              placeholder="name@example.com"
              type="email"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect="off"
              disabled={isLoading}
              {...register("email")}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link
                href="/forgot-password"
                className="text-sm font-medium text-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              disabled={isLoading}
              {...register("password")}
            />
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password.message}</p>
            )}
          </div>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>
                {lockStatus?.locked && countdown !== null && countdown > 0 ? (
                  <div>
                    <p className="font-semibold">Account Locked</p>
                    <p className="mt-1">
                      Too many failed login attempts. Please try again in{" "}
                      <span className="font-bold">{countdown}</span> minute{countdown !== 1 ? "s" : ""}.
                    </p>
                  </div>
                ) : (
                  error
                )}
              </AlertDescription>
            </Alert>
          )}
          <Button disabled={isLoading || (lockStatus?.locked && (countdown || 0) > 0)}>
            {isLoading && (
              <span className="mr-2 h-4 w-4 animate-spin">...</span>
            )}
            {lockStatus?.locked && (countdown || 0) > 0 ? "Account Locked" : "Sign In with Email"}
          </Button>
          {/* Removed "Email me a login link" button as per instruction */}
        </div>
      </form>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>
      <div className="flex flex-col space-y-2 text-center text-sm">
        <Button
          variant="outline"
          type="button"
          disabled={isLoading}
          onClick={() => handleSocialLogin("google")}
        >
          {isLoading ? (
            <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Icons.google className="mr-2 h-4 w-4" />
          )}{" "}
          Google
        </Button>
        <Button
          variant="outline"
          type="button"
          disabled={isLoading}
          onClick={() => handleSocialLogin("github")}
        >
          {isLoading ? (
            <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Icons.gitHub className="mr-2 h-4 w-4" />
          )}{" "}
          Github
        </Button>
        <Link
          href="/register"
          className="underline underline-offset-4 hover:text-primary"
        >
          Don&apos;t have an account? Sign Up
        </Link>
      </div>
    </div>
  );
}
