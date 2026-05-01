"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Label, Alert, AlertDescription, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@pingtome/ui";
import { useAuth } from "@/contexts/AuthContext";
import { Shield, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

export default function TwoFactorPage() {
  const [code, setCode] = useState("");
  const [isBackupMode, setIsBackupMode] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { verify2FA, sessionToken } = useAuth();
  const t = useTranslations("auth.twoFactor");

  useEffect(() => {
    inputRef.current?.focus();
  }, [isBackupMode]);

  useEffect(() => {
    if (!isBackupMode && code.length === 6 && /^\d{6}$/.test(code)) {
      handleSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, isBackupMode]);

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
          t("invalidCode")
      );
      setCode("");
      inputRef.current?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (!isBackupMode && !/^\d*$/.test(value)) return;
    if (!isBackupMode && value.length > 6) return;
    setCode(value);
  };

  const toggleBackupMode = () => {
    setIsBackupMode(!isBackupMode);
    setCode("");
    setError("");
  };

  if (!sessionToken) {
    return null;
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
            {t("heading")}
          </h1>
          <p className="text-muted-foreground">
            {isBackupMode
              ? t("backupDescription")
              : t("codeDescription")}
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">
                  {isBackupMode ? t("backupCodeLabel") : t("authCodeLabel")}
                </Label>
                <Input
                  ref={inputRef}
                  id="code"
                  type="text"
                  inputMode={isBackupMode ? "text" : "numeric"}
                  placeholder={isBackupMode ? t("backupPlaceholder") : "000000"}
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
                    {t("autoSubmit")}
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
                    {t("verifyBackupCode")}
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
                    ? t("useAuthApp")
                    : t("useBackupCode")}
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
            {t("backToLogin")}
          </Link>
        </div>

        <div className="text-center text-sm text-muted-foreground space-y-1">
          <p>{t("troubleAccess")}</p>
          <Link
            href="/forgot-password"
            className="text-primary hover:underline"
          >
            {t("resetPassword")}
          </Link>
        </div>
      </div>
    </div>
  );
}
