"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
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
} from "@pingtome/ui";
import { User, Upload, Save, Mail, CheckCircle, AlertCircle, Camera, Shield, Key, CreditCard, ChevronRight } from "lucide-react";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
});

type ProfileFormData = z.infer<typeof profileSchema>;

const settingsNavItems = [
  { title: "Profile", href: "/dashboard/settings/profile", icon: User, active: true },
  { title: "Security", href: "/dashboard/settings/security", icon: Shield },
  { title: "Two-Factor Auth", href: "/dashboard/settings/two-factor", icon: Key },
  { title: "Billing", href: "/dashboard/billing", icon: CreditCard },
];

export default function ProfileSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      email: "",
    },
  });

  useEffect(() => {
    fetchProfile();
  }, []);

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
    <div className="p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
            Settings
          </h1>
          <p className="text-slate-500 mt-1">
            Manage your account settings and preferences.
          </p>
        </div>

        <div className="grid lg:grid-cols-[240px_1fr] gap-8">
          {/* Settings Navigation */}
          <nav className="space-y-1">
            {settingsNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    item.active
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.title}
                  {!item.active && <ChevronRight className="h-4 w-4 ml-auto text-slate-400" />}
                </Link>
              );
            })}
          </nav>

          {/* Main Content */}
          <div className="space-y-6">
            {/* Profile Card */}
            <Card className="border-slate-200 shadow-sm overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                    <User className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Personal Information</CardTitle>
                    <CardDescription>Update your profile details and photo.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                      <h3 className="font-semibold text-slate-900">Profile Photo</h3>
                      <p className="text-sm text-slate-500 mb-3">
                        Click the image to upload a new photo
                      </p>
                      <div className="flex items-center gap-2">
                        <Label htmlFor="avatar-btn" className="cursor-pointer">
                          <Button type="button" variant="outline" size="sm" asChild className="rounded-lg">
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
                        <span className="text-xs text-slate-400">JPG, PNG or GIF. Max 2MB.</span>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Name Field */}
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-slate-700 font-medium">
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
                    <Label htmlFor="email" className="text-slate-700 font-medium flex items-center gap-2">
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
                      <Badge variant="secondary" className="absolute right-3 top-1/2 -translate-y-1/2 bg-emerald-50 text-emerald-700 border-0">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500">
                      Email cannot be changed. Contact support if you need to update it.
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

            {/* Danger Zone */}
            <Card className="border-red-200 bg-red-50/30">
              <CardHeader>
                <CardTitle className="text-lg text-red-700">Danger Zone</CardTitle>
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
      </div>
    </div>
  );
}
