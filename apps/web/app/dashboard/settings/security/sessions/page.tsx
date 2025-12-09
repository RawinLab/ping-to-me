"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { securityApi, Session } from "@/lib/api/security";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Skeleton,
} from "@pingtome/ui";
import {
  Shield,
  Monitor,
  Smartphone,
  Tablet,
  LogOut,
  AlertTriangle,
  MapPin,
  Clock,
} from "lucide-react";

const getDeviceIcon = (deviceType?: string) => {
  const type = (deviceType || "").toLowerCase();
  if (type.includes("mobile") || type.includes("phone")) {
    return Smartphone;
  }
  if (type.includes("tablet")) {
    return Tablet;
  }
  return Monitor;
};

const maskIpAddress = (ip?: string): string => {
  if (!ip) return "Unknown";
  const parts = ip.split(".");
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.xxx.xxx`;
  }
  // For IPv6 or other formats, mask the last part
  const ipParts = ip.split(":");
  if (ipParts.length > 1) {
    return ipParts.slice(0, -2).join(":") + ":xxxx:xxxx";
  }
  return ip;
};

const formatRelativeTime = (dateString?: string): string => {
  if (!dateString) return "Unknown";
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return "Just now";
  }
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  }
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  }
  const days = Math.floor(diffInSeconds / 86400);
  if (days < 7) {
    return `${days} day${days > 1 ? "s" : ""} ago`;
  }
  return date.toLocaleDateString();
};

export default function ActiveSessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [logoutSessionId, setLogoutSessionId] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutAllOpen, setLogoutAllOpen] = useState(false);
  const [loggingOutAll, setLoggingOutAll] = useState(false);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const data = await securityApi.getSessions();
      setSessions(data);
    } catch (error) {
      console.error("Failed to fetch sessions", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogoutSession = async () => {
    if (!logoutSessionId) return;

    setLoggingOut(true);
    try {
      await securityApi.logoutSession(logoutSessionId);
      setSessions(sessions.filter((s) => s.id !== logoutSessionId));
      setLogoutSessionId(null);
    } catch (error: any) {
      alert(error.message || "Failed to logout session");
    } finally {
      setLoggingOut(false);
    }
  };

  const handleLogoutAll = async () => {
    setLoggingOutAll(true);
    try {
      await securityApi.logoutAllSessions();
      // Keep only the current session
      setSessions(sessions.filter((s) => s.isCurrent));
      setLogoutAllOpen(false);
    } catch (error: any) {
      alert(error.message || "Failed to logout all sessions");
    } finally {
      setLoggingOutAll(false);
    }
  };

  const otherSessions = sessions.filter((s) => !s.isCurrent);
  const currentSession = sessions.find((s) => s.isCurrent);

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
            {/* Header Card */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Active Sessions</CardTitle>
                    <CardDescription>
                      Manage your active sessions across all devices.
                    </CardDescription>
                  </div>
                  {otherSessions.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setLogoutAllOpen(true)}
                      className="rounded-lg text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign out all other devices
                    </Button>
                  )}
                </div>
              </CardHeader>
            </Card>

            {/* Current Session */}
            {loading ? (
              <Card className="border-slate-200 shadow-sm">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <Skeleton className="h-24 w-full rounded-xl" />
                  </div>
                </CardContent>
              </Card>
            ) : currentSession ? (
              <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="h-14 w-14 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      {(() => {
                        const DeviceIcon = getDeviceIcon(
                          currentSession.deviceType,
                        );
                        return <DeviceIcon className="h-7 w-7 text-emerald-600" />;
                      })()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-emerald-900">
                          Current Session
                        </h3>
                        <Badge className="bg-emerald-600 text-white hover:bg-emerald-600 text-xs">
                          Active now
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-emerald-700">
                          <Monitor className="h-4 w-4" />
                          <span>
                            {currentSession.browser} on {currentSession.os}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-emerald-700">
                          <MapPin className="h-4 w-4" />
                          <span>{currentSession.location}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-emerald-700">
                          <Shield className="h-4 w-4" />
                          <span>
                            IP: {maskIpAddress(currentSession.ipAddress)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-emerald-700">
                          <Clock className="h-4 w-4" />
                          <span>
                            Last active:{" "}
                            {formatRelativeTime(currentSession.lastActiveAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : null}

            {/* Other Sessions */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Other Sessions</CardTitle>
                <CardDescription>
                  {otherSessions.length > 0
                    ? `You have ${otherSessions.length} other active session${otherSessions.length > 1 ? "s" : ""}`
                    : "No other active sessions"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-4">
                    {[1, 2].map((i) => (
                      <Skeleton key={i} className="h-32 w-full rounded-xl" />
                    ))}
                  </div>
                ) : otherSessions.length > 0 ? (
                  <div className="space-y-4">
                    {otherSessions.map((session) => {
                      const DeviceIcon = getDeviceIcon(session.deviceType);
                      return (
                        <div
                          key={session.id}
                          className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors"
                        >
                          <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <DeviceIcon className="h-6 w-6 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-medium text-slate-900">
                                {session.browser} on {session.os}
                              </h4>
                            </div>
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2 text-sm text-slate-600">
                                <MapPin className="h-3.5 w-3.5" />
                                <span>{session.location}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-slate-600">
                                <Shield className="h-3.5 w-3.5" />
                                <span>
                                  IP: {maskIpAddress(session.ipAddress)}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-slate-600">
                                <Clock className="h-3.5 w-3.5" />
                                <span>
                                  Last active:{" "}
                                  {formatRelativeTime(session.lastActiveAt)}
                                </span>
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setLogoutSessionId(session.id)}
                            className="rounded-lg text-red-600 border-red-200 hover:bg-red-50 flex-shrink-0"
                          >
                            <LogOut className="mr-2 h-4 w-4" />
                            Sign out
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                      <Monitor className="h-8 w-8 text-slate-400" />
                    </div>
                    <p className="text-slate-600 font-medium mb-1">
                      No other sessions
                    </p>
                    <p className="text-sm text-slate-500">
                      You&apos;re only signed in on this device
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Security Info */}
            <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
                    <Shield className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-blue-900 mb-1">
                      Session Security
                    </h3>
                    <p className="text-sm text-blue-700 mb-3">
                      If you see a session you don&apos;t recognize, sign it
                      out immediately and change your password.
                    </p>
                    <Link href="/dashboard/settings/security">
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-white border-blue-200 text-blue-700 hover:bg-blue-100 rounded-lg"
                      >
                        Security Settings
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>

      {/* Logout Session Confirmation Dialog */}
      <Dialog
        open={!!logoutSessionId}
        onOpenChange={(open) => !open && setLogoutSessionId(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LogOut className="h-5 w-5 text-red-600" />
              Sign Out Session
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to sign out this session?
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl">
            <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800 text-sm">Note</p>
              <p className="text-sm text-amber-600">
                The device will be signed out and will need to log in again to
                access your account.
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setLogoutSessionId(null)}
              className="rounded-lg"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleLogoutSession}
              disabled={loggingOut}
              className="rounded-lg"
            >
              {loggingOut ? "Signing out..." : "Sign Out"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Logout All Sessions Confirmation Dialog */}
      <Dialog open={logoutAllOpen} onOpenChange={setLogoutAllOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <LogOut className="h-5 w-5" />
              Sign Out All Other Devices
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to sign out all other sessions?
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-start gap-3 p-4 bg-red-50 rounded-xl">
            <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
            <div>
              <p className="font-medium text-red-800 text-sm">Warning</p>
              <p className="text-sm text-red-600">
                This will sign out {otherSessions.length} other session
                {otherSessions.length > 1 ? "s" : ""}. All other devices will
                need to log in again.
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setLogoutAllOpen(false)}
              className="rounded-lg"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleLogoutAll}
              disabled={loggingOutAll}
              className="rounded-lg"
            >
              {loggingOutAll ? "Signing out..." : "Sign Out All"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}
