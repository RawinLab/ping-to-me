"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@pingtome/ui";
import { UserPlus, Mail, Shield, Edit, Eye, Loader2 } from "lucide-react";
import { createInvitation, CreateInvitationData } from "@/lib/api/invitations";
import {
  useOrganization,
  useOrgPermissions,
} from "@/contexts/OrganizationContext";

const ROLE_OPTIONS = [
  {
    value: "ADMIN",
    label: "Admin",
    description: "Can manage team members, domains, and all settings",
    icon: Shield,
  },
  {
    value: "EDITOR",
    label: "Editor",
    description: "Can create and edit links, tags, and bio pages",
    icon: Edit,
  },
  {
    value: "VIEWER",
    label: "Viewer",
    description: "Can view links, analytics, and bio pages only",
    icon: Eye,
  },
];

interface InviteMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function InviteMemberDialog({
  open,
  onOpenChange,
  onSuccess,
}: InviteMemberDialogProps) {
  const { currentOrg } = useOrganization();
  const { isOwner, isAdmin } = useOrgPermissions();

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"ADMIN" | "EDITOR" | "VIEWER">("VIEWER");
  const [personalMessage, setPersonalMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter role options based on current user's role
  const availableRoles = ROLE_OPTIONS.filter((option) => {
    if (isOwner) return true; // Owner can assign any role
    if (isAdmin && option.value !== "ADMIN") return true; // Admin can assign Editor/Viewer
    return false;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrg || !email.trim()) return;

    setError(null);
    setIsSubmitting(true);

    try {
      const data: CreateInvitationData = {
        email: email.trim().toLowerCase(),
        role,
        personalMessage: personalMessage.trim() || undefined,
      };

      await createInvitation(currentOrg.id, data);

      // Reset form
      setEmail("");
      setRole("VIEWER");
      setPersonalMessage("");
      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || "Failed to send invitation");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-blue-600" />
            Invite Team Member
          </DialogTitle>
          <DialogDescription>
            Send an invitation to join {currentOrg?.name || "your organization"}
            . They&apos;ll receive an email with a link to accept.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                id="email"
                type="email"
                placeholder="colleague@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          {/* Role */}
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select
              value={role}
              onValueChange={(v) => setRole(v as typeof role)}
            >
              <SelectTrigger id="role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableRoles.map((option) => {
                  const Icon = option.icon;
                  return (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-slate-500" />
                        <div>
                          <span className="font-medium">{option.label}</span>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {option.description}
                          </p>
                        </div>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Personal Message */}
          <div className="space-y-2">
            <Label htmlFor="message">
              Personal Message{" "}
              <span className="text-slate-400 font-normal">(optional)</span>
            </Label>
            <Textarea
              id="message"
              placeholder="Add a personal note to your invitation..."
              value={personalMessage}
              onChange={(e) => setPersonalMessage(e.target.value)}
              maxLength={500}
              rows={3}
            />
            <p className="text-xs text-slate-500 text-right">
              {personalMessage.length}/500
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!isValidEmail(email) || isSubmitting}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Send Invitation
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
