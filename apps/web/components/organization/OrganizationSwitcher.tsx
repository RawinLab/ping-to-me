"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Badge,
} from "@pingtome/ui";
import {
  Building2,
  ChevronDown,
  Plus,
  Check,
  Settings,
  Users,
  Crown,
  Shield,
  Edit,
  Eye,
} from "lucide-react";
import { useOrganization, Organization } from "@/contexts/OrganizationContext";
import { cn } from "@pingtome/ui";

const ROLE_CONFIG: Record<string, { label: string; color: string; icon: any }> =
  {
    OWNER: { label: "Owner", color: "text-amber-600 bg-amber-50", icon: Crown },
    ADMIN: {
      label: "Admin",
      color: "text-purple-600 bg-purple-50",
      icon: Shield,
    },
    EDITOR: { label: "Editor", color: "text-blue-600 bg-blue-50", icon: Edit },
    VIEWER: { label: "Viewer", color: "text-slate-600 bg-slate-50", icon: Eye },
  };

interface OrganizationSwitcherProps {
  showCreateButton?: boolean;
  className?: string;
}

export function OrganizationSwitcher({
  showCreateButton = true,
  className,
}: OrganizationSwitcherProps) {
  const router = useRouter();
  const {
    currentOrg,
    organizations,
    members,
    setCurrentOrg,
    createOrganization,
    isLoading,
  } = useOrganization();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");
  const [newOrgSlug, setNewOrgSlug] = useState("");
  const [creating, setCreating] = useState(false);

  // Get current user's role for each org
  const getOrgRole = (orgId: string) => {
    const member = members.find((m) => m.organizationId === orgId);
    return member?.role || "VIEWER";
  };

  const handleCreateOrg = async () => {
    if (!newOrgName.trim()) return;

    try {
      setCreating(true);
      const slug =
        newOrgSlug ||
        newOrgName
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9-]/g, "");
      await createOrganization({ name: newOrgName, slug });
      setNewOrgName("");
      setNewOrgSlug("");
      setCreateDialogOpen(false);
    } catch (error: any) {
      alert(error.message || "Failed to create organization");
    } finally {
      setCreating(false);
    }
  };

  const handleOrgSelect = (org: Organization) => {
    setCurrentOrg(org);
    // Optionally navigate to dashboard
    // router.push("/dashboard");
  };

  if (isLoading) {
    return (
      <div
        className={cn(
          "animate-pulse h-10 w-48 bg-slate-100 rounded-xl",
          className,
        )}
      />
    );
  }

  if (!currentOrg) {
    return (
      <Button
        variant="outline"
        className={cn("gap-2", className)}
        onClick={() => setCreateDialogOpen(true)}
      >
        <Plus className="h-4 w-4" />
        Create Organization
      </Button>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "gap-2 px-3 h-10 justify-between min-w-[200px] max-w-[280px] border-slate-200 bg-white hover:bg-slate-50",
              className,
            )}
          >
            <div className="flex items-center gap-2 truncate">
              {currentOrg.logo ? (
                <img
                  src={currentOrg.logo}
                  alt={currentOrg.name}
                  className="w-6 h-6 rounded-md object-cover"
                />
              ) : (
                <div className="w-6 h-6 rounded-md bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-medium">
                  {currentOrg.name[0].toUpperCase()}
                </div>
              )}
              <span className="truncate font-medium text-slate-700">
                {currentOrg.name}
              </span>
            </div>
            <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="w-72 p-2">
          <DropdownMenuLabel className="px-2 py-1.5 text-xs text-slate-500 font-medium">
            Switch Organization
          </DropdownMenuLabel>

          <div className="max-h-64 overflow-y-auto">
            {organizations.map((org) => {
              const isSelected = org.id === currentOrg.id;
              const role = getOrgRole(org.id);
              const roleConfig = ROLE_CONFIG[role];

              return (
                <DropdownMenuItem
                  key={org.id}
                  className={cn(
                    "flex items-center gap-3 px-2 py-2.5 rounded-lg cursor-pointer",
                    isSelected && "bg-blue-50",
                  )}
                  onClick={() => handleOrgSelect(org)}
                >
                  {org.logo ? (
                    <img
                      src={org.logo}
                      alt={org.name}
                      className="w-8 h-8 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-medium">
                      {org.name[0].toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-900 truncate">
                        {org.name}
                      </span>
                      {isSelected && (
                        <Check className="h-4 w-4 text-blue-600 shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Badge
                        variant="secondary"
                        className={cn(
                          "text-[10px] px-1.5 py-0 h-4 border-0",
                          roleConfig.color,
                        )}
                      >
                        {roleConfig.label}
                      </Badge>
                      <span className="text-xs text-slate-400">
                        {org._count?.members || 0} members
                      </span>
                    </div>
                  </div>
                </DropdownMenuItem>
              );
            })}
          </div>

          <DropdownMenuSeparator className="my-2" />

          <DropdownMenuItem
            className="flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer text-slate-600"
            onClick={() => router.push("/dashboard/organization")}
          >
            <Settings className="h-4 w-4" />
            Manage Organization
          </DropdownMenuItem>

          <DropdownMenuItem
            className="flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer text-slate-600"
            onClick={() => router.push("/dashboard/settings/team")}
          >
            <Users className="h-4 w-4" />
            Team Members
          </DropdownMenuItem>

          {showCreateButton && (
            <>
              <DropdownMenuSeparator className="my-2" />
              <DropdownMenuItem
                className="flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer text-blue-600 hover:bg-blue-50"
                onClick={() => setCreateDialogOpen(true)}
              >
                <Plus className="h-4 w-4" />
                Create New Organization
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Create Organization Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-600" />
              Create Organization
            </DialogTitle>
            <DialogDescription>
              Create a new organization to collaborate with your team.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="org-name">Organization Name</Label>
              <Input
                id="org-name"
                placeholder="My Company"
                value={newOrgName}
                onChange={(e) => {
                  setNewOrgName(e.target.value);
                  // Auto-generate slug
                  if (
                    !newOrgSlug ||
                    newOrgSlug ===
                      newOrgName
                        .toLowerCase()
                        .replace(/\s+/g, "-")
                        .replace(/[^a-z0-9-]/g, "")
                  ) {
                    setNewOrgSlug(
                      e.target.value
                        .toLowerCase()
                        .replace(/\s+/g, "-")
                        .replace(/[^a-z0-9-]/g, ""),
                    );
                  }
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="org-slug">URL Slug</Label>
              <div className="flex items-center">
                <span className="text-sm text-slate-500 mr-2">pingto.me/</span>
                <Input
                  id="org-slug"
                  placeholder="my-company"
                  value={newOrgSlug}
                  onChange={(e) =>
                    setNewOrgSlug(
                      e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
                    )
                  }
                  className="flex-1"
                />
              </div>
              <p className="text-xs text-slate-500">
                This will be used in your organization&apos;s URLs.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateDialogOpen(false)}
              disabled={creating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateOrg}
              disabled={!newOrgName.trim() || creating}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              {creating ? "Creating..." : "Create Organization"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
