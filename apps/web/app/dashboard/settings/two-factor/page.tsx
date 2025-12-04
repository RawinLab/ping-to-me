"use client";

import { useState, useEffect } from "react";
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
import { Shield, ShieldCheck, ShieldOff, QrCode } from "lucide-react";

export default function TwoFactorPage() {
  const [status, setStatus] = useState<{ enabled: boolean } | null>(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Two-Factor Authentication</h1>
        <p className="text-muted-foreground">
          Add an extra layer of security to your account.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Authenticator App
            </span>
            <Badge variant={status?.enabled ? "default" : "secondary"}>
              {status?.enabled ? "Enabled" : "Disabled"}
            </Badge>
          </CardTitle>
          <CardDescription>
            Use an authenticator app like Google Authenticator or Authy to
            generate verification codes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {status?.enabled ? (
            <div className="flex items-center gap-4 p-4 bg-green-50 rounded-lg">
              <ShieldCheck className="h-8 w-8 text-green-600" />
              <div>
                <p className="font-medium text-green-800">
                  2FA is currently enabled
                </p>
                <p className="text-sm text-green-600">
                  Your account is protected with two-factor authentication.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4 p-4 bg-yellow-50 rounded-lg">
              <ShieldOff className="h-8 w-8 text-yellow-600" />
              <div>
                <p className="font-medium text-yellow-800">
                  2FA is not enabled
                </p>
                <p className="text-sm text-yellow-600">
                  Enable two-factor authentication for enhanced security.
                </p>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter>
          {status?.enabled ? (
            <Button variant="destructive" onClick={() => setDisableOpen(true)}>
              Disable 2FA
            </Button>
          ) : (
            <Button onClick={handleSetup}>
              <QrCode className="mr-2 h-4 w-4" /> Set up 2FA
            </Button>
          )}
        </CardFooter>
      </Card>

      {/* Setup Dialog */}
      <Dialog open={setupOpen} onOpenChange={setSetupOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Set up Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              Scan the QR code with your authenticator app, then enter the
              verification code.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {qrCode && (
              <div className="flex justify-center">
                <img src={qrCode} alt="2FA QR Code" className="w-48 h-48" />
              </div>
            )}
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">
                Can't scan? Enter this code manually:
              </p>
              <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                {secret}
              </code>
            </div>
            <div className="space-y-2">
              <Label htmlFor="verifyCode">Verification Code</Label>
              <Input
                id="verifyCode"
                placeholder="Enter 6-digit code"
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value)}
                maxLength={6}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSetupOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleVerify}
              disabled={verifying || verifyCode.length !== 6}
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
            <DialogTitle>Disable Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              Enter your current 2FA code to disable two-factor authentication.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-red-50 rounded-lg">
              <p className="text-sm text-red-800">
                Disabling 2FA will make your account less secure. Only proceed
                if necessary.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="disableCode">Verification Code</Label>
              <Input
                id="disableCode"
                placeholder="Enter 6-digit code"
                value={disableCode}
                onChange={(e) => setDisableCode(e.target.value)}
                maxLength={6}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDisableOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDisable}
              disabled={disabling || disableCode.length !== 6}
            >
              {disabling ? "Disabling..." : "Disable 2FA"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
