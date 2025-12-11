"use client";

import { useState } from "react";
import { Button } from "@pingtome/ui";
import { apiRequest } from "../lib/api";
import { usePermission } from "../hooks/usePermission";
import { getAssignableRoles, MemberRole } from "../lib/permissions";

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  orgId: string;
}

export function InviteMemberModal({
  isOpen,
  onClose,
  onSuccess,
  orgId,
}: InviteMemberModalProps) {
  const { role: currentUserRole } = usePermission();
  const assignableRoles = getAssignableRoles(currentUserRole as MemberRole);

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<string>(
    assignableRoles[assignableRoles.length - 1] || "VIEWER"
  );
  const [loading, setLoading] = useState(false);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiRequest(`/organizations/${orgId}/invites`, {
        method: "POST",
        body: JSON.stringify({ email, role }),
      });
      onSuccess();
      onClose();
      setEmail("");
      setRole("VIEWER");
    } catch (err) {
      alert("Failed to invite member. Ensure user exists.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">Invite Member</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleInvite} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full p-2 border rounded"
            >
              {assignableRoles.map((r) => (
                <option key={r} value={r}>
                  {r.charAt(0) + r.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              You can only invite members with roles at or below your level.
            </p>
          </div>
          <Button disabled={loading} className="w-full">
            {loading ? "Sending Invite..." : "Send Invite"}
          </Button>
        </form>
      </div>
    </div>
  );
}
