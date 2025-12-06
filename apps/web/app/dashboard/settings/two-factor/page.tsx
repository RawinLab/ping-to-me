"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiRequest } from "@/lib/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Label,
  Badge,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@pingtome/ui";
import { Shield, ShieldCheck, ShieldOff, QrCode, User, Key, CreditCard, ChevronRight, Smartphone, Copy, Check, AlertTriangle, Lock } from "lucide-react";

const settingsNavItems = [
  { title: "Profile", href: "/dashboard/settings/profile", icon: User },
  { title: "Security", href: "/dashboard/settings/security", icon: Shield },
  { title: "Two-Factor Auth", href: "/dashboard/settings/two-factor", icon: Key, active: true },
  { title: "Billing", href: "/dashboard/billing", icon: CreditCard },
];

export default function TwoFactorPage() {
  const [status, setStatus] = useState<{ enabled: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Setup dialog
  const [setupOpen, setSetupOpen] = useState(false);
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [verifying, setVerifying] = useState(false);

  // Disable dialog
  const [disableOpen, setDisableOpen] = useState(false);
  const [disableCode, setDisableCode] = useState("");
  const [disabling, setDisabling] = useState(false);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await apiRequest("/auth/2fa/status");
      setStatus(res);
    } catch (error) {
      console.error("Failed to fetch 2FA status");
    } finally {
      setLoading(false);
    }
  };

  const handleSetup = async () => {
    try {
      const res = await apiRequest("/auth/2fa/setup", { method: "POST" });
      setQrCode(res.qrCode);
      setSecret(res.secret);
      setSetupOpen(true);
    } catch (error) {
      alert("Failed to start 2FA setup");
    }
  };

  const handleVerify = async () => {
    if (!verifyCode) return;

    setVerifying(true);
    try {
      await apiRequest("/auth/2fa/verify", {
        method: "POST",
        body: JSON.stringify({ token: verifyCode }),
      });
      setSetupOpen(false);
      setVerifyCode("");
      fetchStatus();
      alert("2FA has been enabled successfully!");
    } catch (error) {
      alert("Invalid verification code. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  const handleDisable = async () => {
    if (!disableCode) return;

    setDisabling(true);
    try {
      await apiRequest("/auth/2fa/disable", {
        method: "POST",
        body: JSON.stringify({ token: disableCode }),
      });
      setDisableOpen(false);
      setDisableCode("");
      fetchStatus();
      alert("2FA has been disabled.");
    } catch (error) {
      alert("Invalid verification code. Please try again.");
    } finally {
      setDisabling(false);
    }
  };

  const copySecret = () => {
    navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="max-w-5xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-slate-200 rounded w-32" />
            <div className="h-4 bg-slate-200 rounded w-64" />
            <div className="grid lg:grid-cols-[240px_1fr] gap-8">
              <div className="space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-12 bg-slate-100 rounded-xl" />
                ))}
              </div>
              <div className="h-64 bg-slate-100 rounded-xl" />
            </div>
          </div>
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
            {/* Status Card */}
            <Card className="border-slate-200 shadow-sm overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                      <Key className="h-4 w-4 text-indigo-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Two-Factor Authentication</CardTitle>
                      <CardDescription>
                        Add an extra layer of security to your account.
                      </CardDescription>
                    </div>
                  </div>
                  {status?.enabled ? (
                    <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0">
                      <ShieldCheck className="mr-1 h-3 w-3" /> Enabled
                    </Badge>
                  ) : (
                    <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-0">
                      <ShieldOff className="mr-1 h-3 w-3" /> Disabled
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {status?.enabled ? (
                  <div className="flex items-start gap-4 p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl">
                    <div className="h-12 w-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                      <ShieldCheck className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-emerald-800 mb-1">
                        Your account is protected
                      </p>
                      <p className="text-sm text-emerald-600">
                        Two-factor authentication is enabled. You&apos;ll need to enter a verification code from your authenticator app when signing in.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-4 p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl">
                    <div className="h-12 w-12 rounded-xl bg-amber-100 flex items-center justify-center">
                      <AlertTriangle className="h-6 w-6 text-amber-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-amber-800 mb-1">
                        Two-factor authentication is not enabled
                      </p>
                      <p className="text-sm text-amber-600">
                        Protect your account by enabling 2FA. You&apos;ll need an authenticator app like Google Authenticator, Authy, or 1Password.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="bg-slate-50 border-t border-slate-100 px-6 py-4">
                {status?.enabled ? (
                  <Button
                    variant="outline"
                    onClick={() => setDisableOpen(true)}
                    className="rounded-lg border-red-200 text-red-600 hover:bg-red-50"
                  >
                    <ShieldOff className="mr-2 h-4 w-4" />
                    Disable 2FA
                  </Button>
                ) : (
                  <Button
                    onClick={handleSetup}
                    className="rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25"
                  >
                    <QrCode className="mr-2 h-4 w-4" /> Set up 2FA
                  </Button>
                )}
              </CardFooter>
            </Card>

            {/* How it works */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">How Two-Factor Authentication Works</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-600">
                    1
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">Install an authenticator app</p>
                    <p className="text-sm text-slate-500">
                      Download Google Authenticator, Authy, or any TOTP-compatible app on your phone.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-600">
                    2
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">Scan the QR code</p>
                    <p className="text-sm text-slate-500">
                      Use your authenticator app to scan the QR code we&apos;ll show you during setup.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-600">
                    3
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">Enter the verification code</p>
                    <p className="text-sm text-slate-500">
                      Your app will generate a 6-digit code. Enter it to complete the setup.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Supported Apps */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Recommended Authenticator Apps</CardTitle>
                <CardDescription>
                  Any TOTP-compatible app will work with PingTO.Me
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                    <div className="h-10 w-10 rounded-lg bg-white shadow-sm flex items-center justify-center">
                      <Smartphone className="h-5 w-5 text-slate-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 text-sm">Google Authenticator</p>
                      <p className="text-xs text-slate-500">iOS & Android</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                    <div className="h-10 w-10 rounded-lg bg-white shadow-sm flex items-center justify-center">
                      <Lock className="h-5 w-5 text-slate-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 text-sm">Authy</p>
                      <p className="text-xs text-slate-500">iOS, Android & Desktop</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                    <div className="h-10 w-10 rounded-lg bg-white shadow-sm flex items-center justify-center">
                      <Key className="h-5 w-5 text-slate-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 text-sm">1Password</p>
                      <p className="text-xs text-slate-500">All platforms</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Setup Dialog */}
      <Dialog open={setupOpen} onOpenChange={setSetupOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5 text-blue-600" />
              Set up Two-Factor Authentication
            </DialogTitle>
            <DialogDescription>
              Scan the QR code with your authenticator app, then enter the verification code.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {qrCode && (
              <div className="flex justify-center p-4 bg-white rounded-xl border border-slate-200">
                <img src={qrCode} alt="2FA QR Code" className="w-48 h-48" />
              </div>
            )}
            <div className="text-center space-y-2">
              <p className="text-sm text-slate-500">
                Can&apos;t scan? Enter this code manually:
              </p>
              <div className="flex items-center justify-center gap-2">
                <code className="bg-slate-100 px-3 py-2 rounded-lg text-sm font-mono text-slate-700">
                  {secret}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copySecret}
                  className="h-8 w-8 p-0"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Copy className="h-4 w-4 text-slate-400" />
                  )}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="verifyCode" className="text-slate-700 font-medium">
                Verification Code
              </Label>
              <Input
                id="verifyCode"
                placeholder="Enter 6-digit code"
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ""))}
                maxLength={6}
                className="h-11 rounded-lg text-center text-lg font-mono tracking-widest"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setSetupOpen(false)}
              className="rounded-lg"
            >
              Cancel
            </Button>
            <Button
              onClick={handleVerify}
              disabled={verifying || verifyCode.length !== 6}
              className="rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              {verifying ? "Verifying..." : "Verify & Enable"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Disable Dialog */}
      <Dialog open={disableOpen} onOpenChange={setDisableOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <ShieldOff className="h-5 w-5" />
              Disable Two-Factor Authentication
            </DialogTitle>
            <DialogDescription>
              Enter your current 2FA code to disable two-factor authentication.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-red-50 rounded-xl">
              <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
              <div>
                <p className="font-medium text-red-800 text-sm">Warning</p>
                <p className="text-sm text-red-600">
                  Disabling 2FA will make your account less secure. Your account will only be protected by your password.
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="disableCode" className="text-slate-700 font-medium">
                Verification Code
              </Label>
              <Input
                id="disableCode"
                placeholder="Enter 6-digit code"
                value={disableCode}
                onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, ""))}
                maxLength={6}
                className="h-11 rounded-lg text-center text-lg font-mono tracking-widest"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDisableOpen(false)}
              className="rounded-lg"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDisable}
              disabled={disabling || disableCode.length !== 6}
              className="rounded-lg"
            >
              {disabling ? "Disabling..." : "Disable 2FA"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
