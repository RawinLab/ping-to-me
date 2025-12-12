"use client";

import { Suspense, useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useSearchParams } from "next/navigation";
import { apiRequest } from "@/lib/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Label,
  Badge,
  Separator,
  Alert,
  AlertDescription,
  Switch,
} from "@pingtome/ui";
import {
  User,
  Upload,
  Save,
  Mail,
  CheckCircle,
  AlertCircle,
  Camera,
  Link2,
  Unlink,
  Bell,
} from "lucide-react";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface LinkedAccount {
  id: string;
  provider: string;
  type: string;
}

function ProfileSettingsContent() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [linkedAccounts, setLinkedAccounts] = useState<LinkedAccount[]>([]);
  const [linkingProvider, setLinkingProvider] = useState<string | null>(null);
  const [unlinkingProvider, setUnlinkingProvider] = useState<string | null>(
    null
  );
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      email: "",
    },
  });

  useEffect(() => {
    fetchProfile();
    fetchLinkedAccounts();
    fetchNotificationSettings();

    // Handle OAuth redirect params
    const success = searchParams.get("success");
    const error = searchParams.get("error");

    if (success === "oauth_linked") {
      setMessage({
        type: "success",
        text: "Account linked successfully!",
      });
      // Clear URL params
      window.history.replaceState(
        {},
        "",
        "/dashboard/settings/profile"
      );
      // Refresh linked accounts
      fetchLinkedAccounts();
    } else if (error === "oauth_link_failed") {
      setMessage({
        type: "error",
        text: "Failed to link account. Please try again.",
      });
      // Clear URL params
      window.history.replaceState(
        {},
        "",
        "/dashboard/settings/profile"
      );
    }
  }, [searchParams]);

  const fetchProfile = async () => {
    try {
      const user = await apiRequest("/auth/me");
      form.reset({
        name: user.name || "",
        email: user.email || "",
      });
      setAvatar(user.avatar || null);
    } catch (error) {
      console.error("Failed to fetch profile");
    } finally {
      setLoading(false);
    }
  };

  const fetchLinkedAccounts = async () => {
    try {
      const accounts = await apiRequest("/auth/linked-accounts");
      setLinkedAccounts(accounts);
    } catch (error) {
      console.error("Failed to fetch linked accounts");
    }
  };

  const fetchNotificationSettings = async () => {
    try {
      const settings = await apiRequest("/notifications/settings");
      setEmailNotifications(settings.emailNotificationsEnabled);
      setMarketingEmails(settings.marketingEmailsEnabled);
    } catch (error) {
      console.error("Failed to fetch notification settings");
    }
  };

  const onSubmit = async (data: ProfileFormData) => {
    setSaving(true);
    setMessage(null);
    try {
      await apiRequest("/users/me", {
        method: "PATCH",
        body: JSON.stringify(data),
      });
      setMessage({ type: "success", text: "Profile updated successfully!" });
    } catch (error) {
      setMessage({ type: "error", text: "Failed to update profile" });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setAvatar(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleLinkAccount = (provider: string) => {
    setLinkingProvider(provider);
    // Redirect to backend OAuth linking endpoint
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/oauth/link/${provider}`;
  };

  const handleUnlinkAccount = async (provider: string) => {
    if (
      !window.confirm(
        `Are you sure you want to unlink your ${provider} account? Make sure you have another way to log in.`
      )
    ) {
      return;
    }

    setUnlinkingProvider(provider);
    setMessage(null);
    try {
      await apiRequest(`/auth/oauth/unlink/${provider}`, {
        method: "DELETE",
      });
      setMessage({
        type: "success",
        text: `${provider} account unlinked successfully!`,
      });
      fetchLinkedAccounts();
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.message || "Failed to unlink account",
      });
    } finally {
      setUnlinkingProvider(null);
    }
  };

  const isAccountLinked = (provider: string) => {
    return linkedAccounts.some((acc) => acc.provider === provider);
  };

  const handleEmailToggle = async (checked: boolean) => {
    setEmailNotifications(checked);
    try {
      await apiRequest("/notifications/settings", {
        method: "PATCH",
        body: JSON.stringify({ emailNotificationsEnabled: checked }),
      });
    } catch (error) {
      setEmailNotifications(!checked); // Revert on error
      setMessage({ type: "error", text: "Failed to update notification setting" });
    }
  };

  const handleMarketingToggle = async (checked: boolean) => {
    setMarketingEmails(checked);
    try {
      await apiRequest("/notifications/settings", {
        method: "PATCH",
        body: JSON.stringify({ marketingEmailsEnabled: checked }),
      });
    } catch (error) {
      setMarketingEmails(!checked); // Revert on error
      setMessage({ type: "error", text: "Failed to update notification setting" });
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case "google":
        return (
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
        );
      case "github":
        return (
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
          </svg>
        );
      default:
        return <Link2 className="h-5 w-5" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
            Profile Settings
          </h1>
          <p className="text-slate-500 mt-1">
            Manage your personal profile and account details.
          </p>
        </div>

        <div className="space-y-6">
            {/* Profile Card */}
            <Card className="border-slate-200 shadow-sm overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                    <User className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">
                      Personal Information
                    </CardTitle>
                    <CardDescription>
                      Update your profile details and photo.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  {/* Avatar Section */}
                  <div className="flex items-center gap-6 p-4 bg-slate-50 rounded-xl">
                    <div className="relative group">
                      <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center overflow-hidden shadow-lg shadow-blue-500/25">
                        {avatar ? (
                          <img
                            src={avatar}
                            alt="Avatar"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <User className="h-10 w-10 text-white" />
                        )}
                      </div>
                      <label
                        htmlFor="avatar"
                        className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl cursor-pointer"
                      >
                        <Camera className="h-6 w-6 text-white" />
                      </label>
                      <input
                        id="avatar"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarChange}
                      />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">
                        Profile Photo
                      </h3>
                      <p className="text-sm text-slate-500 mb-3">
                        Click the image to upload a new photo
                      </p>
                      <div className="flex items-center gap-2">
                        <Label htmlFor="avatar-btn" className="cursor-pointer">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            asChild
                            className="rounded-lg"
                          >
                            <span>
                              <Upload className="mr-2 h-3.5 w-3.5" />
                              Upload
                            </span>
                          </Button>
                        </Label>
                        <input
                          id="avatar-btn"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleAvatarChange}
                        />
                        <span className="text-xs text-slate-400">
                          JPG, PNG or GIF. Max 2MB.
                        </span>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Name Field */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="name"
                      className="text-slate-700 font-medium"
                    >
                      Full Name
                    </Label>
                    <Input
                      id="name"
                      placeholder="Enter your full name"
                      className="h-11 rounded-lg border-slate-200 focus:border-blue-300 focus:ring-blue-100"
                      {...form.register("name")}
                    />
                    {form.formState.errors.name && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3.5 w-3.5" />
                        {form.formState.errors.name.message}
                      </p>
                    )}
                  </div>

                  {/* Email Field */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="email"
                      className="text-slate-700 font-medium flex items-center gap-2"
                    >
                      <Mail className="h-4 w-4 text-slate-400" />
                      Email Address
                    </Label>
                    <div className="relative">
                      <Input
                        id="email"
                        type="email"
                        disabled
                        className="h-11 rounded-lg bg-slate-50 border-slate-200 pr-24"
                        {...form.register("email")}
                      />
                      <Badge
                        variant="secondary"
                        className="absolute right-3 top-1/2 -translate-y-1/2 bg-emerald-50 text-emerald-700 border-0"
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500">
                      Email cannot be changed. Contact support if you need to
                      update it.
                    </p>
                  </div>

                  {/* Success/Error Message */}
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

                  {/* Submit Button */}
                  <div className="flex justify-end pt-4 border-t border-slate-100">
                    <Button
                      type="submit"
                      disabled={saving}
                      className="h-10 px-6 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25"
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {saving ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Linked Accounts */}
            <Card className="border-slate-200 shadow-sm overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Link2 className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">
                      Linked Accounts
                    </CardTitle>
                    <CardDescription>
                      Connect your social accounts for easier sign-in.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Google */}
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-3">
                      {getProviderIcon("google")}
                      <div>
                        <p className="font-semibold text-slate-900">Google</p>
                        <p className="text-sm text-slate-500">
                          {isAccountLinked("google")
                            ? "Connected"
                            : "Not connected"}
                        </p>
                      </div>
                    </div>
                    {isAccountLinked("google") ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUnlinkAccount("google")}
                        disabled={unlinkingProvider === "google"}
                        className="rounded-lg"
                      >
                        <Unlink className="mr-2 h-3.5 w-3.5" />
                        {unlinkingProvider === "google"
                          ? "Disconnecting..."
                          : "Disconnect"}
                      </Button>
                    ) : (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleLinkAccount("google")}
                        disabled={linkingProvider === "google"}
                        className="rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                      >
                        <Link2 className="mr-2 h-3.5 w-3.5" />
                        {linkingProvider === "google"
                          ? "Connecting..."
                          : "Connect"}
                      </Button>
                    )}
                  </div>

                  {/* GitHub */}
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-3">
                      {getProviderIcon("github")}
                      <div>
                        <p className="font-semibold text-slate-900">GitHub</p>
                        <p className="text-sm text-slate-500">
                          {isAccountLinked("github")
                            ? "Connected"
                            : "Not connected"}
                        </p>
                      </div>
                    </div>
                    {isAccountLinked("github") ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUnlinkAccount("github")}
                        disabled={unlinkingProvider === "github"}
                        className="rounded-lg"
                      >
                        <Unlink className="mr-2 h-3.5 w-3.5" />
                        {unlinkingProvider === "github"
                          ? "Disconnecting..."
                          : "Disconnect"}
                      </Button>
                    ) : (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleLinkAccount("github")}
                        disabled={linkingProvider === "github"}
                        className="rounded-lg bg-gradient-to-r from-slate-800 to-slate-600 hover:from-slate-900 hover:to-slate-700"
                      >
                        <Link2 className="mr-2 h-3.5 w-3.5" />
                        {linkingProvider === "github"
                          ? "Connecting..."
                          : "Connect"}
                      </Button>
                    )}
                  </div>

                  {/* Info Alert */}
                  <Alert className="border-blue-200 bg-blue-50">
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-sm text-blue-800">
                      Linking accounts allows you to sign in with multiple
                      providers. You can unlink an account anytime as long as you
                      have at least one authentication method.
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card className="border-slate-200 shadow-sm overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Bell className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Notification Settings</CardTitle>
                    <CardDescription>
                      Manage your notification preferences.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Email Notifications</p>
                    <p className="text-sm text-muted-foreground">
                      Receive email updates about your links and account.
                    </p>
                  </div>
                  <Switch
                    checked={emailNotifications}
                    onCheckedChange={handleEmailToggle}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Marketing Emails</p>
                    <p className="text-sm text-muted-foreground">
                      Receive tips, product updates and special offers.
                    </p>
                  </div>
                  <Switch
                    checked={marketingEmails}
                    onCheckedChange={handleMarketingToggle}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-red-200 bg-red-50/30">
              <CardHeader>
                <CardTitle className="text-lg text-red-700">
                  Danger Zone
                </CardTitle>
                <CardDescription className="text-red-600/80">
                  Irreversible and destructive actions
                </CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900">Delete Account</p>
                  <p className="text-sm text-slate-500">
                    Permanently delete your account and all data
                  </p>
                </div>
                <Button variant="destructive" size="sm" className="rounded-lg">
                  Delete Account
                </Button>
              </CardContent>
            </Card>
        </div>
    </div>
  );
}

export default function ProfileSettingsPage() {
  return (
    <Suspense fallback={<div className="p-8">Loading...</div>}>
      <ProfileSettingsContent />
    </Suspense>
  );
}
