"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
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
  Separator,
} from "@pingtome/ui";
import {
  Building2,
  UserPlus,
  Shield,
  Edit,
  Eye,
  Crown,
  Mail,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  ArrowRight,
  Link2,
} from "lucide-react";
import {
  getInvitationByToken,
  acceptInvitation,
  declineInvitation,
  Invitation,
} from "@/lib/api/invitations";
import { useAuth } from "@/contexts/AuthContext";
import { setAccessToken } from "@/lib/api";
import { format, isPast } from "date-fns";
import { useTranslations } from "next-intl";

const ROLE_CONFIG: Record<
  string,
  { icon: any; color: string }
> = {
  OWNER: {
    icon: Crown,
    color: "text-amber-600 bg-amber-50",
  },
  ADMIN: {
    icon: Shield,
    color: "text-purple-600 bg-purple-50",
  },
  EDITOR: {
    icon: Edit,
    color: "text-blue-600 bg-blue-50",
  },
  VIEWER: {
    icon: Eye,
    color: "text-slate-600 bg-slate-50",
  },
};

type InvitationStatus =
  | "loading"
  | "valid"
  | "expired"
  | "accepted"
  | "declined"
  | "invalid";

export default function InvitationPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, refresh } = useAuth();
  const token = params.token as string;

  const [status, setStatus] = useState<InvitationStatus>("loading");
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // For new user registration
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const t = useTranslations("invitations");

  const ROLE_LABELS: Record<string, { label: string; description: string }> = {
    OWNER: { label: "Owner", description: t("fullAccess") },
    ADMIN: { label: "Admin", description: t("manageMembers") },
    EDITOR: { label: "Editor", description: t("createEditLinks") },
    VIEWER: { label: "Viewer", description: t("viewLinks") },
  };

  useEffect(() => {
    fetchInvitation();
  }, [token]);

  const fetchInvitation = async () => {
    try {
      const inv = await getInvitationByToken(token);
      setInvitation(inv);

      // Check status
      if (inv.acceptedAt) {
        setStatus("accepted");
      } else if (inv.declinedAt) {
        setStatus("declined");
      } else if (isPast(new Date(inv.expiresAt))) {
        setStatus("expired");
      } else {
        setStatus("valid");
      }
    } catch (err: any) {
      setStatus("invalid");
      setError(err.message || "Invalid invitation");
    }
  };

  const handleAccept = async () => {
    if (!invitation) return;

    // Validation for new users
    if (!user) {
      if (!name.trim()) {
        setError(t("pleaseEnterName"));
        return;
      }
      if (!password) {
        setError(t("pleaseEnterPassword"));
        return;
      }
      if (password.length < 8) {
        setError(t("passwordMin8"));
        return;
      }
      if (password !== confirmPassword) {
        setError(t("passwordsDoNotMatch"));
        return;
      }
    }

    setError(null);
    setIsProcessing(true);

    try {
      const result = await acceptInvitation(
        token,
        user ? undefined : { name, password },
      );

      // If new user, set their access token
      if (result.accessToken) {
        setAccessToken(result.accessToken);
      }

      // Refresh auth context
      await refresh();

      // Redirect to dashboard
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || t("failedToAccept"));
      setIsProcessing(false);
    }
  };

  const handleDecline = async () => {
    if (
      !invitation ||
      !confirm(t("declineConfirm"))
    )
      return;

    setIsProcessing(true);
    try {
      await declineInvitation(token);
      setStatus("declined");
    } catch (err: any) {
      setError(err.message || t("failedToDecline"));
    } finally {
      setIsProcessing(false);
    }
  };

  // Loading state
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">{t("loadingInvitation")}</p>
        </div>
      </div>
    );
  }

  // Invalid token
  if (status === "invalid") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 pb-6 text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">
              {t("invalidTitle")}
            </h2>
            <p className="text-slate-600 mb-6">
              {t("invalidDescription")}
            </p>
            <Link href="/login">
              <Button>{t("goToLogin")}</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Expired
  if (status === "expired") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 pb-6 text-center">
            <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="h-8 w-8 text-amber-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">
              {t("expiredTitle")}
            </h2>
            <p className="text-slate-600 mb-6">
              {t("expiredDescription")}{" "}
              <strong>
                {invitation?.organization?.name || t("theOrganization")}
              </strong>{" "}
              {t("forNewLink")}
            </p>
            <Link href="/login">
              <Button>{t("goToLogin")}</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Already accepted
  if (status === "accepted") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 pb-6 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">
              {t("alreadyAccepted")}
            </h2>
            <p className="text-slate-600 mb-6">
              {t("alreadyAcceptedDescription")}{" "}
              <strong>{invitation?.organization?.name}</strong>.
            </p>
            <Link href="/dashboard">
              <Button>{t("goToDashboard")}</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Declined
  if (status === "declined") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 pb-6 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <XCircle className="h-8 w-8 text-slate-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">
              {t("invitationDeclined")}
            </h2>
            <p className="text-slate-600 mb-6">
              {t("declinedDescription")}
            </p>
            <Link href="/">
              <Button variant="outline">{t("goToHome")}</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Valid invitation - show accept/decline UI
  const roleConfig = ROLE_CONFIG[invitation?.role || "VIEWER"];
  const roleLabels = ROLE_LABELS[invitation?.role || "VIEWER"];
  const RoleIcon = roleConfig.icon;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50 p-4">
      <div className="max-w-md w-full space-y-6">
        {/* Logo */}
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Link2 className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
              {t("pingtome")}
            </span>
          </Link>
        </div>

        {/* Main Card */}
        <Card className="shadow-xl border-slate-200">
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-4">
              {invitation?.organization?.logo ? (
                <img
                  src={invitation.organization.logo}
                  alt={invitation.organization.name}
                  className="w-16 h-16 rounded-xl object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold">
                  {invitation?.organization?.name?.[0]?.toUpperCase() || "O"}
                </div>
              )}
            </div>
            <CardTitle className="text-xl">
              {t("invitedToJoin")} {invitation?.organization?.name}
            </CardTitle>
            <CardDescription>
              {invitation?.invitedBy?.name || invitation?.invitedBy?.email}{" "}
              {t("hasInvitedYou")}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Role Badge */}
            <div className="flex items-center justify-center">
              <div
                className={`flex items-center gap-2 px-4 py-2 rounded-lg ${roleConfig.color}`}
              >
                <RoleIcon className="h-5 w-5" />
                <div>
                  <p className="font-medium">{roleLabels.label}</p>
                  <p className="text-xs opacity-80">{roleLabels.description}</p>
                </div>
              </div>
            </div>

            {/* Personal Message */}
            {invitation?.personalMessage && (
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-sm text-slate-600 italic">
                  &quot;{invitation.personalMessage}&quot;
                </p>
                <p className="text-xs text-slate-500 mt-2">
                  — {invitation.invitedBy?.name || invitation.invitedBy?.email}
                </p>
              </div>
            )}

            {/* Expiry Info */}
            <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
              <Clock className="h-4 w-4" />
              <span>
                {t("expires")}{" "}
                {format(new Date(invitation?.expiresAt || ""), "MMMM d, yyyy")}
              </span>
            </div>

            <Separator />

            {/* New User Registration Form */}
            {!user && (
              <div className="space-y-4">
                <p className="text-sm text-slate-600 text-center">
                  {t("createAccountToAccept")}
                </p>

                <div className="space-y-2">
                  <Label htmlFor="name">{t("yourName")}</Label>
                  <Input
                    id="name"
                    placeholder={t("yourNamePlaceholder")}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">{t("email")}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={invitation?.email || ""}
                    disabled
                    className="bg-slate-50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">{t("password")}</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder={t("atLeast8Chars")}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">{t("confirmPassword")}</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder={t("confirmPasswordPlaceholder")}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Logged in user info */}
            {user && (
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-green-900">{t("loggedInAs")}</p>
                    <p className="text-sm text-green-700">{user.email}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex flex-col gap-3">
            <Button
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              size="lg"
              onClick={handleAccept}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <UserPlus className="h-4 w-4 mr-2" />
              )}
              {user ? t("acceptInvitation") : t("createAccountJoin")}
            </Button>

            <Button
              variant="ghost"
              className="w-full text-slate-600"
              onClick={handleDecline}
              disabled={isProcessing}
            >
              {t("declineInvitation")}
            </Button>

            {!user && (
              <p className="text-xs text-center text-slate-500">
                {t("alreadyHaveAccount")}{" "}
                <Link
                  href={`/login?redirect=/invitations/${token}`}
                  className="text-blue-600 hover:underline"
                >
                  {t("logIn")}
                </Link>
              </p>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
