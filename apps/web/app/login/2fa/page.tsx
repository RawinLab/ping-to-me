"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Label, Alert, AlertDescription, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@pingtome/ui";
import { useAuth } from "@/contexts/AuthContext";
import { Shield, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function TwoFactorPage() {
  const [code, setCode] = useState("");
  const [isBackupMode, setIsBackupMode] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { verify2FA, sessionToken } = useAuth();

  // Auto-focus on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, [isBackupMode]);

  // Auto-submit when 6 digits entered (not in backup mode)
  useEffect(() => {
    if (!isBackupMode && code.length === 6 && /^\d{6}$/.test(code)) {
      handleSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, isBackupMode]);

  // Redirect if no session token
  useEffect(() => {
    if (!sessionToken) {
      router.push("/login");
    }
  }, [sessionToken, router]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!code || isLoading) return;

    setIsLoading(true);
    setError("");

    try {
      await verify2FA(code);
      router.push("/dashboard");
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Invalid code. Please try again."
      );
      setCode("");
      inputRef.current?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow digits for 2FA code mode, allow any chars for backup code
    if (!isBackupMode && !/^\d*$/.test(value)) return;
    // Limit to 6 digits for 2FA code
    if (!isBackupMode && value.length > 6) return;
    setCode(value);
  };

  const toggleBackupMode = () => {
    setIsBackupMode(!isBackupMode);
    setCode("");
    setError("");
  };

  if (!sessionToken) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="container relative min-h-screen flex items-center justify-center py-12">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px]">
        <div className="flex flex-col space-y-2 text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Shield className="h-6 w-6 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            Two-Factor Authentication
          </h1>
          <p className="text-muted-foreground">
            {isBackupMode
              ? "Enter your backup code to continue"
              : "Enter the 6-digit code from your authenticator app"}
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">
                  {isBackupMode ? "Backup Code" : "Authentication Code"}
                </Label>
                <Input
                  ref={inputRef}
                  id="code"
                  type="text"
                  inputMode={isBackupMode ? "text" : "numeric"}
                  placeholder={isBackupMode ? "Enter backup code" : "000000"}
                  value={code}
                  onChange={handleCodeChange}
                  disabled={isLoading}
                  className={`text-center text-2xl tracking-widest ${
                    !isBackupMode ? "font-mono" : ""
                  }`}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                />
                {!isBackupMode && (
                  <p className="text-xs text-muted-foreground text-center">
                    Code will be automatically submitted when complete
                  </p>
                )}
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-3">
                {isBackupMode && (
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={!code || isLoading}
                  >
                    {isLoading && (
                      <span className="mr-2 h-4 w-4 animate-spin">⏳</span>
                    )}
                    Verify Backup Code
                  </Button>
                )}

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={toggleBackupMode}
                  disabled={isLoading}
                >
                  {isBackupMode
                    ? "Use authenticator app code"
                    : "Use backup code instead"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="flex items-center justify-center">
          <Link
            href="/login"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to login
          </Link>
        </div>

        <div className="text-center text-sm text-muted-foreground space-y-1">
          <p>Having trouble accessing your account?</p>
          <Link
            href="/forgot-password"
            className="text-primary hover:underline"
          >
            Reset your password
          </Link>
        </div>
      </div>
    </div>
  );
}
