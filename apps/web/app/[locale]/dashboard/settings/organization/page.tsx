"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Alert,
  AlertDescription,
  Separator,
} from "@pingtome/ui";
import {
  Building2,
  Save,
  CheckCircle,
  AlertCircle,
  Globe,
  Lock,
} from "lucide-react";
import { useOrganization } from "@/contexts/OrganizationContext";
import { usePermission } from "@/hooks/usePermission";
import { LogoUploader } from "@/components/organization/LogoUploader";
import { updateOrganization } from "@/lib/api/organizations";

// Common timezones list
const TIMEZONES = [
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "America/Anchorage", label: "Alaska Time (AKT)" },
  { value: "Pacific/Honolulu", label: "Hawaii Time (HT)" },
  { value: "Europe/London", label: "London (GMT/BST)" },
  { value: "Europe/Paris", label: "Paris (CET/CEST)" },
  { value: "Europe/Berlin", label: "Berlin (CET/CEST)" },
  { value: "Europe/Madrid", label: "Madrid (CET/CEST)" },
  { value: "Europe/Rome", label: "Rome (CET/CEST)" },
  { value: "Europe/Amsterdam", label: "Amsterdam (CET/CEST)" },
  { value: "Asia/Dubai", label: "Dubai (GST)" },
  { value: "Asia/Kolkata", label: "India (IST)" },
  { value: "Asia/Singapore", label: "Singapore (SGT)" },
  { value: "Asia/Hong_Kong", label: "Hong Kong (HKT)" },
  { value: "Asia/Tokyo", label: "Tokyo (JST)" },
  { value: "Asia/Seoul", label: "Seoul (KST)" },
  { value: "Australia/Sydney", label: "Sydney (AEDT/AEST)" },
  { value: "Australia/Melbourne", label: "Melbourne (AEDT/AEST)" },
  { value: "Pacific/Auckland", label: "Auckland (NZDT/NZST)" },
  { value: "UTC", label: "UTC (Coordinated Universal Time)" },
];

const organizationSchema = z.object({
  name: z
    .string()
    .min(2, "Organization name must be at least 2 characters")
    .max(100, "Organization name must not exceed 100 characters"),
  timezone: z.string().min(1, "Please select a timezone"),
});

type OrganizationFormData = z.infer<typeof organizationSchema>;

export default function OrganizationSettingsPage() {
  const { currentOrg, refreshOrganizations } = useOrganization();
  const { isAdminOrAbove } = usePermission();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const form = useForm<OrganizationFormData>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      name: "",
      timezone: "UTC",
    },
  });

  // Load organization data
  useEffect(() => {
    if (currentOrg) {
      form.reset({
        name: currentOrg.name || "",
        timezone: currentOrg.timezone || "UTC",
      });
    }
  }, [currentOrg, form]);

  const onSubmit = async (data: OrganizationFormData) => {
    if (!currentOrg) return;
    if (!isAdminOrAbove) {
      setMessage({
        type: "error",
        text: "You don't have permission to update organization settings",
      });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      await updateOrganization(currentOrg.id, {
        name: data.name,
        timezone: data.timezone,
      });

      // Refresh organization data
      await refreshOrganizations();

      setMessage({
        type: "success",
        text: "Organization settings updated successfully!",
      });
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.message || "Failed to update organization settings",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUploadSuccess = async (logoUrl: string) => {
    setMessage({
      type: "success",
      text: "Organization logo updated successfully!",
    });
    // Refresh organization data to update logo
    await refreshOrganizations();
  };

  const handleLogoDeleteSuccess = async () => {
    setMessage({
      type: "success",
      text: "Organization logo removed successfully!",
    });
    // Refresh organization data to update logo
    await refreshOrganizations();
  };

  if (!currentOrg) {
    return (
      <div className="p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="min-h-[400px] flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-slate-500">Loading organization...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
            Organization Settings
          </h1>
          <p className="text-slate-500 mt-1">
            Manage your organization profile and preferences.
          </p>
        </div>

        {/* Permission Warning */}
        {!isAdminOrAbove && (
          <Alert className="mb-6 border-amber-200 bg-amber-50">
            <Lock className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-sm text-amber-800">
              You have view-only access. Only Owners and Admins can edit
              organization settings.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-6">
          {/* Organization Details Card */}
          <Card className="border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Building2 className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">
                    Organization Details
                  </CardTitle>
                  <CardDescription>
                    Update your organization name and branding.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Organization Logo */}
                <div className="space-y-3">
                  <Label className="text-slate-700 font-medium">
                    Organization Logo
                  </Label>
                  <LogoUploader
                    orgId={currentOrg.id}
                    currentLogo={currentOrg.logo}
                    onUploadSuccess={handleLogoUploadSuccess}
                    onDeleteSuccess={handleLogoDeleteSuccess}
                  />
                  <p className="text-xs text-slate-500">
                    Your logo will be displayed on your organization profile and
                    bio pages.
                  </p>
                </div>

                <Separator />

                {/* Organization Name */}
                <div className="space-y-2">
                  <Label
                    htmlFor="name"
                    className="text-slate-700 font-medium flex items-center gap-2"
                  >
                    <Building2 className="h-4 w-4 text-slate-400" />
                    Organization Name
                  </Label>
                  <Input
                    id="name"
                    placeholder="Enter organization name"
                    className="h-11 rounded-lg border-slate-200 focus:border-blue-300 focus:ring-blue-100"
                    disabled={!isAdminOrAbove}
                    {...form.register("name")}
                  />
                  {form.formState.errors.name && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3.5 w-3.5" />
                      {form.formState.errors.name.message}
                    </p>
                  )}
                  <p className="text-xs text-slate-500">
                    This is your organization&apos;s display name visible to team
                    members and on shared pages.
                  </p>
                </div>

                {/* Timezone */}
                <div className="space-y-2">
                  <Label
                    htmlFor="timezone"
                    className="text-slate-700 font-medium flex items-center gap-2"
                  >
                    <Globe className="h-4 w-4 text-slate-400" />
                    Timezone
                  </Label>
                  <Select
                    value={form.watch("timezone")}
                    onValueChange={(value) => form.setValue("timezone", value)}
                    disabled={!isAdminOrAbove}
                  >
                    <SelectTrigger className="h-11 rounded-lg border-slate-200 focus:border-blue-300 focus:ring-blue-100">
                      <SelectValue placeholder="Select a timezone" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {TIMEZONES.map((tz) => (
                        <SelectItem key={tz.value} value={tz.value}>
                          {tz.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.timezone && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3.5 w-3.5" />
                      {form.formState.errors.timezone.message}
                    </p>
                  )}
                  <p className="text-xs text-slate-500">
                    All analytics and reports will use this timezone by default.
                  </p>
                </div>

                {/* Organization Slug (Read-only) */}
                <div className="space-y-2">
                  <Label htmlFor="slug" className="text-slate-700 font-medium">
                    Organization Slug
                  </Label>
                  <Input
                    id="slug"
                    value={currentOrg.slug}
                    disabled
                    className="h-11 rounded-lg bg-slate-50 border-slate-200"
                  />
                  <p className="text-xs text-slate-500">
                    Your organization slug cannot be changed. Contact support if
                    you need to update it.
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
                {isAdminOrAbove && (
                  <div className="flex justify-end pt-4 border-t border-slate-100">
                    <Button
                      type="submit"
                      disabled={loading}
                      className="h-10 px-6 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25"
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {loading ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>

          {/* Organization Info Card */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Organization Information</CardTitle>
              <CardDescription>
                Additional details about your organization.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl">
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-1">
                    Plan
                  </p>
                  <p className="text-base font-semibold text-slate-900">
                    {currentOrg.plan}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-1">
                    Created
                  </p>
                  <p className="text-base font-semibold text-slate-900">
                    {new Date(currentOrg.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-1">
                    Members
                  </p>
                  <p className="text-base font-semibold text-slate-900">
                    {currentOrg._count?.members || 0}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-1">
                    Links
                  </p>
                  <p className="text-base font-semibold text-slate-900">
                    {currentOrg._count?.links || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
