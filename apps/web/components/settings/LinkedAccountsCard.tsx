"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { apiRequest, getAccessToken } from "@/lib/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@pingtome/ui";
import { Link2, CheckCircle, AlertCircle, Github } from "lucide-react";

interface LinkedAccount {
  provider: string;
  linkedAt?: string;
}

interface LinkedAccountsCardProps {
  showMessage?: (type: "success" | "error", text: string) => void;
}

export function LinkedAccountsCard({ showMessage }: LinkedAccountsCardProps) {
  const t = useTranslations("settings.accounts");
  const [accounts, setAccounts] = useState<LinkedAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [unlinking, setUnlinking] = useState<string | null>(null);
  const [unlinkDialogOpen, setUnlinkDialogOpen] = useState(false);
  const [providerToUnlink, setProviderToUnlink] = useState<string | null>(null);

  useEffect(() => {
    fetchLinkedAccounts();
  }, []);

  const fetchLinkedAccounts = async () => {
    try {
      const response = await apiRequest("/auth/oauth/accounts");
      setAccounts(response.accounts || []);
    } catch (error) {
      console.error("Failed to fetch linked accounts", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLinkAccount = (provider: string) => {
    const token = getAccessToken();
    if (!token) {
      showMessage?.("error", t("authError"));
      return;
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    window.location.href = `${apiUrl}/auth/oauth/link/${provider}?token=${encodeURIComponent(token)}`;
  };

  const handleUnlinkAccount = async (provider: string) => {
    setUnlinking(provider);
    try {
      await apiRequest(`/auth/oauth/unlink/${provider}`, {
        method: "DELETE",
      });

      setAccounts(accounts.filter((acc) => acc.provider !== provider));

      showMessage?.("success", t("unlinked", { provider: getProviderName(provider) }));
    } catch (error: any) {
      showMessage?.("error", error.message || t("unlinkFailed"));
    } finally {
      setUnlinking(null);
      setUnlinkDialogOpen(false);
      setProviderToUnlink(null);
    }
  };

  const openUnlinkDialog = (provider: string) => {
    setProviderToUnlink(provider);
    setUnlinkDialogOpen(true);
  };

  const isLinked = (provider: string) => {
    return accounts.some((acc) => acc.provider === provider);
  };

  const getProviderName = (provider: string) => {
    return provider.charAt(0).toUpperCase() + provider.slice(1);
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case "google":
        return (
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
        );
      case "github":
        return <Github className="h-5 w-5 text-slate-900" />;
      default:
        return <Link2 className="h-5 w-5" />;
    }
  };

  const providers = [
    {
      id: "google",
      name: t("google"),
      description: t("googleDesc"),
    },
    {
      id: "github",
      name: t("github"),
      description: t("githubDesc"),
    },
  ];

  if (loading) {
    return (
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-purple-100 flex items-center justify-center">
              <Link2 className="h-4 w-4 text-purple-600" />
            </div>
            <div>
              <CardTitle className="text-lg">{t("title")}</CardTitle>
              <CardDescription>
                {t("subtitle")}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {providers.map((provider) => {
              const linked = isLinked(provider.id);
              return (
                <div
                  key={provider.id}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-white flex items-center justify-center shadow-sm">
                      {getProviderIcon(provider.id)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-slate-900">
                          {provider.name}
                        </p>
                        {linked && (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-medium">
                            <CheckCircle className="h-3 w-3" />
                            {t("connected")}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500">
                        {provider.description}
                      </p>
                    </div>
                  </div>
                  {linked ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openUnlinkDialog(provider.id)}
                      disabled={unlinking === provider.id}
                      className="rounded-lg text-red-600 border-red-200 hover:bg-red-50"
                    >
                      {unlinking === provider.id ? t("unlinking") : t("disconnect")}
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleLinkAccount(provider.id)}
                      className="rounded-lg"
                    >
                      {t("connect")}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900 mb-1">
                  {t("securityNote")}
                </p>
                <p className="text-xs text-blue-700">
                  {t("securityNoteDesc")}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={unlinkDialogOpen} onOpenChange={setUnlinkDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("disconnectTitle", { provider: providerToUnlink ? getProviderName(providerToUnlink) : "" })}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("disconnectDesc", { provider: providerToUnlink ? getProviderName(providerToUnlink) : "" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => providerToUnlink && handleUnlinkAccount(providerToUnlink)}
              className="bg-red-600 hover:bg-red-700"
            >
              {t("disconnect")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
