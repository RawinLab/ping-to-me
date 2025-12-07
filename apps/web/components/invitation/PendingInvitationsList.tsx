"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Skeleton,
} from "@pingtome/ui";
import {
  Mail,
  Clock,
  RefreshCw,
  X,
  Shield,
  Edit,
  Eye,
  Loader2,
  MailCheck,
  Users,
} from "lucide-react";
import {
  listInvitations,
  resendInvitation,
  cancelInvitation,
  Invitation,
} from "@/lib/api/invitations";
import { useOrganization } from "@/contexts/OrganizationContext";
import { formatDistanceToNow, format, isPast } from "date-fns";

const ROLE_CONFIG: Record<string, { label: string; color: string; icon: any }> =
  {
    ADMIN: {
      label: "Admin",
      color: "bg-purple-100 text-purple-700",
      icon: Shield,
    },
    EDITOR: { label: "Editor", color: "bg-blue-100 text-blue-700", icon: Edit },
    VIEWER: {
      label: "Viewer",
      color: "bg-slate-100 text-slate-700",
      icon: Eye,
    },
  };

interface PendingInvitationsListProps {
  onInvitationChange?: () => void;
}

export function PendingInvitationsList({
  onInvitationChange,
}: PendingInvitationsListProps) {
  const { currentOrg } = useOrganization();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedInvitation, setSelectedInvitation] =
    useState<Invitation | null>(null);

  const fetchInvitations = async () => {
    if (!currentOrg) return;

    try {
      setIsLoading(true);
      const result = await listInvitations(currentOrg.id, {
        status: "pending",
      });
      setInvitations(result.invitations || []);
    } catch (err) {
      console.error("Failed to fetch invitations:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, [currentOrg?.id]);

  const handleResend = async (invitation: Invitation) => {
    if (!currentOrg) return;

    setActionInProgress(invitation.id);
    try {
      await resendInvitation(currentOrg.id, invitation.id);
      await fetchInvitations();
      onInvitationChange?.();
    } catch (err: any) {
      alert(err.message || "Failed to resend invitation");
    } finally {
      setActionInProgress(null);
    }
  };

  const handleCancel = async () => {
    if (!currentOrg || !selectedInvitation) return;

    setActionInProgress(selectedInvitation.id);
    try {
      await cancelInvitation(currentOrg.id, selectedInvitation.id);
      await fetchInvitations();
      onInvitationChange?.();
    } catch (err: any) {
      alert(err.message || "Failed to cancel invitation");
    } finally {
      setActionInProgress(null);
      setCancelDialogOpen(false);
      setSelectedInvitation(null);
    }
  };

  const getExpiryStatus = (expiresAt: string) => {
    const expiry = new Date(expiresAt);
    if (isPast(expiry)) {
      return { label: "Expired", color: "bg-red-100 text-red-700" };
    }
    return {
      label: `Expires ${formatDistanceToNow(expiry, { addSuffix: true })}`,
      color: "bg-amber-100 text-amber-700",
    };
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-1" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Mail className="h-5 w-5 text-blue-600" />
              Pending Invitations
            </CardTitle>
            <CardDescription>
              {invitations.length} pending invitation
              {invitations.length !== 1 ? "s" : ""}
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchInvitations}
            disabled={isLoading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </CardHeader>

        <CardContent>
          {invitations.length === 0 ? (
            <div className="py-12 text-center">
              <div className="mx-auto h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                <MailCheck className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                No pending invitations
              </h3>
              <p className="text-slate-500 max-w-sm mx-auto">
                All invitations have been accepted or there are no pending
                invitations.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Invited By</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.map((invitation) => {
                  const roleConfig =
                    ROLE_CONFIG[invitation.role] || ROLE_CONFIG.VIEWER;
                  const RoleIcon = roleConfig.icon;
                  const expiryStatus = getExpiryStatus(invitation.expiresAt);
                  const isExpired = isPast(new Date(invitation.expiresAt));
                  const isProcessing = actionInProgress === invitation.id;

                  return (
                    <TableRow key={invitation.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                            <Mail className="h-4 w-4 text-slate-500" />
                          </div>
                          <div>
                            <p className="font-medium">{invitation.email}</p>
                            <p className="text-xs text-slate-500">
                              Sent{" "}
                              {format(
                                new Date(invitation.createdAt),
                                "MMM d, yyyy",
                              )}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${roleConfig.color} border-0`}>
                          <RoleIcon className="h-3 w-3 mr-1" />
                          {roleConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-slate-600">
                          {invitation.invitedBy?.name ||
                            invitation.invitedBy?.email ||
                            "Unknown"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${expiryStatus.color} border-0`}>
                          <Clock className="h-3 w-3 mr-1" />
                          {expiryStatus.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleResend(invitation)}
                            disabled={isProcessing}
                          >
                            {isProcessing ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <RefreshCw className="h-4 w-4 mr-1" />
                                Resend
                              </>
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => {
                              setSelectedInvitation(invitation);
                              setCancelDialogOpen(true);
                            }}
                            disabled={isProcessing}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Invitation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel the invitation for{" "}
              <strong>{selectedInvitation?.email}</strong>? They will no longer
              be able to join the organization using this invitation link.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Invitation</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              className="bg-red-600 hover:bg-red-700"
            >
              {actionInProgress ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Cancel Invitation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
