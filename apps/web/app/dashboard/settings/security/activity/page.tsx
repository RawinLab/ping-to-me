"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { securityApi, LoginActivity } from "@/lib/api/security";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Skeleton,
} from "@pingtome/ui";
import {
  Shield,
  CheckCircle,
  XCircle,
  MapPin,
  Monitor,
  AlertTriangle,
  Clock,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
} from "lucide-react";

const parseUserAgent = (userAgent: string) => {
  // Simple user agent parsing (in production, use a library like ua-parser-js)
  let browser = "Unknown Browser";
  let os = "Unknown OS";
  let device = "Desktop";

  // Parse OS
  if (userAgent.includes("Windows")) os = "Windows";
  else if (userAgent.includes("Mac")) os = "macOS";
  else if (userAgent.includes("Linux")) os = "Linux";
  else if (userAgent.includes("Android")) os = "Android";
  else if (userAgent.includes("iOS") || userAgent.includes("iPhone"))
    os = "iOS";

  // Parse Browser
  if (userAgent.includes("Chrome") && !userAgent.includes("Edg"))
    browser = "Chrome";
  else if (userAgent.includes("Safari") && !userAgent.includes("Chrome"))
    browser = "Safari";
  else if (userAgent.includes("Firefox")) browser = "Firefox";
  else if (userAgent.includes("Edg")) browser = "Edge";

  // Parse Device
  if (
    userAgent.includes("Mobile") ||
    userAgent.includes("Android") ||
    userAgent.includes("iPhone")
  )
    device = "Mobile";
  else if (userAgent.includes("Tablet") || userAgent.includes("iPad"))
    device = "Tablet";

  return { browser, os, device };
};

const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  // If less than 24 hours ago, show relative time
  if (diffInSeconds < 86400) {
    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
    }
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  }

  // Otherwise show full date and time
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

const isSuspiciousActivity = (
  activity: LoginActivity,
  activities: LoginActivity[],
): boolean => {
  // Check for multiple failed attempts
  if (!activity.success) {
    const recentFailures = activities.filter(
      (a) =>
        !a.success &&
        new Date(a.createdAt).getTime() >
          new Date().getTime() - 3600000 && // Last hour
        a.ipAddress === activity.ipAddress,
    );
    if (recentFailures.length >= 3) return true;
  }

  // Check for new location (simplified - in production, compare with known locations)
  // This is a placeholder - you'd implement proper geo-location comparison
  return false;
};

export default function LoginActivityPage() {
  const [activities, setActivities] = useState<LoginActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "success" | "failed">("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  useEffect(() => {
    fetchActivities();
  }, [filter, page]);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const params: any = { page, limit };
      if (filter === "success") params.success = true;
      if (filter === "failed") params.success = false;

      const response = await securityApi.getLoginActivity(params);
      setActivities(response.activities);
      setTotal(response.total);
    } catch (error) {
      console.error("Failed to fetch login activity", error);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(total / limit);

  const successCount = activities.filter((a) => a.success).length;
  const failedCount = activities.filter((a) => !a.success).length;

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
            {/* Header Card */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Login Activity</CardTitle>
                <CardDescription>
                  Review your recent login attempts and security events.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-slate-200 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Shield className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-900">
                        {total}
                      </p>
                      <p className="text-sm text-slate-500">Total Attempts</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-emerald-200 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                      <CheckCircle className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-emerald-900">
                        {successCount}
                      </p>
                      <p className="text-sm text-emerald-600">Successful</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-red-200 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
                      <XCircle className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-red-900">
                        {failedCount}
                      </p>
                      <p className="text-sm text-red-600">Failed</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Activity List */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <Tabs
                  value={filter}
                  onValueChange={(value: any) => {
                    setFilter(value);
                    setPage(1);
                  }}
                >
                  <TabsList className="grid w-full max-w-md grid-cols-3">
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="success">Successful</TabsTrigger>
                    <TabsTrigger value="failed">Failed</TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Skeleton key={i} className="h-24 w-full rounded-xl" />
                    ))}
                  </div>
                ) : activities.length > 0 ? (
                  <div className="space-y-3">
                    {activities.map((activity) => {
                      const { browser, os, device } = parseUserAgent(
                        activity.userAgent,
                      );
                      const suspicious = isSuspiciousActivity(
                        activity,
                        activities,
                      );

                      return (
                        <div
                          key={activity.id}
                          className={`flex items-start gap-4 p-4 rounded-xl border transition-colors ${
                            activity.success
                              ? "bg-white border-slate-200 hover:border-slate-300"
                              : suspicious
                                ? "bg-red-50 border-red-200 hover:border-red-300"
                                : "bg-amber-50 border-amber-200 hover:border-amber-300"
                          }`}
                        >
                          <div
                            className={`h-12 w-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                              activity.success
                                ? "bg-emerald-100"
                                : "bg-red-100"
                            }`}
                          >
                            {activity.success ? (
                              <CheckCircle className="h-6 w-6 text-emerald-600" />
                            ) : (
                              <XCircle className="h-6 w-6 text-red-600" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <h4
                                className={`font-medium ${
                                  activity.success
                                    ? "text-slate-900"
                                    : "text-red-900"
                                }`}
                              >
                                {activity.success
                                  ? "Successful Login"
                                  : "Failed Login Attempt"}
                              </h4>
                              {suspicious && (
                                <Badge className="bg-red-600 text-white hover:bg-red-600 text-xs">
                                  Suspicious
                                </Badge>
                              )}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              <div className="flex items-center gap-2 text-sm text-slate-600">
                                <Clock className="h-3.5 w-3.5" />
                                <span>{formatDateTime(activity.createdAt)}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-slate-600">
                                <Monitor className="h-3.5 w-3.5" />
                                <span>
                                  {browser} on {os}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-slate-600">
                                <MapPin className="h-3.5 w-3.5" />
                                <span>{activity.location}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-slate-600">
                                <Shield className="h-3.5 w-3.5" />
                                <span>IP: {activity.ipAddress}</span>
                              </div>
                            </div>
                            {!activity.success && activity.failureReason && (
                              <div className="mt-2 flex items-start gap-2 p-2 bg-red-100 rounded-lg">
                                <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                                <p className="text-sm text-red-700">
                                  <span className="font-medium">Reason:</span>{" "}
                                  {activity.failureReason}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                      <Shield className="h-8 w-8 text-slate-400" />
                    </div>
                    <p className="text-slate-600 font-medium mb-1">
                      No login activity
                    </p>
                    <p className="text-sm text-slate-500">
                      No login attempts found for the selected filter
                    </p>
                  </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-200">
                    <p className="text-sm text-slate-600">
                      Showing {(page - 1) * limit + 1} to{" "}
                      {Math.min(page * limit, total)} of {total} results
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(page - 1)}
                        disabled={page === 1}
                        className="rounded-lg"
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(page + 1)}
                        disabled={page === totalPages}
                        className="rounded-lg"
                      >
                        Next
                        <ChevronRightIcon className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Security Tip */}
            <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
                    <Shield className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-blue-900 mb-1">
                      Security Tip
                    </h3>
                    <p className="text-sm text-blue-700 mb-3">
                      If you notice any suspicious login attempts or activity
                      from unfamiliar locations, change your password
                      immediately and enable two-factor authentication.
                    </p>
                    <div className="flex gap-2">
                      <Link href="/dashboard/settings/security">
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-white border-blue-200 text-blue-700 hover:bg-blue-100 rounded-lg"
                        >
                          Change Password
                        </Button>
                      </Link>
                      <Link href="/dashboard/settings/two-factor">
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-white border-blue-200 text-blue-700 hover:bg-blue-100 rounded-lg"
                        >
                          Enable 2FA
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
      </div>
    </div>
  );
}
