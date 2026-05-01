"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { apiRequest } from "@/lib/api";
import { LinkedAccountsCard } from "@/components/settings/LinkedAccountsCard";
import { PasskeyManager } from "@/components/settings/PasskeyManager";
import { SecurityKeyManager } from "@/components/settings/SecurityKeyManager";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Label,
  Separator,
} from "@pingtome/ui";
import {
  Lock,
  Shield,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  ShieldCheck,
  Key,
} from "lucide-react";

export function SecuritySettingsTab() {
  const searchParams = useSearchParams();
  const t = useTranslations("settings.changePassword");
  const [saving, setSaving] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const passwordSchema = z
    .object({
      currentPassword: z.string().min(1, t("currentPasswordRequired")),
      newPassword: z.string().min(8, t("passwordMinLength")),
      confirmPassword: z.string().min(1, t("confirmRequired")),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: t("passwordsNoMatch"),
      path: ["confirmPassword"],
    });

  type PasswordFormData = z.infer<typeof passwordSchema>;

  const form = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    const oauthStatus = searchParams.get("oauth");
    const provider = searchParams.get("provider");
    const errorMessage = searchParams.get("message");

    if (oauthStatus === "linked" && provider) {
      setMessage({
        type: "success",
        text: t("accountLinked", { provider }),
      });
      window.history.replaceState({}, "", "/dashboard/settings/security");
    } else if (oauthStatus === "error") {
      setMessage({ type: "error", text: errorMessage || t("linkFailed") });
      window.history.replaceState({}, "", "/dashboard/settings/security");
    }
  }, [searchParams]);

  const onSubmit = async (data: PasswordFormData) => {
    setSaving(true);
    setMessage(null);
    try {
      await apiRequest("/auth/change-password", {
        method: "POST",
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }),
      });
      setMessage({ type: "success", text: t("passwordUpdated") });
      form.reset();
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.message || t("updateFailed"),
      });
    } finally {
      setSaving(false);
    }
  };

  const password = form.watch("newPassword");
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { label: "", color: "", width: "0%" };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score <= 2) return { label: t("strengthWeak"), color: "bg-red-500", width: "33%" };
    if (score <= 4)
      return { label: t("strengthMedium"), color: "bg-amber-500", width: "66%" };
    return { label: t("strengthStrong"), color: "bg-emerald-500", width: "100%" };
  };

  const strength = getPasswordStrength(password);

  return (
    <div className="space-y-6">
      {/* Password Card */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-amber-100 flex items-center justify-center">
              <Lock className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <CardTitle className="text-lg">{t("title")}</CardTitle>
              <CardDescription>
                {t("subtitle")}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Current Password */}
            <div className="space-y-2">
              <Label
                htmlFor="currentPassword"
                className="text-slate-700 font-medium"
              >
                {t("currentPassword")}
              </Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrent ? "text" : "password"}
                  placeholder={t("currentPasswordPlaceholder")}
                  className="h-11 rounded-lg border-slate-200 focus:border-blue-300 focus:ring-blue-100 pr-10"
                  {...form.register("currentPassword")}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  onClick={() => setShowCurrent(!showCurrent)}
                >
                  {showCurrent ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {form.formState.errors.currentPassword && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {form.formState.errors.currentPassword.message}
                </p>
              )}
            </div>

            <Separator />

            {/* New Password */}
            <div className="space-y-2">
              <Label
                htmlFor="newPassword"
                className="text-slate-700 font-medium"
              >
                {t("newPassword")}
              </Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNew ? "text" : "password"}
                  placeholder={t("newPasswordPlaceholder")}
                  className="h-11 rounded-lg border-slate-200 focus:border-blue-300 focus:ring-blue-100 pr-10"
                  {...form.register("newPassword")}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  onClick={() => setShowNew(!showNew)}
                >
                  {showNew ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {/* Password Strength Indicator */}
              {password && (
                <div className="space-y-1.5">
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${strength.color} transition-all duration-300`}
                      style={{ width: strength.width }}
                    />
                  </div>
                  <p className="text-xs text-slate-500">
                    {t("passwordStrength")}{" "}
                    <span
                      className={
                        strength.color === "bg-emerald-500"
                          ? "text-emerald-600"
                          : strength.color === "bg-amber-500"
                            ? "text-amber-600"
                            : "text-red-600"
                      }
                    >
                      {strength.label}
                    </span>
                  </p>
                </div>
              )}
              {form.formState.errors.newPassword && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {form.formState.errors.newPassword.message}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label
                htmlFor="confirmPassword"
                className="text-slate-700 font-medium"
              >
                {t("confirmPassword")}
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  placeholder={t("confirmPasswordPlaceholder")}
                  className="h-11 rounded-lg border-slate-200 focus:border-blue-300 focus:ring-blue-100 pr-10"
                  {...form.register("confirmPassword")}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  onClick={() => setShowConfirm(!showConfirm)}
                >
                  {showConfirm ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {form.formState.errors.confirmPassword && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {form.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* Message */}
            {message && (
              <div
                className={`flex items-center gap-2 p-3 rounded-lg ${
                  message.type === "success"
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {message.type === "success" ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <p className="text-sm font-medium">{message.text}</p>
              </div>
            )}

            {/* Submit */}
            <div className="flex justify-end pt-4 border-t border-slate-100">
              <Button
                type="submit"
                disabled={saving}
                className="h-10 px-6 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25"
              >
                <Shield className="mr-2 h-4 w-4" />
                {saving ? t("updating") : t("updatePassword")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Linked Accounts Card */}
      <LinkedAccountsCard
        showMessage={(type, text) => setMessage({ type, text })}
      />

      {/* Passkey Manager */}
      <PasskeyManager />

      {/* Hardware Security Key Manager */}
      <SecurityKeyManager />

      {/* 2FA Promo Card */}
      <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl bg-emerald-100 flex items-center justify-center">
              <ShieldCheck className="h-6 w-6 text-emerald-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-emerald-900 mb-1">
                {t("enable2fa")}
              </h3>
              <p className="text-sm text-emerald-700 mb-4">
                {t("enable2faDesc")}
              </p>
              <Link href="/dashboard/settings/two-factor">
                <Button
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg"
                >
                  <Key className="mr-2 h-4 w-4" />
                  {t("setup2fa")}
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
