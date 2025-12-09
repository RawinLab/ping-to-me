"use client";

import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/api";
import { securityApi } from "@/lib/api/security";
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
import {
  Shield,
  ShieldCheck,
  ShieldOff,
  QrCode,
  Key,
  Smartphone,
  Copy,
  Check,
  AlertTriangle,
  Lock,
  Download,
  RefreshCw,
  Eye,
  EyeOff,
} from "lucide-react";

export default function TwoFactorPage() {
  const [status, setStatus] = useState<{ enabled: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [remainingBackupCodes, setRemainingBackupCodes] = useState<
    number | null
  >(null);

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

  // Backup codes dialogs
  const [backupCodesPasswordOpen, setBackupCodesPasswordOpen] = useState(false);
  const [backupCodesPassword, setBackupCodesPassword] = useState("");
  const [showBackupCodesPassword, setShowBackupCodesPassword] = useState(false);
  const [generatingBackupCodes, setGeneratingBackupCodes] = useState(false);
  const [backupCodesOpen, setBackupCodesOpen] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [copiedCodes, setCopiedCodes] = useState(false);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await apiRequest("/auth/2fa/status");
      setStatus(res);

      // Fetch backup codes count if 2FA is enabled
      if (res.enabled) {
        try {
          const backupCodesStatus = await securityApi.getRemainingBackupCodes();
          setRemainingBackupCodes(backupCodesStatus.remainingCount);
        } catch (error) {
          console.error("Failed to fetch backup codes status");
        }
      }
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

  const handleGenerateBackupCodes = async () => {
    if (!backupCodesPassword) return;

    setGeneratingBackupCodes(true);
    try {
      const response = await securityApi.generateBackupCodes(
        backupCodesPassword,
      );
      setBackupCodes(response.codes);
      setRemainingBackupCodes(response.remainingCount);
      setBackupCodesPasswordOpen(false);
      setBackupCodesPassword("");
      setBackupCodesOpen(true);
    } catch (error: any) {
      alert(error.message || "Failed to generate backup codes");
    } finally {
      setGeneratingBackupCodes(false);
    }
  };

  const copyAllCodes = () => {
    navigator.clipboard.writeText(backupCodes.join("\n"));
    setCopiedCodes(true);
    setTimeout(() => setCopiedCodes(false), 2000);
  };

  const downloadCodes = () => {
    const text = `PingTO.Me Backup Codes\nGenerated: ${new Date().toLocaleString()}\n\n${backupCodes.join("\n")}\n\nStore these codes securely. Each code can only be used once.`;
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pingtome-backup-codes-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
            Two-Factor Authentication
          </h1>
          <p className="text-slate-500 mt-1">
            Add an extra layer of security to your account.
          </p>
        </div>

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
                      <CardTitle className="text-lg">
                        Two-Factor Authentication
                      </CardTitle>
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
                        Two-factor authentication is enabled. You&apos;ll need
                        to enter a verification code from your authenticator app
                        when signing in.
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
                        Protect your account by enabling 2FA. You&apos;ll need
                        an authenticator app like Google Authenticator, Authy,
                        or 1Password.
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

            {/* Backup Codes Card - Only show if 2FA is enabled */}
            {status?.enabled && (
              <Card className="border-slate-200 shadow-sm overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                        <Key className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">Backup Codes</CardTitle>
                        <CardDescription>
                          Use these codes to access your account if you lose your
                          authenticator device.
                        </CardDescription>
                      </div>
                    </div>
                    {remainingBackupCodes !== null && (
                      <Badge
                        className={`${
                          remainingBackupCodes === 0
                            ? "bg-red-100 text-red-700 hover:bg-red-100"
                            : remainingBackupCodes <= 2
                              ? "bg-amber-100 text-amber-700 hover:bg-amber-100"
                              : "bg-blue-100 text-blue-700 hover:bg-blue-100"
                        } border-0`}
                      >
                        {remainingBackupCodes} remaining
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
                    <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
                      <Shield className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-blue-800 mb-1">
                        Keep backup codes secure
                      </p>
                      <p className="text-sm text-blue-600">
                        Each code can only be used once. Store them in a secure
                        location like a password manager. You&apos;ll need them
                        if you lose access to your authenticator app.
                      </p>
                    </div>
                  </div>
                  {remainingBackupCodes === 0 && (
                    <div className="flex items-start gap-3 p-4 bg-red-50 rounded-xl mt-4">
                      <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                      <div>
                        <p className="font-medium text-red-800 text-sm">
                          No backup codes remaining
                        </p>
                        <p className="text-sm text-red-600">
                          You&apos;ve used all your backup codes. Generate new
                          ones to ensure you can access your account.
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="bg-slate-50 border-t border-slate-100 px-6 py-4 flex gap-2">
                  <Button
                    onClick={() => setBackupCodesPasswordOpen(true)}
                    className="rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25"
                  >
                    <Key className="mr-2 h-4 w-4" />
                    {remainingBackupCodes === 0
                      ? "Generate Backup Codes"
                      : "Regenerate Backup Codes"}
                  </Button>
                  {remainingBackupCodes !== null && remainingBackupCodes > 0 && (
                    <p className="text-xs text-slate-500 flex items-center">
                      Regenerating will invalidate existing codes
                    </p>
                  )}
                </CardFooter>
              </Card>
            )}

            {/* How it works */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">
                  How Two-Factor Authentication Works
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-600">
                    1
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">
                      Install an authenticator app
                    </p>
                    <p className="text-sm text-slate-500">
                      Download Google Authenticator, Authy, or any
                      TOTP-compatible app on your phone.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-600">
                    2
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">
                      Scan the QR code
                    </p>
                    <p className="text-sm text-slate-500">
                      Use your authenticator app to scan the QR code we&apos;ll
                      show you during setup.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-600">
                    3
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">
                      Enter the verification code
                    </p>
                    <p className="text-sm text-slate-500">
                      Your app will generate a 6-digit code. Enter it to
                      complete the setup.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Supported Apps */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">
                  Recommended Authenticator Apps
                </CardTitle>
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
                      <p className="font-medium text-slate-900 text-sm">
                        Google Authenticator
                      </p>
                      <p className="text-xs text-slate-500">iOS & Android</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                    <div className="h-10 w-10 rounded-lg bg-white shadow-sm flex items-center justify-center">
                      <Lock className="h-5 w-5 text-slate-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 text-sm">
                        Authy
                      </p>
                      <p className="text-xs text-slate-500">
                        iOS, Android & Desktop
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                    <div className="h-10 w-10 rounded-lg bg-white shadow-sm flex items-center justify-center">
                      <Key className="h-5 w-5 text-slate-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 text-sm">
                        1Password
                      </p>
                      <p className="text-xs text-slate-500">All platforms</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
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
              Scan the QR code with your authenticator app, then enter the
              verification code.
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
              <Label
                htmlFor="verifyCode"
                className="text-slate-700 font-medium"
              >
                Verification Code
              </Label>
              <Input
                id="verifyCode"
                placeholder="Enter 6-digit code"
                value={verifyCode}
                onChange={(e) =>
                  setVerifyCode(e.target.value.replace(/\D/g, ""))
                }
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
                  Disabling 2FA will make your account less secure. Your account
                  will only be protected by your password.
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="disableCode"
                className="text-slate-700 font-medium"
              >
                Verification Code
              </Label>
              <Input
                id="disableCode"
                placeholder="Enter 6-digit code"
                value={disableCode}
                onChange={(e) =>
                  setDisableCode(e.target.value.replace(/\D/g, ""))
                }
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

      {/* Backup Codes Password Confirmation Dialog */}
      <Dialog
        open={backupCodesPasswordOpen}
        onOpenChange={setBackupCodesPasswordOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-blue-600" />
              Confirm Your Password
            </DialogTitle>
            <DialogDescription>
              Enter your password to generate backup codes.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl">
              <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
              <div>
                <p className="font-medium text-amber-800 text-sm">Important</p>
                <p className="text-sm text-amber-600">
                  {remainingBackupCodes && remainingBackupCodes > 0
                    ? "Generating new codes will invalidate all existing backup codes."
                    : "Store these codes securely. They will only be shown once."}
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="backupPassword" className="text-slate-700 font-medium">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="backupPassword"
                  type={showBackupCodesPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={backupCodesPassword}
                  onChange={(e) => setBackupCodesPassword(e.target.value)}
                  className="h-11 rounded-lg border-slate-200 focus:border-blue-300 focus:ring-blue-100 pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  onClick={() =>
                    setShowBackupCodesPassword(!showBackupCodesPassword)
                  }
                >
                  {showBackupCodesPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setBackupCodesPasswordOpen(false);
                setBackupCodesPassword("");
              }}
              className="rounded-lg"
            >
              Cancel
            </Button>
            <Button
              onClick={handleGenerateBackupCodes}
              disabled={generatingBackupCodes || !backupCodesPassword}
              className="rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              {generatingBackupCodes ? "Generating..." : "Generate Codes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Backup Codes Display Dialog */}
      <Dialog open={backupCodesOpen} onOpenChange={setBackupCodesOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-blue-600" />
              Your Backup Codes
            </DialogTitle>
            <DialogDescription>
              Save these codes in a secure location. Each code can only be used
              once.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-red-50 rounded-xl">
              <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
              <div>
                <p className="font-medium text-red-800 text-sm">
                  Store securely - Shown only once
                </p>
                <p className="text-sm text-red-600">
                  These codes will not be shown again. Download or copy them now.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
              {backupCodes.map((code, index) => (
                <div
                  key={index}
                  className="flex items-center justify-center p-3 bg-white rounded-lg border border-slate-200"
                >
                  <code className="text-sm font-mono text-slate-700 font-semibold">
                    {code}
                  </code>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={copyAllCodes}
                className="flex-1 rounded-lg"
              >
                {copiedCodes ? (
                  <>
                    <Check className="mr-2 h-4 w-4 text-emerald-500" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy All
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={downloadCodes}
                className="flex-1 rounded-lg"
              >
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                setBackupCodesOpen(false);
                setBackupCodes([]);
              }}
              className="rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              I&apos;ve saved my codes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}
