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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@pingtome/ui";
import { apiRequest } from "../../../../lib/api";
import { InviteMemberModal } from "../../../../components/InviteMemberModal";
import { usePermission } from "@/hooks/usePermission";
import { PermissionGate } from "@/components/PermissionGate";
import { RoleBadge } from "@/components/RoleBadge";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/contexts/OrganizationContext";
import {
  Users,
  UserPlus,
  Shield,
  Crown,
  Eye,
  Edit,
  Trash2,
  Mail,
  Lock,
} from "lucide-react";
import type { MemberRole } from "@/lib/permissions";

const ROLE_CONFIG: Record<string, { label: string; color: string; icon: any }> =
  {
    OWNER: {
      label: "Owner",
      color: "bg-amber-100 text-amber-700",
      icon: Crown,
    },
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

export default function TeamSettingsPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const { currentOrg } = useOrganization();
  const orgId = currentOrg?.id || "";

  // Permission hooks
  const {
    canInviteMembers,
    canRemoveMembers,
    canUpdateRoles,
    canManageRole,
    getAssignableRoles,
    role: currentUserRole,
  } = usePermission();
  const { user } = useAuth();

  useEffect(() => {
    if (orgId) {
      loadMembers();
    }
  }, [orgId]);

  const loadMembers = async () => {
    if (!orgId) return;
    try {
      const res = await apiRequest(`/organizations/${orgId}/members`);
      setMembers(res);
    } catch (err) {
      console.error("Failed to load members");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (userId: string) => {
    if (!confirm("Are you sure you want to remove this member?")) return;
    try {
      await apiRequest(`/organizations/${orgId}/members/${userId}`, {
        method: "DELETE",
      });
      loadMembers();
    } catch (err) {
      alert("Failed to remove member");
    }
  };

  const handleRoleChange = async (
    userId: string,
    newRole: string,
    currentRole: string,
  ) => {
    // Check if user can manage the target role
    if (!canManageRole(newRole as MemberRole)) {
      alert("You don't have permission to assign this role");
      return;
    }

    try {
      await apiRequest(`/organizations/${orgId}/members/${userId}`, {
        method: "PATCH",
        body: JSON.stringify({ role: newRole }),
      });
      loadMembers();
    } catch (err) {
      alert("Failed to update role");
    }
  };

  // Get list of roles the current user can assign
  const assignableRoles = getAssignableRoles();

  // Check if a member can be managed by current user
  const canManageMember = (memberRole: string, memberUserId: string) => {
    // Cannot manage yourself
    if (memberUserId === user?.id) return false;

    // Cannot manage members with equal or higher role
    return canManageRole(memberRole as MemberRole);
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-slate-200 rounded w-48" />
            <div className="h-4 bg-slate-200 rounded w-72" />
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-slate-100 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
              Team Members
            </h1>
            <p className="text-slate-500 mt-1">
              Manage your team and their access levels.
            </p>
          </div>
          <PermissionGate resource="team" action="invite">
            <Button
              onClick={() => setInviteModalOpen(true)}
              className="h-10 px-5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25"
            >
              <UserPlus className="mr-2 h-4 w-4" /> Invite Member
            </Button>
          </PermissionGate>
        </div>

        {/* Permission Notice for Limited Users */}
        {!canInviteMembers() && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <Lock className="h-4 w-4 text-amber-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-amber-900 mb-1">
                    Limited Access
                  </p>
                  <p className="text-sm text-amber-700">
                    You have {currentUserRole?.toLowerCase()} access. Contact an
                    admin or owner to invite new members or manage team roles.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Object.entries(ROLE_CONFIG).map(([role, config]) => {
            const count = members.filter((m) => m.role === role).length;
            const Icon = config.icon;
            return (
              <Card key={role} className="border-slate-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-10 w-10 rounded-xl ${config.color} flex items-center justify-center`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-900">
                        {count}
                      </p>
                      <p className="text-sm text-slate-500">{config.label}s</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Members List */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Team Members</CardTitle>
                <CardDescription>
                  {members.length} member{members.length !== 1 ? "s" : ""} in
                  your organization
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {members.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {members.map((member) => {
                  const roleConfig =
                    ROLE_CONFIG[member.role] || ROLE_CONFIG.VIEWER;
                  const RoleIcon = roleConfig.icon;
                  const isCurrentUser = member.userId === user?.id;
                  const canManageThisMember = canManageMember(
                    member.role,
                    member.userId,
                  );
                  const canChangeRole =
                    canUpdateRoles() && canManageThisMember && !isCurrentUser;
                  const canRemoveThisMember =
                    canRemoveMembers() && canManageThisMember && !isCurrentUser;

                  return (
                    <div
                      key={member.userId}
                      className="flex flex-col sm:flex-row sm:items-center gap-4 p-5 hover:bg-slate-50 transition-colors"
                    >
                      {/* User Info */}
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-lg shadow-lg shadow-blue-500/25">
                          {member.user.name?.[0]?.toUpperCase() ||
                            member.user.email[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-slate-900 truncate">
                              {member.user.name || "Unknown"}
                            </p>
                            {isCurrentUser && (
                              <Badge variant="outline" className="text-xs">
                                You
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 text-sm text-slate-500">
                            <Mail className="h-3.5 w-3.5" />
                            <span className="truncate">
                              {member.user.email}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Role Badge & Actions */}
                      <div className="flex items-center gap-3 sm:ml-auto">
                        {canChangeRole && assignableRoles.length > 0 ? (
                          <Select
                            value={member.role}
                            onValueChange={(value) =>
                              handleRoleChange(
                                member.userId,
                                value,
                                member.role,
                              )
                            }
                          >
                            <SelectTrigger className="w-36 rounded-lg">
                              <SelectValue>
                                <div className="flex items-center gap-2">
                                  <RoleIcon className="h-4 w-4" />
                                  {roleConfig.label}
                                </div>
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {assignableRoles.map((role) => {
                                const config = ROLE_CONFIG[role];
                                const Icon = config.icon;
                                return (
                                  <SelectItem key={role} value={role}>
                                    <div className="flex items-center gap-2">
                                      <Icon className="h-4 w-4" />
                                      {config.label}
                                    </div>
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="w-36">
                            <RoleBadge
                              role={member.role as MemberRole}
                              size="md"
                            />
                          </div>
                        )}

                        {canRemoveThisMember ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemove(member.userId)}
                            className="rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        ) : (
                          <div className="w-9" /> // Spacer to maintain layout
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-16 text-center">
                <div className="mx-auto h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center mb-4">
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  No team members yet
                </h3>
                <p className="text-slate-500 mb-6 max-w-sm mx-auto">
                  Invite team members to collaborate on your links and
                  analytics.
                </p>
                <PermissionGate resource="team" action="invite">
                  <Button
                    onClick={() => setInviteModalOpen(true)}
                    className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25"
                  >
                    <UserPlus className="mr-2 h-4 w-4" /> Invite Your First
                    Member
                  </Button>
                </PermissionGate>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Role Permissions Info */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Role Permissions</CardTitle>
            <CardDescription>
              Understanding what each role can do in your organization.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.entries(ROLE_CONFIG).map(([role, config]) => {
                const Icon = config.icon;
                const permissions = {
                  OWNER: [
                    "Full access",
                    "Manage billing",
                    "Delete organization",
                    "Transfer ownership",
                  ],
                  ADMIN: [
                    "Manage members",
                    "Manage domains",
                    "Access all links",
                    "View analytics",
                  ],
                  EDITOR: [
                    "Create & edit links",
                    "Manage tags",
                    "View analytics",
                    "Create bio pages",
                  ],
                  VIEWER: [
                    "View links",
                    "View analytics",
                    "View bio pages",
                    "Read-only access",
                  ],
                };
                return (
                  <div key={role} className="p-4 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className={`h-10 w-10 rounded-lg ${config.color} flex items-center justify-center`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">
                          {config.label}
                        </p>
                      </div>
                    </div>
                    <ul className="space-y-1.5">
                      {permissions[role as keyof typeof permissions]?.map(
                        (perm) => (
                          <li
                            key={perm}
                            className="text-sm text-slate-600 flex items-center gap-2"
                          >
                            <div className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                            {perm}
                          </li>
                        ),
                      )}
                    </ul>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <InviteMemberModal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        onSuccess={loadMembers}
        orgId={orgId}
      />
    </div>
  );
}
