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

const ROLE_CONFIG: Record<
  string,
  { label: string; description: string; icon: any; color: string }
> = {
  OWNER: {
    label: "Owner",
    description: "Full access to everything",
    icon: Crown,
    color: "text-amber-600 bg-amber-50",
  },
  ADMIN: {
    label: "Admin",
    description: "Manage members, domains, and settings",
    icon: Shield,
    color: "text-purple-600 bg-purple-50",
  },
  EDITOR: {
    label: "Editor",
    description: "Create and edit links, tags, and bio pages",
    icon: Edit,
    color: "text-blue-600 bg-blue-50",
  },
  VIEWER: {
    label: "Viewer",
    description: "View links, analytics, and bio pages",
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
        setError("Please enter your name");
        return;
      }
      if (!password) {
        setError("Please enter a password");
        return;
      }
      if (password.length < 8) {
        setError("Password must be at least 8 characters");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match");
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
      setError(err.message || "Failed to accept invitation");
      setIsProcessing(false);
    }
  };

  const handleDecline = async () => {
    if (
      !invitation ||
      !confirm("Are you sure you want to decline this invitation?")
    )
      return;

    setIsProcessing(true);
    try {
      await declineInvitation(token);
      setStatus("declined");
    } catch (err: any) {
      setError(err.message || "Failed to decline invitation");
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
          <p className="text-slate-600">Loading invitation...</p>
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
              Invalid Invitation
            </h2>
            <p className="text-slate-600 mb-6">
              This invitation link is invalid or has been revoked. Please
              contact the organization administrator for a new invitation.
            </p>
            <Link href="/login">
              <Button>Go to Login</Button>
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
              Invitation Expired
            </h2>
            <p className="text-slate-600 mb-6">
              This invitation has expired. Please contact{" "}
              <strong>
                {invitation?.organization?.name || "the organization"}
              </strong>{" "}
              for a new invitation link.
            </p>
            <Link href="/login">
              <Button>Go to Login</Button>
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
              Already Accepted
            </h2>
            <p className="text-slate-600 mb-6">
              You&apos;ve already accepted this invitation. You&apos;re a member of{" "}
              <strong>{invitation?.organization?.name}</strong>.
            </p>
            <Link href="/dashboard">
              <Button>Go to Dashboard</Button>
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
              Invitation Declined
            </h2>
            <p className="text-slate-600 mb-6">
              You&apos;ve declined this invitation. If you change your mind, please
              contact the organization for a new invitation.
            </p>
            <Link href="/">
              <Button variant="outline">Go to Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Valid invitation - show accept/decline UI
  const roleConfig = ROLE_CONFIG[invitation?.role || "VIEWER"];
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
              PingTO.Me
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
              You&apos;re invited to join {invitation?.organization?.name}
            </CardTitle>
            <CardDescription>
              {invitation?.invitedBy?.name || invitation?.invitedBy?.email} has
              invited you to collaborate.
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
                  <p className="font-medium">{roleConfig.label}</p>
                  <p className="text-xs opacity-80">{roleConfig.description}</p>
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
                Expires{" "}
                {format(new Date(invitation?.expiresAt || ""), "MMMM d, yyyy")}
              </span>
            </div>

            <Separator />

            {/* New User Registration Form */}
            {!user && (
              <div className="space-y-4">
                <p className="text-sm text-slate-600 text-center">
                  Create an account to accept this invitation
                </p>

                <div className="space-y-2">
                  <Label htmlFor="name">Your Name</Label>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={invitation?.email || ""}
                    disabled
                    className="bg-slate-50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="Confirm your password"
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
                    <p className="font-medium text-green-900">Logged in as</p>
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
              {user ? "Accept Invitation" : "Create Account & Join"}
            </Button>

            <Button
              variant="ghost"
              className="w-full text-slate-600"
              onClick={handleDecline}
              disabled={isProcessing}
            >
              Decline Invitation
            </Button>

            {!user && (
              <p className="text-xs text-center text-slate-500">
                Already have an account?{" "}
                <Link
                  href={`/login?redirect=/invitations/${token}`}
                  className="text-blue-600 hover:underline"
                >
                  Log in
                </Link>
              </p>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
