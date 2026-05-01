"use client";

import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Input, Label, Alert, AlertDescription } from "@pingtome/ui";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Icons } from "@/components/icons";
import { useTranslations } from "next-intl";

const createLoginSchema = (t: (key: string) => string) =>
  z.object({
    email: z.string().email(t("invalidEmail")),
    password: z.string().min(1, t("passwordRequired")),
  });

type LoginFormData = z.infer<ReturnType<typeof createLoginSchema>>;

interface LockStatus {
  locked: boolean;
  remainingMinutes?: number;
}

export function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const t = useTranslations("auth.login");
  const tv = useTranslations("auth.login.validation");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lockStatus, setLockStatus] = useState<LockStatus | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const loginSchema = useMemo(() => createLoginSchema(tv), [tv]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const email = watch("email");

  useEffect(() => {
    if (countdown !== null && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 60000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
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
        router.push("/login/2fa");
      }
    } catch (err: any) {
      const errorData = err.response?.data;

      if (errorData?.locked) {
        const remainingMinutes = errorData.remainingMinutes || 0;
        setLockStatus({
          locked: true,
          remainingMinutes,
        });
        setCountdown(remainingMinutes);
        setError(t("accountLockedMessage", { count: remainingMinutes, plural: remainingMinutes !== 1 ? "s" : "" }));
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
            <Label htmlFor="email">{t("emailLabel")}</Label>
            <Input
              id="email"
              placeholder={t("emailPlaceholder")}
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
              <Label htmlFor="password">{t("passwordLabel")}</Label>
              <Link
                href="/forgot-password"
                className="text-sm font-medium text-primary hover:underline"
              >
                {t("forgotPassword")}
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                disabled={isLoading}
                className="pr-10"
                {...register("password")}
              />
              <button
                type="button"
                tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? t("hidePassword") : t("showPassword")}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password.message}</p>
            )}
          </div>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>
                {lockStatus?.locked && countdown !== null && countdown > 0 ? (
                  <div>
                    <p className="font-semibold">{t("accountLocked")}</p>
                    <p className="mt-1">
                      {t("accountLockedMessage", { count: countdown, plural: countdown !== 1 ? "s" : "" })}
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
            {lockStatus?.locked && (countdown || 0) > 0 ? t("accountLockedShort") : t("signIn")}
          </Button>
        </div>
      </form>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            {t("orContinueWith")}
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
          {t("noAccount")}
        </Link>
      </div>
    </div>
  );
}
