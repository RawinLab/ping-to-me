"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button, Alert, AlertDescription } from "@pingtome/ui";
import Link from "next/link";
import { AuthSidebar } from "@/components/auth/AuthSidebar";
import { Loader2, CheckCircle2, XCircle, ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams?.get("token");
  const router = useRouter();
  const t = useTranslations("auth.verifyEmail");
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage(t("missingToken"));
      return;
    }

    const verify = async () => {
      try {
        const res = await fetch(
          process.env.NEXT_PUBLIC_API_URL + "/auth/verify-email",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token }),
          },
        );

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.message || t("verificationFailed"));
        }

        setStatus("success");
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      } catch (err: any) {
        setStatus("error");
        setMessage(err.message);
      }
    };

    verify();
  }, [token, router, t]);

  return (
    <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px]">
      <div className="flex flex-col items-center space-y-4 text-center">
        {status === "loading" && (
          <>
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-100">
              <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">
              {t("verifying")}
            </h1>
            <p className="text-muted-foreground">
              {t("verifyingDescription")}
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">
              {t("verified")}
            </h1>
            <Alert className="bg-green-50 border-green-200 text-green-800">
              <AlertDescription>
                {t("verifiedDescription")}
              </AlertDescription>
            </Alert>
          </>
        )}

        {status === "error" && (
          <>
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
              <XCircle className="h-10 w-10 text-red-600" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">
              {t("verificationFailed")}
            </h1>
            <Alert variant="destructive">
              <AlertDescription>{message}</AlertDescription>
            </Alert>
            <Link href="/login" className="w-full">
              <Button variant="outline" className="w-full gap-2">
                <ArrowLeft className="h-4 w-4" />
                {t("backToLogin")}
              </Button>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  const t = useTranslations("auth.verifyEmail");

  return (
    <div className="container relative min-h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <AuthSidebar
        variant="success"
        title={t("sidebarTitle")}
        description={t("sidebarDescription")}
      />
      <div className="flex items-center justify-center py-12 lg:p-8">
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          }
        >
          <VerifyEmailContent />
        </Suspense>
      </div>
    </div>
  );
}
