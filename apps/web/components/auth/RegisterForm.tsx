"use client";

import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Button,
  Input,
  Label,
  Alert,
  AlertDescription,
  buttonVariants,
} from "@pingtome/ui";
import { Eye, EyeOff, Check, X } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useTranslations } from "next-intl";

const createRegisterSchema = (t: (key: string) => string) =>
  z.object({
    email: z.string().email(t("invalidEmail")),
    password: z
      .string()
      .min(8, t("passwordMinLength"))
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
        t("passwordRequirements")
      ),
    name: z.string().optional(),
  });

type RegisterFormData = z.infer<ReturnType<typeof createRegisterSchema>>;

export function RegisterForm() {
  const t = useTranslations("auth.register");
  const tv = useTranslations("auth.register.validation");
  const tc = useTranslations("common");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const registerSchema = useMemo(() => createRegisterSchema(tv), [tv]);

  const PASSWORD_REQUIREMENTS = useMemo(() => [
    { key: "length", label: t("passwordChecks.length"), test: (v: string) => v.length >= 8 },
    { key: "uppercase", label: t("passwordChecks.uppercase"), test: (v: string) => /[A-Z]/.test(v) },
    { key: "lowercase", label: t("passwordChecks.lowercase"), test: (v: string) => /[a-z]/.test(v) },
    { key: "number", label: t("passwordChecks.number"), test: (v: string) => /\d/.test(v) },
    { key: "special", label: t("passwordChecks.special"), test: (v: string) => /[@$!%*?&]/.test(v) },
  ], [t]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const passwordValue = watch("password") || "";
  const emailValue = watch("email") || "";

  const requirementChecks = useMemo(
    () => PASSWORD_REQUIREMENTS.map((req) => ({
      ...req,
      met: req.test(passwordValue),
    })),
    [passwordValue, PASSWORD_REQUIREMENTS]
  );

  const allRequirementsMet = requirementChecks.every((r) => r.met);

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      await api.post("/auth/register", data);
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="grid gap-6">
        <Alert className="bg-green-50 border-green-200 text-green-800">
          <AlertDescription>
            {t("registrationSuccess")}
          </AlertDescription>
        </Alert>
        <Link
          href="/login"
          className={buttonVariants({
            variant: "outline",
            className: "w-full",
          })}
        >
          {t("backToLogin")}
        </Link>
      </div>
    );
  }

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
            <Label htmlFor="password">{t("passwordLabel")}</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                disabled={isLoading}
                className="pr-10"
                {...register("password", {
                  onBlur: undefined,
                })}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => {
                  if (!passwordValue) setPasswordFocused(false);
                }}
              />
              <button
                type="button"
                tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {(passwordFocused || (passwordValue && !allRequirementsMet)) && (
              <div className="mt-1 rounded-md border bg-muted/50 p-3 text-sm space-y-1.5">
                <p className="font-medium text-muted-foreground mb-2">{t("passwordRequirements")}</p>
                {requirementChecks.map((req) => (
                  <div key={req.key} className="flex items-center gap-2">
                    {req.met ? (
                      <Check className="h-3.5 w-3.5 text-green-600 shrink-0" />
                    ) : (
                      <X className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    )}
                    <span className={req.met ? "text-green-600" : "text-muted-foreground"}>
                      {req.label}
                    </span>
                  </div>
                ))}
              </div>
            )}
            {errors.password && !passwordFocused && (
              <p className="text-sm text-red-500">{errors.password.message}</p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="name">{t("nameLabel")}</Label>
            <Input
              id="name"
              type="text"
              disabled={isLoading}
              {...register("name")}
            />
          </div>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <Button disabled={isLoading || (passwordValue.length > 0 && !allRequirementsMet)}>
            {isLoading && (
              <span className="mr-2 h-4 w-4 animate-spin">...</span>
            )}
            {t("signUp")}
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
        <Link
          href="/login"
          className="underline underline-offset-4 hover:text-primary"
        >
          {t("hasAccount")}
        </Link>
      </div>
    </div>
  );
}
