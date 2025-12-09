"use client";

import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useSearchParams } from "next/navigation";
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
  Badge,
  Skeleton,
} from "@pingtome/ui";
import {
  Lock,
  Shield,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  ShieldCheck,
  Monitor,
  Smartphone,
  Tablet,
  MapPin,
  Clock,
  AlertTriangle,
  Key,
} from "lucide-react";

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type PasswordFormData = z.infer<typeof passwordSchema>;

interface LoginAttempt {
  id: string;
  email: string;
  success: boolean;
  ipAddress?: string;
  userAgent?: string;
  location?: string;
  reason?: string;
  createdAt: string;
  deviceInfo?: string;
  device?: string;
  browser?: string;
  os?: string;
}

interface LoginActivityResponse {
  attempts: LoginAttempt[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}


function SecuritySettingsContent() {
  const searchParams = useSearchParams();
  const [saving, setSaving] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [loginActivity, setLoginActivity] = useState<LoginActivityResponse | null>(null);
  const [loadingActivity, setLoadingActivity] = useState(true);

  const form = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Check for OAuth linking result in URL params
  useEffect(() => {
    const oauthStatus = searchParams.get("oauth");
    const provider = searchParams.get("provider");
    const errorMessage = searchParams.get("message");

    if (oauthStatus === "linked" && provider) {
      setMessage({ type: "success", text: `${provider} account linked successfully!` });
      // Clear URL params
      window.history.replaceState({}, "", "/dashboard/settings/security");
    } else if (oauthStatus === "error") {
      setMessage({ type: "error", text: errorMessage || "Failed to link account" });
      // Clear URL params
      window.history.replaceState({}, "", "/dashboard/settings/security");
    }
  }, [searchParams]);

  // Fetch login activity on mount
  useEffect(() => {
    fetchLoginActivity();
  }, []);

  const fetchLoginActivity = async () => {
    setLoadingActivity(true);
    try {
      const response = await apiRequest("/auth/login-activity?limit=20&page=1") as LoginActivityResponse;
      setLoginActivity(response);
    } catch (error) {
      console.error("Failed to fetch login activity:", error);
    } finally {
      setLoadingActivity(false);
    }
  };

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
      setMessage({ type: "success", text: "Password updated successfully!" });
      form.reset();
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.message || "Failed to update password",
      });
    } finally {
      setSaving(false);
    }
  };

  // Password strength indicator
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

    if (score <= 2) return { label: "Weak", color: "bg-red-500", width: "33%" };
    if (score <= 4)
      return { label: "Medium", color: "bg-amber-500", width: "66%" };
    return { label: "Strong", color: "bg-emerald-500", width: "100%" };
  };

  const strength = getPasswordStrength(password);

  // Helper function to get device icon
  const getDeviceIcon = (device?: string) => {
    switch (device) {
      case "mobile":
        return <Smartphone className="h-4 w-4" />;
      case "tablet":
        return <Tablet className="h-4 w-4" />;
      case "desktop":
        return <Monitor className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  // Helper function to format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
            Security Settings
          </h1>
          <p className="text-slate-500 mt-1">
            Manage your password and account security options.
          </p>
        </div>

        <div className="space-y-6">
            {/* Password Card */}
            <Card className="border-slate-200 shadow-sm overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-amber-100 flex items-center justify-center">
                    <Lock className="h-4 w-4 text-amber-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Change Password</CardTitle>
                    <CardDescription>
                      Update your password to keep your account secure.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  {/* Current Password */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="currentPassword"
                      className="text-slate-700 font-medium"
                    >
                      Current Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type={showCurrent ? "text" : "password"}
                        placeholder="Enter your current password"
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
                      New Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showNew ? "text" : "password"}
                        placeholder="Enter your new password"
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
                          Password strength:{" "}
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
                      Confirm New Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirm ? "text" : "password"}
                        placeholder="Confirm your new password"
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
                      {saving ? "Updating..." : "Update Password"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Linked Accounts Card */}
            <LinkedAccountsCard showMessage={(type, text) => setMessage({ type, text })} />

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
                      Enable Two-Factor Authentication
                    </h3>
                    <p className="text-sm text-emerald-700 mb-4">
                      Add an extra layer of security to your account by enabling
                      2FA with an authenticator app.
                    </p>
                    <Link href="/dashboard/settings/two-factor">
                      <Button
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg"
                      >
                        <Key className="mr-2 h-4 w-4" />
                        Set up 2FA
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Login Activity */}
            <Card className="border-slate-200 shadow-sm overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Clock className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Login Activity</CardTitle>
                      <CardDescription>
                        Recent login attempts to your account (last 20)
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {loadingActivity ? (
                  <div className="p-6 space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-4">
                        <Skeleton className="h-10 w-10 rounded-lg" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-1/3" />
                          <Skeleton className="h-3 w-1/2" />
                        </div>
                        <Skeleton className="h-6 w-16 rounded-full" />
                      </div>
                    ))}
                  </div>
                ) : loginActivity && loginActivity.attempts.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/50">
                          <th className="text-left p-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="text-left p-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                            Device & Browser
                          </th>
                          <th className="text-left p-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                            Location
                          </th>
                          <th className="text-left p-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                            IP Address
                          </th>
                          <th className="text-left p-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                            Time
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {loginActivity.attempts.map((attempt, index) => {
                          const isSuspicious = !attempt.success;
                          return (
                            <tr
                              key={attempt.id}
                              className={`border-b border-slate-100 hover:bg-slate-50/50 transition-colors ${
                                isSuspicious ? "bg-red-50/30" : ""
                              }`}
                            >
                              <td className="p-4">
                                {attempt.success ? (
                                  <Badge
                                    variant="default"
                                    className="bg-emerald-100 text-emerald-700 border-emerald-200"
                                  >
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Success
                                  </Badge>
                                ) : (
                                  <Badge
                                    variant="destructive"
                                    className="bg-red-100 text-red-700 border-red-200"
                                  >
                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                    Failed
                                  </Badge>
                                )}
                              </td>
                              <td className="p-4">
                                <div className="flex items-center gap-2">
                                  <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
                                    {getDeviceIcon(attempt.device)}
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-slate-900">
                                      {attempt.deviceInfo || "Unknown device"}
                                    </p>
                                    {!attempt.success && attempt.reason && (
                                      <p className="text-xs text-red-600">
                                        {attempt.reason.replace(/_/g, " ")}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="p-4">
                                <div className="flex items-center gap-1.5 text-sm text-slate-600">
                                  <MapPin className="h-3.5 w-3.5 text-slate-400" />
                                  {attempt.location || "Unknown"}
                                </div>
                              </td>
                              <td className="p-4">
                                <code className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded">
                                  {attempt.ipAddress || "N/A"}
                                </code>
                              </td>
                              <td className="p-4">
                                <span className="text-sm text-slate-600">
                                  {formatDate(attempt.createdAt)}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                      <Clock className="h-6 w-6 text-slate-400" />
                    </div>
                    <p className="text-sm text-slate-500">
                      No login activity found
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Active Sessions */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Active Sessions</CardTitle>
                <CardDescription>
                  Manage your active sessions across devices.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                        <svg
                          className="h-5 w-5 text-blue-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">
                          Current Session
                        </p>
                        <p className="text-sm text-slate-500">
                          macOS · Chrome · Bangkok, Thailand
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full font-medium">
                      Active now
                    </span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 rounded-lg text-red-600 border-red-200 hover:bg-red-50"
                >
                  Sign out all other sessions
                </Button>
              </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}

export default function SecuritySettingsPage() {
  return (
    <Suspense fallback={<div className="p-8">Loading...</div>}>
      <SecuritySettingsContent />
    </Suspense>
  );
}
